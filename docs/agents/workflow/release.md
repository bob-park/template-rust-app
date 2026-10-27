---
title: Release
scope: scripts/**, docs/release.md
applies_to: cutting a release, touching release scripts or updater config
related:
  - ./versioning.md
  - ../configuration.md
---

# Release

> Releases are built, signed and uploaded **locally**: `scripts/release-macos.sh` (macOS: signs with Developer ID and notarizes the `.app` and `.dmg` with an App Store Connect API key) and `scripts/release-windows.ps1` (Windows: updater `.sig` only). `scripts/latest-json.mjs` then assembles `latest.json`. There is no CI build. The full procedure, in Korean, is in [docs/release.md](../../release.md).

## Steps

1. The version is already bumped on `develop` ([versioning](versioning.md)). Merge `develop` into `main`.
2. On macOS (Apple Silicon), run `scripts/release-macos.sh`. It uploads the dmg, `App_<v>_aarch64.app.tar.gz` and its `.sig` to the draft release `v<v>`.
3. On Windows, run `pwsh scripts/release-windows.ps1`. It uploads `App_<v>_x64-setup.exe` and its `.sig`.
4. Write the release notes; they become the update notes. Then run `node scripts/latest-json.mjs v<v>`.
5. Publish with `gh release edit v<v> --draft=false`.

## Updater signing key

The key pair is made once per app with the Tauri CLI. The private half lives only in each machine's secret store (`tauri-updater-<app>` / `tauri-updater-<app>-pw`, where `<app>` is `APP_NAME` / `$AppName` in the load scripts). The public half is `src-tauri/updater.key.pub` and, with the same text, `plugins.updater.pubkey`.

- **Generate** (once per app, or when the user asks to rotate, see the rules below): `yarn tauri signer generate -w <path>` writes `<path>` (private) and `<path>.pub`. It prompts for a password (`-p` sets it, `--ci` skips prompts, `-f` overwrites an existing file). Then:
  1. Store the private key **content** and the password: `security add-generic-password -a "$USER" -s tauri-updater-<app> -w '<content>'` (and `-s tauri-updater-<app>-pw`) on macOS, `. scripts/load-updater-key-windows.ps1 -Save` on Windows.
  2. Copy `<path>.pub` to `src-tauri/updater.key.pub` and put its text in `plugins.updater.pubkey`.
  3. Keep an offline backup of the private key file, then delete it from the working machine.
- **Sign a file by hand:** load the key (`source scripts/load-updater-key-macos.sh` / `. scripts/load-updater-key-windows.ps1`), then `yarn tauri signer sign --app-version <v> <file>`. It reads `TAURI_SIGNING_PRIVATE_KEY(_PASSWORD)` from the env. `yarn tauri build` already signs the updater artifacts, so this is only for re-signing.

## Rules for agents

- **Never run the release scripts or `gh release` commands without the user's explicit request.** They publish to users.
- **Never run `yarn tauri signer generate` (or change a filled `plugins.updater.pubkey`) without the user's explicit request.** Installed apps only trust the current public key: after a rotation they reject every update signed with the new key, so users must reinstall by hand.
- The updater signing key comes from the OS secret store: the login keychain through `scripts/load-updater-key-macos.sh` (sourced), and Credential Manager through `scripts/load-updater-key-windows.ps1` (dot-sourced). Neither is run as a child process. Don't go back to a key file or `sign.env`, and don't print the values.
- macOS notarization uses the **API key** method only (`APPLE_API_KEY`, `APPLE_API_ISSUER`, `APPLE_API_KEY_PATH`, set by `release-macos.sh`). Don't reintroduce `APPLE_ID`/`APPLE_PASSWORD`: if `APPLE_ID` is set, Tauri notarizes with it instead.
- Tauri notarizes only the `.app`; `release-macos.sh` then notarizes and staples the `.dmg` with `notarytool`. Keep that step, or Gatekeeper rejects the downloaded dmg.
- `scripts/release-macos.sh --build-only` builds and notarizes but uploads nothing. It still talks to Apple, so ask before running it.
- If you change `productName`, update the file names in `release-macos.sh` and `release-windows.ps1`. `latest-json.mjs` matches on suffix only.
- Both scripts refuse to run when `v<v>` is already **published** with that platform's build. A shipped version is never overwritten; bump the version instead (hotfix flow in [versioning](versioning.md)). Adding a platform that is still missing from a published release is allowed.
- Releases are created with `--target main`, so the tag points at `main` even when `develop` is the repo's default branch.
- `latest-json.mjs` refuses to run while `plugins.updater.pubkey` is empty. Don't remove that guard.
- The updater only accepts a `latest.json` whose listed platforms are all complete. That's why the script includes only the platforms that were uploaded.
