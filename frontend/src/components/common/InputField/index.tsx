import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";

export type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: ReactNode;
  className?: string;
};

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      id,
      label,
      type = "text",
      placeholder,
      icon,
      error,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [showPassword, setShowPassword] = useState(false);
    const resolvedType = type === "password" && showPassword ? "text" : type;
    const showPasswordToggle = type === "password";
    const inputClasses = [
      "w-full h-10 rounded-[6px] border px-3 text-sm transition-colors focus:outline-none focus:ring-2",
      error ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[rgba(220,38,38,0.12)]" : "focus:border-[#15803D] focus:ring-[rgba(21,128,61,0.12)]",
      disabled ? "cursor-not-allowed bg-[#F1F5F9] text-[#94A3B8]" : "bg-white",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={`flex w-full flex-col ${className}`.trim()}>
        {label ? (
          <label htmlFor={inputId} className="mb-2 text-sm font-medium text-[#0F172A]">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <input
            {...props}
            ref={ref}
            id={inputId}
            type={resolvedType}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            style={{
              borderColor: error ? '#DC2626' : '#CBD5E1',
              color: '#0F172A'
            }}
            className={inputClasses}
          />
          {showPasswordToggle ? (
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-gray-600"
              style={{ color: 'var(--gray-column-text)' }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          ) : icon ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--gray-column-text)' }}>
              {icon}
            </span>
          ) : null}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-[#DC2626]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
