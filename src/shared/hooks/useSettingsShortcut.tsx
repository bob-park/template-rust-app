import { useEffect } from 'react';

import call from '@/shared/api';

/**
 * Ctrl+, (Cmd+,) opens the settings window. On macOS the app menu accelerator handles it
 * before the webview sees the key; this covers Windows, which has no app menu.
 */
export default function useSettingsShortcut() {
  // useEffect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        void call('open_settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
