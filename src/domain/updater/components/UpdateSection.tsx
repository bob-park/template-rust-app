import { useEffect, useState } from 'react';

import { useAutoUpdate, useAutoUpdateUpdate } from '@/domain/settings/queries/settings';
import { useUpdateCheck, useUpdateInstall, useUpdateStatus } from '@/domain/updater/queries/updater';
import Button from '@/shared/components/settings/Button';
import SettingRow from '@/shared/components/settings/SettingRow';
import Switch from '@/shared/components/settings/Switch';
import { useI18n } from '@/shared/providers/i18n/I18nProvider';
import { describeUpdateStatus } from '@/utils/updateStatus';

import { getVersion } from '@tauri-apps/api/app';

export default function UpdateSection() {
  // state
  const [version, setVersion] = useState('');

  // hooks
  const { t } = useI18n();

  // queries
  const { status } = useUpdateStatus();
  const { checkUpdate, isLoading: isChecking } = useUpdateCheck();
  const { installUpdate, isLoading: isInstalling } = useUpdateInstall();
  const { autoUpdate } = useAutoUpdate();
  const { updateAutoUpdate } = useAutoUpdateUpdate();

  // useEffect
  useEffect(() => {
    void getVersion().then(setVersion);
  }, []);

  return (
    <>
      <SettingRow label={t.updates.version(version)} hint={describeUpdateStatus(status, t.updates)}>
        {status.status === 'ready' ? (
          <Button disabled={isInstalling} onClick={installUpdate}>
            {t.updates.restart}
          </Button>
        ) : (
          <Button disabled={isChecking || status.status === 'checking'} onClick={checkUpdate}>
            {t.updates.check}
          </Button>
        )}
      </SettingRow>
      <SettingRow label={t.updates.auto}>
        <Switch ariaLabel={t.updates.auto} checked={autoUpdate} onChange={updateAutoUpdate} />
      </SettingRow>
    </>
  );
}
