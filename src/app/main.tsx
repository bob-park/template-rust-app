import { StrictMode } from 'react';

import App from '@/app/App';
import SettingsApp from '@/app/settings/SettingsApp';
import { getTheme } from '@/domain/settings/apis/settings';
import { THEME_QUERY_KEY } from '@/domain/settings/queries/settings';
import RQProvider, { queryClient } from '@/shared/components/queries/RQProvider';
import ThemeProvider, { applyTheme } from '@/shared/providers/theme/ThemeProvider';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { createRoot } from 'react-dom/client';

import './globals.css';

// One bundle, one screen per window label (see src-tauri/tauri.conf.json).
const SCREENS: Record<string, () => React.JSX.Element> = {
  main: App,
  settings: SettingsApp,
};

const Screen = SCREENS[getCurrentWindow().label] ?? App;

// Apply the stored theme before the first paint so there is no flash.
const theme = await getTheme().catch(() => 'system' as const);
queryClient.setQueryData(THEME_QUERY_KEY, theme);
applyTheme(theme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RQProvider>
      <ThemeProvider>
        <Screen />
      </ThemeProvider>
    </RQProvider>
  </StrictMode>,
);
