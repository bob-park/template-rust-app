# 04-settings-persist: Settings survive a restart

- Priority: P0
- Preconditions: app running. Note current theme, language, launch-at-login, and auto-update values so they can be restored after the test.

## Steps
1. Open Settings. Select the settings window with `--window-id` (both windows are open).
2. General tab: set `settings.theme` to `settings.dark` "Dark" / "다크"; set `settings.language` to the other language; toggle `settings.launchAtLogin`.
3. Updates tab: toggle `updates.auto` "Automatically check for updates" / "자동으로 업데이트 확인".
4. Quit from the tray (`quit`), relaunch, open Settings.
5. Restore the original values.

## Expected
- Step 2: the UI switches theme and language immediately, in both windows, the settings window title (`settings`), the tray labels (`open`, `settings`, `quit`), and the macOS app-menu item (`settings_menu` "Settings…" / "설정…"), all in `src-tauri/src/app/i18n.rs`.
- Step 4: every value from steps 2–3 is unchanged after relaunch.
- Launch-at-login state matches the OS (macOS Login Items / Windows startup) — verify with a screenshot of the OS setting only if the user allows touching it; otherwise `UNVERIFIED`.
- No `role="alert"`.

## UX checks
- Is it obvious that changes save without a Save button?
