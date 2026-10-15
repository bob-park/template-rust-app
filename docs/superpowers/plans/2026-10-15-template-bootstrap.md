# Template Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn this empty repo into a Tauri 2 desktop-app template: a running "Hello, world" app with SQLite, tray, Dock icon, light/dark/system theme and auto-update; local signed release scripts; a GitHub Actions version bump on `develop`; and agent rule docs (`AGENTS.md`, `CLAUDE.md`, `docs/agents/`).

**Architecture:** React + Vite + Tailwind v4 + daisyUI v5 frontend in `src/`, Rust in `src-tauri/`. The Rust side has four modules: `store.rs` (Tauri-free SQLite settings), `tray.rs`, `updater.rs`, and `lib.rs` (app setup, commands, window lifecycle). The frontend calls Rust only through `src/api.ts`. Release and versioning are shell/Node scripts copied from vee-app and the spring template, then generalized.

**Tech Stack:** Rust 2024, Tauri 2.12, rusqlite (bundled), React 19, TypeScript, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), daisyUI v5, Yarn 4 via mise, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-15-template-bootstrap-design.md`

**Reference repos (read, copy, shrink):**
- vee-app: `/Users/hwpark/Documents/rust-workspace/vee-app`
- spring template: `/Users/hwpark/Documents/intellij-workspace/template-malgn-spring-modulith`

## Global Constraints

- Work on branch `main`. Commit messages use the `<prefix>: <subject>` format (feat/fix/refactor/build/docs/test/chore). Every commit ends with the session attribution lines.
- Dependency versions copy vee-app (`package.json`, `src-tauri/Cargo.toml`, `.mise.toml`: node 26, yarn 4.18.1). Add only `tailwindcss`, `@tailwindcss/vite`, `daisyui` (latest v4 / v5) on top. Rust deps:
  - tauri (features `tray-icon`, `image-png`)
  - serde, serde_json, log
  - tauri-plugin-single-instance, tauri-plugin-log, tauri-plugin-updater
  - rusqlite (`bundled`)
  - tempfile (dev)
- Do not add anything else without asking the user.
- Placeholder names:

  | Item | Value |
  | ---- | ----- |
  | productName | `App` |
  | identifier | `com.bobpark.app` |
  | crate | `template-rust-app` / lib `template_rust_app_lib` |
  | repo | `bob-park/template-rust-app` |
  | sign.env | `~/.config/template-rust-app/sign.env` |
  | DB file | `app.db` in the app data dir |

- Initial version `0.0.1` in `src-tauri/tauri.conf.json` (source of truth), `package.json`, and `src-tauri/Cargo.toml`. Plain semver `X.Y.Z` only.
- No LICENSE file and no `license` field anywhere.
- `plugins.updater.pubkey` is `""`. The endpoint is `https://github.com/bob-park/template-rust-app/releases/latest/download/latest.json`. `createUpdaterArtifacts: true`.
- No i18n. Tray labels are English.
- No secrets in the repo.
- macOS: regular activation policy, so the app shows in the Dock (do NOT copy vee's `ActivationPolicy::Accessory`).
- Docs language: `docs/agents/**` and `AGENTS.md` are in English. `CLAUDE.md` Claude-specific rules, `docs/development.md`, `docs/release.md`, and `README.md` are in Korean.
- Colors live only in the daisyUI theme blocks in `src/index.css`. Components use daisyUI/Tailwind semantic classes (`bg-base-100`, `text-primary`, `btn-primary`, …), never hex values.

## Review Focus

1. **First launch on a clean machine.** The app data dir does not exist yet. `Store::open` must create it, so the first launch does not crash. Test: `open_creates_missing_parent_dirs` (Task 2).
2. **Garbage in the `theme` row.** A hand-edited or old DB holds something like `"blue"`. `get_theme` must return `"system"` rather than an error or the bad value. Test: `get_theme_falls_back_to_system_for_unknown_value` (Task 2).
3. **`set_theme` called with an invalid value.** This is the frontend trust boundary. The call must be rejected and nothing saved. Test: `set_theme_rejects_unknown_value` (Task 2).
4. **Reopening an existing DB.** Migrations must not re-run, and the seed must not overwrite a value the user changed. Test: `reopen_keeps_user_values` (Task 2).
5. **Malformed version, or an unknown bump argument, in `bump-version-up.sh`.** The script must exit non-zero and leave all four files untouched. Tests: `rejects malformed version` and `rejects unknown bump type` (Task 6).

---

## File Structure

```
.mise.toml  .yarnrc.yml  .gitignore  package.json  tsconfig.json  vite.config.ts  index.html
app-icon.svg                      # example app icon source → yarn tauri icon
bump-version-up.sh                # semver bump of the 3 version files + Cargo.lock
.github/workflows/bump-version.yml
src/
  main.tsx                        # applies stored theme, then mounts <App/>
  App.tsx                         # greeting + theme select
  api.ts                          # ONLY place that calls invoke()
  theme.ts  theme.test.ts         # ThemePref, resolveTheme, applyTheme
  index.css                       # tailwind + daisyui + light/dark themes (kraken tokens)
src-tauri/
  Cargo.toml  build.rs  tauri.conf.json  capabilities/default.json
  icons/ (generated) + icons/tray.png + icons/tray.svg
  src/main.rs  lib.rs  store.rs  tray.rs  updater.rs
scripts/ release.sh  release.ps1  latest-json.mjs  latest-json.test.mjs  bump-version-up.test.mjs
docs/ development.md  release.md
AGENTS.md  CLAUDE.md  README.md
docs/agents/ (see Task 8)
```

---

### Task 1: Tauri + React + Tailwind/daisyUI skeleton with Dock icon

**Files:**
- Create: `.mise.toml`, `.yarnrc.yml`, `.gitignore`, `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `app-icon.svg`, `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Create: `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/icons/*`

**Interfaces:**
- Produces:
  - Window label `main`, declared with `create: false` in `tauri.conf.json`. `lib.rs` builds it in `setup`, the same way as vee's `for config in app.config().app.windows` loop. This means no command can run before state is managed.
  - `pub fn show_main(app: &AppHandle)` in `lib.rs`: show + unminimize + set_focus on window `main`.
  - `pub fn run()`.

- [ ] **Step 1: Write the toolchain and frontend config files**
  - `.mise.toml`, `.yarnrc.yml`, `tsconfig.json`, `vite.config.ts`, `index.html`: copy from vee-app. Set `<title>App</title>`. Add `tailwindcss()` from `@tailwindcss/vite` to the Vite plugins.
  - `.gitignore`: vee's file without the Babelay/kiri/`.dll` blocks. Keep `node_modules/ .yarn/ dist/ src-tauri/gen/ target/ .idea/ .DS_Store *.tsbuildinfo .superpowers/`.
  - `package.json`:
    - `"name": "template-rust-app"`, `"version": "0.0.1"`, no `license`.
    - Scripts: same as vee's.
    - Deps: `@tauri-apps/api`, `react`, `react-dom`.
    - Dev deps: vee's list minus `plugin-dialog`, plus `tailwindcss`, `@tailwindcss/vite`, `daisyui`.

- [ ] **Step 2: Write `src/index.css` with both daisyUI themes**

  ```css
  @import "tailwindcss";
  @plugin "daisyui" { themes: false; }
  @plugin "daisyui/theme" { name: "light"; default: true; color-scheme: light; /* ... */ }
  @plugin "daisyui/theme" { name: "dark"; prefersdark: true; color-scheme: dark; /* ... */ }
  ```

  - **Light theme:** take the values from `docs/design/kraken-design.md`:
    - primary `#7132f5`, primary-content `#ffffff`
    - base-100 `#ffffff`, base-content `#101114`
    - neutral `#686b82`, success `#149e61`
    - `--radius-field: 0.75rem` (12px buttons)
  - **Dark theme:** builder's call, using the same purple family:
    - base-100 near `#101114`
    - base-content near `#ffffff`
    - primary a lighter purple with readable contrast
  - Every daisyUI theme variable must be present in both blocks; the daisyUI docs list them.
  - Font: `IBM Plex Sans` fallback stack. Load it through `index.html` only if you choose a webfont; system fallback is acceptable.

- [ ] **Step 3: Write `src/main.tsx` and `src/App.tsx`**
  - `App` renders a centered card. The card holds `<h1 className="text-4xl font-bold">Hello, world</h1>`, a hardcoded string for now that Task 2 replaces.
  - Use daisyUI classes only.

- [ ] **Step 4: Write the Rust crate**
  - `Cargo.toml`: `name = "template-rust-app"`, `version = "0.0.1"`, `edition = "2024"`, lib `template_rust_app_lib` with vee's crate-type. Dependencies are listed in Global Constraints.
  - `build.rs` and `main.rs`: copy from vee, renaming the lib.
  - `tauri.conf.json`:
    - productName `App`, version `0.0.1`, identifier `com.bobpark.app`, build section same as vee.
    - One window: `{ "label": "main", "create": false, "title": "App", "width": 480, "height": 360, "center": true }`.
    - bundle targets `app`, `dmg`, `nsis`, with the standard icon list.
    - `createUpdaterArtifacts: true`.
    - updater plugin block per Global Constraints (pubkey `""`, `windows.installMode: "passive"`).
  - `capabilities/default.json`: windows `["main"]`, permissions `["core:default"]`.
  - `lib.rs`: `run()` registers the plugins in this order:
    1. single-instance, whose callback is `show_main`
    2. log at Info
    3. updater

    In `setup`, build the windows. In `on_window_event`, handle `main` + `CloseRequested`: call `api.prevent_close()`, then `window.hide()`.

    Finish with `.build(generate_context!())?.run(|app, event| …)`. On macOS, `RunEvent::Reopen { has_visible_windows: false, .. }` calls `show_main(app)`. This is the Dock click.

- [ ] **Step 5: Create example icons**
  - `app-icon.svg`: a simple 1024×1024 rounded square in `#7132f5` with a white "A".
  - Run `yarn tauri icon app-icon.svg`.
  - `src-tauri/icons/tray.svg`: black glyph on transparent, 44×44.
  - Run `yarn tauri icon src-tauri/icons/tray.svg -o <scratch> -p 44` and copy the 44px PNG to `src-tauri/icons/tray.png`.

- [ ] **Step 6: Verify**
  - Run: `yarn install && yarn typecheck && yarn tauri build --no-bundle`. Expected: all succeed.
  - Run: `yarn tauri dev`. Expected:
    - The window shows "Hello, world" in a purple-accented card.
    - The Dock shows the purple "A" icon.
    - Closing the window hides it, and clicking the Dock icon brings it back.
    - Running `yarn tauri dev` a second time while the first is up focuses the existing window.

- [ ] **Step 7: Commit**: `build: scaffold tauri react app with tailwind and daisyui`

---

### Task 2: SQLite store and settings commands

**Files:**
- Create: `src-tauri/src/store.rs`, `src/api.ts`
- Modify: `src-tauri/src/lib.rs`, `src/App.tsx`

**Interfaces:**
- Produces (Rust, `store.rs`, no `tauri` imports):
  - `pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;`
  - `pub struct Store`
  - `Store::open(path: &Path) -> Result<Store>`: creates parent dirs, migrates via `PRAGMA user_version`.
  - `Store::get_setting(&self, key: &str) -> Result<Option<String>>`
  - `Store::set_setting(&self, key: &str, value: &str) -> Result<()>` (upsert)
- Produces (Rust, `lib.rs`):
  - `pub struct AppState { pub store: Mutex<Store> }`
  - `pub const THEMES: [&str; 3] = ["light", "dark", "system"];`
  - Commands:
    - `get_greeting(state) -> Result<String, String>`
    - `get_theme(state) -> Result<String, String>`: an unknown stored value becomes `"system"`.
    - `set_theme(state, theme: String) -> Result<(), String>`: rejects values not in `THEMES`.
- Produces (TS, `src/api.ts`):
  - `getGreeting(): Promise<string>`
  - `getTheme(): Promise<ThemePref>`
  - `setTheme(theme: ThemePref): Promise<void>`
  - `ThemePref` is imported from `src/theme.ts`. Create that file here with just `export type ThemePref = "light" | "dark" | "system";`.

Schema V1, in a transaction:

```sql
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO settings VALUES ('greeting', 'Hello, world'), ('theme', 'system');
PRAGMA user_version = 1;
```

- [ ] **Step 1: Write failing tests** in `store.rs` `#[cfg(test)]` and `lib.rs` `#[cfg(test)]`, using `tempfile::tempdir()`:
  - `open_seeds_defaults`: a fresh `Store::open(dir/"a/b/app.db")` → `get_setting("greeting") == Some("Hello, world")` and `get_setting("theme") == Some("system")`.
  - `open_creates_missing_parent_dirs`: the path above, where `a/b` does not exist → `Ok`.
  - `reopen_keeps_user_values`: open → `set_setting("greeting","Hi")` → drop → reopen → `Some("Hi")`.
  - `get_setting_missing_key_is_none`: `get_setting("nope") == None`.
  - The two theme tests below need command logic that can be tested without Tauri. Put it in plain helper functions that the commands call:
    - `fn read_theme(store: &Store) -> Result<String, String>`
    - `fn write_theme(store: &Store, theme: &str) -> Result<(), String>`
  - `get_theme_falls_back_to_system_for_unknown_value`: `set_setting("theme","blue")` → `read_theme == "system"`.
  - `set_theme_rejects_unknown_value`: `write_theme("blue")` is `Err`, and the stored value is still `"system"`.

- [ ] **Step 2: Run** `cargo test --manifest-path src-tauri/Cargo.toml --lib`. Expected: FAIL (not defined).

- [ ] **Step 3: Implement** `store.rs` and the `lib.rs` pieces above.
  - In `setup`: `Store::open(&app.path().app_data_dir()?.join("app.db"))?`, `app.manage(AppState { … })`, then build the windows.
  - Register the 3 commands.
  - `// ponytail:` a store open failure aborts setup. Add a dialog when real user data is at stake (vee-app uses tauri-plugin-dialog).

- [ ] **Step 4: Run** the tests again. Expected: PASS.

- [ ] **Step 5: Wire the UI.** `App.tsx` shows the `getGreeting()` result instead of the hardcoded string.
  - Run: `yarn typecheck`.
  - Run: `yarn tauri dev`. Expected: "Hello, world" shows, read from the DB.

- [ ] **Step 6: Commit**: `feat: add sqlite settings store with greeting and theme`

---

### Task 3: Light / dark / system theme

**Files:**
- Modify: `src/theme.ts`, `src/main.tsx`, `src/App.tsx`
- Create: `src/theme.test.ts`

**Interfaces:**
- Consumes: `getTheme`, `setTheme` (Task 2).
- Produces (`src/theme.ts`):
  - `resolveTheme(pref: ThemePref, prefersDark: boolean): "light" | "dark"`
  - `applyTheme(pref: ThemePref): () => void`. It sets `document.documentElement.dataset.theme` to the resolved value. When `pref === "system"`, it also subscribes to `matchMedia("(prefers-color-scheme: dark)")` changes. It returns an unsubscribe function, which is a no-op for light/dark.

- [ ] **Step 1: Write the failing test** `src/theme.test.ts` (`node:test`, `node:assert/strict`):

  ```ts
  test("resolveTheme", () => {
    assert.equal(resolveTheme("light", true), "light");
    assert.equal(resolveTheme("dark", false), "dark");
    assert.equal(resolveTheme("system", true), "dark");
    assert.equal(resolveTheme("system", false), "light");
  });
  ```

- [ ] **Step 2: Run** `yarn test`. Expected: FAIL.

- [ ] **Step 3: Implement** `theme.ts`.
  - `main.tsx`: `await getTheme()` → `applyTheme(pref)` **before** `createRoot(...).render`, so the first paint already has the right theme.
  - `App.tsx`: add a daisyUI `select` (Light / Dark / System) bound to the current pref. On change: `setTheme(p)`, then call the previous unsubscribe, then `applyTheme(p)`.

- [ ] **Step 4: Verify**
  - Run: `yarn test && yarn typecheck`. Expected: PASS.
  - Run: `yarn tauri dev`. Expected:
    - Switching themes recolors the page immediately.
    - With "System" selected, toggling macOS appearance recolors the page live.
    - Restart → the choice persists.

- [ ] **Step 5: Commit**: `feat: add light, dark and system theme switching`

---

### Task 4: Tray and auto-updater

**Files:**
- Create: `src-tauri/src/tray.rs`, `src-tauri/src/updater.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Consumes: `show_main(app)` (Task 1).
- Produces (`updater.rs`): shrink vee's `updater.rs`.
  - Keep: `UpdateStatus` (same serde shape, and its test `status_serializes_like_the_typescript_union`), `UpdateState` with `ready_version()`, `check(app) -> UpdateStatus` (async), `install_and_restart(app) -> Result<(), String>`, `spawn_periodic(app)` (release builds only, every 6h).
  - Drop: the `whats_new` call and the `#[tauri::command]`s, since there is no UI for them.
  - `set_status` calls `tray::refresh`.
- Produces (`tray.rs`):
  - `create(app: &AppHandle) -> tauri::Result<()>`
  - `refresh(app: &AppHandle)`
  - Menu ids, in order:
    - `open` "Open"
    - `update`: "Check for Updates", or "Restart to Update" when `ready_version()` is `Some`
    - separator
    - `quit` "Quit"
  - Handlers:
    - `open` → `show_main`
    - `update` → if ready, `install_and_restart` (log the error); else `tauri::async_runtime::spawn(check)`
    - `quit` → `app.exit(0)`
  - Tray icon: macOS uses `icons/tray.png` as a template image. Other platforms use the default window icon, as in vee's `tray.rs`.

- [ ] **Step 1: Copy the `status_serializes_like_the_typescript_union` test** with the shrunk `updater.rs`. Run `cargo test --manifest-path src-tauri/Cargo.toml --lib`. Expected: PASS once the module compiles.

- [ ] **Step 2: Implement** `tray.rs`.
  - `lib.rs`: `.manage(updater::UpdateState::default())`. In `setup`, after the windows are built: `tray::create(app.handle())?` and `updater::spawn_periodic(app.handle().clone())`.

- [ ] **Step 3: Verify**
  - Run: `cargo test … --lib && yarn tauri build --no-bundle`. Expected: PASS.
  - Run: `yarn tauri dev`. Expected:
    - The tray icon appears.
    - Open shows the hidden window.
    - "Check for Updates" logs a failure (empty pubkey / no release) without crashing.
    - Quit exits the process.

- [ ] **Step 4: Commit**: `feat: add tray menu and background auto-updater`

---

### Task 5: Local release scripts

**Files:**
- Create: `scripts/release.sh`, `scripts/release.ps1`, `scripts/latest-json.mjs`, `scripts/latest-json.test.mjs`, `docs/release.md`

**Interfaces:**
- Consumes: product name `App`, repo `bob-park/template-rust-app`, sign.env path from Global Constraints.
- Produces: `buildManifest(tag, sigs, now?, notes?)`, exported from `latest-json.mjs`, with the same signature as vee's.

- [ ] **Step 1: Copy** `latest-json.test.mjs` from vee. Change the expected URLs to `bob-park/template-rust-app`. Run `yarn test`. Expected: FAIL (module missing).

- [ ] **Step 2: Copy and generalize** the three scripts from vee.
  - Replace `vee-app` with `template-rust-app`, `Vee` with `App`, and `~/.config/vee` with `~/.config/template-rust-app`. Change the temp-dir prefix to `app-sig-`.
  - Bundle names:
    - `App_${VERSION}_aarch64.dmg`
    - `App.app.tar.gz` → `App_${VERSION}_aarch64.app.tar.gz`
    - `App_${version}_x64-setup.exe`
  - Windows stays like vee: no code signing, only the Tauri updater `.sig`. Notarization is macOS only (via the `APPLE_*` env vars in sign.env).
  - Mark the scripts executable (`chmod +x scripts/release.sh`).

- [ ] **Step 3: Run** `yarn test`. Expected: PASS.

- [ ] **Step 4: Write `docs/release.md`** in Korean, adapting vee's `docs/release.md`. Add a "처음 한 번" section covering:
  - `yarn tauri signer generate -w ~/.config/template-rust-app/updater.key`. Paste the public key into `plugins.updater.pubkey`, and set `TAURI_SIGNING_PRIVATE_KEY` / `_PASSWORD` in sign.env.
  - The Apple Developer ID certificate and `APPLE_*` keys.

  Update the procedure:
  1. Version bumps come from the GitHub Action on `develop` (Task 6), never by hand.
  2. Merge `develop` into `main` via PR.
  3. On `main`, run `scripts/release.sh` (macOS) and `pwsh scripts/release.ps1` (Windows).
  4. Run `node scripts/latest-json.mjs v<X.Y.Z>`.
  5. Publish with `gh release edit … --draft=false`.

  Keep vee's "macOS만 먼저 게시하기" and "문제 해결" sections, renamed.

- [ ] **Step 5: Commit**: `build: add local signed release scripts`

---

### Task 6: Version bump script and workflow

**Files:**
- Create: `bump-version-up.sh`, `scripts/bump-version-up.test.mjs`, `.github/workflows/bump-version.yml`

**Interfaces:**
- Produces: `./bump-version-up.sh [patch|minor|major]` (default `patch`). It runs from its own directory (`cd "$(dirname "$0")"`).
  - Reads the current version from `src-tauri/tauri.conf.json` (`"version": "X.Y.Z"`).
  - Validates `^[0-9]+\.[0-9]+\.[0-9]+$`.
  - Bumps (minor resets patch; major resets minor and patch).
  - Writes the new version to:
    - `src-tauri/tauri.conf.json`
    - `package.json` (top-level `"version"`)
    - `src-tauri/Cargo.toml` (`[package]` `version`)
    - `src-tauri/Cargo.lock`: the `version` line right after `name = "template-rust-app"`
  - Uses `perl -i` so it works on macOS and Ubuntu. Uses the spring script's colored Korean messages.
  - Validates everything before writing anything.
  - Prints `현재 버전: …` and `새로운 버전: …`.

- [ ] **Step 1: Write the failing test** `scripts/bump-version-up.test.mjs`.
  - Each case copies `bump-version-up.sh` plus four minimal fixture files into a fresh `mkdtempSync` dir with the same relative paths:
    - `tauri.conf.json` with `"version": "0.0.1"`
    - `package.json` with `"version": "0.0.1"` and a dependency entry whose version must stay untouched
    - `Cargo.toml` with a `[package] version` and a `serde = { version = "1" }` dep that must stay untouched
    - `Cargo.lock` with two packages
  - Then it runs `bash <dir>/bump-version-up.sh <arg>` with `execFileSync` / `spawnSync`.
  - Cases:
    - `patch by default`: no arg → all four files contain `0.0.2`, and the dependency versions are unchanged.
    - `minor resets patch`: version `1.2.3` → `1.3.0`.
    - `major resets minor and patch`: `1.2.3` → `2.0.0`.
    - `rejects unknown bump type`: arg `date` → non-zero exit; files byte-identical.
    - `rejects malformed version`: version `0.1.0-rc1-20260101` → non-zero exit; files byte-identical.

- [ ] **Step 2: Run** `yarn test`. Expected: FAIL.

- [ ] **Step 3: Implement** `bump-version-up.sh` and `chmod +x` it.

- [ ] **Step 4: Run** `yarn test`. Expected: PASS.

- [ ] **Step 5: Write `.github/workflows/bump-version.yml`** as a port of the spring `SmartVersionBumpOnPR.yml`.
  - Trigger: `push` to `develop`. Job permission: `contents: write`. Use `actions/checkout@v4` with `fetch-depth: 0`, and set the git identity to `GitHub Action`.
  - PR number: take it from `Merge pull request #N`, and also from the squash form `… (#N)` at the end of the subject.
  - PR title and labels: fetch with `actions/github-script@v7`.
  - Bump type: `major` if a `major` label or `[major]` in the title; `minor` likewise; otherwise `patch`. There is no `date` branch.
  - Run `./bump-version-up.sh <type>`.
  - If anything changed: `NEW_VERSION` from `node -p 'require("./src-tauri/tauri.conf.json").version'`, `git add` the four files, `git commit -m "chore: bump version to ${NEW_VERSION} [skip ci]"`, `git push origin develop`.

- [ ] **Step 6: Verify**
  - Run: `bash -n bump-version-up.sh`.
  - Run: `ruby -ryaml -e 'YAML.load_file(".github/workflows/bump-version.yml")'` (or any YAML parser).
  - Expected: no errors. Do NOT run the script on the real repo files.

- [ ] **Step 7: Commit**: `build: add semver bump script and develop workflow`

---

### Task 7: Developer docs and README

**Files:**
- Create: `docs/development.md`, `README.md`

- [ ] **Step 1: Write `docs/development.md`** in Korean, adapting vee's version.
  - Tool table: Rust 2024, Node 26 / Yarn 4.18.1 via mise, OS prerequisites.
  - 처음 한 번: `mise install`, `yarn install`.
  - 개발 실행: `yarn tauri dev`, plus the note that this is a tray app — quit from the tray before rerunning.
  - 테스트: the three commands.
  - 빌드: `yarn tauri build`, which needs signing keys; use `--no-bundle` without them.
  - 프로젝트 구조: the tree from this plan's File Structure.
  - 데이터 초기화: `~/Library/Application Support/com.bobpark.app/`, `%APPDATA%\com.bobpark.app\`.
  - Schema versioning via `PRAGMA user_version`.

- [ ] **Step 2: Write `README.md`** in Korean.
  - What the template is.
  - Quick start (`mise install && yarn install && yarn tauri dev`).
  - Links to `docs/development.md`, `docs/release.md`, `AGENTS.md`.
  - "새 앱으로 만들 때 바꿀 것" checklist with every placeholder location:
    - `package.json` name
    - `Cargo.toml` name + lib name + `main.rs` lib path
    - `tauri.conf.json` productName/identifier/title/updater endpoint/pubkey
    - `REPO` + sign.env path in the three scripts
    - bundle file names `App_` in the release scripts
    - the Cargo.lock package name in `bump-version-up.sh`
    - `index.html` title
    - `app-icon.svg` + regenerating icons
    - `docs/design/`
  - "GitHub 설정": create the `develop` branch; make it the default PR base; if `develop` is protected, allow GitHub Actions to push.

- [ ] **Step 3: Verify** that every command and path in both files exists in the repo (spot-check with `ls`).

- [ ] **Step 4: Commit**: `docs: add development guide and readme`

---

### Task 8: AGENTS.md, CLAUDE.md, docs/agents

**Files:**
- Create: `AGENTS.md`, `CLAUDE.md`, and under `docs/agents/`:
  - `overview.md`, `architecture.md`, `structure-dir.md`, `design.md`, `testing.md`, `build-run.md`, `configuration.md`, `documentation.md`
  - `conventions/rust-modules.md`, `conventions/tauri-commands.md`, `conventions/sqlite-store.md`, `conventions/frontend.md`, `conventions/naming.md`
  - `workflow/branching.md`, `workflow/commit-messages.md`, `workflow/pr.md`, `workflow/versioning.md`, `workflow/release.md`

**Format (every doc under `docs/agents/`):**
- YAML frontmatter `title`, `scope`, `applies_to`, `related`.
- Then `# Title`.
- Then a one-line `> TL;DR` blockquote.
- Follow the spring template's files as models.

**Content decisions:** state each one; the wording is yours.
- `overview.md`: Tauri desktop-app template; stack + versions; points to the README placeholder checklist.
- `architecture.md`:
  - The frontend calls Rust only via `src/api.ts`.
  - `AppState` holds `Mutex<Store>`.
  - Windows are `create: false` and get built in `setup` after state is managed.
  - Close hides the window; Dock reopen and second launch call `show_main`; the tray menu; the updater lifecycle (release-only, 6h, install on user request).
- `structure-dir.md`: the tree, plus where new things go:
  - new Rust feature → `src-tauri/src/<feature>.rs`
  - new screen → `src/<feature>/`
- `design.md`:
  - **Read `docs/design/` before any UI work.**
  - Tokens live only in the `src/index.css` daisyUI theme blocks.
  - Use semantic daisyUI classes, no hex in components.
  - Every change is checked in both light and dark.
- `conventions/rust-modules.md`:
  - one module per feature
  - keep logic Tauri-free where possible (like `store.rs`) so it is unit-testable
  - errors: `Box<dyn Error + Send + Sync>` inside, `Result<T, String>` at the command boundary
  - `log` macros, not `println!`
- `conventions/tauri-commands.md`:
  - define with `#[tauri::command]` and register in `generate_handler!`
  - validate inputs at the command (example: `set_theme`)
  - add a typed wrapper in `src/api.ts`
  - event names are `<domain>://<event>`
  - new plugin permissions go in `capabilities/default.json`
- `conventions/sqlite-store.md`:
  - append a `SCHEMA_Vn` migration and bump `user_version`; never edit a shipped migration
  - tests use `tempfile`
- `conventions/frontend.md`:
  - function components
  - Tailwind + daisyUI classes only; no CSS modules or inline colors
  - pure logic in `*.ts` with a `*.test.ts` via `node:test`
  - i18n is not set up; follow vee-app's `src/i18n` pattern if added
- `conventions/naming.md`: Rust snake_case modules/commands; TS camelCase wrappers mirroring command names (`get_theme` → `getTheme`); PascalCase components.
- `testing.md`: the three commands, with what each covers.
- `build-run.md`: dev, `--no-bundle`, full build needs keys.
- `configuration.md`: `tauri.conf.json` fields, capabilities, sign.env location; **never commit secrets**.
- `documentation.md`: `docs/superpowers/specs|plans` naming, `docs/design/`, `docs/development.md`, `docs/release.md`.
- `workflow/branching.md`: spring's table with `master` → `main`.
- `workflow/commit-messages.md`: spring's prefixes plus `chore` (used by the bump bot).
- `workflow/pr.md`: base-branch table with `main`; title → bump table with `[major]`/`[minor]`/else patch, and labels `major`/`minor` work too; no `[date]`.
- `workflow/versioning.md`:
  - plain semver `X.Y.Z`, starting at `0.0.1`
  - `tauri.conf.json` is the source of truth; four files are kept in sync by `bump-version-up.sh`; never edit by hand
  - the workflow runs on `develop` and needs `contents: write` (branch protection note)
  - release tag `vX.Y.Z`
- `workflow/release.md`: short summary; links `docs/release.md`.

**`AGENTS.md`:** follow spring's layout.
- Intro paragraph.
- Map grouped as Overview / Architecture & Structure / Design / Code Conventions / Workflow / Ops.
- "How to use" routes:
  - new UI screen → design → frontend → tauri-commands
  - new persisted data → sqlite-store → tauri-commands
  - new Rust feature → rust-modules → architecture
  - cutting a release → release → versioning
  - opening a PR → pr
  - etc.
- A top-level line: **"App design: read [`docs/design/`](docs/design/) before building or changing any UI."**
- The Convention Enforcement paragraph (spring's wording, adapted).

**`CLAUDE.md`:** `# CLAUDE.md`, `@AGENTS.md`, then `## Claude Code 전용 규칙` with spring's sections (Plan Mode, Skill Usage, Language, Convention Enforcement, Dependency Changes, Destructive Operations), adapted:
- Convention list → this repo's conventions.
- Dependency Changes → `src-tauri/Cargo.toml` and `package.json`.
- Add under Language: UI 작업 전 `docs/design/` 확인.

- [ ] **Step 1: Write all docs.**

- [ ] **Step 2: Verify links.**

  Run from the repo root:

  ```bash
  for f in AGENTS.md $(find docs/agents -name '*.md'); do
    grep -oE '\]\([^)#]+' "$f" | sed 's/^](//' | grep -v '^http' | while read -r p; do
      [ -e "$(dirname "$f")/$p" ] || echo "MISSING in $f: $p"; done; done
  ```

  Expected: no output.

- [ ] **Step 3: Verify accuracy.** Every file path, command name and module named in the docs exists. Grep for `store.rs`, `get_theme`, `bump-version-up.sh`, `show_main` etc. against the code.

- [ ] **Step 4: Commit**: `docs: add agent guide, claude rules and topic docs`

---

### Task 9: Final verification

- [ ] **Step 1: Run** `cargo test --manifest-path src-tauri/Cargo.toml --lib && yarn test && yarn typecheck && yarn tauri build --no-bundle`. Expected: all pass.
- [ ] **Step 2: Run** `yarn tauri dev` and walk the spec's completion checklist:
  - Hello, world
  - theme switch + persistence
  - tray Open/Quit
  - Dock icon + reopen
- [ ] **Step 3: Run** `git status`. Expected: clean, with no secrets or build output tracked (`git ls-files | grep -E 'target/|node_modules|dist/|\.env'` → empty).
