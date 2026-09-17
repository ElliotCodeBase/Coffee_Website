"use client";

import { useId, useState } from "react";

/**
 * Password `<input>` with a show/hide eye-icon toggle, used everywhere a
 * password is entered in the admin panel: login, the invite "set your
 * password" flow, and changing an existing password. Kept as a single
 * shared component so all three stay visually and behaviorally consistent.
 *
 * Toggling visibility never touches the value itself, so it's safe to use
 * for both new-password fields and password confirmation.
 */
export default function PasswordField({
  id,
  name,
  label,
  required,
  autoComplete,
  value,
  onChange,
  className,
}: {
  id?: string;
  name: string;
  label: string;
  required?: boolean;
  autoComplete?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={inputId} className="block text-xs font-bold uppercase text-stone-500 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          id={inputId}
          name={name}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className={
            className ||
            "w-full px-4 py-3 pr-11 text-sm rounded-md border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          }
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-caffeine-dark transition-colors"
        >
          {visible ? (
            <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21m-2.121-2.121A10.056 10.056 0 0021.542 12c-.36-1.128-.917-2.19-1.638-3.147"
              />
            </svg>
          ) : (
            <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
