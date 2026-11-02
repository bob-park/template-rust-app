# 01-launch-quit: Launch and quit

- Priority: P0
- Preconditions: app not running. `APP_NAME` read from `src-tauri/tauri.conf.json` ([ui-testing](../agents/ui-testing.md#setup)).

## Steps
1. Run `yarn tauri dev` (or the release bundle). `wait` for a window of `"$APP_NAME"`.
2. `list-windows --app "$APP_NAME"`, then snapshot the main window.
3. Close the main window (`close` button or `press cmd+w` / `ctrl+w`).
4. Open the tray menu (`list-surfaces`) and choose Open.
5. Open the tray menu again and choose Quit.

## Expected
- Step 2: one visible window titled `"$APP_NAME"`; it shows the greeting heading (non-empty).
- Step 3: the window hides, the process keeps running (`list-apps` still lists it).
- Step 4: tray item native label `open` "Open" / "열기" (`src-tauri/src/app/i18n.rs`) shows the main window again.
- Step 5: tray item `quit` "Quit" / "종료" exits; `list-apps` no longer lists the app.
- No `role="alert"` element at any step.

## UX checks
- Is it clear that closing the window keeps the app running in the tray?
