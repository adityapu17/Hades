# Hades
Web basic knowledge dan dokumentasi tim internal Helpdesk

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # output ke dist/
```

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
