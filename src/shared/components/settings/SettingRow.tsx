interface SettingRowProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

/** One settings line (vee-app `.setting-row`): label and hint left, control right. */
export default function SettingRow({ label, hint, children }: SettingRowProps) {
  return (
    <div className="border-divider flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <div>
        {label}
        {hint && <small className="text-muted mt-0.5 block text-[11px]">{hint}</small>}
      </div>
      {children}
    </div>
  );
}
