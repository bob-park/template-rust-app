import type { KeyboardEvent, ReactNode } from 'react';

import { useI18n } from '@/shared/providers/i18n/I18nProvider';

import cx from 'classnames';

export type SettingsTab = 'general' | 'updates';

const svg = (children: ReactNode) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const TABS: { value: SettingsTab; icon: ReactNode }[] = [
  {
    value: 'general',
    icon: svg(
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
      </>,
    ),
  },
  {
    value: 'updates',
    icon: svg(
      <>
        <path d="M12 3v12M7 10l5 5 5-5" />
        <path d="M5 21h14" />
      </>,
    ),
  },
];

/** Preferences-style tab bar (vee-app). Arrow keys move between tabs (WAI-ARIA tabs pattern). */
export default function Tabs({ value, onChange }: { value: SettingsTab; onChange: (tab: SettingsTab) => void }) {
  // hooks
  const { t } = useI18n();

  // handle
  const handleKeyDown = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;

    if (!step) {
      return;
    }

    e.preventDefault();

    const i = TABS.findIndex((tab) => tab.value === value);
    const next = TABS[(i + step + TABS.length) % TABS.length].value;

    onChange(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <div
      className="border-divider flex shrink-0 justify-center gap-1 border-b pt-2 pb-2.5"
      role="tablist"
      onKeyDown={handleKeyDown}
    >
      {TABS.map((tab) => (
        <button
          key={tab.value}
          id={`tab-${tab.value}`}
          type="button"
          role="tab"
          aria-selected={tab.value === value}
          aria-controls="settings-panel"
          tabIndex={tab.value === value ? 0 : -1}
          className={cx(
            'flex w-[72px] cursor-pointer flex-col items-center gap-[3px] rounded-[10px] py-1.5 text-[11px]',
            {
              'bg-accent-subtle text-primary font-semibold': tab.value === value,
              'text-muted': tab.value !== value,
            },
          )}
          onClick={() => onChange(tab.value)}
        >
          {tab.icon}
          {t.settings.tabs[tab.value]}
        </button>
      ))}
    </div>
  );
}
