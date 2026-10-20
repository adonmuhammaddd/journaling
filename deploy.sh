#!/usr/bin/env bash
#
# deploy.sh — bundle a production-ready Laravel zip (TANPA node_modules).
#
#     ./deploy.sh                 # build asset + zip
#     ./deploy.sh --lean-vendor   # + composer install --no-dev (vendor ramping)
#
# Hasilnya 1 file <project>-deploy-<tanggal>.zip yang tinggal di-upload &
# di-extract di hosting. Dipakai untuk deploy PERTAMA atau saat ada dependency baru
# dan server tidak punya composer. Rilis biasa pakai ./release.sh.
#
set -euo pipefail
cd "$(dirname "$0")"

PROJECT="$(basename "$PWD")"
STAMP="$(date +%Y%m%d-%H%M)"
OUT="${PROJECT}-deploy-${STAMP}.zip"
TMP="$(mktemp -t "${PROJECT}-deploy-XXXX").zip"

# 0. Pastikan ini project Laravel.
if [ ! -f artisan ]; then
  echo "✗ 'artisan' tidak ditemukan — ini bukan root project Laravel. Batal."
  exit 1
fi

# 1. Build frontend asset → public/build.
echo "▶ npm run build …"
npm run build

# 2. (Opsional) Rampingkan vendor untuk produksi.
if [ "${1:-}" = "--lean-vendor" ]; then
  echo "▶ composer install --no-dev --optimize-autoloader …"
  composer install --no-dev --optimize-autoloader
  echo "  (Nanti balik kerja lokal: jalanin 'composer install' lagi buat balikin dev deps.)"
fi

# 3. Zip semua KECUALI yang build-time / dev / rahasia / referensi.
#    Build ke /tmp dulu biar zip-nya gak masukin dirinya sendiri.
#
#    Kategori exclude:
#      • build-time JS  : node_modules, package*.json, *.config.js, jsconfig, .nvmrc
#      • dev/VCS/IDE    : .git, tests, phpunit, .vscode/.idea/.fleet/.claude/.superpowers
#      • runtime state  : .env, public/hot, bootstrap/cache, storage/{cache,sessions,views,logs,app}
#      • RAHASIA/data   : *.sql, database/*.sqlite (DB lokal berisi akun demo!), .env.*
#      • referensi/docs : *.md, docs/
#      • artefak/sampah : *.zip, .DS_Store, __MACOSX, release.sh
echo "▶ Membuat zip …"
zip -r -q "$TMP" . \
  -x 'node_modules/*' \
  -x '.git/*' -x '.gitignore' -x '.gitattributes' \
  -x 'tests/*' -x 'phpunit.xml' -x '.phpunit.result.cache' \
  -x '.env' -x '.env.*' \
  -x 'public/hot' \
  -x 'bootstrap/cache/*.php' \
  -x 'storage/app/*' \
  -x 'storage/framework/cache/*' \
  -x 'storage/framework/sessions/*' \
  -x 'storage/framework/views/*' \
  -x 'storage/logs/*' \
  -x '.DS_Store' -x '*/.DS_Store' \
  -x '.vscode/*' -x '.idea/*' -x '.fleet/*' -x '.claude/*' -x '.superpowers/*' \
  -x '__MACOSX/*' \
  -x '*.zip' \
  -x 'deploy.sh' -x 'release.sh' \
  -x '*.sql' -x 'database/*.sqlite' -x 'database/*.sqlite-*' \
  -x '*.md' -x 'docs/*' \
  -x 'package.json' -x 'package-lock.json' -x '.nvmrc' \
  -x 'vite.config.js' -x 'vitest.config.js' -x 'tailwind.config.js' -x 'postcss.config.js' -x 'jsconfig.json' \
  -x '.editorconfig'

# Re-add yang kebuang excludes di atas tapi tetap kita mau:
#  - .env.example / .env.production.example : referensi
#  - .gitignore skeleton storage/ : biar deploy PERTAMA tetap punya folder writable
#    (di redeploy, file-file ini sudah identik di server jadi aman ditimpa)
for keep in .env.example .env.production.example \
            storage/app/.gitignore storage/app/public/.gitignore storage/app/private/.gitignore \
            storage/framework/cache/.gitignore storage/framework/sessions/.gitignore \
            storage/framework/views/.gitignore storage/logs/.gitignore; do
  if [ -f "$keep" ]; then zip -q "$TMP" "$keep"; fi
done

mv "$TMP" "$OUT"

echo ""
echo "✓ Selesai: $OUT  ($(du -h "$OUT" | cut -f1))"
echo ""
echo "Langkah upload:"
echo "  1. Upload $OUT ke hosting, extract di folder app."
echo "  2. .env, storage/ & bootstrap/cache TIDAK ikut (sengaja)"
echo "     — aman, gak nimpa config produksi di server."
echo "  3. Di server (Terminal cPanel):"
echo "       php artisan package:discover"
echo "       php artisan migrate --force"
echo "       php artisan config:cache && php artisan route:cache && php artisan view:cache"
