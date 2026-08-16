# Deploy 2FAKU ke Cloudflare Workers

## Build configuration

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: `/`
- Recommended Node.js version: `22`

Dashboard Workers terbaru tidak menampilkan kolom **Build output directory**. Folder
hasil build sudah ditentukan di `wrangler.jsonc` melalui
`assets.directory: "./dist"`.

## Deployment

1. Push repository ini ke GitHub.
2. Buka Cloudflare Dashboard, lalu pilih **Workers & Pages**.
3. Buat Worker, lalu hubungkan repository GitHub ini.
4. Pilih branch produksi `main`.
5. Masukkan build configuration di atas. Kolom output tidak diperlukan.
6. Pilih token API khusus Workers Builds yang tersedia, lalu deploy.
7. Setelah deployment berhasil, buka **Domains** dan tambahkan `2faku.com`.
8. Daftarkan `https://2faku.com/sitemap.xml` di Google Search Console.

Setiap push berikutnya ke branch produksi akan otomatis memicu build dan deployment baru.

## Pengujian lokal

```bash
npm ci
npm run build
npx wrangler deploy --dry-run
```

Versi static yang di-deploy berada di folder `dist`. Source Laravel lama tetap tersedia sebagai backup, tetapi tidak diperlukan oleh Cloudflare Workers.
