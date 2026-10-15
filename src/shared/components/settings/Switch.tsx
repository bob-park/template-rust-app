interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
}

/** On/off switch (vee-app `.switch`). */
export default function Switch({ checked, onChange, ariaLabel, disabled }: SwitchProps) {
  return (
    <input
      type="checkbox"
      role="switch"
      aria-label={ariaLabel}
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="bg-base-300 checked:bg-primary relative h-5 w-9 cursor-pointer appearance-none rounded-[10px] transition-colors duration-[120ms] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform after:duration-[120ms] after:content-[''] checked:after:translate-x-4"
    />
  );
}
