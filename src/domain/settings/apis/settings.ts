import type { LocalePref, ThemePref } from '@/domain/settings/apis/settings.dto';
import call from '@/shared/api';

export async function getGreeting() {
  return call<string>('get_greeting');
}

export async function getTheme() {
  return call<ThemePref>('get_theme');
}

export async function setTheme(theme: ThemePref) {
  return call<ThemePref>('set_theme', { theme });
}

export async function getAutoUpdate() {
  return call<boolean>('get_auto_update');
}

export async function setAutoUpdate(enabled: boolean) {
  return call<boolean>('set_auto_update', { enabled });
}

export async function getLocale() {
  return call<LocalePref>('get_locale');
}

export async function setLocale(locale: LocalePref) {
  return call<LocalePref>('set_locale', { locale });
}

export async function getAutostart() {
  return call<boolean>('get_autostart');
}

export async function setAutostart(enabled: boolean) {
  return call<boolean>('set_autostart', { enabled });
}
