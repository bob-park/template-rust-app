#!/usr/bin/env bash
# Builds the signed and notarized macOS app (.app, .dmg, updater bundle + .sig).
# Notarization uses an App Store Connect API key: key ID and issuer ID come from the
# login keychain, the .p8 from ~/.config/apple. Extra args go to `tauri build`.
set -euo pipefail
cd "$(dirname "$0")/.."
kc() { security find-generic-password -a "$USER" -s "$1" -w; }

set -a
# shellcheck disable=SC1091
source "$HOME/.config/apple/.env"                 # APPLE_SIGNING_IDENTITY
# shellcheck disable=SC1091
source "$HOME/.config/template-rust-app/sign.env" # TAURI_SIGNING_PRIVATE_KEY(_PASSWORD)
set +a

# Assign before export: `export X="$(kc …)"` would hide a failed lookup from set -e.
APPLE_API_KEY=$(kc tauri-apple-api-key)
APPLE_API_ISSUER=$(kc tauri-apple-api-issuer)
APPLE_API_KEY_PATH="$HOME/.config/apple/AuthKey_${APPLE_API_KEY}.p8"
[ -f "$APPLE_API_KEY_PATH" ] || { echo "missing $APPLE_API_KEY_PATH" >&2; exit 1; }
export APPLE_API_KEY APPLE_API_ISSUER APPLE_API_KEY_PATH

yarn tauri build --bundles app,dmg "$@"
