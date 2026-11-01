# Hades
Web basic knowledge dan dokumentasi tim internal Helpdesk

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # output ke dist/
```

## Quiz (`/quiz/`)

Aplikasi quiz (dulu repo Quibel) ada di folder `quiz/` (React + Vite) dan tampil di `https://<domain-hades>/quiz/`.
Satu domain, satu project Firebase (`peruri-helpdesk-kb`), jadi login Hades otomatis berlaku di Quiz. Akun dikelola dari **Kelola User** di Hades.

- `npm run build` membangun Hades, lalu Quiz ke `dist/quiz` (lihat `build:quiz` di `package.json`).
- Dev Quiz: `cd quiz && npm install && npm run dev` (buka `/quiz/`). Port dev berbeda dari Hades, jadi sesi login tidak ikut terbawa di mode dev; uji alur login lewat hasil deploy.
- Rules Firestore untuk Hades dan Quiz ada di satu file: `firestore.rules`.

## Deploy (Cloudflare Workers + static assets)

Konfigurasi ada di `wrangler.jsonc` (folder `dist/`) dan `public/_headers` (cache header).

**Via Git (auto-deploy tiap push):** Cloudflare dashboard → Workers & Pages → Create → Import a repository → pilih repo ini.

| Setting | Nilai |
|---|---|
| Worker name | `hades-peruri` (harus sama dengan `name` di `wrangler.jsonc`) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

**Manual dari lokal:** `npm run deploy` (perlu `npx wrangler login` sekali).

Setelah domain baru aktif, tambahkan domainnya di Firebase Console → Authentication → Settings → Authorized domains.
