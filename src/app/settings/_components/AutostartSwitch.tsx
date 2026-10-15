import { useAutostart, useAutostartUpdate } from '@/domain/settings/queries/settings';
import Switch from '@/shared/components/settings/Switch';
import { useI18n } from '@/shared/providers/i18n/I18nProvider';

export default function AutostartSwitch() {
  // hooks
  const { t } = useI18n();

  // queries
  const { autostart } = useAutostart();
  const { updateAutostart, isLoading } = useAutostartUpdate();

  return (
    <Switch ariaLabel={t.settings.launchAtLogin} checked={autostart} disabled={isLoading} onChange={updateAutostart} />
  );
}
