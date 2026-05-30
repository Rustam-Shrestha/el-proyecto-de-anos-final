import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";
type IconValue = ReactNode | (() => ReactNode);

export type SharedButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  label?: ReactNode;
  icon?: IconValue;
  iconPosition?: "left" | "right";
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
  secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
  ghost: "bg-transparent text-gray-900 hover:bg-gray-100 focus-visible:ring-gray-300",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
    />
  </svg>
);

export const Button = forwardRef<HTMLButtonElement, SharedButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading,
      loading,
      disabled,
      leftIcon,
      rightIcon,
      label,
      icon,
      iconPosition = "left",
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const showLoading = Boolean(isLoading || loading);
    const resolvedIcon = typeof icon === "function" ? icon() : icon;
    const resolvedLeftIcon = leftIcon || (resolvedIcon && iconPosition === "left" ? resolvedIcon : null);
    const resolvedRightIcon = rightIcon || (resolvedIcon && iconPosition === "right" ? resolvedIcon : null);
    const content = children ?? label;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || showLoading}
        aria-busy={showLoading}
        className={`${variantClasses[variant]} ${sizeClasses[size]} inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        {...props}
      >
        {showLoading ? <Spinner /> : resolvedLeftIcon}
        {content}
        {!showLoading ? resolvedRightIcon : null}
      </button>
    );
  }
);

Button.displayName = "Button";

export const PrimaryButton = (props: SharedButtonProps) => <Button {...props} variant="primary" />;
export const SecondaryButton = (props: SharedButtonProps) => <Button {...props} variant="secondary" />;
export const DangerButton = (props: SharedButtonProps) => <Button {...props} variant="danger" />;
export const OutlineButton = (props: SharedButtonProps) => <Button {...props} variant="ghost" />;