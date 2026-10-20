# Journaling

Catat aktivitas harian sebagai blok waktu (presisi menit) plus catatan, lalu lihat di kalender Day / Week / Month. Multi-user, nyaman dipakai di HP.

Stack: Laravel 12, Breeze (Inertia v2 + React 18 JSX), Tailwind 3, Vite 7, Vitest. MySQL di produksi, sqlite untuk lokal dan test. Desain lengkap ada di `docs/superpowers/specs/2026-10-20-journaling-design.md`.

## Jalan di lokal

Butuh PHP 8.2+, Composer, dan Node 22.12+ (`nvm use`).

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed   # --seed membuat akun demo@journaling.test (sandi: password) + entri seminggu
composer run dev             # server + vite di http://127.0.0.1:8000
```

## Test

```bash
php artisan test   # PHPUnit: auth, kalender, CRUD entri, validasi, isolasi antar user
npm test           # Vitest: helper tanggal, jam, layout blok, filter di resources/js/lib
```

## Struktur penting

- `app/Enums/Category.php`: daftar kategori tetap (label + warna), satu-satunya sumber.
- `app/Support/CalendarRange.php`: normalisasi `?view=&date=` dan rentang tanggal per view.
- `resources/js/lib/`: fungsi murni (tanggal, jam WIB, posisi blok, entri bentrok, filter).
- `resources/js/Components/Calendar/`: komponen kalender.

## Rilis ke cPanel

Setup sekali di server: clone repo ke folder aplikasi, `git checkout deploy`, `composer install --no-dev`, isi `.env`:

```
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=Asia/Jakarta
APP_LOCALE=id
DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...
```

lalu `php artisan key:generate` dan arahkan document root subdomain ke `public/`.

Setiap rilis:

```bash
./release.sh          # lokal: test, build, push branch deploy
./server-deploy.sh    # server: pull, migrate, cache
```
