import { useLocalePref, useLocaleUpdate } from '@/domain/settings/queries/settings';
import Segmented from '@/shared/components/settings/Segmented';
import { useI18n } from '@/shared/providers/i18n/I18nProvider';

export default function LanguageSwitcher() {
  // hooks
  const { t } = useI18n();

  // queries
  const { locale } = useLocalePref();
  const { updateLocale, isLoading } = useLocaleUpdate();

  // Language names stay in their own language so users can always find theirs.
  return (
    <Segmented
      ariaLabel={t.settings.language}
      value={locale}
      disabled={isLoading}
      onChange={updateLocale}
      options={[
        { value: 'system', label: t.settings.system },
        { value: 'ko', label: '한국어' },
        { value: 'en', label: 'English' },
      ]}
    />
  );
}
