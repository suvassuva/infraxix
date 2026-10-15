import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
}

export function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
  className = '',
}: RadioGroupProps) {
  return (
    <fieldset className={`w-full ${className}`}>
      {label && (
        <legend className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
          {label}
        </legend>
      )}
      <div className="space-y-2">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const isChecked = value === option.value;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={`flex items-start p-3 rounded-lg border transition-all cursor-pointer ${
                isChecked
                  ? 'border-blue-500 bg-blue-50/40 text-blue-950'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
              } ${option.disabled ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input
                type="radio"
                id={id}
                name={name}
                value={option.value}
                checked={isChecked}
                disabled={option.disabled}
                onChange={() => onChange && onChange(option.value)}
                className="h-4 w-4 mt-0.5 border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3 text-sm">
                <span className="font-medium">{option.label}</span>
                {option.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
    </fieldset>
  );
}
