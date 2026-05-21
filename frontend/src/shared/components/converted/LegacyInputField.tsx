import type { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";
import { memo, useState } from "react";

type LegacyInputFieldProps = {
  id?: string;
  name: string;
  label: string;
  error?: string;
  className?: string;
  icon?: ReactNode;
  onValueChange?: (_value: string, _event: ChangeEvent<HTMLInputElement>) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange">;

export const LegacyInputField = memo(
  ({
    id,
    name,
    label,
    error,
    className = "",
    icon,
    onValueChange,
    type = "text",
    ...props
  }: LegacyInputFieldProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const resolvedType = type === "password" ? (showPassword ? "text" : "password") : type;

    return (
      <div className={`flex flex-col w-full ${className}`.trim()}>
        <label htmlFor={id ?? name} className="text-sm font-normal mb-1 text-primary">
          {label}
        </label>
        <div className="relative">
          <input
            {...props}
            id={id ?? name}
            name={name}
            type={resolvedType}
            onChange={(event) => onValueChange?.(event.target.value, event)}
            className="w-full text-sm bg-[#F6F6F6] text-gray-700 px-3 py-2.5 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {type === "password" ? (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          ) : (
            icon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
          )}

          {error ? <span className="text-red-600 text-sm block mt-1">{error}</span> : null}
        </div>
      </div>
    );
  }
);

LegacyInputField.displayName = "LegacyInputField";
