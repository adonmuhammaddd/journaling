#!/usr/bin/env bash
#
# server-deploy.sh — tarik rilis DI SERVER (cPanel) dari branch `deploy`.
#
# Prasyarat (setup sekali): repo sudah di-clone di folder aplikasi dan berada di
# branch `deploy`, `vendor/` sudah ada, `.env` dan `storage/` sudah terisi.
#
# Pemakaian:
#   ./server-deploy.sh              # git pull + migrasi + segarkan cache
#   ./server-deploy.sh --composer   # + composer install (kalau ada dep composer baru)
#
set -euo pipefail
cd "$(dirname "$0")"

echo "▶ git pull origin deploy …"
git pull origin deploy

if [ "${1:-}" = "--composer" ]; then
  echo "▶ composer install --no-dev --optimize-autoloader …"
  composer install --no-dev --optimize-autoloader --no-interaction
fi

# Manifest paket lama bisa menunjuk provider dev yang tidak ada di vendor ramping.
echo "▶ php artisan package:discover …"
rm -f bootstrap/cache/packages.php bootstrap/cache/services.php
php artisan package:discover || true

echo "▶ php artisan migrate --force …"
php artisan migrate --force

echo "▶ menyegarkan cache …"
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo ""
echo "✓ Deploy selesai."
