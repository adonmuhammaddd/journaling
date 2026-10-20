#!/usr/bin/env bash
#
# release.sh — rilis lewat git. Jalankan DI LOKAL.
#
# Menaruh hasil `npm run build` (public/build) ke branch `deploy` lalu push.
# Di server cukup `./server-deploy.sh`.
#
set -euo pipefail
cd "$(dirname "$0")"

MAIN=main
DEPLOY=deploy

if [ -n "$(git status --porcelain)" ]; then
  echo "✗ Masih ada perubahan yang belum di-commit. Rapikan dulu."
  exit 1
fi

# Node harus cukup baru untuk Vite 7.
if command -v node >/dev/null 2>&1; then
  NODE_MINOR="$(node -p 'process.versions.node.split(".").slice(0,2).join("")')"
  if [ "$NODE_MINOR" -lt 2212 ] 2>/dev/null; then
    echo "✗ Node $(node -v) terlalu tua. Jalankan 'nvm use' dulu (lihat .nvmrc)."
    exit 1
  fi
fi

echo "▶ npm test …"
npm test

echo "▶ php artisan test …"
php artisan test

echo "▶ checkout $DEPLOY + merge $MAIN …"
if git show-ref --verify --quiet "refs/heads/$DEPLOY"; then
  git checkout "$DEPLOY"
  git merge "$MAIN" --no-edit
else
  echo "  (branch '$DEPLOY' belum ada — dibuat dari $MAIN)"
  git checkout -b "$DEPLOY"
fi

echo "▶ npm run build …"
npm run build

# public/build ada di .gitignore; di branch rilis ia wajib ikut karena server tidak punya node.
echo "▶ commit public/build (paksa, lewati .gitignore) …"
git add -f public/build
git commit -m "build $(date +%F-%H%M)" || echo "  (public/build tidak berubah)"

echo "▶ push $DEPLOY …"
git push -u origin "$DEPLOY"

echo "▶ kembali ke $MAIN …"
git checkout "$MAIN"

# Kembali ke main menghapus public/build (di sini diabaikan git, di deploy dilacak).
echo "▶ membangun ulang aset lokal …"
npm run build >/dev/null

echo ""
echo "✓ Rilis terdorong ke branch '$DEPLOY'."
echo "  Di server jalankan:  ./server-deploy.sh"
echo "  (kalau ada dep composer baru:  ./server-deploy.sh --composer)"
