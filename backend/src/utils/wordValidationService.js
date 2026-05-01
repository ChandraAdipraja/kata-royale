import axios from "axios";
import Word from "../models/Word.js";

const normalizeWord = (word = "") => word.trim().toLowerCase();

export const checkWordInCache = async (word) => {
  const normalized = normalizeWord(word);
  if (!normalized) return null;
  return Word.findOne({ word: normalized });
};

export const saveWordToCache = async (word, isValid) => {
  const normalized = normalizeWord(word);
  if (!normalized) return null;

  return Word.findOneAndUpdate(
    { word: normalized },
    { word: normalized, isValid, checkedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const checkWordInKBBI = async (word) => {
  const normalized = normalizeWord(word);
  const baseUrl = process.env.KBBI_API_BASE_URL || "http://localhost:8787";
  const { data } = await axios.get(`${baseUrl}/api/lookup/${encodeURIComponent(normalized)}`, {
    timeout: 3500
  });

  return Boolean(data?.exists);
};

export const validateWord = async (word, requiredLetter) => {
  const normalized = normalizeWord(word);

  if (!normalized) {
    return { isValid: false, reason: "Kata tidak boleh kosong", word: normalized };
  }

  if (requiredLetter && !normalized.startsWith(requiredLetter.toLowerCase())) {
    return { isValid: false, reason: `Kata harus dimulai dengan huruf ${requiredLetter.toUpperCase()}`, word: normalized };
  }

  const cached = await checkWordInCache(normalized);
  if (cached) {
    return {
      isValid: cached.isValid,
      reason: cached.isValid ? "Valid dari cache" : "Tidak ditemukan di KBBI",
      word: normalized,
      source: "cache"
    };
  }

  try {
    const isValid = await checkWordInKBBI(normalized);
    await saveWordToCache(normalized, isValid);

    return {
      isValid,
      reason: isValid ? "Valid dari KBBI" : "Tidak ditemukan di KBBI",
      word: normalized,
      source: "kbbi"
    };
  } catch (error) {
    const fallback = await checkWordInCache(normalized);
    if (fallback) {
      return {
        isValid: fallback.isValid,
        reason: "KBBI API tidak tersedia, memakai cache",
        word: normalized,
        source: "cache-fallback"
      };
    }

    return {
      isValid: false,
      reason: "KBBI API tidak tersedia dan kata belum ada di cache",
      word: normalized,
      source: "unavailable"
    };
  }
};
