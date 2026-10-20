# Deploy — Journaling ke cPanel

Stack: Laravel 12 + Inertia + React (Vite). Dua cara deploy:
**GIT** untuk perubahan kode/CSS biasa; **ZIP** untuk deploy pertama atau saat ada dependency baru.

> Repo: `github.com/adonmuhammaddd/journaling` (public)
> Branch: `main` (sumber, bersih) · `deploy` (main + `public/build` yang di-track)
> Server butuh `vendor/` + `public/build/` saat runtime — **bukan** `node_modules` (build-time only).

---

## A. Deploy via GIT (kode/CSS, TANPA dependency baru) — cara utama

**Lokal:**
```bash
./release.sh
# cek working tree bersih + branch main + Node >= 22.12 → npm test + php artisan test
# → checkout deploy → merge main → npm run build → commit public/build → push deploy
# → balik main → build ulang aset lokal
```

**Server (SSH / Terminal cPanel):**
```bash
cd ~/path/ke/app
./server-deploy.sh
# git pull origin deploy → hapus public/hot → package:discover
# → migrate --force → optimize:clear → config/route/view cache
```
`vendor/` di server tetap dipakai (tak berubah); `public/build` ikut lewat git.

---

## B. Deploy via ZIP (deploy pertama, atau composer.json / package.json berubah)

```bash
composer install && npm install
./deploy.sh                 # atau: ./deploy.sh --lean-vendor  (composer --no-dev)
# → journaling-deploy-<tanggal>.zip → upload cPanel → extract menimpa
```
Alternatif kalau server punya Composer: `./release.sh` (lokal) lalu server `./server-deploy.sh --composer`.

⚠️ Setelah zip deploy yang menambah package baru, **wajib** `php artisan package:discover`
— zip tidak membawa `bootstrap/cache/*.php`, jadi provider paket baru tidak terdaftar.

`deploy.sh` sengaja **tidak** menyertakan `.env`, `storage/`, `database/*.sqlite` (DB lokal berisi
akun demo), `*.sql`, dan `*.md`, supaya extract di server tidak menimpa config maupun data produksi.

---

## Setup 1x di server — folder app jadi git checkout branch `deploy`

Repo ini **public**, jadi clone lewat HTTPS tanpa deploy key SSH.

Urutan untuk instalasi pertama:

```bash
# 1. Lokal: dorong branch deploy pertama kali, lalu buat zip (bawa vendor/)
./release.sh
./deploy.sh --lean-vendor
composer install            # balikin dev deps lokal

# 2. cPanel: buat subdomain, document root → <folder app>/public
#    Buat database MySQL + user, beri ALL PRIVILEGES.
#    Upload zip ke <folder app>, extract.

# 3. Server: jadikan folder app checkout branch deploy
cd ~/path/ke/app
git init
git remote add origin https://github.com/adonmuhammaddd/journaling.git
git fetch origin deploy
git checkout -f -b deploy origin/deploy   # -f: timpa file hasil extract zip
chmod +x server-deploy.sh

# 4. Server: .env produksi
cp .env.production.example .env           # isi APP_URL, DB_*, MAIL_*
php artisan key:generate
php artisan migrate --force               # JANGAN pakai --seed (akun demo)
chmod -R 755 storage bootstrap/cache
./server-deploy.sh
```

`.env`, `storage/`, dan `vendor/` tidak ikut git — biarkan apa adanya di server.

**Email:** fitur "Lupa kata sandi" butuh SMTP. Isi `MAIL_MAILER=smtp` + `MAIL_HOST/PORT/USERNAME/PASSWORD`
dari akun email cPanel; dengan `MAIL_MAILER=log` tautan reset hanya tercatat di log.

---

## Artisan setelah deploy

| Perintah | Kapan |
|---|---|
| `php artisan package:discover` | **Wajib** setelah tambah package/dependency baru |
| `php artisan migrate --force` | Ada migrasi baru. **JANGAN** `migrate:fresh` / `--seed` — menghapus data / bikin akun demo |
| `php artisan optimize:clear` | Route/config/Blade berubah |
| `php artisan config:clear` | Setelah ubah `.env` |

`server-deploy.sh` sudah menjalankan package:discover + migrate + optimize:clear + cache ulang.

---

## Kalau tampilan di server "aneh" / asset tidak kebaca

Cek `public/hot` di server. Kalau file itu ada, Blade merender
`<script src="http://127.0.0.1:5173/…">` (mode dev Vite) dan asset produksi tidak dipakai.
`server-deploy.sh` sudah menghapusnya tiap deploy; kalau deploy manual, hapus sendiri.
