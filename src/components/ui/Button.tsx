import React from "react";

export type ButtonVariant = "primary" | "danger" | "success" | "ghost";
export type ButtonSize = "default" | "sm";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

/**
 * Primary button component — design system compliant.
 * RULE: Never place business logic here. Only rendering.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "default",
      loading = false,
      icon,
      children,
      disabled,
      className = "",
      ...rest
    },
    ref
  ) => {
    const variantClass: Record<ButtonVariant, string> = {
      primary: "btn-primary",
      danger: "btn-danger",
      success: "btn-success",
      ghost: "btn-ghost",
    };

    const sizeClass: Record<ButtonSize, string> = {
      default: "",
      sm: "btn-sm",
    };

    const classes = [
      "btn",
      variantClass[variant],
      sizeClass[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {icon && <span aria-hidden="true">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

function LoadingSpinner() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="28"
        strokeDashoffset="12"
        strokeLinecap="round"
      />
    </svg>
  );
}
