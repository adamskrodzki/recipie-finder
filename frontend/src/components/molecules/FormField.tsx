import React from 'react';
import { Input } from '../atoms/Input';
import './FormField.css';

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
}

export const FormField = React.forwardRef<
  HTMLInputElement,
  FormFieldProps
>((
  {
    id,
    label,
    value,
    onChange,
    onFocus,
    onKeyDown,
    type = 'text',
    placeholder,
    disabled = false,
    required = false,
    autoComplete,
  },
  ref
) => {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-field__label">
        {label}
        {required && <span className="form-field__required">*</span>}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={label}
        ref={ref}
        autoComplete={autoComplete}
      />
    </div>
  );
});

FormField.displayName = 'FormField'; 