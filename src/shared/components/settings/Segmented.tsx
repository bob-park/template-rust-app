import cx from 'classnames';

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

/** Radio group drawn as a segmented control (vee-app `.seg`). */
export default function Segmented<T extends string>({
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div className="bg-subtle inline-flex gap-0.5 rounded-[10px] p-0.5" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          disabled={disabled}
          className={cx('cursor-pointer rounded-lg px-2.5 py-1 text-xs', {
            'bg-card text-base-content font-semibold shadow-[0_1px_4px_rgba(16,24,40,0.08)]': option.value === value,
            'text-muted': option.value !== value,
          })}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
