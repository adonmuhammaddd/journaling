#!/usr/bin/env bash
#
# server-deploy.sh — tarik rilis DI SERVER (cPanel) dari branch `deploy`.
#
# Prasyarat (setup 1x): repo sudah di-clone di folder app, checkout branch `deploy`,
# vendor/ sudah ada (dari deploy zip atau composer), .env & storage/ sudah terisi.
#
# Pemakaian:
#   ./server-deploy.sh              # git pull + migrasi + cache (tanpa dep baru)
#   ./server-deploy.sh --composer   # + composer install (kalau ada dep composer baru)
#
set -euo pipefail
cd "$(dirname "$0")"

echo "▶ git pull origin deploy …"
git pull origin deploy

# Penanda mode dev Vite. Kalau file ini ada, Blade merender
# <script src="http://127.0.0.1:5173/…"> dan asset produksi tidak kepakai.
rm -f public/hot

if [ "${1:-}" = "--composer" ]; then
  if command -v composer >/dev/null 2>&1; then
    echo "▶ composer install --no-dev --optimize-autoloader …"
    composer install --no-dev --optimize-autoloader --no-interaction
  else
    echo "⚠ composer tidak ditemukan di server — lewati (deploy dep baru pakai ./deploy.sh zip)."
  fi
fi

# Manifest paket lama bisa menunjuk provider dev yang tidak ada di vendor ramping.
echo "▶ php artisan package:discover …"
rm -f bootstrap/cache/packages.php bootstrap/cache/services.php
php artisan package:discover || true

echo "▶ php artisan migrate --force …"
php artisan migrate --force

echo "▶ php artisan optimize:clear …"
php artisan optimize:clear

echo "▶ cache ulang config / route / view …"
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo ""
echo "✓ Deploy selesai."
