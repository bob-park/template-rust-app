import type { ThemePref } from '@/domain/settings/apis/settings.dto';
import { useThemePref, useThemeUpdate } from '@/domain/settings/queries/settings';

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function ThemeSwitcher() {
  // queries
  const { theme } = useThemePref();
  const { updateTheme, isLoading } = useThemeUpdate();

  return (
    <label className="flex items-center justify-between gap-4">
      <span>Theme</span>
      <select
        className="select select-sm w-36"
        value={theme}
        disabled={isLoading}
        onChange={(e) => updateTheme(e.target.value as ThemePref)}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
