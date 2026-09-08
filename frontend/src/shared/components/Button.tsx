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
  primary: "bg-[#15803D] text-white hover:bg-[#166534] active:bg-[#14532D] focus-visible:ring-[#15803D] border border-transparent",
  secondary: "bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] focus-visible:ring-[#15803D]",
  danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C] focus-visible:ring-[#DC2626] border border-transparent",
  ghost: "bg-transparent text-[#334155] hover:bg-[#F1F5F9] focus-visible:ring-[#CBD5E1]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-sm",
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
        className={`${variantClasses[variant]} ${sizeClasses[size]} inline-flex items-center justify-center gap-2 rounded-[6px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
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