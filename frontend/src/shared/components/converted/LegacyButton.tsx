import { memo, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";

type LegacyButtonProps = {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
};

const variantClassMap: Record<ButtonVariant, string> = {
  primary: "text-white bg-primary border-none",
  secondary: "text-primary border-2 border-primary bg-white",
  outline: "text-[#1F2635] border-2 border-[#D0D5DD] bg-white",
  danger: "text-white bg-red-600 border-none"
};

export const LegacyButton = memo(
  ({
    label,
    onClick,
    type = "button",
    icon,
    variant = "primary",
    className = "",
    loading = false,
    disabled = false
  }: LegacyButtonProps) => {
    return (
      <button
        type={type}
        className={`text-sm font-medium py-2 px-4 flex items-center gap-2 rounded-lg ${variantClassMap[variant]} ${className}`}
        onClick={onClick}
        disabled={loading || disabled}
      >
        {loading ? <span>Loading...</span> : icon}
        <span>{label}</span>
      </button>
    );
  }
);

LegacyButton.displayName = "LegacyButton";
