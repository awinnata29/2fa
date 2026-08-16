# Deploy 2FAKU ke Cloudflare Pages

## Build configuration

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Recommended Node.js version: `22`

## Deployment

1. Push repository ini ke GitHub.
2. Buka Cloudflare Dashboard, lalu pilih **Workers & Pages**.
3. Pilih **Create application** → **Pages** → **Connect to Git**.
4. Pilih repository GitHub 2FAKU dan branch produksi (`main`).
5. Masukkan build configuration di atas, lalu pilih **Save and Deploy**.
6. Setelah preview berhasil, buka **Custom domains** dan tambahkan `2faku.com`.
7. Daftarkan `https://2faku.com/sitemap.xml` di Google Search Console.

Setiap push berikutnya ke branch produksi akan otomatis memicu build dan deployment baru.

## Pengujian lokal

```bash
npm ci
npm run build
npm run preview
```

Versi static yang di-deploy berada di folder `dist`. Source Laravel lama tetap tersedia sebagai backup, tetapi tidak diperlukan oleh Cloudflare Pages.
