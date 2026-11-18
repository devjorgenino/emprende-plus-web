import { type ReactNode, forwardRef, useId } from 'react';

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  variant?: 'default' | 'outlined';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, variant = 'outlined', className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted z-10" aria-hidden="true">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
            className={`
              w-full
              px-3 py-2
              rounded-lg
              bg-surface
              border
              transition-colors
              duration-200
              focus:outline-none
              focus:ring-2
              focus:ring-secondary
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-error focus:ring-error' : 'border-border focus:ring-secondary'}
              ${variant === 'outlined' ? '' : 'shadow-elevation-1'}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';