# agent-desktop UI Testing Guide + rustfmt + AI Ignores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an agent-agnostic agent-desktop UI testing guide with P0 scenarios, a `rustfmt.toml` enforced as a fifth check, and `.gitignore` entries for AI local workspaces.

**Architecture:** Docs-only plus config. The guide lives in `docs/agents/ui-testing.md` and is linked from `AGENTS.md`; scenarios are one file each in `docs/ui-scenarios/`. App name and bundle ID are read from `src-tauri/tauri.conf.json` at test time, never hard-coded.

**Tech Stack:** agent-desktop CLI, `jq`, rustfmt (stable, edition 2024), Markdown.

**Spec:** `docs/superpowers/specs/2026-11-02-agent-desktop-ui-testing-design.md`

## Global Constraints

- Work on the current branch (`main`). No dependency changes.
- `docs/agents/**` and `docs/ui-scenarios/**`: English. Every `docs/agents/` file: frontmatter (`title`, `scope`, `applies_to`, `related`) → `# Title` → one-line `> TL;DR`. Relative links.
- No `pnpm`, no bare global `npm`/`node`; commands go through yarn + mise.
- `APP_NAME` / `BUNDLE_ID` come from `jq -r .productName|.identifier src-tauri/tauri.conf.json` (PowerShell: `(Get-Content src-tauri/tauri.conf.json | ConvertFrom-Json).productName` / `.identifier`).
- Accessible names (`aria-label`, etc.) are user-visible copy → from `src/shared/i18n/{en,ko}.ts`.
- Commit format `<prefix>: <subject>` (`docs/agents/workflow/commit-messages.md`), with the session attribution trailer.
- Final gate (five checks): `cargo test --manifest-path src-tauri/Cargo.toml --lib`, `cargo fmt --manifest-path src-tauri/Cargo.toml --check`, `yarn test`, `yarn typecheck`, `yarn lint` (all via `mise exec --` for yarn).

## Review Focus

1. Running `cargo fmt` over 33 diffs must not change behavior → Task 1 runs `cargo test` after formatting.
2. Two windows (main + settings) make `--app` ambiguous → guide must route `AMBIGUOUS_TARGET` to `--window-id` and scenario 04 must pick the settings window explicitly.
3. `jq` missing (Windows, minimal Linux) → guide gives the PowerShell form and a `node -p "require('./src-tauri/tauri.conf.json').productName"` fallback via mise.
4. A renamed `productName` with spaces → every example quotes `"$APP_NAME"`.
5. `.claude/` ignored wholesale hides a future shared `.claude/settings.json` → one comment line in `.gitignore` says to narrow it.

---

### Task 1: rustfmt config, format, and the fifth check

**Files:**
- Create: `src-tauri/rustfmt.toml`
- Modify: `src-tauri/src/**/*.rs` (formatter output only)
- Modify: `docs/agents/testing.md` (TL;DR "All four" → "All five"; table row for `cargo fmt`)
- Modify: `CLAUDE.md:17` (add `cargo fmt --manifest-path src-tauri/Cargo.toml --check` to the list)
- Modify: `AGENTS.md:86` ("four checks" → "five checks")
- Modify: `docs/development.md:53-56` (add the `cargo fmt --check` line, Korean comment)

- [ ] **Step 1:** Confirm the check fails today: `cargo fmt --manifest-path src-tauri/Cargo.toml --check` → non-zero, `Diff in` lines.
- [ ] **Step 2:** Create `src-tauri/rustfmt.toml` with exactly `edition = "2024"`, `max_width = 100`, `newline_style = "Unix"`.
- [ ] **Step 3:** Run `cargo fmt --manifest-path src-tauri/Cargo.toml`.
- [ ] **Step 4:** `cargo fmt ... --check` → exit 0, no output; `cargo test --manifest-path src-tauri/Cargo.toml --lib` → all pass.
- [ ] **Step 5:** Update the four doc locations above. Table row: `| cargo fmt --manifest-path src-tauri/Cargo.toml --check | Rust formatting (src-tauri/rustfmt.toml) | — |`.
- [ ] **Step 6:** Commit `build: add rustfmt config and format rust code`.

### Task 2: .gitignore for AI local workspaces

**Files:** Modify: `.gitignore`

- [ ] **Step 1:** Replace the `# superpowers scratch …` block with:
  ```
  # AI / agent local workspaces
  # .claude/ is ignored wholesale; narrow to .claude/settings.local.json to commit shared settings or skills
  .claude/
  .superpowers/
  .taste-skill/
  .gstack/
  .context/
  .playwright-mcp/
  .ui-test-results/
  ```
- [ ] **Step 2:** `git check-ignore -v .claude/x .taste-skill/x .ui-test-results/x` → each prints a `.gitignore` match; `git status --short` shows no tracked file disappeared.
- [ ] **Step 3:** Commit `chore: ignore ai agent local workspaces`.

### Task 3: docs/agents/ui-testing.md + AGENTS.md routing

**Files:**
- Create: `docs/agents/ui-testing.md`
- Modify: `AGENTS.md` (Ops Map line, How to use line)
- Add: spec + this plan (`docs/superpowers/{specs,plans}/2026-11-02-*`)

**Interfaces:** Produces the scenario format and result path that Task 4 uses: `docs/ui-scenarios/NN-<name>.md`; results `.ui-test-results/<YYYYMMDD-HHmm>/report.md`.

- [ ] **Step 1:** Write the doc. Frontmatter: `title: UI Testing (agent-desktop)`, `scope: src/**, docs/ui-scenarios/**`, `applies_to: looking at or driving the running app, UI/UX testing, making UI testable`, `related: ./build-run.md, ./testing.md, ./design.md, ./libs/i18n.md`. Sections, translated from `~/Downloads/AGENTS.md` §1–7 with these changes:
  - "Setup": replaces §0 table; read `APP_NAME`/`BUNDLE_ID` per Global Constraints (+ node fallback); dev = `yarn tauri dev`, release build = see [build-run](./build-run.md).
  - "Install": `mise exec -- npm install -g agent-desktop`, `agent-desktop version`, `agent-desktop permissions --guide`; platform notes kept.
  - "Basic rules", "Loop" (snapshot → act → snapshot, ref format `@<snapshot_id>:<element>`), "Errors" table, "3 failures → FAIL(blocked)", "Cleanup" kept.
  - "Windows in this template": main + settings windows → `list-windows`, `--window-id`; tray and app menu are native → `list-surfaces`.
  - "Making UI testable": §4 rules; accessible names come from i18n (example `aria-label={t('…')}`, no literal strings); check light/dark + ko/en per [design](./design.md).
  - "Scenarios", "Reports", "Safety" from §5–7, pointing at `docs/ui-scenarios/` and `.ui-test-results/`.
- [ ] **Step 2:** AGENTS.md Ops: `- [UI Testing](docs/agents/ui-testing.md): drive the running app with agent-desktop, P0 scenarios in docs/ui-scenarios/, reports, accessible names`. How to use: `- **Seeing, driving, or UI-testing the running app:** [ui-testing](docs/agents/ui-testing.md) → [build-run](docs/agents/build-run.md)`.
- [ ] **Step 3:** Verify: `grep -n "pnpm\|{{APP_NAME}}\|{{BUNDLE_ID}}\|npm install -g agent-desktop$" docs/agents/ui-testing.md` → no matches except the mise-prefixed install; `jq -r .productName src-tauri/tauri.conf.json` → `App`; every relative link resolves (`ls` each target).
- [ ] **Step 4:** Commit `docs: add agent-desktop ui testing guide`.

### Task 4: P0 scenarios

**Files:** Create `docs/ui-scenarios/` `01-launch-quit.md`, `02-window-behavior.md`, `03-keyboard.md`, `04-settings-persist.md`, `05-error-display.md`, `06-theme.md`, `07-update-check.md`.

**Interfaces:** Consumes Task 3's format (Priority, Preconditions, Steps, Expected, UX checks).

- [ ] **Step 1:** Read `src/` windows, settings sections, and `src/shared/i18n/en.ts`/`ko.ts`, plus tray/menu in `src-tauri/src/app/`, to get real labels.
- [ ] **Step 2:** Write each file, Priority P0, expected strings as `i18n.key` ("English" / "한국어"). 04 covers greeting, theme, language, auto-update, restart, values kept. 05 uses the greeting input's validation if one exists; if the template has no invalid-input path, the file says so and marks the scenario `N/A until a domain adds input validation`.
- [ ] **Step 3:** Verify every i18n key cited exists: `grep -o "\`[a-zA-Z.]*\`" docs/ui-scenarios/*.md` cross-checked against `en.ts`.
- [ ] **Step 4:** Optional smoke: `yarn tauri dev`, then run scenario 01 with agent-desktop to prove the guide's commands work; report result, don't commit artifacts.
- [ ] **Step 5:** Run the five checks (Global Constraints) → all pass. Commit `docs: add p0 ui test scenarios`.
