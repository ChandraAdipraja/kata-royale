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

4. Jalankan KBBI API lokal:

```bash
npm run dev:kbbi
```

Service KBBI repo ini berbasis Cloudflare Workers/Wrangler dan normalnya berjalan di `http://localhost:8787`.

5. Jalankan backend:

```bash
npm run dev:backend
```

6. Jalankan frontend:

```bash
npm run dev:frontend
```

Frontend tersedia di `http://localhost:5173`.

## Fitur

- Register, login, logout, JWT auth, protected profile.
- Guest mode dengan nama sementara.
- Create lobby, join via room code, waiting room realtime, ready state, host start.
- Gameplay classic turn-based dengan HP, timer realtime, typing preview, word history, eliminasi, dan result page.
- Validasi kata utama lewat KBBI API lokal.
- Cache validasi kata di MongoDB collection `words`.
- Fallback validasi ke cache saat KBBI API down.
- Statistik user login dan leaderboard berdasarkan winrate lalu total win.
