const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const serviceRoot = path.join(__dirname, "..");
const kvDir = path.join(serviceRoot, "kv-data");

if (!fs.existsSync(kvDir)) {
  console.error("kv-data belum ada. Jalankan dulu: npm run kbbi:prepare");
  process.exit(1);
}

const files = fs
  .readdirSync(kvDir)
  .filter((file) => /^bulk_upload_\d+\.json$/.test(file))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

if (files.length === 0) {
  console.error("bulk_upload_*.json tidak ditemukan. Jalankan dulu: npm run kbbi:prepare");
  process.exit(1);
}

for (const file of files) {
  const fullPath = path.join(kvDir, file);
  console.log(`Uploading preview KV: ${file}`);
  const result = spawnSync(
    "npx",
    ["wrangler", "kv", "bulk", "put", fullPath, "--binding", "KBBI_DATA", "--local", "--preview", "true"],
    {
      cwd: serviceRoot,
      stdio: "inherit",
      shell: process.platform === "win32"
    }
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log("KBBI local preview KV siap dipakai.");
