import axios from "axios";
import CategoryValidation from "../models/CategoryValidation.js";

export const CATEGORIES = ["hewan", "buah", "sayur", "makanan", "minuman", "benda", "tempat", "profesi"];

export const randomCategory = () => CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

const normalize = (str = "") => str.trim().toLowerCase();

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

export const validateCategory = async (word, category) => {
  const w = normalize(word);
  const c = normalize(category);

  const cached = await checkCache(w, c);
  if (cached) {
    return {
      isValid: cached.isValid,
      reason: cached.isValid ? `Valid dalam kategori ${category}` : `Kata bukan termasuk kategori ${category}`,
      source: "cache"
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { isValid: false, reason: "Validator kategori tidak tersedia", source: "unavailable" };
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: buildPrompt(w, c) }] }],
        generationConfig: { maxOutputTokens: 5, temperature: 0 }
      },
      { timeout: 8000 }
    );

    const text = (response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim().toLowerCase();
    const isValid = text.startsWith("ya");

    await saveCache(w, c, isValid);

    return {
      isValid,
      reason: isValid ? `Valid dalam kategori ${category}` : `Kata bukan termasuk kategori ${category}`,
      source: "gemini"
    };
  } catch (_error) {
    const fallback = await checkCache(w, c);
    if (fallback) {
      return {
        isValid: fallback.isValid,
        reason: fallback.isValid ? `Valid dalam kategori ${category} (cache)` : `Kata bukan termasuk kategori ${category}`,
        source: "cache-fallback"
      };
    }

    return { isValid: false, reason: "Validator kategori tidak tersedia", source: "unavailable" };
  }
};
