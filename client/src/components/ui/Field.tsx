import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

const baseFieldClasses =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 disabled:bg-gray-100 disabled:text-gray-400";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

export function Field({
  label,
  error,
  required,
  hint,
  children,
}: FieldWrapperProps & { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-ink-900">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="text-xs text-gray-500">{hint}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  ({ className, error, ...rest }, ref) => (
    <input
      ref={ref}
      className={clsx(baseFieldClasses, error && "border-red-400 focus:ring-red-300", className)}
      {...rest}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(({ className, error, ...rest }, ref) => (
  <textarea
    ref={ref}
    className={clsx(baseFieldClasses, "min-h-[80px]", error && "border-red-400 focus:ring-red-300", className)}
    {...rest}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }
>(({ className, error, children, ...rest }, ref) => (
  <select
    ref={ref}
    className={clsx(baseFieldClasses, "pr-8", error && "border-red-400 focus:ring-red-300", className)}
    {...rest}
  >
    {children}
  </select>
));
Select.displayName = "Select";
