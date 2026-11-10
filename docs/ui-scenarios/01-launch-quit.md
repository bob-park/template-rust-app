# 01-launch-quit: Launch and quit

- Priority: P0
- Preconditions: app not running. `APP_NAME` set for the run mode ([ui-testing](../agents/ui-testing.md#setup)).

## Steps
1. Run `yarn dotenv -e .env.development.local -- yarn tauri dev` (or the release bundle). `wait` for a window of `"$APP_NAME"`.
2. `list-windows --app "$APP_NAME"`, then snapshot the main window.
3. Close the main window: macOS `focus-window` + `press cmd+w`; Windows the title-bar close button (there is no app menu, so `ctrl+w` does nothing).
4. Open the tray menu (`list-surfaces`) and choose Open.
5. Open the tray menu again and choose Quit.

## Expected
- Step 2: a main window titled as `app.windows[0].title` in `src-tauri/tauri.conf.json` (`App`); it shows the greeting heading (non-empty).
- Step 3: the window hides, the process keeps running (`list-apps` still lists it).
- Step 4: tray item native label `open` "Open" / "열기" (`src-tauri/src/app/i18n.rs`) shows the main window again.
- Step 5: tray item `quit` "Quit" / "종료" exits; `list-apps` no longer lists the app.
- No `role="alert"` element at any step.

## UX checks
- Is it clear that closing the window keeps the app running in the tray?
