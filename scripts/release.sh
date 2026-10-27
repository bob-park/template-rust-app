#!/usr/bin/env bash
# Builds, signs and notarizes the macOS app for Apple Silicon via build-mac.sh (Intel Macs are not
# supported), then uploads the dmg, the updater bundle and its .sig to a draft
# release. latest.json is assembled afterwards by scripts/latest-json.mjs.
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="bob-park/template-rust-app"
VERSION=$(node -p 'require("./src-tauri/tauri.conf.json").version')
TAG="v$VERSION"

# A published release that already has this platform's build is shipped: overwriting it would
# change what users installed without a version bump. (Adding a missing platform is fine.)
shipped=$(gh release view "$TAG" -R "$REPO" --json isDraft,assets \
  -q 'select(.isDraft == false) | .assets[].name | select(endswith("_aarch64.app.tar.gz"))' 2>/dev/null || true)
if [ -n "$shipped" ]; then
  echo "$TAG is already published with a macOS build ($shipped). Bump the version first (docs/release.md)." >&2
  exit 1
fi

scripts/build-mac.sh --target aarch64-apple-darwin

# --target main: the tag is cut from main, not the repo's default branch (often develop).
gh release view "$TAG" -R "$REPO" >/dev/null 2>&1 \
  || gh release create "$TAG" -R "$REPO" --target main --draft --title "App $TAG" --notes "App $TAG"

bundle="src-tauri/target/aarch64-apple-darwin/release/bundle"
# Exact names: old versions' bundles stay in target/ after a version bump.
dmg="$bundle/dmg/App_${VERSION}_aarch64.dmg"
[ -f "$dmg" ] || { echo "missing $dmg" >&2; exit 1; }

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
# The updater bundle is always named App.app.tar.gz; version it for the release.
tarball="$work/App_${VERSION}_aarch64.app.tar.gz"
cp "$bundle/macos/App.app.tar.gz" "$tarball"
cp "$bundle/macos/App.app.tar.gz.sig" "$tarball.sig"

gh release upload "$TAG" -R "$REPO" --clobber "$dmg" "$tarball" "$tarball.sig"
echo "Draft $TAG updated with the macOS build."
echo "After the Windows upload: node scripts/latest-json.mjs $TAG, then gh release edit $TAG -R $REPO --draft=false"
