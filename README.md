# Kata Royale

Kata Royale adalah web game multiplayer realtime berbasis giliran. Pemain harus menyambung kata berdasarkan huruf terakhir dari kata sebelumnya. Kata yang dikirim divalidasi melalui data KBBI, dan mode tambahan `Challenge Kategori` dapat memaksa pemain menjawab kata yang sesuai kategori acak.

Project ini dibuat sebagai aplikasi full-stack dengan:

- Frontend: React, Vite, Tailwind CSS, Socket.IO Client
- Backend: Node.js, Express, Socket.IO, MongoDB, Mongoose
- Auth: JWT dan bcrypt
- Validasi kata: KBBI API lokal atau Cloudflare Workers KV
- Validasi kategori: dictionary lokal, cache MongoDB, Gemini, lalu Cloudflare AI sebagai fallback

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Cara Kerja Game](#cara-kerja-game)
- [Arsitektur](#arsitektur)
- [Struktur Folder](#struktur-folder)
- [Prasyarat](#prasyarat)
- [Setup Lokal](#setup-lokal)
- [Environment Variables](#environment-variables)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Script NPM](#script-npm)
- [REST API](#rest-api)
- [Socket Events](#socket-events)
- [Model Database](#model-database)
- [Validasi Kata dan Kategori](#validasi-kata-dan-kategori)
- [Build dan Deployment](#build-dan-deployment)
- [Troubleshooting](#troubleshooting)
- [Catatan Pengembangan](#catatan-pengembangan)

## Fitur Utama

- Register, login, logout, dan session JWT.
- Mode guest tanpa akun.
- Pemilihan avatar untuk user login.
- Dashboard pemain.
- Create lobby dengan pengaturan:
  - nama lobby,
  - jumlah maksimal pemain,
  - HP,
  - timer,
  - public/private lobby,
  - challenge kategori.
- Join lobby melalui daftar lobby publik atau room code.
- Waiting room realtime:
  - daftar pemain,
  - status ready,
  - host start,
  - host close room.
- Gameplay realtime:
  - turn-based,
  - timer per giliran,
  - HP dan eliminasi,
  - typing preview,
  - validasi kata,
  - riwayat kata valid,
  - result page.
- Statistik user login:
  - total match,
  - win,
  - lose,
  - winrate,
  - total valid words.
- Leaderboard berdasarkan winrate, jumlah win, lalu total match.
- Cache validasi kata di MongoDB.
- Cache validasi kategori di MongoDB.
- KBBI service terpisah untuk validasi kata.

## Cara Kerja Game

1. Pemain masuk sebagai guest atau user login.
2. Host membuat lobby.
3. Pemain lain join lobby melalui room code atau lobby publik.
4. Non-host menekan `Ready`.
5. Host menekan `Start Game`.
6. Backend membuat game state di memory.
7. Pemain yang mendapat giliran mengirim kata.
8. Backend mengecek:
   - kata tidak kosong,
   - format hanya huruf `a-z` dan tanda hubung,
   - kata dimulai dengan huruf yang diwajibkan,
   - kata belum pernah dipakai,
   - kata ada di KBBI,
   - jika mode kategori aktif, kata sesuai kategori saat ini.
9. Jika valid:
   - kata masuk ke daftar `wordsUsed`,
   - huruf berikutnya menjadi huruf terakhir dari kata,
   - giliran berpindah ke pemain hidup berikutnya.
10. Jika invalid atau timeout:
   - HP pemain berkurang 1,
   - pemain tereliminasi jika HP mencapai 0,
   - giliran berpindah.
11. Game selesai ketika hanya tersisa satu pemain hidup.
12. Backend menyimpan match dan memperbarui statistik user login.

## Arsitektur

```text
Browser React
  |
  | REST API: auth, profile, leaderboard, public lobbies
  | Socket.IO: lobby dan gameplay realtime
  v
Express + Socket.IO Backend
  |
  | Mongoose
  v
MongoDB

Backend
  |
  | HTTP lookup kata
  v
KBBI API service
  |
  | Cloudflare KV atau local words-id.txt
  v
Dataset KBBI
```

Backend menjadi sumber kebenaran untuk game state. Frontend hanya menampilkan state dan mengirim aksi pemain.

Game state aktif disimpan di memory backend melalui `Map`, sedangkan data permanen seperti user, lobby, match, dan cache validasi disimpan di MongoDB.

## Struktur Folder

```text
kata-royale/
  backend/
    src/
      config/
        db.js
      controllers/
        authController.js
        lobbyController.js
        userController.js
      data/
        categoryDictionary.js
      middleware/
        authMiddleware.js
      models/
        CategoryValidation.js
        Lobby.js
        Match.js
        User.js
        Word.js
      routes/
        authRoutes.js
        lobbyRoutes.js
        userRoutes.js
      sockets/
        gameSocket.js
      utils/
        auth.js
        categoryValidationService.js
        wordValidationService.js
      server.js

  frontend/
    public/
      avatars/
    src/
      components/
      context/
      hooks/
      pages/
      services/
      App.jsx
      main.jsx
      styles.css

  services/
    kbbi-api/
      src/
        index.ts
        server.js
        words-id.txt
      scripts/
        prepare-data.js
        upload-local-preview-kv.js
      kbbi-dataset-kbbi-v-main/
```

## Prasyarat

Pastikan sudah terpasang:

- Node.js 18 atau lebih baru
- npm
- MongoDB lokal atau MongoDB Atlas
- Git

Opsional untuk service KBBI Cloudflare Worker:

- Wrangler
- Akun Cloudflare
- Cloudflare KV namespace

Opsional untuk validasi kategori AI:

- Gemini API key
- Cloudflare account id dan API token

## Setup Lokal

Clone repository, lalu masuk ke folder project:

```bash
git clone <repository-url>
cd kata-royale
```

Install semua dependency:

```bash
npm run install:all
```

Salin file environment:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Di Linux/macOS:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Pastikan MongoDB berjalan. Default koneksi lokal:

```text
mongodb://127.0.0.1:27017/sambungkata
```

Siapkan data KBBI lokal:

```bash
npm run kbbi:setup
```

Perintah ini menjalankan:

- `services/kbbi-api/scripts/prepare-data.js`
- `services/kbbi-api/scripts/upload-local-preview-kv.js`

Output generated akan masuk ke folder `services/kbbi-api/kv-data/` dan local preview KV Wrangler.

## Environment Variables

### Backend

File: `backend/.env`

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/sambungkata
JWT_SECRET=change_this_secret
CLIENT_URL=http://localhost:5173
KBBI_API_BASE_URL=http://localhost:8787
GEMINI_API_KEY=your_gemini_api_key
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.1-8b-instruct
GEMINI_TIMEOUT_MS=8000
CLOUDFLARE_AI_TIMEOUT_MS=20000
```

Keterangan:

- `PORT`: port backend Express.
- `MONGO_URI`: koneksi MongoDB.
- `JWT_SECRET`: secret untuk menandatangani JWT.
- `CLIENT_URL`: origin frontend yang diizinkan CORS. Bisa diisi beberapa origin dengan koma.
- `KBBI_API_BASE_URL`: base URL service KBBI.
- `GEMINI_API_KEY`: opsional, dipakai untuk validasi kategori.
- `CLOUDFLARE_ACCOUNT_ID`: opsional, dipakai untuk fallback validasi kategori.
- `CLOUDFLARE_API_TOKEN`: opsional, dipakai untuk fallback validasi kategori.
- `CLOUDFLARE_AI_MODEL`: model Cloudflare AI.
- `GEMINI_TIMEOUT_MS`: timeout request Gemini.
- `CLOUDFLARE_AI_TIMEOUT_MS`: timeout request Cloudflare AI.

Jika key AI tidak diisi, game tetap bisa berjalan. Mode kategori akan mengandalkan dictionary lokal dan cache MongoDB.

### Frontend

File: `frontend/.env`

```env
VITE_API_URL=http://localhost:5000
```

Keterangan:

- `VITE_API_URL`: base URL backend Express dan Socket.IO.

## Menjalankan Aplikasi

Jalankan service KBBI:

```bash
npm run dev:kbbi
```

Default URL:

```text
http://localhost:8787
```

Tes cepat:

```bash
curl http://localhost:8787/api/lookup/rumah
```

Response yang diharapkan:

```json
{
  "exists": true,
  "word": "rumah"
}
```

Jalankan backend:

```bash
npm run dev:backend
```

Default URL:

```text
http://localhost:5000
```

Tes health check:

```bash
curl http://localhost:5000/health
```

Jalankan frontend:

```bash
npm run dev:frontend
```

Default URL:

```text
http://localhost:5173
```

Urutan terminal yang disarankan:

1. MongoDB
2. KBBI API
3. Backend
4. Frontend

## Script NPM

Script root:

```bash
npm run install:all
npm run kbbi:prepare
npm run kbbi:upload-local
npm run kbbi:setup
npm run dev:backend
npm run dev:frontend
npm run dev:kbbi
```

Keterangan:

- `install:all`: install dependency backend, frontend, dan KBBI service.
- `kbbi:prepare`: proses dataset KBBI menjadi format KV.
- `kbbi:upload-local`: upload data ke Wrangler local preview KV.
- `kbbi:setup`: menjalankan `kbbi:prepare` lalu `kbbi:upload-local`.
- `dev:backend`: menjalankan backend dengan nodemon.
- `dev:frontend`: menjalankan Vite dev server.
- `dev:kbbi`: menjalankan KBBI API dengan Wrangler.

Script backend:

```bash
npm --prefix backend run dev
npm --prefix backend start
```

Script frontend:

```bash
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run preview
```

Script KBBI:

```bash
npm --prefix services/kbbi-api run dev
npm --prefix services/kbbi-api run deploy
npm --prefix services/kbbi-api run prepare-data
```

## REST API

Base URL lokal:

```text
http://localhost:5000/api
```

### Auth

#### Register

```http
POST /api/auth/register
```

Body:

```json
{
  "username": "player1",
  "email": "player1@example.com",
  "password": "secret123"
}
```

#### Login

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "player1@example.com",
  "password": "secret123"
}
```

#### Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Logout

```http
POST /api/auth/logout
```

Logout hanya mengembalikan response sukses. Token dihapus dari client.

### Lobbies

#### Public Lobbies

```http
GET /api/lobbies/public
```

Mengembalikan lobby dengan status `waiting` dan `settings.isPublic = true`.

### Users

#### Profile

```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update Avatar

```http
PATCH /api/users/avatar
Authorization: Bearer <token>
```

Body:

```json
{
  "avatar": "Avatar1.png"
}
```

Avatar valid: `Avatar1.png` sampai `Avatar12.png`.

#### Leaderboard

```http
GET /api/users/leaderboard
```

Sorting:

1. `winrate` descending
2. `win` descending
3. `totalMatch` ascending

## Socket Events

Socket.IO memakai URL backend yang sama dengan `VITE_API_URL`.

Auth socket dikirim melalui `socket.auth`:

```js
{
  token,
  guestName,
  guestId
}
```

Jika `token` valid, backend menganggap pemain sebagai user login. Jika tidak ada token, pemain dianggap guest.

### Lobby Events

#### `lobby:create`

Client mengirim:

```js
socket.emit("lobby:create", {
  name: "Classic Room",
  maxPlayers: 4,
  hp: 3,
  timer: 15,
  isPublic: true,
  categoryChallenge: false,
  guestName: "Guest_1234",
  guestId: "guest_xxx"
}, callback);
```

Backend membuat lobby baru, menjadikan pembuat sebagai host, lalu mengembalikan lobby.

#### `lobby:join`

Client mengirim:

```js
socket.emit("lobby:join", {
  roomCode: "ABC123",
  guestName: "Guest_1234",
  guestId: "guest_xxx"
}, callback);
```

Dipakai untuk join lobby waiting room dan reconnect ke game yang sedang berjalan.

#### `lobby:ready`

Client mengirim:

```js
socket.emit("lobby:ready", {
  roomCode: "ABC123",
  ready: true
}, callback);
```

Host selalu dianggap ready.

#### `lobby:start`

Client mengirim:

```js
socket.emit("lobby:start", {
  roomCode: "ABC123"
}, callback);
```

Hanya host yang dapat memulai game. Syarat:

- minimal 2 pemain,
- semua non-host ready.

#### `lobby:close`

Client mengirim:

```js
socket.emit("lobby:close", {
  roomCode: "ABC123"
}, callback);
```

Hanya host yang dapat membubarkan lobby dengan status `waiting`.

#### Event dari server

```text
lobby:updated
lobby:closed
game:started
```

### Game Events

#### `game:sync`

Client mengirim:

```js
socket.emit("game:sync", {
  roomCode: "ABC123"
}, callback);
```

Dipakai untuk mengambil ulang state game setelah refresh/reconnect.

#### `game:typing`

Client mengirim:

```js
socket.emit("game:typing", {
  roomCode: "ABC123",
  text: "rum"
});
```

Server mengirim preview ke pemain lain.

#### `game:submit_word`

Client mengirim:

```js
socket.emit("game:submit_word", {
  roomCode: "ABC123",
  word: "rumah"
}, callback);
```

Server memvalidasi kata dan memindahkan giliran.

#### Event dari server

```text
game:state_updated
game:typing_preview
game:turn_changed
game:word_valid
game:word_invalid
game:player_eliminated
game:finished
```

## Model Database

### User

Menyimpan akun dan statistik:

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

Menyimpan room aktif/riwayat status:

- `roomCode`
- `name`
- `players`
- `settings`
- `status`

Status lobby:

```text
waiting
playing
finished
```

### Match

Menyimpan hasil game:

- `roomCode`
- `players`
- `winner`
- `wordsUsed`
- `createdAt`

### Word

Cache validasi KBBI:

- `word`
- `isValid`
- `checkedAt`

### CategoryValidation

Cache validasi kategori:

- `word`
- `category`
- `isValid`
- `checkedAt`

Memiliki unique index untuk kombinasi `word + category`.

## Validasi Kata dan Kategori

### Validasi Kata

Urutan validasi kata:

1. Normalisasi kata menjadi lowercase.
2. Cek kata kosong.
3. Cek awalan sesuai `currentLetter`.
4. Cek MongoDB cache di collection `words`.
5. Jika belum ada di cache, request ke KBBI API:

```text
GET /api/lookup/:word
```

6. Simpan hasil valid/invalid ke cache.
7. Jika KBBI API down, backend mencoba memakai cache yang tersedia.

Jika KBBI API down dan kata belum ada di cache, kata ditolak.

### Validasi Kategori

Mode kategori aktif jika `settings.categoryChallenge = true`.

Kategori yang tersedia:

```text
hewan
buah
sayur
makanan
minuman
benda
tempat
profesi
```

Urutan validasi kategori:

1. Cek dictionary lokal di `backend/src/data/categoryDictionary.js`.
2. Cek MongoDB cache di collection `categoryvalidations`.
3. Coba validasi dengan Gemini jika `GEMINI_API_KEY` tersedia.
4. Jika Gemini gagal atau timeout, coba Cloudflare AI jika env tersedia.
5. Simpan hasil AI ke cache.

Catatan:

- Hasil negatif juga dicache.
- Jika semua validator eksternal tidak tersedia dan pasangan kata-kategori belum ada di dictionary/cache, kata akan ditolak.
- Timer game dipause saat backend sedang memvalidasi kata.

## KBBI API Service

Service KBBI berada di:

```text
services/kbbi-api
```

Endpoint utama yang dipakai game:

```http
GET /api/lookup/:word
```

Contoh:

```bash
curl http://localhost:8787/api/lookup/rumah
```

Response:

```json
{
  "exists": true,
  "word": "rumah"
}
```

Service juga menyediakan endpoint tambahan:

```text
GET /api/word/:word
GET /api/check/:word
GET /api/similar/:word
GET /api/search?q=query
GET /api/stats
```

Untuk pengembangan lokal, gunakan `npm run kbbi:setup` agar dataset tersedia di local preview KV.

## Build dan Deployment

### Build Frontend

```bash
npm --prefix frontend run build
```

Output:

```text
frontend/dist
```

### Start Backend Production

```bash
npm --prefix backend start
```

Pastikan env production sudah diatur:

- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `KBBI_API_BASE_URL`

### Deploy KBBI Worker

Masuk ke folder service:

```bash
cd services/kbbi-api
```

Deploy:

```bash
npm run deploy
```

Pastikan `wrangler.toml` sudah memiliki KV namespace yang benar.

### Catatan Deployment Full App

Frontend dapat dideploy ke Vercel, Netlify, atau static hosting lain. Set env:

```env
VITE_API_URL=https://your-backend-domain.com
```

Backend dapat dideploy ke Render, Railway, Fly.io, VPS, atau platform Node.js lain. Set env:

```env
CLIENT_URL=https://your-frontend-domain.com
KBBI_API_BASE_URL=https://your-kbbi-worker.workers.dev
```

MongoDB dapat memakai MongoDB Atlas.

## Troubleshooting

### Frontend tidak bisa connect ke backend

Periksa `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Restart Vite setelah mengubah env.

### CORS error

Periksa `CLIENT_URL` di `backend/.env`.

Jika ada beberapa frontend origin:

```env
CLIENT_URL=http://localhost:5173,https://your-frontend-domain.com
```

### MongoDB connection error

Pastikan MongoDB berjalan dan `MONGO_URI` benar.

Default lokal:

```env
MONGO_URI=mongodb://127.0.0.1:27017/sambungkata
```

### Kata selalu ditolak karena KBBI API tidak tersedia

Pastikan KBBI API berjalan:

```bash
npm run dev:kbbi
```

Tes:

```bash
curl http://localhost:8787/api/lookup/rumah
```

Pastikan backend memakai URL yang benar:

```env
KBBI_API_BASE_URL=http://localhost:8787
```

### Mode kategori sering menolak kata

Penyebab umum:

- kata belum ada di dictionary lokal,
- cache belum punya data,
- env Gemini/Cloudflare AI belum diisi,
- API eksternal timeout.

Solusi:

- isi env AI jika ingin validasi kategori lebih luas,
- tambahkan kata umum ke `backend/src/data/categoryDictionary.js`,
- naikkan timeout jika koneksi lambat.

### PowerShell menolak perintah npm

Jika muncul error `npm.ps1 cannot be loaded`, gunakan:

```powershell
npm.cmd run dev:frontend
npm.cmd --prefix frontend run build
```

Atau ubah execution policy sesuai kebutuhan development Windows.

### Socket gagal setelah keluar lobby

Ada risiko ketika non-host keluar waiting room karena frontend memanggil `socket.disconnect()`. Jika setelah keluar pemain tidak bisa create/join lobby lagi, refresh halaman atau pastikan socket connect ulang.

## Catatan Pengembangan

- Game state aktif masih disimpan di memory backend. Jika backend restart, game berjalan akan hilang.
- Cocok untuk single-instance backend. Jika ingin scale horizontal, game state perlu dipindah ke Redis atau adapter Socket.IO yang mendukung multi-instance.
- Setelah game selesai, match dan statistik user login disimpan ke MongoDB.
- Guest bisa bermain, tetapi statistik guest tidak disimpan permanen.
- `services/kbbi-api/kv-data/`, `.wrangler/`, `node_modules/`, dan `dist/` tidak perlu dicommit.
- Folder `services/kbbi-api` berasal dari service KBBI terpisah. Untuk project kelas/demo, folder ini bisa ikut dicommit tanpa metadata `.git` internal.

## Ringkasan Endpoint Lokal

```text
Frontend        http://localhost:5173
Backend         http://localhost:5000
Backend health  http://localhost:5000/health
KBBI API        http://localhost:8787
KBBI lookup     http://localhost:8787/api/lookup/rumah
```

## Lisensi

Sesuaikan bagian ini dengan kebutuhan project atau aturan kampus. Jika belum ada lisensi khusus, project dapat dianggap private untuk keperluan tugas/demo.
