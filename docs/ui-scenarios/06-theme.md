# 06-theme: Light and dark are readable

- Priority: P0
- Preconditions: app running, `settings.theme` = `settings.system` "System" / "시스템".

## Steps
1. Set the OS to light mode. Screenshot main and settings windows (both tabs).
2. Set the OS to dark mode. Repeat the screenshots.
3. Set `settings.theme` to `settings.light`, then `settings.dark`, with the OS in the opposite mode. Screenshot each.
4. Repeat steps 1–2 with the other language.
5. Restore the OS appearance and the theme setting.

## Expected
- With `System`, the app follows the OS change without a restart.
- An explicit Light/Dark choice overrides the OS.
- No text, icon, focus ring, or switch is invisible or low-contrast in either theme ([design](../agents/design.md)).

## UX checks
- Does anything flash the wrong theme on window open?
