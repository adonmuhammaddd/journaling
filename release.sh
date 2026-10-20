#!/usr/bin/env bash
#
# release.sh — rilis via GIT (tanpa zip). Jalankan DI LOKAL.
#
# Test dulu, lalu ambil hasil `npm run build` (public/build) ke branch `deploy` dan push.
# Di server cukup `./server-deploy.sh` (git pull origin deploy).
#
# PAKAI saat TIDAK ada dependency baru (composer.json / package.json TIDAK berubah).
# Kalau ADA dependency baru → pakai ./deploy.sh (zip), atau ./server-deploy.sh --composer
# di server kalau composer tersedia di sana.
#
set -euo pipefail
cd "$(dirname "$0")"

MAIN=main
DEPLOY=deploy

# 0. Working tree harus bersih — checkout branch gagal / bikin bingung kalau kotor.
if [ -n "$(git status --porcelain)" ]; then
  echo "✗ Ada perubahan yang belum di-commit. Commit atau stash dulu:"
  git status --short
  exit 1
fi

if [ "$(git rev-parse --abbrev-ref HEAD)" != "$MAIN" ]; then
  echo "✗ Jalankan dari branch '$MAIN' (sekarang: $(git rev-parse --abbrev-ref HEAD))."
  exit 1
fi

# Vite 7 butuh Node >= 22.12 (lihat .nvmrc).
NODE_OK="$(node -p 'const [a, b] = process.versions.node.split(".").map(Number); a > 22 || (a === 22 && b >= 12)')"
if [ "$NODE_OK" != "true" ]; then
  echo "✗ Node $(node -v) terlalu tua. Jalankan 'nvm use' dulu."
  exit 1
fi

# 1. Test di main sebelum apa pun didorong.
echo "▶ npm test …"
npm test
echo "▶ php artisan test …"
php artisan test

# 2. Branch deploy — dibuat dari main kalau belum ada (rilis pertama).
if git show-ref --verify --quiet "refs/heads/$DEPLOY"; then
  echo "▶ checkout $DEPLOY + merge $MAIN …"
  git checkout "$DEPLOY"
  git merge "$MAIN" --no-edit
elif git ls-remote --exit-code --heads origin "$DEPLOY" >/dev/null 2>&1; then
  echo "▶ ambil $DEPLOY dari origin + merge $MAIN …"
  git checkout -b "$DEPLOY" "origin/$DEPLOY"
  git merge "$MAIN" --no-edit
else
  echo "▶ branch '$DEPLOY' belum ada — dibuat dari $MAIN …"
  git checkout -b "$DEPLOY"
fi

# 3. Build asset produksi.
echo "▶ npm run build …"
npm run build

# 4. public/build ada di .gitignore — dipaksa masuk khusus di branch deploy.
echo "▶ commit public/build (force, lewati .gitignore) …"
git add -f public/build
git commit -m "build $(date +%F-%H%M)" || echo "  (public/build tidak berubah)"

echo "▶ push $DEPLOY …"
git push -u origin "$DEPLOY"

echo "▶ kembali ke $MAIN …"
git checkout "$MAIN"

# Kembali ke main menghapus public/build (di main diabaikan git, di deploy dilacak).
echo "▶ membangun ulang aset lokal …"
npm run build >/dev/null

echo ""
echo "✓ Rilis terdorong ke branch '$DEPLOY'."
echo "  Di server jalankan:  ./server-deploy.sh"
echo "  (kalau ada dep composer baru:  ./server-deploy.sh --composer)"
