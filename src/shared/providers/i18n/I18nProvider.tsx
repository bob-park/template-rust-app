import { createContext, useContext, useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import type { LocalePref } from '@/domain/settings/apis/settings.dto';
import { LOCALE_QUERY_KEY, useLocalePref } from '@/domain/settings/queries/settings';
import { type Dict, type Locale, dicts, resolveLocale } from '@/shared/i18n';

import { listen } from '@tauri-apps/api/event';

interface I18n {
  locale: Locale;
  t: Dict;
}

const I18nContext = createContext<I18n>({ locale: 'en', t: dicts.en });

export function useI18n() {
  return useContext(I18nContext);
}

export default function I18nProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  // hooks
  const queryClient = useQueryClient();

  // queries
  const { locale: pref } = useLocalePref();

  const locale = resolveLocale(pref, navigator.language);

  // useEffect
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    // Another window changed the language; each window has its own query cache.
    const unlisten = listen<LocalePref>('settings://locale-changed', (e) =>
      queryClient.setQueryData(LOCALE_QUERY_KEY, e.payload),
    );

    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [queryClient]);

  return <I18nContext.Provider value={{ locale, t: dicts[locale] }}>{children}</I18nContext.Provider>;
}
