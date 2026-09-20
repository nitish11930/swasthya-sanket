import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helpText?: string;
}

/**
 * Input field — design system compliant.
 * Includes label, optional icon, error/help text.
 * RULE: No validation logic here — use Zod schemas in lib/validations.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helpText, id, className = "", style, ...rest }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`;

    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}
      >
        {label && (
          <label
            htmlFor={inputId}
            className="text-label-md"
            style={{ color: "var(--on-surface-variant)", marginLeft: 2 }}
          >
            {label}
          </label>
        )}
        <div style={{ position: "relative" }}>
          {icon && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                pointerEvents: "none",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={["input-field", className].filter(Boolean).join(" ")}
            style={{
              paddingLeft: icon ? 44 : 16,
              borderColor: error ? "var(--danger)" : undefined,
              ...style,
            }}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={
              error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
            }
            {...rest}
          />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-label-sm"
            role="alert"
            style={{ color: "var(--danger)", marginLeft: 2 }}
          >
            {error}
          </p>
        )}
        {!error && helpText && (
          <p
            id={`${inputId}-help`}
            className="text-label-sm"
            style={{ color: "var(--outline)", marginLeft: 2 }}
          >
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
