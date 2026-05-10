# Catatan Bug dan Risiko

## Bug yang sudah ditemukan

1. Socket bisa tetap disconnect setelah keluar lobby sebagai non-host.
   - Lokasi: `frontend/src/pages/WaitingRoom.jsx`
   - Dampak: setelah klik keluar, user kembali ke dashboard tetapi socket tidak otomatis connect ulang, sehingga create/join lobby berikutnya bisa gagal sampai halaman direfresh.

2. Ada karakter encoding rusak di UI.
   - Lokasi: `frontend/src/pages/Game.jsx`, `frontend/src/pages/CreateLobby.jsx`
   - Dampak: separator placeholder dan ikon dropdown bisa muncul sebagai karakter mojibake, bukan middle dot atau panah dropdown.

3. Fallback API frontend mengarah ke production.
   - Lokasi: `frontend/src/services/api.js`
   - Dampak: fresh clone tanpa `frontend/.env` akan memakai `https://kata-royale.onrender.com`, bukan backend lokal `http://localhost:5000`.

## Catatan fitur kategori

1. Flow kategori sudah tersambung dari frontend ke backend.
   - `CreateLobby` mengirim `categoryChallenge`.
   - Backend menyimpan setting lobby.
   - Saat game mulai, backend membuat `currentCategory`.
   - Saat submit kata, backend mengecek KBBI dulu lalu mengecek kategori.
   - Frontend menampilkan kategori aktif di halaman game.

2. Validator kategori bergantung pada `GEMINI_API_KEY`.
   - Jika key kosong, semua jawaban kategori akan ditolak dengan pesan `Validator kategori tidak tersedia`.
   - Saat ini belum ada preflight check saat host mengaktifkan kategori atau start game.

3. Cache kategori berjalan.
   - Model `CategoryValidation` punya unique index untuk pasangan `word + category`.
   - Jalur cache sudah dites dengan data sementara dan menghasilkan response valid dari cache.

4. Risiko performa paling besar ada di cache miss.
   - Setiap pasangan kata-kategori baru memanggil Gemini dengan timeout 8 detik.
   - Timer game tetap berjalan ketika backend menunggu response validasi.
   - Pada timer pendek, pemain bisa terkena timeout saat validasi masih berjalan, lalu hasil validasi lama bisa datang terlambat dan berpotensi mengubah state turn yang sudah maju.

5. Hasil LLM tidak sepenuhnya deterministik secara produk.
   - Temperature sudah 0, tetapi kategori seperti `benda`, `makanan`, `tempat`, atau kata ambigu tetap bisa menghasilkan keputusan yang terasa tidak konsisten.
   - Hasil negatif ikut dicache, jadi salah klasifikasi bisa menetap sampai cache dibersihkan.
