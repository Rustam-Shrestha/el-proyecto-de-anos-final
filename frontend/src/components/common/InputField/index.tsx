// @ts-nocheck
/**
 * InputField Component — Memoized
 *
 * Wrapped in React.memo to prevent unnecessary re-renders.
 */
import React, { memo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const InputField = memo(({
  id,
  label,
  value,
  type,
  placeholder,
  icon,
  onChange,
  error,
  name,
  className = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`flex flex-col w-full ${className}`.trim()}>
      <label className="text-sm font-normal mb-1 text-primary">{label}</label>
      <div className="relative">
        <input
          {...props}
          id={id}
          name={name}
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${
            type === "date" ? "uppercase" : ""
          } w-full text-sm bg-[#F6F6F6] text-gray-500 px-3 py-2.5 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-primary`}
        />
        {type === "password" ? (
          <div
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
        ) : (
          icon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )
        )}
        {error && <span className="text-red text-sm block">{error}</span>}
      </div>
    </div>
  );
});

export default InputField;
