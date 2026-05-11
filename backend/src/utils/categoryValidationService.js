import axios from "axios";
import { CATEGORY_DICTIONARY } from "../data/categoryDictionary.js";
import CategoryValidation from "../models/CategoryValidation.js";

export const CATEGORIES = ["hewan", "buah", "sayur", "makanan", "minuman", "benda", "tempat", "profesi"];

export const randomCategory = () => CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

const normalize = (str = "") => str.trim().toLowerCase();
const geminiTimeoutMs = () => Number(process.env.GEMINI_TIMEOUT_MS || process.env.CATEGORY_AI_TIMEOUT_MS) || 8000;
const cloudflareTimeoutMs = () => Number(process.env.CLOUDFLARE_AI_TIMEOUT_MS || process.env.CATEGORY_AI_TIMEOUT_MS) || 20000;
const isConfigured = (value = "") => Boolean(value && value.length >= 20 && !/^your_|^isi_|change_this/i.test(value));

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
  if (!isConfigured(apiKey)) {
    console.log("[Gemini] API key tidak dikonfigurasi, skip validasi Gemini");
    return null;
  }

  console.log(`[Gemini] Memvalidasi kata "${word}" untuk kategori "${category}"`);

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      contents: [{ parts: [{ text: buildPrompt(word, category) }] }],
      generationConfig: { maxOutputTokens: 10, temperature: 0 }
    },
    { timeout: geminiTimeoutMs() }
  );

  const text = (response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
  console.log(`[Gemini] Response mentah untuk "${word}" (kategori "${category}"): "${text}"`);

  const isValid = parseYesNo(text);
  if (isValid === null) {
    console.warn(`[Gemini] Tidak dapat memparse response untuk "${word}": "${text}"`);
    return null;
  }

  console.log(`[Gemini] Hasil validasi "${word}" (kategori "${category}"): ${isValid ? "VALID" : "TIDAK VALID"}`);
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
    console.log(`[Category] "${w}" (kategori "${c}"): VALID dari dictionary lokal`);
    return {
      isValid: true,
      reason: `Valid dalam kategori ${category}`,
      source: "dictionary"
    };
  }

  const cached = await checkCache(w, c);
  if (cached) {
    console.log(`[Category] "${w}" (kategori "${c}"): ${cached.isValid ? "VALID" : "TIDAK VALID"} dari cache`);
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
  } catch (error) {
    const status = error.response?.status;
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error(`[Gemini] Error validasi "${w}" kategori "${c}" (status ${status || "no-response"}): ${errMsg}`);
  }

  try {
    const cloudflareResult = await validateWithCloudflare(w, c);
    if (cloudflareResult) {
      await saveCache(w, c, cloudflareResult.isValid);
      return aiResultPayload(cloudflareResult.isValid, category, cloudflareResult.source);
    }
  } catch (error) {
    const status = error.response?.status;
    const errMsg = error.response?.data?.errors?.[0]?.message || error.message;
    console.error(`[Cloudflare AI] Error validasi "${w}" kategori "${c}" (status ${status || "no-response"}): ${errMsg}`);
    return { isValid: false, reason: "Validator kategori tidak tersedia", source: "unavailable" };
  }

  return { isValid: false, reason: "Validator kategori tidak tersedia", source: "unavailable" };
};
