import { useEffect, useState } from 'react';

import AutostartSwitch from '@/app/settings/_components/AutostartSwitch';
import Tabs, { type SettingsTab } from '@/app/settings/_components/Tabs';
import UpdateSection from '@/domain/updater/components/UpdateSection';
import ErrorAlert from '@/shared/components/error/ErrorAlert';
import LanguageSwitcher from '@/shared/components/i18n/LanguageSwitcher';
import SettingRow from '@/shared/components/settings/SettingRow';
import SettingSection from '@/shared/components/settings/SettingSection';
import ThemeSwitcher from '@/shared/components/theme/ThemeSwitcher';
import { useI18n } from '@/shared/providers/i18n/I18nProvider';

import { listen } from '@tauri-apps/api/event';

export default function SettingsApp() {
  // state
  const [tab, setTab] = useState<SettingsTab>('general');

  // hooks
  const { t } = useI18n();

  // useEffect
  useEffect(() => {
    // The window is hidden, not destroyed, on close; every open starts on the general tab.
    const unlisten = listen('settings://opened', () => setTab('general'));

    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <main className="flex h-full flex-col">
      <Tabs value={tab} onChange={setTab} />
      <div
        className="flex-1 overflow-y-auto px-7 py-4"
        id="settings-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
      >
        <ErrorAlert />
        {tab === 'general' && (
          <SettingSection>
            <SettingRow label={t.settings.theme}>
              <ThemeSwitcher />
            </SettingRow>
            <SettingRow label={t.settings.language}>
              <LanguageSwitcher />
            </SettingRow>
            <SettingRow label={t.settings.launchAtLogin}>
              <AutostartSwitch />
            </SettingRow>
          </SettingSection>
        )}
        {tab === 'updates' && (
          <SettingSection>
            <UpdateSection />
          </SettingSection>
        )}
      </div>
    </main>
  );
}
