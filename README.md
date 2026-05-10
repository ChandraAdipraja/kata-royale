# SambungKata

SambungKata adalah web game multiplayer realtime berbasis giliran. Frontend memakai React + Vite + Tailwind CSS, backend memakai Node.js + Express + Socket.IO, database memakai MongoDB + Mongoose, dan validasi kata utama memakai service KBBI dari `services/kbbi-api`.

## Struktur

```text
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    sockets/
    utils/wordValidationService.js
frontend/
  src/
    components/
    context/
    hooks/
    pages/
    services/
services/
  kbbi-api/
```

## Setup

1. Install semua dependencies:

```bash
npm run install:all
```

2. Salin env backend:

```bash
copy backend\.env.example backend\.env
```

3. Pastikan MongoDB lokal berjalan di `mongodb://127.0.0.1:27017/sambungkata`.

4. Siapkan data KBBI lokal:

```bash
npm run kbbi:setup
```

Perintah ini akan:
- menjalankan `prepare-data` dari repo KBBI API,
- membuat `services/kbbi-api/kv-data/`,
- mengisi Wrangler local preview KV agar endpoint lookup benar-benar membaca dataset KBBI.

Folder `kv-data` sengaja tidak dicommit karena generated dan besar. Setiap developer cukup menjalankan setup ini sekali setelah clone.

5. Jalankan KBBI API lokal:

```bash
npm run dev:kbbi
```

Service KBBI lokal berjalan di `http://localhost:8787`.

Tes cepat:

```bash
curl http://localhost:8787/api/lookup/rumah
```

Output yang benar:

```json
{"exists":true,"word":"rumah"}
```

6. Jalankan backend:

```bash
npm run dev:backend
```

7. Jalankan frontend:

```bash
npm run dev:frontend
```

Frontend tersedia di `http://localhost:5173`.

## Deploy OAuth

Untuk production, backend harus punya env berikut:

```env
CLIENT_URL=https://kata-royale.vercel.app
API_URL=https://kata-royale.onrender.com
```

`CLIENT_URL` dipakai backend untuk redirect browser setelah OAuth berhasil atau gagal. Kalau nilainya kosong atau masih `http://localhost:5173`, login OAuth akan selesai lalu kembali ke localhost.

`API_URL` dipakai Passport sebagai callback URL OAuth. Daftarkan callback ini juga di provider OAuth:

```text
https://kata-royale.onrender.com/api/auth/google/callback
https://kata-royale.onrender.com/api/auth/discord/callback
```

## Fitur

- Register, login, logout, JWT auth, protected profile.
- Guest mode dengan nama sementara.
- Create lobby, join via room code, waiting room realtime, ready state, host start.
- Gameplay classic turn-based dengan HP, timer realtime, typing preview, word history, eliminasi, dan result page.
- Validasi kata utama lewat KBBI API lokal.
- Cache validasi kata di MongoDB collection `words`.
- Fallback validasi ke cache saat KBBI API down.
- Statistik user login dan leaderboard berdasarkan winrate lalu total win.

## Catatan untuk Push ke GitHub

`services/kbbi-api` berasal dari repo lain. Ada dua cara yang aman:

1. **Paling mudah untuk project kelas/demo:** commit isi folder `services/kbbi-api` ke repo utama.
   Sebelum `git add`, hapus metadata Git di dalam service:

   ```bash
   rmdir /s /q services\kbbi-api\.git
   ```

   Setelah itu `git add .` akan memasukkan source KBBI API sebagai bagian dari repo SambungKata.

2. **Cara Git yang lebih formal:** pakai Git submodule.
   Teman yang clone harus menjalankan:

   ```bash
   git submodule update --init --recursive
   ```

Untuk demo akhir, opsi pertama biasanya lebih simpel. Jangan commit `services/kbbi-api/kv-data/`, `.wrangler/`, atau `node_modules/`; semuanya sudah masuk `.gitignore`.
