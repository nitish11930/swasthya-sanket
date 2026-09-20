import React from "react";

export type CardVariant = "default" | "danger" | "success" | "warning";

export interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  role?: string;
  "aria-label"?: string;
}

const variantClass: Record<CardVariant, string> = {
  default: "glass",
  danger: "glass-danger",
  success: "glass-success",
  warning: "glass-warning",
};

/**
 * Glassmorphic card — design system compliant.
 * Renders children within a styled glass surface.
 */
export function Card({
  variant = "default",
  children,
  className = "",
  style,
  ...rest
}: CardProps) {
  return (
    <div
      className={["card", variantClass[variant], className].filter(Boolean).join(" ")}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}
