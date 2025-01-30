import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  loading?: boolean;
  isDisabled?: boolean;
}

const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'default',
      children,
      loading,
      isDisabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'group relative flex items-center justify-center gap-2';

    const variantStyles = {
      default: 'bg-accent/10 text-accent hover:bg-accent/15',
      ghost: 'hover:bg-accent/5 text-ink',
      destructive: 'bg-red-500/10 text-red-500 hover:bg-red-500/15',
    };

    const sizeStyles = {
      default: 'h-10 w-10 rounded-lg',
      sm: 'h-9 w-9 rounded-md',
      lg: 'h-11 w-11 rounded-lg',
    };

    const transitionStyles = 'transition-all duration-200';

    const loadingStyles = loading
      ? 'cursor-default opacity-50'
      : 'journal-button';

    const disabledStyles = isDisabled
      ? 'cursor-not-allowed opacity-50'
      : 'cursor-pointer';

    const classes = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      transitionStyles,
      loadingStyles,
      disabledStyles,
      className,
    ].join(' ');

    return (
      <button ref={ref} className={classes} disabled={loading || isDisabled} {...props}>
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { IconButton };
