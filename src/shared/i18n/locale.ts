// Type-only import: erased at runtime, so node --test needs no alias resolution.
import type { LocalePref } from '@/domain/settings/apis/settings.dto';

export type Locale = 'en' | 'ko';

/** Same rule as Rust `app::i18n::resolve`: "system" follows the OS language. */
export function resolveLocale(pref: LocalePref, systemLanguage: string): Locale {
  if (pref !== 'system') {
    return pref;
  }

  return systemLanguage.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}
