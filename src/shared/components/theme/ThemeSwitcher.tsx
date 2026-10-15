import { useThemePref, useThemeUpdate } from '@/domain/settings/queries/settings';
import Segmented from '@/shared/components/settings/Segmented';
import { useI18n } from '@/shared/providers/i18n/I18nProvider';

export default function ThemeSwitcher() {
  // hooks
  const { t } = useI18n();

  // queries
  const { theme } = useThemePref();
  const { updateTheme, isLoading } = useThemeUpdate();

  return (
    <Segmented
      ariaLabel={t.settings.theme}
      value={theme}
      disabled={isLoading}
      onChange={updateTheme}
      options={[
        { value: 'system', label: t.settings.system },
        { value: 'light', label: t.settings.light },
        { value: 'dark', label: t.settings.dark },
      ]}
    />
  );
}
