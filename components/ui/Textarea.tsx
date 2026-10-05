import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  charCount?: number;
  maxChars?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, charCount, maxChars, className = '', id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          {label && (
            <label htmlFor={textareaId} className="block text-xs font-medium text-slate-700">
              {label}
              {props.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}
          {maxChars !== undefined && (
            <span className="text-[11px] text-slate-400 font-mono">
              {charCount !== undefined ? charCount : (props.value as string)?.length || 0} / {maxChars}
            </span>
          )}
        </div>
        <textarea
          id={textareaId}
          ref={ref}
          className={`block w-full rounded-md text-xs sm:text-sm text-slate-900 bg-white border transition-colors duration-120 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500 p-3 leading-relaxed ${
            error
              ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
              : 'border-slate-300 hover:border-slate-400'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-xs text-red-600 font-medium" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-1 text-[11px] text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
