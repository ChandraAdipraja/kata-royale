# Kata Royale

Kata Royale adalah web game multiplayer realtime berbasis giliran. Pemain harus menyambung kata dari huruf terakhir kata sebelumnya, menjaga HP tetap tersisa, dan bertahan sampai menjadi pemenang. Kata divalidasi melalui service KBBI, sedangkan mode tambahan `Challenge Kategori` membuat pemain juga harus menjawab sesuai kategori acak.

## Production

Frontend production:

```text
https://kata-royale.vercel.app
```

Backend production default yang dipakai frontend saat build tanpa `VITE_API_URL`:

```text
https://kata-royale.onrender.com
```

## Tech Stack

| Layer | Teknologi |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, React Router, Lucide Icons |
| Realtime | Socket.IO Client dan Socket.IO Server |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt, Google OAuth, Discord OAuth |
| Validasi Kata | KBBI API lokal atau Cloudflare Workers KV |
| Validasi Kategori | Dictionary lokal, MongoDB cache, Gemini, Cloudflare AI fallback |
| Deployment | Vercel untuk frontend, Render atau Node host untuk backend, Cloudflare Workers untuk KBBI |

## Fitur Utama

- Landing page dengan quick start guest.
- Register, login, logout, dan session JWT.
- Login OAuth Google dan Discord.
- Guest mode tanpa akun.
- Dashboard pemain.
- Create lobby dengan konfigurasi:
  - nama lobby,
  - max player,
  - HP,
  - timer,
  - public/private,
  - challenge kategori.
- Public lobby list dengan search dan filter frontend.
- Join lobby melalui room code.
- Waiting room realtime:
  - player list,
  - slot kosong,
  - ready state,
  - host start,
  - host close room,
  - copy room code.
- Gameplay realtime:
  - turn-based,
  - timer per giliran,
  - HP dan eliminasi,
  - typing preview,
  - validasi kata KBBI,
  - validasi kategori opsional,
  - timeline aktivitas,
  - daftar kata valid,
  - result page dan podium.
- Profile user:
  - update avatar,
  - update username,
  - statistik match.
- Leaderboard berdasarkan win dan total valid words.
- Cache validasi kata dan kategori di MongoDB.

## Cara Kerja Game

1. Pemain masuk sebagai guest atau user login.
2. Host membuat lobby dan memilih setting match.
3. Pemain lain join melalui lobby publik atau room code.
4. Non-host menekan `Ready`.
5. Host menekan `Start Game`.
6. Backend membuat game state aktif di memory.
7. Pemain mendapat giliran secara bergantian.
8. Pemain submit kata.
9. Backend mengecek:
   - kata tidak kosong,
   - format hanya huruf `a-z` dan tanda hubung,
   - kata dimulai dari huruf yang diwajibkan,
   - kata belum pernah digunakan,
   - kata ada di KBBI,
   - jika mode kategori aktif, kata cocok dengan kategori saat ini.
10. Jika valid:
    - kata masuk ke `wordsUsed`,
    - huruf berikutnya menjadi huruf terakhir kata,
    - giliran berpindah.
11. Jika tidak valid atau timeout:
    - HP pemain berkurang,
    - pemain tereliminasi saat HP mencapai 0.
12. Match selesai saat tersisa satu pemain hidup.
13. Backend menyimpan match dan statistik user login.

## Arsitektur

```text
React + Vite Frontend
  |
  | REST API + Socket.IO
  v
Express + Socket.IO Backend
  |
  | Mongoose
  v
MongoDB
  |
  | HTTP lookup
  v
KBBI API Service
  |
  | optional AI fallback
  v
Gemini / Cloudflare AI
```

Catatan penting:

- Lobby, user, match, word cache, dan category cache disimpan di MongoDB.
- Game state aktif disimpan di memory backend melalui `Map`.
- Karena game state aktif berada di memory, backend production idealnya berjalan sebagai single instance atau perlu adapter/state store tambahan jika diskalakan horizontal.

## Struktur Folder

```text
kata-royale/
  backend/
    src/
      config/
      controllers/
      data/
      middleware/
      models/
      routes/
      sockets/
      utils/
  frontend/
    public/
      avatars/
    src/
      components/
      context/
      hooks/
      pages/
      services/
  services/
    kbbi-api/
      src/
      scripts/
      kbbi-dataset-kbbi-v-main/
```

## Frontend Routes

| Route | Halaman |
| --- | --- |
| `/` | Landing / quick start |
| `/dashboard` | Dashboard pemain |
| `/login` | Login |
| `/register` | Register |
| `/oauth/callback` | OAuth token callback |
| `/lobby/create` | Create lobby |
| `/lobby/public` | Public lobby list |
| `/lobby/join` | Join by room code |
| `/lobby/:roomCode` | Waiting room |
| `/game/:roomCode` | Game arena |
| `/result/:matchId` | Match result |
| `/leaderboard` | Leaderboard |
| `/profile` | Profile |

## Prasyarat Lokal

- Node.js 18 atau lebih baru.
- npm.
- MongoDB lokal atau MongoDB Atlas.
- Opsional: Cloudflare Wrangler untuk menjalankan KBBI Worker.
- Opsional: Gemini API key atau Cloudflare AI token untuk mode kategori.

## Setup Lokal

Install semua dependency:

```bash
npm run install:all
```

Jika hanya ingin install bagian tertentu:

```bash
npm --prefix backend install
npm --prefix frontend install
npm --prefix services/kbbi-api install
```

Siapkan env backend:

```bash
cp backend/.env.example backend/.env
```

Contoh env backend lokal:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/sambungkata
JWT_SECRET=change_this_secret
CLIENT_URL=http://localhost:5173
API_URL=http://localhost:5000
KBBI_API_BASE_URL=http://localhost:8787
GEMINI_API_KEY=your_gemini_api_key
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.1-8b-instruct
GEMINI_TIMEOUT_MS=8000
CLOUDFLARE_AI_TIMEOUT_MS=20000
```

Siapkan env frontend jika ingin override backend URL:

```env
VITE_API_URL=http://localhost:5000
```

Jika `VITE_API_URL` tidak diisi:

- mode development memakai `http://localhost:5000`,
- mode production memakai `https://kata-royale.onrender.com`.

## Menjalankan Lokal

Terminal 1 - MongoDB:

```bash
mongod
```

Terminal 2 - KBBI API lokal sederhana:

```bash
node services/kbbi-api/src/server.js
```

Endpoint lokal:

```text
http://localhost:8787/health
http://localhost:8787/api/lookup/rumah
```

Alternatif KBBI Worker dengan Wrangler:

```bash
npm run dev:kbbi
```

Terminal 3 - Backend:

```bash
npm run dev:backend
```

Backend lokal:

```text
http://localhost:5000
http://localhost:5000/health
```

Terminal 4 - Frontend:

```bash
npm run dev:frontend
```

Frontend lokal:

```text
http://localhost:5173
```

## NPM Scripts

Root scripts:

| Script | Fungsi |
| --- | --- |
| `npm run install:all` | Install dependency backend, frontend, dan KBBI service |
| `npm run dev:backend` | Jalankan backend dengan nodemon |
| `npm run dev:frontend` | Jalankan frontend Vite |
| `npm run dev:kbbi` | Jalankan KBBI Worker dengan Wrangler |
| `npm run kbbi:prepare` | Proses dataset KBBI menjadi data KV |
| `npm run kbbi:upload-local` | Upload data ke local preview KV |
| `npm run kbbi:setup` | Prepare dan upload local preview KV |

Frontend scripts:

```bash
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run preview
```

Backend scripts:

```bash
npm --prefix backend run dev
npm --prefix backend start
```

KBBI service scripts:

```bash
npm --prefix services/kbbi-api run dev
npm --prefix services/kbbi-api run deploy
npm --prefix services/kbbi-api run prepare-data
```

## Environment Variables

### Backend

| Variable | Wajib | Keterangan |
| --- | --- | --- |
| `PORT` | Tidak | Port backend, default `5000` |
| `MONGO_URI` | Ya | MongoDB connection string |
| `JWT_SECRET` | Ya untuk production | Secret JWT |
| `CLIENT_URL` | Ya | Origin frontend yang diizinkan CORS, bisa dipisah koma |
| `API_URL` | Ya untuk OAuth | Base URL backend untuk callback OAuth |
| `KBBI_API_BASE_URL` | Ya | Base URL KBBI API |
| `GOOGLE_CLIENT_ID` | Opsional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Opsional | Google OAuth client secret |
| `DISCORD_CLIENT_ID` | Opsional | Discord OAuth client ID |
| `DISCORD_CLIENT_SECRET` | Opsional | Discord OAuth client secret |
| `GEMINI_API_KEY` | Opsional | Validator kategori via Gemini |
| `CLOUDFLARE_ACCOUNT_ID` | Opsional | Cloudflare AI account ID |
| `CLOUDFLARE_API_TOKEN` | Opsional | Cloudflare AI token |
| `CLOUDFLARE_AI_MODEL` | Opsional | Model Cloudflare AI |
| `GEMINI_TIMEOUT_MS` | Opsional | Timeout Gemini |
| `CLOUDFLARE_AI_TIMEOUT_MS` | Opsional | Timeout Cloudflare AI |

### Frontend

| Variable | Wajib | Keterangan |
| --- | --- | --- |
| `VITE_API_URL` | Disarankan | Base URL backend Express dan Socket.IO |

Production frontend di Vercel sebaiknya memakai:

```env
VITE_API_URL=https://kata-royale.onrender.com
```

Production backend sebaiknya memakai:

```env
CLIENT_URL=https://kata-royale.vercel.app
API_URL=https://kata-royale.onrender.com
KBBI_API_BASE_URL=https://your-kbbi-worker.workers.dev
```

## REST API

Base path backend:

```text
/api
```

### Auth

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login` | Login user |
| `POST` | `/api/auth/logout` | Logout response |
| `GET` | `/api/auth/me` | Ambil user aktif, butuh Bearer token |
| `GET` | `/api/auth/google` | Mulai Google OAuth |
| `GET` | `/api/auth/google/callback` | Callback Google OAuth |
| `GET` | `/api/auth/discord` | Mulai Discord OAuth |
| `GET` | `/api/auth/discord/callback` | Callback Discord OAuth |

### Lobbies

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/api/lobbies/public` | Daftar lobby publik dengan status waiting |

Sebagian besar aksi lobby berjalan melalui Socket.IO agar realtime.

### Users

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/api/users/profile` | Ambil profile user aktif |
| `PATCH` | `/api/users/profile` | Update username |
| `PATCH` | `/api/users/avatar` | Update avatar |
| `GET` | `/api/users/leaderboard` | Ambil leaderboard |

## Socket Events

Socket auth dikirim dari frontend melalui:

```js
socket.auth = { token, guestName, guestId };
```

### Lobby Events

| Event | Arah | Fungsi |
| --- | --- | --- |
| `lobby:create` | client -> server | Membuat lobby baru |
| `lobby:join` | client -> server | Join lobby by room code |
| `lobby:ready` | client -> server | Update ready state |
| `lobby:update_settings` | client -> server | Host update setting room |
| `lobby:start` | client -> server | Host mulai game |
| `lobby:close` | client -> server | Host menutup lobby |
| `lobby:updated` | server -> client | Broadcast lobby terbaru |
| `lobby:closed` | server -> client | Broadcast lobby ditutup |

### Game Events

| Event | Arah | Fungsi |
| --- | --- | --- |
| `game:sync` | client -> server | Sinkronisasi state game setelah reload/reconnect |
| `game:typing` | client -> server | Kirim typing preview |
| `game:submit_word` | client -> server | Submit kata |
| `game:leave` | client -> server | Keluar dari match |
| `game:started` | server -> client | Game dimulai |
| `game:state_updated` | server -> client | Broadcast state game |
| `game:turn_changed` | server -> client | Broadcast pergantian giliran |
| `game:typing_preview` | server -> client | Preview typing pemain aktif |
| `game:word_valid` | server -> client | Kata diterima |
| `game:word_invalid` | server -> client | Kata ditolak atau timeout |
| `game:player_eliminated` | server -> client | Pemain tereliminasi |
| `game:player_left` | server -> client | Pemain keluar match |
| `game:finished` | server -> client | Match selesai |

## Model Database

### User

Menyimpan akun, password hash, statistik, dan avatar.

Field utama:

- `username`
- `email`
- `password`
- `totalMatch`
- `win`
- `lose`
- `winrate`
- `totalValidWords`
- `avatar`

### Lobby

Menyimpan room aktif atau selesai.

Field utama:

- `roomCode`
- `name`
- `players`
- `settings`
- `status`

### Match

Menyimpan hasil match selesai.

Field utama:

- `roomCode`
- `players`
- `winner`
- `wordsUsed`
- `createdAt`

### Word

Cache validasi kata KBBI.

### CategoryValidation

Cache validasi pasangan `word + category`.

## Validasi Kata

Urutan validasi kata:

1. Normalize kata menjadi lowercase.
2. Cek kosong.
3. Cek huruf awal sesuai giliran.
4. Cek sudah pernah digunakan atau belum.
5. Cek cache MongoDB collection `words`.
6. Jika belum ada cache, request ke KBBI API:

```text
GET {KBBI_API_BASE_URL}/api/lookup/:word
```

7. Simpan hasil ke cache.
8. Jika KBBI API tidak tersedia, backend mencoba cache fallback.

Jika KBBI API down dan kata belum pernah ada di cache, kata ditolak.

## Validasi Kategori

Kategori yang tersedia:

- `hewan`
- `buah`
- `sayur`
- `makanan`
- `minuman`
- `benda`
- `tempat`
- `profesi`

Urutan validasi kategori:

1. Cek dictionary lokal `backend/src/data/categoryDictionary.js`.
2. Cek cache MongoDB collection `categoryvalidations`.
3. Jika `GEMINI_API_KEY` tersedia, validasi via Gemini.
4. Jika Gemini gagal atau timeout, coba Cloudflare AI.
5. Simpan hasil validasi AI ke cache.

Jika semua validator eksternal tidak tersedia dan kata tidak ada di dictionary/cache, kata ditolak dengan pesan validator kategori tidak tersedia.

## KBBI API Service

Folder:

```text
services/kbbi-api
```

Service ini punya dua mode:

1. Local Node server sederhana:

```bash
node services/kbbi-api/src/server.js
```

Endpoint:

```text
GET /health
GET /api/lookup/:word
```

2. Cloudflare Worker:

```bash
npm --prefix services/kbbi-api run dev
npm --prefix services/kbbi-api run deploy
```

Worker mendukung endpoint:

- `GET /api/lookup/:word`
- `GET /api/word/:word`
- `GET /api/check/:word`
- `GET /api/similar/:word`
- `GET /api/search?q=query`
- `GET /api/stats`

## Build

Build frontend:

```bash
npm --prefix frontend run build
```

Preview frontend:

```bash
npm --prefix frontend run preview
```

Start backend production:

```bash
npm --prefix backend start
```

## Deployment

### Frontend Vercel

Production URL:

```text
https://kata-royale.vercel.app
```

Recommended settings:

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:

```env
VITE_API_URL=https://kata-royale.onrender.com
```

`frontend/vercel.json` sudah menyediakan rewrite SPA:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Backend Render / Node Host

Recommended settings:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`

Environment production minimal:

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=strong_secret
CLIENT_URL=https://kata-royale.vercel.app
API_URL=https://kata-royale.onrender.com
KBBI_API_BASE_URL=https://your-kbbi-worker.workers.dev
```

Jika OAuth dipakai, tambahkan Google/Discord client credentials.

### KBBI Cloudflare Worker

```bash
cd services/kbbi-api
npm install
npm run prepare-data
npm run deploy
```

Pastikan `wrangler.toml` memakai KV namespace yang benar.

## Troubleshooting

### Frontend tidak bisa connect backend

Periksa:

- `VITE_API_URL` di Vercel atau `.env` frontend.
- Backend hidup dan `/health` mengembalikan status OK.
- `CLIENT_URL` backend berisi origin frontend.

### CORS error

Tambahkan frontend origin ke `CLIENT_URL`.

Contoh:

```env
CLIENT_URL=http://localhost:5173,https://kata-royale.vercel.app
```

### Backend gagal konek MongoDB

Periksa:

- `MONGO_URI` benar.
- MongoDB lokal berjalan.
- Untuk MongoDB Atlas, IP address backend sudah di-whitelist.
- Username/password MongoDB benar.

### Kata selalu ditolak

Periksa:

- `KBBI_API_BASE_URL` benar.
- KBBI API berjalan.
- Endpoint `/api/lookup/rumah` mengembalikan `exists: true`.
- Cache MongoDB belum kosong untuk kata yang diuji.

### Mode kategori sering menolak kata

Kemungkinan:

- Kata tidak ada di dictionary lokal.
- Cache kategori belum ada.
- `GEMINI_API_KEY` dan Cloudflare AI env belum diisi.
- Validator AI timeout.

Mode kategori tetap bisa berjalan tanpa AI, tetapi hanya mengandalkan dictionary lokal dan cache yang sudah ada.

### Socket terasa putus setelah keluar room

Frontend sudah melakukan reconnect setelah keluar waiting room. Jika masih terjadi, refresh halaman atau pastikan backend Socket.IO masih hidup.

## Catatan Pengembangan

- Jangan commit file `.env`.
- Jangan commit `node_modules`, `dist`, `.wrangler`, atau generated KV data besar.
- Backend saat ini menyimpan game state aktif di memory. Untuk scale multi-instance, pertimbangkan Socket.IO Redis adapter dan persistent game state.
- `JWT_SECRET` wajib kuat di production.
- Jika frontend production berubah domain, update `CLIENT_URL` backend dan OAuth redirect config.

## Quick Links

| Target | URL |
| --- | --- |
| Production frontend | `https://kata-royale.vercel.app` |
| Production backend default | `https://kata-royale.onrender.com` |
| Local frontend | `http://localhost:5173` |
| Local backend | `http://localhost:5000` |
| Local KBBI API | `http://localhost:8787` |
| Local KBBI lookup | `http://localhost:8787/api/lookup/rumah` |
