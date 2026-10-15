import { useI18n } from '@/shared/providers/i18n/I18nProvider';
import { useStore } from '@/shared/store/rootStore';
import { errorMessage } from '@/utils/errorMessage';

/** Shows the last failed action (see the error slice) until dismissed. */
export default function ErrorAlert() {
  // store
  const error = useStore((s) => s.error);
  const dismissError = useStore((s) => s.dismissError);

  // hooks
  const { t } = useI18n();

  if (!error) {
    return null;
  }

  return (
    <div
      role="alert"
      className="bg-error/12 text-error mb-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3"
    >
      <span title={error.message}>{errorMessage(error, t.errors)}</span>
      <button type="button" className="cursor-pointer font-semibold" onClick={dismissError}>
        {t.errors.dismiss}
      </button>
    </div>
  );
}
