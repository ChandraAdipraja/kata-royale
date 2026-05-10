import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = Number(process.env.PORT || 8787);
const WORDS_PATH = join(__dirname, "words-id.txt");

const normalizeWord = (value = "") =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z-]/g, "");

const loadWords = async () => {
  const raw = await readFile(WORDS_PATH, "utf8");
  return new Set(
    raw
      .split(/\r?\n/)
      .map(normalizeWord)
      .filter(Boolean)
  );
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  });
  res.end(JSON.stringify(payload));
};

const words = await loadWords();

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, { ok: true, totalWords: words.size });
    return;
  }

  const match = url.pathname.match(/^\/api\/lookup\/(.+)$/);
  if (req.method === "GET" && match) {
    const word = normalizeWord(decodeURIComponent(match[1]));
    const exists = words.has(word);

    sendJson(res, 200, {
      word,
      exists,
      source: "local"
    });
    return;
  }

  sendJson(res, 404, { message: "Not found" });
});

server.listen(PORT, () => {
  console.log(`KBBI API listening on ${PORT}`);
});
