#!/bin/sh
# Buduje stronę i publikuje dist/ na gałęzi gh-pages.
# GitHub Pages serwuje tę gałąź (Settings → Pages → Deploy from a branch → gh-pages, / (root)).
# Użycie:  sh publish.sh
set -e
repo=$(cd "$(dirname "$0")" && pwd)
cd "$repo"

python3 build.py
src=$(git rev-parse --short HEAD)
git fetch -q origin gh-pages

tmp=$(mktemp -d)
trap 'git -C "$repo" worktree remove --force "$tmp"' EXIT
git worktree add -q --detach "$tmp" origin/gh-pages

git -C "$tmp" rm -rq --ignore-unmatch .
cp -R dist/. "$tmp"/
touch "$tmp/.nojekyll"
git -C "$tmp" add -A

if git -C "$tmp" diff --cached --quiet; then
  echo "Brak zmian do opublikowania."
  exit 0
fi
git -C "$tmp" commit -q -m "Publish site build from $src"
git -C "$tmp" push -q origin HEAD:gh-pages
echo "Opublikowano (z $src). Strona odświeży się za ok. minutę."
