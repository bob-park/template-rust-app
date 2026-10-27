---
title: Configuration & Secrets
scope: src-tauri/tauri.conf.json, src-tauri/capabilities/**, .yarnrc.yml, scripts/**
applies_to: changing app config, windows, permissions, or anything touching keys and tokens
related:
  - ./build-run.md
  - ./workflow/release.md
  - ./conventions/tauri-commands.md
---

# Configuration & Secrets

> App config is `src-tauri/tauri.conf.json`. Webview permissions are in `src-tauri/capabilities/default.json`. Secrets (signing keys, Apple credentials, npm token) live **outside the repo**: the login keychain (macOS), Windows Credential Manager, `~/.config/apple/` and the `GITHUB_NPM_AUTH_TOKEN` env var. **Never commit a secret.**

## `tauri.conf.json`

| Field | Notes |
| ----- | ----- |
| `version` | source of truth for the app version — changed only by `bump-version-up.sh` ([versioning](./workflow/versioning.md)) |
| `productName`, `identifier` | placeholders `App` / `com.bobpark.app`; release scripts depend on `productName` for file names |
| `app.windows` | `main` and `settings`, both `create: false` (built in `setup` after state exists) |
| `bundle.createUpdaterArtifacts` | `true` — full builds need the signing key |
| `plugins.updater.pubkey` | public half of the updater key; empty in the template, filled per app with the same text as `src-tauri/updater.key.pub` ([release](../release.md)) |
| `plugins.updater.endpoints` | `…/releases/latest/download/latest.json` of this repo |

## Capabilities

- `capabilities/default.json` lists the windows (`main`, `settings`) and `core:default`.
- A plugin API **called from JS** needs its permission here. Rust-only plugin use does not.
- A new window label must be added here.

## Secrets

| Secret | Where | Used by |
| ------ | ----- | ------- |
| `APPLE_SIGNING_IDENTITY` (Developer ID) | `~/.config/apple/.env` (shared by all apps) | `scripts/release-macos.sh` (code signing) |
| App Store Connect API key ID / issuer ID | login keychain, services `tauri-apple-api-key` / `tauri-apple-api-issuer` | `scripts/release-macos.sh` (notarization) |
| App Store Connect API private key | `~/.config/apple/AuthKey_<key id>.p8` | `scripts/release-macos.sh` (`APPLE_API_KEY_PATH`) |
| `TAURI_SIGNING_PRIVATE_KEY` (+ password) | macOS: login keychain, services `tauri-updater-<app>` / `tauri-updater-<app>-pw`, exported by `source scripts/load-updater-key-macos.sh`. Windows: Credential Manager, same two names, set by `. scripts/load-updater-key-windows.ps1` (`-Save` stores them once). `<app>` is `APP_NAME` / `$AppName` in those scripts | `yarn tauri build`, both release scripts |
| `GITHUB_NPM_AUTH_TOKEN` | shell env | `yarn install` (`@bob-park/*` from GitHub Packages) |
| `GITHUB_TOKEN` | Actions-provided | `bump-version.yml` |

- Don't print secrets in logs, scripts, or commit messages.
- If the stored key is not the key **content** (a path, a truncated value), the build fails late with `Invalid symbol` ([release](../release.md#문제-해결)).
