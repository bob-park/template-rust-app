---
title: UI Testing (agent-desktop)
scope: src/**, docs/ui-scenarios/**
applies_to: looking at or driving the running app, UI/UX testing, making UI testable
related:
  - ./build-run.md
  - ./testing.md
  - ./design.md
  - ./libs/i18n.md
---

# UI Testing (agent-desktop)

> Look at and drive the running app with `agent-desktop`: read the app name from the config (dev: Cargo package name, release: `productName`), then loop snapshot → act → snapshot using refs from the latest snapshot only. Scenarios live in `docs/ui-scenarios/`, reports in `.ui-test-results/` (git-ignored). Interactive elements need i18n-backed accessible names, or they can't be tested.

## Setup

Nothing here is per-app. Read the app's name from the config at the start of every session, so a renamed app needs no doc change. The name agent-desktop sees depends on how the app was started:

| Run | App name in `list-apps` | Source |
| --- | ----------------------- | ------ |
| `yarn tauri dev` (unbundled binary) | Cargo package name, e.g. `template-rust-app` | `src-tauri/Cargo.toml` `[package].name` |
| Release bundle | `productName`, e.g. `App` | `src-tauri/tauri.conf.json` |

```bash
# macOS / Linux: dev
APP_NAME=$(sed -n 's/^name = "\(.*\)"/\1/p' src-tauri/Cargo.toml | head -1)
# macOS / Linux: release bundle
APP_NAME=$(jq -r .productName src-tauri/tauri.conf.json)
# release, no jq: through mise's Node
APP_NAME=$(mise exec -- node -p "require('./src-tauri/tauri.conf.json').productName")
```

```powershell
# Windows: dev
$APP_NAME = (Select-String -Path src-tauri/Cargo.toml -Pattern '^name = "(.*)"' | Select-Object -First 1).Matches.Groups[1].Value
# Windows: release bundle
$APP_NAME = (Get-Content -Raw src-tauri/tauri.conf.json | ConvertFrom-Json).productName
```

Confirm with `agent-desktop list-apps` before the first snapshot.

| Item | Value |
| ---- | ----- |
| Dev run | `yarn dotenv -e .env.development.local -- yarn tauri dev` (through mise, see [build-run](./build-run.md)) |
| Release build | see [build-run](./build-run.md) |
| Scenarios | `docs/ui-scenarios/` |
| Results | `.ui-test-results/<YYYYMMDD-HHmm>/` (git-ignored) |

Always quote `"$APP_NAME"`; a renamed `productName` may contain spaces.

### Install (once)

```bash
mise exec -- npm install -g agent-desktop
agent-desktop version
agent-desktop permissions --guide   # macOS: grant Accessibility to the terminal
```

- **macOS:** without Accessibility permission nothing works. On a permission error, stop and ask the user to grant it.
- **Windows:** the terminal and the app must run at the same privilege level (admin or not).
- **Linux:** needs `at-spi2-core`. WebKitGTK may expose an incomplete accessibility tree.

## Basic rules

- Before first use in a session, run `agent-desktop skills get desktop` and `agent-desktop skills get platform`, and follow them.
- Don't guess flags. Check `agent-desktop <command> --help`.
- Judge screen state from the **accessibility snapshot**. Use `screenshot` only for visual checks: layout, color, overlap, transparent windows.
- Every command prints a JSON envelope (`ok`, `data` / `error`). Always check `ok`.
- Default to headless actions. Use `--headed` (real pointer/keyboard) only when headless doesn't work, and record why.

## Running a test

### Launch

1. Dev testing: `yarn dotenv -e .env.development.local -- yarn tauri dev`. Release verification: run the built bundle.
2. Confirm it's up: `agent-desktop list-apps`, `agent-desktop list-windows --app "$APP_NAME"`.
3. The first `tauri dev` compile is slow. Use `agent-desktop wait` (see `--help`) for the window, never a fixed sleep.

### Windows in this template

- Two webview windows: `main` and `settings` (`src-tauri/tauri.conf.json`; titles come from `app.windows[].title`, and the settings title follows the app language, e.g. `설정`). Settings opens from the app menu, the tray, or `cmd+,` / `ctrl+,`. With both open, `--app` alone is ambiguous: take the window from `list-windows` and pass `--window-id`. `list-windows` also lists helper windows with the app name as title; pick by the real title.
- The settings window is fixed-size (`"resizable": false`).
- Keys go to the focused window: for `press`, `--window-id` selects the app instance, not the window. Aim keys with `focus-window` first.
- The tray menu and the macOS app menu are native OS elements, not webview content. Find them with `list-surfaces`. Windows has no app menu.

### Observe → act → verify

```bash
agent-desktop snapshot --app "$APP_NAME" -i --compact   # 1) observe: get refs
agent-desktop click @<snapshot_id>:e8                    # 2) act: refs from that snapshot only
agent-desktop snapshot --app "$APP_NAME" -i --compact   # 3) verify: new snapshot, check the result
```

- Ref format is `@<snapshot_id>:<element>`. Short `@e8` fails with `INVALID_ARGS`. In PowerShell, quote it: `'@s8f3k2p9:e8'`.
- **A ref is valid only for the snapshot that produced it.** After the UI changes, take a new snapshot.
- For busy screens, get the structure with `--skeleton`, then zoom in with `--root <ref>`.
- Text: `type` or `set-value`. Keys: `press` (there is no `key` command).

### Errors

| Code | Response |
| ---- | -------- |
| `STALE_REF` | The UI changed. Take a new snapshot, retry with a new ref. |
| `AMBIGUOUS_TARGET` | Several windows match. Pick one from `error.details` and pass `--window-id`. |
| `INVALID_ARGS` | Check the ref format and arguments. |
| other | Retry only if `error.disposition.retry` is `safe`. Otherwise stop and record it. |

- Three failures on the same step: record the scenario as **FAIL (blocked)** and move on. Never change the app code to get past it.

### Cleanup

- Quit with `close-app`, and stop the `yarn tauri dev` process you started.

## Making UI testable

agent-desktop finds elements through the accessibility tree. **An element with no name in the tree counts as untestable.** For new UI:

- Clickable things are `<button>`, `<a>`, `<input>`, not a `div` with `onClick`. If a `div` is unavoidable, give it `role` and `tabIndex`.
- Icon-only buttons need `aria-label`. Accessible names are user-visible copy, so they come from the dictionaries ([i18n](./libs/i18n.md)): `aria-label={t.settings.open}` (illustrative key), never a literal string.
- Inputs get a name through `<label htmlFor>` or `aria-label`.
- Expose state: `aria-checked` on toggles/checkboxes, `aria-expanded` on disclosure panels.
- Loading, toasts, and errors use `role="status"` or `role="alert"`, so a snapshot can verify them.
- Accessible names match the visible text and are unique within the app.
- Unnamed or duplicate names found while testing go in the report as **accessibility issues**. Don't fix them in the same change ([AGENTS.md](../../AGENTS.md#convention-enforcement)).

### Tauri notes

- Transparent, non-focusable, or always-on-top windows may be missing from the tree. Check them with `screenshot` too.
- System notifications: verify with `list-notifications`, clean up with `dismiss-all-notifications`.
- Clipboard features: verify with `clipboard-set` / `clipboard-get`. Back up the user's clipboard first and restore it after.
- Check every screen in light and dark, and in ko and en ([design](./design.md)).

## Scenarios

One file per scenario: `docs/ui-scenarios/<NN>-<name>.md`, in English.

```markdown
# 01-launch-quit: Launch and quit

- Priority: P0
- Preconditions: …

## Steps
1. …

## Expected
- … (cite i18n keys with both texts: `settings.title` "Settings" / "설정")

## UX checks
- …
```

The P0 set in `docs/ui-scenarios/` (01–07) must pass, or be marked `N/A` with the reason the scenario states, for every app built from this template. Add app-specific scenarios after them.

## Reports

Write `.ui-test-results/<YYYYMMDD-HHmm>/report.md`. Save the snapshot JSON and screenshot of each failed step in the same folder.

```markdown
# UI test results — <APP_NAME> <version/commit>

- Environment: macOS 15.x / Windows 11 / …
- Run: dev | release build

| Scenario | Result | Notes |
| -------- | ------ | ----- |
| 01-launch-quit | PASS | |
| 04-settings-persist | FAIL | language resets after restart |

## Failures
- scenario / step, expected vs actual, evidence (snapshot, screenshot files), repro steps

## Accessibility issues
- unnamed button: toolbar, 2nd icon

## UX suggestions
- (works, but hard to use — be specific)
```

- Mark PASS/FAIL **only with snapshot or screenshot evidence**. Anything unchecked is `UNVERIFIED`.
- Keep UX suggestions separate from bugs.

## Safety

- **Touch only the app under test.** If another app seems needed, stop and ask the user.
- Snapshots, screenshots, and clipboard contents may hold personal data. Never upload them to public repos, issues, or external services. `.ui-test-results/` stays git-ignored.
- Irreversible actions (payment, account deletion, real email/messages/calls) only against test accounts or mocks. Without one, skip the step and record it.
- Never edit a scenario or its expected results to make a test pass.
