import type { ThemePref } from '@/domain/settings/apis/settings.dto';
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
