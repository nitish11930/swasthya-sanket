import React from "react";

export type BadgeVariant =
  | "primary"
  | "success"
  | "danger"
  | "warning"
  | "neutral";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  primary: "badge-primary",
  success: "badge-success",
  danger: "badge-danger",
  warning: "badge-warning",
  neutral: "badge-neutral",
};

/**
 * Badge / chip — used for status indicators, role labels, priority chips.
 */
export function Badge({ variant = "neutral", children, icon, className = "" }: BadgeProps) {
  return (
    <span
      className={["badge", variantClass[variant], className].filter(Boolean).join(" ")}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
