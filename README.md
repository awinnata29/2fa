# 2FAKU

2FAKU adalah web utility gratis untuk membuat kode autentikasi TOTP dan memeriksa status UID Facebook secara massal. Aplikasi berjalan sebagai static website di browser dan dirancang untuk deployment gratis melalui Cloudflare Pages.

Production domain: [2faku.com](https://2faku.com)

## Fitur

### 2FA Authenticator

- Menghasilkan kode TOTP enam digit setiap 30 detik.
- Mendukung secret key Base32.
- Secret key berbeda untuk setiap grup.
- Tambah, pilih, dan hapus grup.
- Data grup disimpan pada `localStorage` browser.
- Copy kode autentikasi dengan satu klik.
- Tidak mengirim secret key ke backend.

### Check Live UID Facebook

- Memeriksa banyak UID dalam satu proses.
- Hanya memproses baris numerik UID.
- Mengabaikan email, password, secret key, baris kosong, dan UID duplikat.
- Pemeriksaan paralel dengan progress real-time.
- Memisahkan hasil Live dan Dead.
- Copy dan export hasil ke file `.txt`.
- Menampilkan kartu statistik akun aktif, mati, dan total akun.

Status UID ditentukan berdasarkan respons foto profil dan CDN publik Facebook. Perubahan endpoint, privasi akun, pembatasan wilayah, atau rate limit Facebook dapat memengaruhi hasil.

## Teknologi

- HTML5
- CSS dan Tailwind CSS v4 build pipeline
- Vanilla JavaScript
- Web Crypto API untuk HMAC-SHA1 TOTP
- Vite v7
- Cloudflare Pages
- Laravel 12 sebagai source/backup lama, tidak dibutuhkan pada deployment static

## Persyaratan

Untuk versi static yang direkomendasikan:

- Node.js 22 atau lebih baru
- npm
- Browser modern dengan Web Crypto API

PHP, Composer, database, dan web server Laravel tidak diperlukan untuk menjalankan versi Cloudflare.

## Instalasi lokal

Clone repository:

```bash
git clone https://github.com/awinnata29/2fa.git
cd 2fa
```

Install dependency secara reproducible:

```bash
npm ci
```

Jalankan development server:

```bash
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

Halaman yang tersedia:

- `/` — 2FA Authenticator
- `/check-live-uid-facebook/` — Check Live UID Facebook

## Production build

Jalankan:

```bash
npm run build
```

Vite akan:

1. Memproses CSS dan JavaScript.
2. Menghasilkan dua halaman HTML production.
3. Menyalin gambar promosi, favicon, sitemap, robots, redirects, dan security headers.
4. Menyimpan seluruh hasil deployment di folder `dist`.

Preview hasil production:

```bash
npm run preview
```

Jangan mengedit isi folder `dist` secara langsung karena folder tersebut dibuat ulang setiap build.

## Deploy ke Cloudflare Pages melalui GitHub

1. Push perubahan ke branch `main` GitHub.
2. Masuk ke Cloudflare Dashboard.
3. Buka **Workers & Pages**.
4. Pilih **Create application** → **Pages** → **Connect to Git**.
5. Hubungkan repository `awinnata29/2fa`.
6. Gunakan konfigurasi berikut:

| Pengaturan | Nilai |
|---|---|
| Framework preset | `None` |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node.js version | `22` |

7. Pilih **Save and Deploy**.
8. Setelah deployment preview berhasil, buka **Custom domains**.
9. Tambahkan `2faku.com` dan ikuti konfigurasi DNS Cloudflare.

Setiap push baru ke branch `main` akan otomatis membuat deployment baru. Instruksi ringkas juga tersedia di [CLOUDFLARE_DEPLOY.md](CLOUDFLARE_DEPLOY.md).

## Struktur penting

```text
2fa/
├── index.html                          # Halaman static Authenticator
├── check-live-uid-facebook/
│   └── index.html                      # Halaman static Check UID
├── resources/
│   ├── css/app.css                     # Seluruh design system
│   ├── js/app.js                       # TOTP, grup, dan UID checker
│   └── views/home.blade.php            # Source Laravel/backup
├── public/
│   ├── images/ads/                     # Banner promosi
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── _headers                        # Security dan cache headers
│   └── _redirects                      # Routing Cloudflare Pages
├── scripts/postbuild.mjs               # Menyalin aset static ke dist
├── vite.config.js                      # Multi-page Vite configuration
└── dist/                               # Output build, tidak masuk Git
```

## Penyimpanan data dan privasi

Data authenticator disimpan di browser menggunakan key berikut:

- `2faku-groups`
- `2faku-active-group`

Data lama dari `keylime-groups` tetap dibaca untuk kebutuhan migrasi. Menghapus site data atau local storage browser akan menghapus seluruh grup dan secret key pada perangkat tersebut.

Jangan membagikan secret key 2FA, file export sensitif, `.env`, access token, atau kredensial akun melalui issue maupun commit Git.

## TOTP

Generator menggunakan:

- Base32 decoding
- HMAC-SHA1
- Time step 30 detik
- Output enam digit

Perhitungan dilakukan melalui Web Crypto API pada browser. Waktu perangkat harus akurat agar kode sama dengan server layanan tujuan.

## SEO

Project sudah menyertakan:

- Title dan meta description berbeda untuk setiap halaman.
- Canonical URL ke `https://2faku.com`.
- Open Graph dan Twitter metadata.
- Structured data `SoftwareApplication`, `WebApplication`, dan `WebSite`.
- `robots.txt`.
- `sitemap.xml`.
- URL nyata untuk halaman Check UID tanpa hash routing.

Setelah domain aktif, tambahkan `https://2faku.com/sitemap.xml` ke Google Search Console dan gunakan URL Inspection untuk meminta indexing.

## Pengujian

Sebelum push atau deployment:

```bash
npm ci
npm run build
npm run preview
```

Checklist manual:

- Generator menghasilkan TOTP enam digit.
- Countdown memperbarui kode setiap 30 detik.
- Setiap grup memiliki secret key berbeda.
- Tambah dan hapus grup bekerja di desktop dan mobile.
- Data tetap tersedia setelah refresh.
- Filter Check UID hanya mengambil baris numerik.
- Copy dan export hasil bekerja.
- Halaman `/check-live-uid-facebook/` dapat dibuka langsung.
- `robots.txt` dan `sitemap.xml` dapat diakses.

Legacy Laravel test, jika PHP dan Composer tersedia:

```bash
composer install
php artisan test
```

## Troubleshooting

### `npm ci` gagal

Pastikan Node.js versi 22 digunakan, hapus `node_modules`, lalu jalankan kembali:

```bash
npm ci
```

### Halaman Check UID menghasilkan semua Dead

Pastikan browser tidak memblokir request ke `graph.facebook.com`. Ad blocker, DNS filter, rate limit, atau perubahan respons Facebook dapat memengaruhi pemeriksaan.

### Kode TOTP berbeda

Pastikan secret key benar dan waktu perangkat tersinkronisasi otomatis. Spasi dan tanda hubung pada secret key akan diabaikan.

### Cloudflare menampilkan 404 pada Check UID

Pastikan build output memakai folder `dist` dan file `public/_redirects` ikut tersalin oleh build.

## Workflow pengembangan

```bash
git checkout -b feature/nama-fitur
npm ci
npm run dev
npm run build
git add .
git commit -m "Describe the change"
git push origin feature/nama-fitur
```

Jangan commit folder `node_modules`, `dist`, `vendor`, file `.env`, atau credential apa pun.

## Lisensi

Project ini menggunakan lisensi MIT sesuai konfigurasi project Laravel awal.
