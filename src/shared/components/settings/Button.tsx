import cx from 'classnames';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'danger' };

/** vee-app `.btn`: tinted background, accent text. */
export default function Button({ variant = 'default', className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'cursor-pointer rounded-xl px-3.5 py-2 font-semibold whitespace-nowrap disabled:cursor-default disabled:opacity-50',
        variant === 'danger' ? 'bg-error/12 text-error' : 'bg-accent-subtle text-primary',
        className,
      )}
    />
  );
}
