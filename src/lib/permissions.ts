import { Role } from "@/domain/enums";

export enum Permission {
  VIEW_DISTRICT = "VIEW_DISTRICT",
  VIEW_PHC = "VIEW_PHC",
  UPDATE_INVENTORY = "UPDATE_INVENTORY",
  SUBMIT_FIELD_EVENT = "SUBMIT_FIELD_EVENT",
  APPROVE_TRANSFER = "APPROVE_TRANSFER",
  REJECT_TRANSFER = "REJECT_TRANSFER",
  DISPATCH_TRANSFER = "DISPATCH_TRANSFER",
  CONFIRM_RECEIPT = "CONFIRM_RECEIPT",
  RECONCILE_TRANSFER = "RECONCILE_TRANSFER",
  VIEW_AUDIT = "VIEW_AUDIT",
  MANAGE_USERS = "MANAGE_USERS"
}

// Map each Role to their set of permitted actions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    Permission.VIEW_DISTRICT,
    Permission.VIEW_PHC,
    Permission.VIEW_AUDIT,
    Permission.MANAGE_USERS,
  ],
  [Role.DISTRICT_OFFICER]: [
    Permission.VIEW_DISTRICT,
    Permission.VIEW_PHC,
    Permission.VIEW_AUDIT,
    Permission.APPROVE_TRANSFER,
    Permission.REJECT_TRANSFER,
    Permission.RECONCILE_TRANSFER,
  ],
  [Role.PHC_ADMIN]: [
    Permission.VIEW_PHC,
    Permission.UPDATE_INVENTORY,
    Permission.DISPATCH_TRANSFER,
    Permission.CONFIRM_RECEIPT,
  ],
  [Role.FIELD_WORKER]: [
    Permission.SUBMIT_FIELD_EVENT,
    Permission.VIEW_PHC, // Basic viewing of their assigned PHC
  ],
  [Role.AUDITOR]: [
    Permission.VIEW_DISTRICT,
    Permission.VIEW_PHC,
    Permission.VIEW_AUDIT,
  ],
};

/**
 * Check if a Role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
