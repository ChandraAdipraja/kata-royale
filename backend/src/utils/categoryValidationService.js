import axios from "axios";
import { CATEGORY_DICTIONARY } from "../data/categoryDictionary.js";
import CategoryValidation from "../models/CategoryValidation.js";

export const CATEGORIES = ["hewan", "buah", "sayur", "makanan", "minuman", "benda", "tempat", "profesi"];

export const randomCategory = () => CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

const normalize = (str = "") => str.trim().toLowerCase();
const geminiTimeoutMs = () => Number(process.env.GEMINI_TIMEOUT_MS || process.env.CATEGORY_AI_TIMEOUT_MS) || 8000;
const cloudflareTimeoutMs = () => Number(process.env.CLOUDFLARE_AI_TIMEOUT_MS || process.env.CATEGORY_AI_TIMEOUT_MS) || 20000;
const isConfigured = (value = "") => Boolean(value && !/^your_|^isi_|change_this/i.test(value));

const dictionaryHas = (word, category) => {
  const words = CATEGORY_DICTIONARY[normalize(category)] || [];
  return words.includes(normalize(word));
};

const checkCache = (word, category) =>
  CategoryValidation.findOne({ word: normalize(word), category: normalize(category) });

const saveCache = (word, category, isValid) => {
  const w = normalize(word);
  const c = normalize(category);
  return CategoryValidation.findOneAndUpdate(
    { word: w, category: c },
    { word: w, category: c, isValid, checkedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const buildPrompt = (word, category) =>
  `Dalam bahasa Indonesia, apakah kata "${word}" termasuk dalam kategori "${category}"?\n` +
  `Aturan penting:\n` +
  `- Untuk kategori "tempat": nama tempat geografis (kota, negara, provinsi, gunung, sungai, dll) BOLEH diterima\n` +
  `- Untuk kategori selain "tempat": nama tempat geografis TIDAK boleh diterima\n` +
  `- Hanya kata umum atau benda generik, bukan nama merek dagang\n` +
  `Jawab HANYA dengan satu kata: "ya" atau "tidak".`;

const parseYesNo = (text = "") => {
  const answer = text
    .trim()
    .toLowerCase()
    .replace(/^[\s"'`]+/, "")
    .replace(/^jawaban\s*:\s*/, "");

  if (/^(ya|iya)\b/.test(answer)) return true;
  if (/^(tidak|bukan|no)\b/.test(answer)) return false;
  if (/\b(tidak|bukan|no)\b/.test(answer)) return false;
  if (/\b(ya|iya)\b/.test(answer)) return true;
  return null;
};

const validateWithGemini = async (word, category) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!isConfigured(apiKey)) return null;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      contents: [{ parts: [{ text: buildPrompt(word, category) }] }],
      generationConfig: { maxOutputTokens: 5, temperature: 0 }
    },
    { timeout: geminiTimeoutMs() }
  );

  const text = (response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
  const isValid = parseYesNo(text);
  if (isValid === null) return null;

  return { isValid, source: "gemini" };
};

const validateWithCloudflare = async (word, category) => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const model = process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";
  if (!isConfigured(accountId) || !isConfigured(apiToken)) return null;

  const response = await axios.post(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    { prompt: buildPrompt(word, category) },
    {
      timeout: cloudflareTimeoutMs(),
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      }
    }
  );

  const text = (response.data?.result?.response || "").trim();
  const isValid = parseYesNo(text);
  if (isValid === null) return null;

  return { isValid, source: "cloudflare" };
};

const aiResultPayload = (isValid, category, source) => ({
  isValid,
  reason: isValid ? `Valid dalam kategori ${category}` : `Kata bukan termasuk kategori ${category}`,
  source
});

export const validateCategory = async (word, category) => {
  const w = normalize(word);
  const c = normalize(category);

  if (!w || !c || !CATEGORIES.includes(c)) {
    return { isValid: false, reason: "Kategori tidak tersedia", source: "unavailable" };
  }

  if (dictionaryHas(w, c)) {
    return {
      isValid: true,
      reason: `Valid dalam kategori ${category}`,
      source: "dictionary"
    };
  }

  const cached = await checkCache(w, c);
  if (cached) {
    return {
      isValid: cached.isValid,
      reason: cached.isValid ? `Valid dalam kategori ${category}` : `Kata bukan termasuk kategori ${category}`,
      source: "cache"
    };
  }

  try {
    const geminiResult = await validateWithGemini(w, c);
    if (geminiResult) {
      await saveCache(w, c, geminiResult.isValid);
      return aiResultPayload(geminiResult.isValid, category, geminiResult.source);
    }
  } catch (_error) {
    // Cloudflare is the fallback when Gemini is unavailable, rate-limited, or times out.
  }

  try {
    const cloudflareResult = await validateWithCloudflare(w, c);
    if (cloudflareResult) {
      await saveCache(w, c, cloudflareResult.isValid);
      return aiResultPayload(cloudflareResult.isValid, category, cloudflareResult.source);
    }
  } catch (_error) {
    return { isValid: false, reason: "Validator kategori tidak tersedia", source: "unavailable" };
  }

  return { isValid: false, reason: "Validator kategori tidak tersedia", source: "unavailable" };
};
