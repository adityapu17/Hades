# Quiz (Quibel) di dalam Hades

Aplikasi quiz internal: admin membuat bank soal dan quiz, member mengerjakan dengan timer, hasil dipantau real-time.
Aplikasi ini berjalan di `/quiz/` pada domain Hades dan **tidak punya login sendiri**: sesi berasal dari login Hades
(satu domain + satu project Firebase). Belum login atau akun belum terdaftar/dinonaktifkan: diarahkan ke halaman login Hades (`/`).

- Akun dibuat/diubah/dinonaktifkan di Hades -> **Kelola User** (role `admin` atau `member`).
- Router memakai hash (`/quiz/#/quiz`, `/quiz/#/admin`), jadi tidak butuh rewrite di server.
- Config Firebase ada di `src/firebase.js` dan harus sama dengan `../src/utils/firebase.js`.
- Rules Firestore ada di `../firestore.rules` (gabungan Hades + Quiz).
- Build: dijalankan oleh `npm run build` di root repo (output ke `../dist/quiz`).

## Format Excel upload soal

Kolom header (baris pertama), urutan bebas:

| Soal | Opsi A | Opsi B | Opsi C | Opsi D | Jawaban Benar | Poin |
|---|---|---|---|---|---|---|
| Contoh soal? | opsi 1 | opsi 2 | opsi 3 | opsi 4 | A | 10 |

`Jawaban Benar` diisi huruf A/B/C/D; `Poin` opsional (default 10). Tombol "Unduh Template Excel" di halaman Bank Soal membuat file contoh.

## Struktur data Firestore

- `users/{uid}` -> `{ name, email, role, initials, disabled? }` (dikelola dari Hades)
- `questionBanks/{id}`, `questions/{id}`, `quizzes/{id}`
- `attempts/{quizId_userId}` -> `{ quizId, userId, userName, snapshot[], answers[], startTime, endAt, endTime, status, totalPoints, maxPoints, scorePercent }`

## Catatan

- Nilai dihitung di browser dan soal beserta kunci jawabannya bisa dibaca member lewat Firestore: cocok untuk quiz internal, bukan ujian yang harus anti-curang.
- Gambar soal disimpan base64 di Firestore (maks. 500KB); video/audio lewat link.
