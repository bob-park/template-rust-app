# Template Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn this empty repo into a Tauri 2 desktop-app template:
- a running "Hello, world" app with SQLite, tray, Dock icon, light/dark/system theme and auto-update
- local signed release scripts
- a GitHub Actions version bump on `develop`
- agent rule docs (`AGENTS.md`, `CLAUDE.md`, `docs/agents/`)

**Architecture:** Front and back share domain names.
- **Frontend:** follows the nextjs template layout. Code lives in `src/app`, `src/domain/<name>/{apis,queries,components,store}`, `src/shared`, and `src/utils`. Data flows through React Query hooks, which call `apis/*.ts`, which call Tauri commands.
- **Rust:** code lives in `src-tauri/src/app` (shell: state, window, tray, updater), `src-tauri/src/domain/<name>/{model,repository,commands}`, and `src-tauri/src/shared/{db,error}`.
- **Dependency direction:** commands → domain → shared, one way only. `tauri` is imported only in `lib.rs`, `app/`, and `commands.rs`.
- **Release and versioning:** shell/Node scripts copied from vee-app and the spring template, then generalized.

**Tech Stack:**
- **Rust side:** Rust 2024, Tauri 2.12, rusqlite (bundled), thiserror
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), daisyUI v5, @tanstack/react-query v5, zustand v5 + immer, classnames
- **Tooling:** ESLint/Prettier via `@bob-park/*` configs, Yarn 4 via mise, `node:test`

**Spec:** `docs/superpowers/specs/2026-10-15-template-bootstrap-design.md`

**Reference repos (read, copy, shrink):**
- vee-app: `/Users/hwpark/Documents/rust-workspace/vee-app` (Tauri, release, updater, tray)
- nextjs template: `/Users/hwpark/Documents/webstorm-workspace/template-nextjs-app` (frontend layout, store/query patterns, lint config, `.yarnrc.yml`, `docs/agents/conventions/*`, `docs/agents/libs/*`)
- spring template: `/Users/hwpark/Documents/intellij-workspace/template-malgn-spring-modulith` (AGENTS.md format, workflow docs, bump workflow)

## Global Constraints

- **Branch and commits:**
  - Work on branch `main`.
  - Commit messages use the `<prefix>: <subject>` format (feat/fix/refactor/build/docs/test/chore).
  - Every commit ends with the session attribution lines.
- **JS dependencies:**
  - Versions copy vee-app (`.mise.toml`: node 26, yarn 4.18.1; React/Vite/TS/Tauri versions).
  - From the nextjs template `package.json`, take: `@tanstack/react-query`, `@tanstack/react-query-devtools`, `zustand`, `immer`, `classnames`, `@bob-park/eslint-config-bobpark`, `@bob-park/prettier-config-bobpark`, `eslint`, `prettier`.
  - Also add `tailwindcss`, `@tailwindcss/vite`, `daisyui` (v4 / v5).
- **Rust dependencies:**
  - tauri (features `tray-icon`, `image-png`)
  - serde, serde_json, log, thiserror
  - tauri-plugin-single-instance, tauri-plugin-log, tauri-plugin-updater
  - rusqlite (`bundled`)
  - tempfile (dev)
- **No other dependencies** without asking the user.
- `.yarnrc.yml` copies the nextjs template: `nodeLinker: node-modules`, the `bob-park` scope on `https://npm.pkg.github.com`, and `npmAuthToken: "${GITHUB_NPM_AUTH_TOKEN}"`.
  - Include `yarnPath` only if you commit the yarn release; otherwise rely on corepack/mise.
- **Placeholder names:**

  | Item | Value |
  | ---- | ----- |
  | productName | `App` |
  | identifier | `com.bobpark.app` |
  | crate | `template-rust-app` / lib `template_rust_app_lib` |
  | repo | `bob-park/template-rust-app` |
  | sign.env | `~/.config/template-rust-app/sign.env` |
  | DB file | `app.db` in the app data dir |

- **Version:** initial version `0.0.1` in `src-tauri/tauri.conf.json` (source of truth), `package.json`, and `src-tauri/Cargo.toml`. Plain semver `X.Y.Z` only.
- **License:** no LICENSE file and no `license` field anywhere.
- **Updater:** `plugins.updater.pubkey` is `""`. The endpoint is `https://github.com/bob-park/template-rust-app/releases/latest/download/latest.json`. `createUpdaterArtifacts: true`.
- **i18n:** none. Tray labels are English.
- **Secrets:** none in the repo.
- **macOS:** regular activation policy, so the app shows in the Dock. Do NOT copy vee's `ActivationPolicy::Accessory`.
- **Docs language:**
  - English: `docs/agents/**` and `AGENTS.md`.
  - Korean: `CLAUDE.md` Claude-specific rules, `docs/development.md`, `docs/release.md`, and `README.md`.
- **Colors:** they live only in the daisyUI theme blocks in `src/app/globals.css`. Components use daisyUI/Tailwind semantic classes (`bg-base-100`, `text-primary`, `btn-primary`, …), never hex values.
- **Frontend imports:**
  - Cross-folder imports use `@/…` (tsconfig `paths` + Vite `resolve.alias`). Same-folder imports are relative.
  - Client components and hooks use the nextjs template's section-comment order (`docs/agents/conventions/react-sections.md` there), minus the server-component parts.
- **Rust layering:**
  - `domain/**/model.rs`, `domain/**/repository.rs`, `domain/**/mod.rs`, and `shared/**` must not import `tauri`.
  - Domains never use another domain's `repository` directly.

## Review Focus

1. **First launch on a clean machine.** The app data dir does not exist yet. `shared::db::open` must create it. Test: `open_creates_missing_parent_dirs` (Task 2).
2. **Garbage in the `theme` row.** A hand-edited or old DB holds `"blue"`. `settings::theme` must return `Theme::System` rather than an error. Test: `theme_falls_back_to_system_for_unknown_value` (Task 2).
3. **`set_theme` called with an invalid value.** This is the frontend trust boundary. It must return `AppError::InvalidInput` and save nothing. Test: `set_theme_rejects_unknown_value` (Task 2).
4. **Reopening an existing DB.** Migrations must not re-run, and the seed must not overwrite user values. Test: `reopen_keeps_user_values` (Task 2).
5. **Malformed version, or an unknown bump argument, in `bump-version-up.sh`.** The script must exit non-zero and leave all four files untouched. Tests: `rejects malformed version` and `rejects unknown bump type` (Task 6).

---

## File Structure

```
.mise.toml  .yarnrc.yml  .gitignore  package.json  tsconfig.json  vite.config.ts  eslint.config.mjs  index.html
app-icon.svg                      # example app icon source → yarn tauri icon
bump-version-up.sh                # semver bump of the 3 version files + Cargo.lock
.github/workflows/bump-version.yml
src/
  app/
    main.tsx                      # seeds theme, applies it, mounts providers + <App/>
    App.tsx                       # card: <Greeting/> + <ThemeSwitcher/>
    globals.css                   # tailwind + daisyui + light/dark themes (kraken tokens)
  domain/settings/
    apis/settings.ts  apis/settings.dto.ts
    queries/settings.tsx
    components/Greeting.tsx
    store/.gitkeep
  shared/
    api/index.ts  api/common.dto.ts           # call<T>() over invoke, AppError type
    queries/index.ts                          # QueryMutationHandle<T>
    components/queries/RQProvider.tsx         # exports queryClient + provider
    components/theme/ThemeSwitcher.tsx
    providers/theme/ThemeProvider.tsx
    store/rootStore.ts  store/types.d.ts      # SlicePattern, empty BoundState
  utils/theme.ts  utils/theme.test.ts         # resolveTheme (pure)
src-tauri/
  Cargo.toml  build.rs  tauri.conf.json  capabilities/default.json
  icons/ (generated) + icons/tray.png + icons/tray.svg
  src/
    main.rs  lib.rs
    app/mod.rs  app/state.rs  app/window.rs  app/tray.rs  app/updater.rs
    domain/mod.rs  domain/settings/{mod.rs, model.rs, repository.rs, commands.rs}
    shared/mod.rs  shared/db.rs  shared/error.rs  shared/migrations/0001_init.sql
scripts/ release.sh  release.ps1  latest-json.mjs  latest-json.test.mjs  bump-version-up.test.mjs
docs/ development.md  release.md
AGENTS.md  CLAUDE.md  README.md
docs/agents/ (see Task 8)
```

---

### Task 1: Skeleton — Tauri + React + Tailwind/daisyUI + lint, with Dock icon and window lifecycle

**Files:**
- Create the config files: `.mise.toml`, `.yarnrc.yml`, `.gitignore`, `package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.mjs`, `index.html`, `app-icon.svg`
- Create the frontend files: `src/app/main.tsx`, `src/app/App.tsx`, `src/app/globals.css`
- Create the Rust crate files: `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`
- Create the app shell modules: `src-tauri/src/app/{mod.rs, window.rs}`
- Create the icons: `src-tauri/icons/*`

**Interfaces:**
- Produces (`app/window.rs`):
  - `pub const MAIN: &str = "main";`
  - `pub fn build_all(app: &tauri::App) -> tauri::Result<()>`: builds every `app.config().app.windows` entry, as vee's setup loop does. Windows are `create: false`, so they exist only after state is managed.
  - `pub fn show_main(app: &AppHandle)`: show + unminimize + set_focus on `MAIN`.
  - `pub fn hide_on_close(window: &tauri::Window, event: &WindowEvent)`: on `CloseRequested` for `MAIN`, it calls `prevent_close` and hides the window.
- Produces (`lib.rs`):
  - `pub fn run()`. It only assembles the app: plugins, `.setup`, `.on_window_event(app::window::hide_on_close)`, `invoke_handler`, and `.build(...)?.run(...)`.

- [ ] **Step 1: Config files**
  - `.mise.toml`, `tsconfig.json`, `vite.config.ts`, `index.html`: start from vee-app.
    - `index.html`: `<title>App</title>`, script `/src/app/main.tsx`.
    - `tsconfig.json`: add `"baseUrl": "."` and `"paths": { "@/*": ["./src/*"] }`.
    - `vite.config.ts`: add the `tailwindcss()` plugin, plus `resolve.alias` `{ "@": fileURLToPath(new URL("./src", import.meta.url)) }`.
  - `.yarnrc.yml`: per Global Constraints.
  - `eslint.config.mjs`: extends `@bob-park/eslint-config-bobpark`, as the nextjs template does, but without the `next/*` compat extends.
  - `package.json`:
    - `"prettier": "@bob-park/prettier-config-bobpark"`.
    - Scripts: vee's, plus `"lint": "eslint ./src"` and `"prettier": "prettier --write \"src/**/*.{ts,tsx,css}\""`.
    - `"test": "node --test \"src/**/*.test.ts\" \"scripts/*.test.mjs\""`.
  - If the bobpark ESLint config hard-requires Next.js plugins, stop and ask the user rather than adding Next deps.
  - `.gitignore`: vee's file without the Babelay/kiri/`.dll` blocks. Keep `node_modules/ .yarn/* (except releases if committed) dist/ src-tauri/gen/ target/ .idea/ .DS_Store *.tsbuildinfo .superpowers/`.

- [ ] **Step 2: Write `src/app/globals.css` with both daisyUI themes**

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
    - `--radius-field: 0.75rem`
  - **Dark theme:** builder's call, using the same purple family: base-100 near `#101114`, base-content near white, primary a lighter purple with readable contrast.
  - Every daisyUI theme variable must be present in both blocks.
  - Font: an `IBM Plex Sans` fallback stack.

- [ ] **Step 3: `src/app/main.tsx` and `src/app/App.tsx`**
  - `App` renders a centered daisyUI card containing `<h1 className="text-4xl font-bold">Hello, world</h1>`. Task 2 replaces this hardcoded text.

- [ ] **Step 4: The Rust crate**
  - `Cargo.toml`: `name = "template-rust-app"`, `version = "0.0.1"`, `edition = "2024"`, lib `template_rust_app_lib` with vee's crate-type, and the deps from Global Constraints.
  - `build.rs` and `main.rs`: copy from vee, renaming the lib.
  - `tauri.conf.json`:
    - productName `App`, version `0.0.1`, identifier `com.bobpark.app`, build section same as vee.
    - One window: `{ "label": "main", "create": false, "title": "App", "width": 480, "height": 360, "center": true }`.
    - bundle targets `app`, `dmg`, `nsis`, with the standard icon list.
    - `createUpdaterArtifacts: true`.
    - updater plugin block per Global Constraints (`windows.installMode: "passive"`).
  - `capabilities/default.json`: windows `["main"]`, permissions `["core:default"]`.
  - `lib.rs` `run()` registers the plugins in this order:
    1. single-instance, whose callback is `app::window::show_main`
    2. log at Info
    3. updater

    `setup` calls `app::window::build_all(app)`. `.build(generate_context!())` is followed by `.run(|app, event| …)`. On macOS, `RunEvent::Reopen { has_visible_windows: false, .. }` calls `show_main`. This is the Dock click.

- [ ] **Step 5: Example icons**
  - `app-icon.svg`: a 1024×1024 rounded square in `#7132f5` with a white "A".
  - Run `yarn tauri icon app-icon.svg`.
  - `src-tauri/icons/tray.svg`: a black glyph on transparent.
  - Run `yarn tauri icon src-tauri/icons/tray.svg -o <scratch> -p 44` and copy the 44px PNG to `src-tauri/icons/tray.png`.

- [ ] **Step 6: Verify**
  - Run: `yarn install && yarn typecheck && yarn lint && yarn tauri build --no-bundle`. Expected: all succeed.
  - Run: `yarn tauri dev`. Expected:
    - "Hello, world" shows in a purple-accented card.
    - The Dock shows the purple "A" icon.
    - Closing the window hides it, and clicking the Dock icon brings it back.
    - A second `yarn tauri dev` focuses the existing window.

- [ ] **Step 7: Commit**: `build: scaffold tauri react app with tailwind, daisyui and lint`

---

### Task 2: Shared DB/error and the `settings` domain (Rust)

**Files:**
- Create the shared modules: `src-tauri/src/shared/{mod.rs, db.rs, error.rs, migrations/0001_init.sql}`
- Create the domain modules: `src-tauri/src/domain/mod.rs`, `src-tauri/src/domain/settings/{mod.rs, model.rs, repository.rs, commands.rs}`
- Create the state module: `src-tauri/src/app/state.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Produces (`shared/error.rs`):
  - `#[derive(Debug, thiserror::Error)] pub enum AppError` with:
    - `InvalidInput(String)`
    - `Db(#[from] rusqlite::Error)`
    - `Io(#[from] std::io::Error)`
  - A hand-written `Serialize` that emits `{ "code": "INVALID_INPUT" | "DB" | "IO", "message": <Display> }`.
  - `pub type AppResult<T> = Result<T, AppError>;`
- Produces (`shared/db.rs`):
  - `pub fn open(path: &Path) -> AppResult<Connection>`: creates parent dirs, then migrates.
  - `pub fn open_in_memory() -> AppResult<Connection>`: migrated in-memory DB, used by tests.
  - `const MIGRATIONS: &[&str] = &[include_str!("migrations/0001_init.sql")];`
  - Migration rule: apply each entry whose index ≥ `PRAGMA user_version`, in its own transaction, then set `user_version = index + 1`.
- `0001_init.sql`:

  ```sql
  CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  INSERT INTO settings VALUES ('greeting', 'Hello, world'), ('theme', 'system');
  ```

- Produces (`domain/settings/model.rs`):
  - `#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)] #[serde(rename_all = "lowercase")] pub enum Theme { Light, Dark, System }`
  - `Theme::parse(&str) -> Option<Theme>` and `Theme::as_str(self) -> &'static str`
- Produces (`domain/settings/repository.rs`), SQL only:
  - `pub fn get(conn: &Connection, key: &str) -> AppResult<Option<String>>`
  - `pub fn set(conn: &Connection, key: &str, value: &str) -> AppResult<()>` (upsert)
- Produces (`domain/settings/mod.rs`), the public API other code uses:
  - `pub fn greeting(conn: &Connection) -> AppResult<String>`: a missing row gives `"Hello, world"`.
  - `pub fn theme(conn: &Connection) -> AppResult<Theme>`: a missing or unknown value gives `Theme::System`.
  - `pub fn set_theme(conn: &Connection, raw: &str) -> AppResult<Theme>`: an unknown value gives `AppError::InvalidInput` and nothing is written.
- Produces (`domain/settings/commands.rs`):
  - `get_greeting(state: State<AppState>) -> AppResult<String>`
  - `get_theme(state) -> AppResult<Theme>`
  - `set_theme(state, theme: String) -> AppResult<Theme>`
- Produces (`app/state.rs`):
  - `pub struct AppState { pub db: Mutex<Connection> }`

- [ ] **Step 1: Write failing tests** (`#[cfg(test)]` in `db.rs` and `settings/mod.rs`):
  - In `db.rs`:
    - `open_creates_missing_parent_dirs`: `db::open(tempdir/"a/b/app.db")` → `Ok`, and the file exists.
    - `reopen_keeps_user_values`: open → `repository::set(conn,"greeting","Hi")` → drop → reopen → `get == Some("Hi")`, and `user_version == 1`.
  - In `settings/mod.rs`, against `open_in_memory()`:
    - `seeds_defaults`: `greeting == "Hello, world"` and `theme == Theme::System`.
    - `theme_falls_back_to_system_for_unknown_value`: `repository::set(conn,"theme","blue")` → `theme == Theme::System`.
    - `set_theme_rejects_unknown_value`: `set_theme(conn,"blue")` is `Err(AppError::InvalidInput(_))`, and the stored value is still `"system"`.
    - `set_theme_round_trips`: `set_theme(conn,"dark")` → `theme == Theme::Dark`.
  - In `error.rs`:
    - `serializes_code_and_message`: `serde_json::to_value(AppError::InvalidInput("x".into()))` has `code == "INVALID_INPUT"`.

- [ ] **Step 2: Run** `cargo test --manifest-path src-tauri/Cargo.toml --lib`. Expected: FAIL (not defined).

- [ ] **Step 3: Implement** the modules above.
  - In `lib.rs` `setup`:
    1. `let conn = shared::db::open(&app.path().app_data_dir()?.join("app.db"))?;`
    2. `app.manage(AppState { db: Mutex::new(conn) })`
    3. Then `build_all`.
  - Register the three commands in `generate_handler!`.
  - `// ponytail:` a DB open failure aborts setup. Add an error dialog (tauri-plugin-dialog, as in vee-app) when real user data is at stake.

- [ ] **Step 4: Run** the tests again. Expected: PASS. Also run `grep -rn "use tauri" src-tauri/src/domain src-tauri/src/shared | grep -v commands.rs`. Expected: no output.

- [ ] **Step 5: Commit**: `feat: add sqlite db, app error and settings domain`

---

### Task 3: Frontend data layer, greeting, and light/dark/system theme

**Files:**
- Create the shared API files: `src/shared/api/index.ts`, `src/shared/api/common.dto.ts`
- Create the shared query files: `src/shared/queries/index.ts`, `src/shared/components/queries/RQProvider.tsx`
- Create the shared store files: `src/shared/store/rootStore.ts`, `src/shared/store/types.d.ts`
- Create the theme files: `src/shared/providers/theme/ThemeProvider.tsx`, `src/shared/components/theme/ThemeSwitcher.tsx`
- Create the settings domain files: `src/domain/settings/apis/settings.ts`, `src/domain/settings/apis/settings.dto.ts`, `src/domain/settings/queries/settings.tsx`, `src/domain/settings/components/Greeting.tsx`, `src/domain/settings/store/.gitkeep`
- Create the theme utility and its test: `src/utils/theme.ts`, `src/utils/theme.test.ts`
- Modify: `src/app/main.tsx`, `src/app/App.tsx`

**Interfaces:**
- Consumes: the commands `get_greeting`, `get_theme`, `set_theme` (Task 2), and the error shape `{ code, message }`.
- Produces:
  - `shared/api/common.dto.ts`: `export interface AppError { code: string; message: string }`
  - `shared/api/index.ts`: `export default async function call<T>(cmd: string, args?: InvokeArgs): Promise<T>`. It wraps `invoke` and rethrows as `AppError`; a non-object error becomes `{ code: "UNKNOWN", message: String(e) }`.
  - `shared/queries/index.ts`: `interface QueryMutationHandle<T> { onSuccess?: (data: T) => void; onError?: (err: AppError) => void }`
  - `RQProvider.tsx`:
    - `export const queryClient`, with the nextjs defaults minus `refetchOnReconnect`.
    - `export default function RQProvider({children})`, which includes devtools in dev only.
  - `shared/store/types.d.ts`: the nextjs `SlicePattern` module augmentation.
  - `rootStore.ts`: `export const useStore` (zustand + devtools + immer, no slices yet, `name: "app"`) and `export type BoundState = object;`. Add a comment showing how a domain slice is spread in.
  - `domain/settings/apis/settings.dto.ts`: `export type ThemePref = "light" | "dark" | "system";`
  - `domain/settings/apis/settings.ts`:
    - `getGreeting(): Promise<string>`
    - `getTheme(): Promise<ThemePref>`
    - `setTheme(theme: ThemePref): Promise<ThemePref>`
  - `domain/settings/queries/settings.tsx`:
    - `useGreeting(): { greeting?: string; isLoading: boolean }` (key `['settings','greeting']`)
    - `useThemePref(): { theme: ThemePref; isLoading }` (key `['settings','theme']`, default `"system"`)
    - `useThemeUpdate(handle: QueryMutationHandle<ThemePref>): { updateTheme: (t: ThemePref) => void; isLoading }`, which calls `setQueryData(['settings','theme'], t)` on success
  - `utils/theme.ts`: `export function resolveTheme(pref: ThemePref, prefersDark: boolean): "light" | "dark"`. It is pure; import `ThemePref` with `import type` so `node --test` can run it.
  - `ThemeProvider.tsx`: reads `useThemePref()`. In an effect, it sets `document.documentElement.dataset.theme = resolveTheme(...)`. While the pref is `"system"`, it listens to `matchMedia("(prefers-color-scheme: dark)")` and cleans up on change.
  - `ThemeSwitcher.tsx`: a daisyUI `select` (Light / Dark / System) wired to `useThemePref` + `useThemeUpdate`.
  - `Greeting.tsx`: `<h1>` showing `useGreeting().greeting`.
  - `main.tsx`:
    1. `const pref = await getTheme()`
    2. `queryClient.setQueryData(['settings','theme'], pref)`
    3. Set `dataset.theme = resolveTheme(pref, matchMedia(...).matches)`
    4. Render `<RQProvider><ThemeProvider><App/></ThemeProvider></RQProvider>`

    Steps 1–3 run before render, so there is no flash.
  - Components and hooks use the section-comment order.

- [ ] **Step 1: Write the failing test** `src/utils/theme.test.ts` (`node:test`, `node:assert/strict`):

  ```ts
  test("resolveTheme", () => {
    assert.equal(resolveTheme("light", true), "light");
    assert.equal(resolveTheme("dark", false), "dark");
    assert.equal(resolveTheme("system", true), "dark");
    assert.equal(resolveTheme("system", false), "light");
  });
  ```

- [ ] **Step 2: Run** `yarn test`. Expected: FAIL.

- [ ] **Step 3: Implement** everything above.

- [ ] **Step 4: Verify**
  - Run: `yarn test && yarn typecheck && yarn lint`. Expected: PASS.
  - Run: `yarn tauri dev`. Expected:
    - "Hello, world" comes from the DB.
    - The switcher recolors the page immediately.
    - With System selected, toggling macOS appearance recolors the page live.
    - The choice persists across a restart.

- [ ] **Step 5: Commit**: `feat: add settings domain ui with react query and theme switching`

---

### Task 4: Tray and auto-updater

**Files:**
- Create: `src-tauri/src/app/tray.rs`, `src-tauri/src/app/updater.rs`
- Modify: `src-tauri/src/app/mod.rs`, `src-tauri/src/lib.rs`

**Interfaces:**
- Consumes: `app::window::show_main` (Task 1).
- Produces (`app/updater.rs`): shrink vee's `updater.rs`.
  - Keep:
    - `UpdateStatus` (same serde shape, and its test `status_serializes_like_the_typescript_union`)
    - `UpdateState` with `ready_version()`
    - `check(app) -> UpdateStatus` (async)
    - `install_and_restart(app) -> Result<(), String>`
    - `spawn_periodic(app)` (release builds only, every 6h)
  - Drop the `whats_new` call and the `#[tauri::command]`s.
  - `set_status` calls `tray::refresh`.
- Produces (`app/tray.rs`):
  - `create(app: &AppHandle) -> tauri::Result<()>`
  - `refresh(app: &AppHandle)`
  - Menu ids, in order:
    - `open` "Open"
    - `update`: "Check for Updates", or "Restart to Update" when ready
    - separator
    - `quit` "Quit"
  - Handlers:
    - `open` → `show_main`
    - `update` → if ready, `install_and_restart` (log the error); else spawn `check`
    - `quit` → `app.exit(0)`
  - Tray icon: macOS uses `icons/tray.png` as a template image; other platforms use the default window icon, as in vee's `tray.rs`.

- [ ] **Step 1: Copy the `status_serializes_like_the_typescript_union` test** with the shrunk `updater.rs`. Run `cargo test --manifest-path src-tauri/Cargo.toml --lib`. Expected: PASS.

- [ ] **Step 2: Implement** `tray.rs`.
  - `lib.rs`: `.manage(app::updater::UpdateState::default())`. In `setup`, after `build_all`: `app::tray::create(app.handle())?` and `app::updater::spawn_periodic(app.handle().clone())`.

- [ ] **Step 3: Verify**
  - Run: `cargo test … --lib && yarn tauri build --no-bundle`. Expected: PASS.
  - Run: `yarn tauri dev`. Expected:
    - The tray icon appears.
    - Open shows the hidden window.
    - "Check for Updates" logs a failure without crashing.
    - Quit exits.

- [ ] **Step 4: Commit**: `feat: add tray menu and background auto-updater`

---

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
  - 처음 한 번: `mise install`; export `GITHUB_NPM_AUTH_TOKEN` (a GitHub PAT with `read:packages`, needed for `@bob-park/*`); `yarn install`.
  - 개발 실행: `yarn tauri dev`, plus the note that this is a tray app — quit from the tray before rerunning.
  - 테스트와 검사: `cargo test --manifest-path src-tauri/Cargo.toml --lib`, `yarn test`, `yarn typecheck`, `yarn lint`.
  - 빌드: `yarn tauri build`, which needs signing keys; use `--no-bundle` without them.
  - 프로젝트 구조: the tree from this plan's File Structure, with the front/back domain pairing explained.
  - 데이터 초기화: `~/Library/Application Support/com.bobpark.app/`, `%APPDATA%\com.bobpark.app\`.
  - Schema change: add `shared/migrations/000N_*.sql` and append it to `MIGRATIONS`.

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
    - zustand devtools `name` in `rootStore.ts`
    - `app-icon.svg` + regenerating icons
    - `docs/design/`
  - "GitHub 설정":
    - create the `develop` branch and make it the default PR base
    - if `develop` is protected, allow GitHub Actions to push
    - `GITHUB_NPM_AUTH_TOKEN` for package installs

- [ ] **Step 3: Verify** that every command and path in both files exists (spot-check with `ls`).

- [ ] **Step 4: Commit**: `docs: add development guide and readme`

---

### Task 8: AGENTS.md, CLAUDE.md, docs/agents

**Files:**
- Create: `AGENTS.md`, `CLAUDE.md`, and under `docs/agents/`:
  - `overview.md`, `tech-stack.md`, `architecture.md`, `structure.md`, `design.md`, `testing.md`, `build-run.md`, `configuration.md`, `documentation.md`
  - `conventions/rust-modules.md`, `conventions/tauri-commands.md`, `conventions/sqlite-migrations.md`, `conventions/error-handling.md`
  - `conventions/module-aliases.md`, `conventions/naming.md`, `conventions/typescript.md`, `conventions/react-sections.md`
  - `libs/react-query.md`, `libs/zustand-slice.md`, `libs/tailwind-daisyui.md`, `libs/theme.md`
  - `workflow/branching.md`, `workflow/commit-messages.md`, `workflow/pr.md`, `workflow/versioning.md`, `workflow/release.md`

**Format (every doc under `docs/agents/`):**
- YAML frontmatter `title`, `scope`, `applies_to`, `related`.
- Then `# Title`.
- Then a one-line `> TL;DR` blockquote.

**Sources:**
- Frontend docs (`module-aliases`, `naming`, `typescript`, `react-sections`, `libs/*`) adapt the same-named nextjs template docs.
  - Drop the Next.js-only parts: server components, route handlers, cookies, next-intl, ky.
  - Replace ky with `shared/api` `call()` over Tauri commands.
- Workflow docs adapt the spring template.

**Content decisions:** state each one; the wording is yours.
- `overview.md`: a Tauri desktop-app template; points to the README placeholder checklist.
- `tech-stack.md`: what each version pin is and where it lives (`package.json`, `Cargo.toml`, `.mise.toml`).
- `architecture.md`:
  - The request path is component → `queries/` hook → `apis/` → `shared/api` `call()` → `#[tauri::command]` in `domain/<name>/commands.rs` → domain `mod.rs` → `repository.rs` → `shared::db`.
  - `AppState` holds `Mutex<Connection>`.
  - Windows are `create: false` and get built in `setup` after state is managed.
  - Close hides the window; Dock reopen and second launch call `show_main`.
  - Tray menu; updater lifecycle (release-only, 6h, install on user request).
  - Front/back domains share names.
- `structure.md`:
  - The full tree (front and back).
  - **Adding a domain**, in order:
    1. Rust: `domain/<name>/{mod,model,repository,commands}.rs`; a migration if it needs tables; register commands in `lib.rs`.
    2. Frontend: `apis/<name>.dto.ts` → `apis/<name>.ts` → `queries/<name>.tsx` → `components/` → optional `store/slice.ts` registered in `rootStore.ts`.
    3. Create all four frontend sub-folders even if empty (`.gitkeep`).
  - Also covers `_layouts/` for `src/app`, `shared/` vs `utils/` (pure only), and `app/` (Rust shell) vs `domain/`.
- `design.md`:
  - **Read `docs/design/` before any UI work.**
  - Tokens live only in the `src/app/globals.css` daisyUI theme blocks.
  - Use semantic daisyUI classes and no hex values in components.
  - Check every change in both light and dark.
- `conventions/rust-modules.md`:
  - The dependency direction, with the "no `tauri` outside `lib.rs`, `app/`, `commands.rs`" rule and its grep check.
  - No cross-domain `repository` use; go through the other domain's `mod.rs` API.
  - Add `service.rs` only when logic spans repositories.
  - Use `log` macros, not `println!`.
- `conventions/tauri-commands.md`:
  - Commands are thin: unwrap state → call the domain API → return `AppResult<T>`.
  - Validate inputs at the domain API (example: `set_theme`).
  - Register in `generate_handler!`; mirror with a function in `src/domain/<name>/apis/<name>.ts`.
  - Command names are snake_case verb_noun and unique across domains.
  - Event names are `<domain>://<event>`.
  - Plugin permissions go in `capabilities/default.json`.
- `conventions/sqlite-migrations.md`:
  - One file per version, `000N_<desc>.sql`; append to `MIGRATIONS`.
  - Never edit a shipped file.
  - Test with `db::open_in_memory()`.
- `conventions/error-handling.md`:
  - The `AppError` variants and the `{code,message}` wire shape.
  - Add a variant and code when the frontend must branch on it.
  - The frontend receives `AppError` via `QueryMutationHandle.onError`.
- `testing.md`:
  - `cargo test --lib` covers domain/db/error.
  - `yarn test` covers `utils/*.test.ts` and `scripts/*.test.mjs`; test files must not use runtime `@/` imports.
  - `yarn typecheck` and `yarn lint`.
- `build-run.md`: dev, `--no-bundle`, full build needs keys.
- `configuration.md`:
  - `tauri.conf.json` fields and capabilities.
  - The `sign.env` location.
  - `GITHUB_NPM_AUTH_TOKEN`.
  - **Never commit secrets.**
- `documentation.md`: `docs/superpowers/specs|plans` naming, `docs/design/`, `docs/development.md`, `docs/release.md`.
- `workflow/branching.md`: spring's table, with `master` → `main`.
- `workflow/commit-messages.md`: spring's prefixes, plus `chore` (used by the bump bot).
- `workflow/pr.md`:
  - Base-branch table with `main`.
  - Title → bump table: `[major]`/`[minor]`/else patch. Labels `major`/`minor` work too. There is no `[date]`.
- `workflow/versioning.md`:
  - Plain semver `X.Y.Z`, starting at `0.0.1`.
  - `tauri.conf.json` is the source of truth. `bump-version-up.sh` keeps four files in sync; never edit them by hand.
  - The workflow runs on `develop` with `contents: write` (add a branch protection note).
  - Release tag `vX.Y.Z`.
- `workflow/release.md`: a short summary that links to `docs/release.md`.

**`AGENTS.md`:** follow spring's layout.
- Intro paragraph.
- Map grouped as Foundations / Architecture & Structure / Design / Rust Conventions / Frontend Conventions / Library Patterns / Workflow / Ops.
- "How to use" routes:
  - new feature/domain → structure → architecture → tauri-commands → react-query
  - new UI → design → react-sections → tailwind-daisyui
  - new table/column → sqlite-migrations
  - new error case → error-handling
  - client UI state → zustand-slice
  - cutting a release → release → versioning
  - opening a PR → pr
- A top-level line: **"App design: read [`docs/design/`](docs/design/) before building or changing any UI."**
- The Convention Enforcement paragraph.

**`CLAUDE.md`:** `# CLAUDE.md`, `@AGENTS.md`, then `## Claude Code 전용 규칙` with spring's sections, adapted:
- Plan Mode, Skill Usage, Language (add: UI 작업 전 `docs/design/` 확인).
- Convention Enforcement, listing this repo's convention docs.
- Dependency Changes: `src-tauri/Cargo.toml`, `package.json`.
- Destructive Operations.

- [ ] **Step 1: Write all docs.**

- [ ] **Step 2: Verify links.**

  Run from the repo root:

  ```bash
  for f in AGENTS.md $(find docs/agents -name '*.md'); do
    grep -oE '\]\([^)#]+' "$f" | sed 's/^](//' | grep -v '^http' | while read -r p; do
      [ -e "$(dirname "$f")/$p" ] || echo "MISSING in $f: $p"; done; done
  ```

  Expected: no output.

- [ ] **Step 3: Verify accuracy.** Every path, command and module named in the docs exists. Grep for `show_main`, `AppError`, `MIGRATIONS`, `call<`, `useThemePref`, `bump-version-up.sh`, etc. against the code.

- [ ] **Step 4: Commit**: `docs: add agent guide, claude rules and topic docs`

---

---

### Task 9: Final verification

- [ ] **Step 1: Run** `cargo test --manifest-path src-tauri/Cargo.toml --lib && yarn test && yarn typecheck && yarn lint && yarn tauri build --no-bundle`. Expected: all pass.
- [ ] **Step 2: Run** `yarn tauri dev` and walk the spec's completion checklist:
  - Hello, world
  - theme switch + persistence
  - tray Open/Quit
  - Dock icon + reopen
- [ ] **Step 3: Run** `git status`. Expected: clean, with no secrets or build output tracked (`git ls-files | grep -E 'target/|node_modules|dist/|\.env'` → empty).

---

## Addendum (user request mid-execution): Settings window + Cmd+,

Folded into existing tasks:
- **Task 2:** `commands::set_theme` takes `app: AppHandle` and, on success, calls `app.emit("settings://theme-changed", theme)`. The command test stays at the domain level.
- **Task 3:**
  - New screen `src/app/settings/SettingsApp.tsx` with `<ThemeSwitcher/>`. `App.tsx` keeps only `<Greeting/>`.
  - `main.tsx` picks the screen from `getCurrentWindow().label`.
  - `ThemeProvider` listens to `settings://theme-changed` and calls `queryClient.setQueryData(['settings','theme'], t)`.
- **Task 4:**
  - Add the `settings` window to tauri.conf (`create: false`, 480×360, `resizable: false`, `center`) and capabilities. `window.rs` gets `pub const SETTINGS`, `show_settings(app)`, and close→hide for both windows.
  - App menu (`app/menu.rs`, `pub fn build(app) -> tauri::Result<Menu<Wry>>`): the default menu plus a "Settings…" item, accelerator `CmdOrCtrl+,`, id `settings`. Set it with `.menu(app::menu::build)`. `.on_menu_event` routes `settings` to `show_settings`.
  - Tray gets a "Settings" item (id `settings`).

## Addendum 2 (user request mid-execution): Updates section in Settings

Folded into Task 4:
- **Rust, settings domain:**
  - `auto_update(conn) -> AppResult<bool>`: a missing row → `true`.
  - `set_auto_update(conn, enabled: bool) -> AppResult<bool>`.
  - Commands `get_auto_update`, `set_auto_update`.
  - Tests: `auto_update_defaults_to_true`, `set_auto_update_round_trips`.
- **Rust, `app/updater.rs`:**
  - `set_status` emits `update://status`.
  - Commands `check_update`, `get_update_status`, `install_update_and_restart`, as in vee.
  - `spawn_periodic` skips the check when `settings::auto_update` is false.
- **Frontend, `src/domain/updater`:**
  - `apis/updater.dto.ts`: the `UpdateStatus` union.
  - `apis/updater.ts`.
  - `queries/updater.tsx`: status query plus event listener, check/install mutations.
  - `components/UpdateSection.tsx`: version via `@tauri-apps/api/app` `getVersion`, status, button, auto-update toggle.
  - `src/utils/updateStatus.ts`: `describeUpdateStatus(s)`, a pure function with a `node:test`.
