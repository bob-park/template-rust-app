/** Base dictionary. Every other locale is typed `Dict`, so a missing key fails `yarn typecheck`. */
export const en = {
  settings: {
    title: 'Settings',
    tabs: { general: 'General', updates: 'Updates' },
    theme: 'Theme',
    language: 'Language',
    launchAtLogin: 'Launch at login',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
  },
  updates: {
    title: 'Updates',
    version: (v: string) => `Version ${v}`,
    check: 'Check for Updates',
    restart: 'Restart to Update',
    auto: 'Automatically check for updates',
    idle: 'Not checked yet',
    checking: 'Checking…',
    upToDate: 'Up to date',
    ready: (v: string) => `Version ${v} is ready`,
    failed: 'Update check failed',
  },
  /** Keyed by `AppError.code` (src-tauri/src/shared/error.rs). */
  errors: {
    INVALID_INPUT: "That value isn't allowed.",
    DB: "Couldn't save to the database.",
    IO: "Couldn't read or write a file.",
    SCHEMA_TOO_NEW: 'This data was created by a newer version of the app. Please update the app.',
    UNKNOWN: 'Something went wrong.',
    dismiss: 'Dismiss',
  },
};

export type Dict = typeof en;
