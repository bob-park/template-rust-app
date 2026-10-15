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
};

export type Dict = typeof en;
