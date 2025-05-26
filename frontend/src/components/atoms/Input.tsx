import React from 'react';
import './Input.css';

interface InputProps {
  id?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  autoComplete?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>((
  {
    id,
    type = 'text',
    value,
    onChange,
    onFocus,
    onKeyDown,
    placeholder,
    disabled = false,
    className = '',
    'aria-label': ariaLabel,
    autoComplete,
  },
  ref
) => {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={`input ${className}`.trim()}
      aria-label={ariaLabel}
      ref={ref}
      autoComplete={autoComplete}
    />
  );
});

Input.displayName = 'Input'; 