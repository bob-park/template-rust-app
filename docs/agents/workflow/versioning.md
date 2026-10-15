---
title: Versioning
scope: "**"
applies_to: reading or changing the app version, cutting a release
related:
  - ./pr.md
  - ./release.md
---

# Versioning

> Plain semver `X.Y.Z`, starting at `0.0.1`. `src-tauri/tauri.conf.json` is the source of truth. `bump-version-up.sh` keeps four files in sync; **never edit versions by hand**. The bump runs automatically in GitHub Actions on every merge into `develop`.

## Files carrying the version

`src-tauri/tauri.conf.json` (source of truth) · `package.json` · `src-tauri/Cargo.toml` (`[package]`) · `src-tauri/Cargo.lock` (the `template-rust-app` entry).

## `bump-version-up.sh`

```bash
./bump-version-up.sh [patch|minor|major]   # default: patch
```

- The script validates everything first, then writes. A malformed version or an unknown argument exits non-zero and changes nothing.
- It uses `perl -i`, so it works on macOS and on the Ubuntu runner.
- It is tested by `scripts/bump-version-up.test.mjs`.
- No `-rcN`/date suffixes: the Tauri updater compares semver, and prerelease tags would break update ordering.

## Workflow (`.github/workflows/bump-version.yml`)

1. Trigger: a push to `develop`, which happens when a PR merges. The bot's own commit carries `[skip ci]` and is skipped.
2. The workflow finds the PR number from the merge or squash commit, then reads the PR title and labels ([pr](pr.md#title)).
3. It runs the script and commits `chore: bump version to X.Y.Z [skip ci]` to `develop`.

**Repository setup:**

- Settings → Actions → Workflow permissions must be **Read and write**.
- If `develop` is protected, allow GitHub Actions to bypass the protection.

## Releases

Release tags are `vX.Y.Z`, cut from `main` by the release scripts ([release](release.md)).
