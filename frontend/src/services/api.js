import axios from "axios";

const DEFAULT_API_URL = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://kata-royale.onrender.com";

export const API_URL =
  import.meta.env.VITE_API_URL || DEFAULT_API_URL;

export const api = axios.create({
  baseURL: `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sambungkata_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
