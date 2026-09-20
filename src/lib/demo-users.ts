/**
 * SWASTHYA-SANKET — Demo User Store
 *
 * Phase 0/1: Hardcoded demo users — NO DATABASE REQUIRED.
 * Phase 2: Replace with Prisma + bcrypt verification.
 *
 * SECURITY NOTE:
 * - In production, passwords MUST be bcrypt hashed and stored in DB.
 * - These plain-text demo passwords are ONLY for local development.
 * - This file MUST NOT be used in production (guarded by NODE_ENV check in auth).
 *
 * DEMO CREDENTIALS:
 * ┌──────────────────┬─────────────┬──────────────────────┐
 * │ Employee ID      │ Password    │ Role                 │
 * ├──────────────────┼─────────────┼──────────────────────┤
 * │ ANM-RJ-001       │ demo@1234   │ ANM                  │
 * │ MO-RJ-001        │ demo@1234   │ Medical Officer      │
 * │ PHC-RJ-001       │ demo@1234   │ PHC Head             │
 * │ DO-RJ-001        │ demo@1234   │ District Officer     │
 * │ SA-RJ-001        │ demo@1234   │ State Admin          │
 * └──────────────────┴─────────────┴──────────────────────┘
 */

export type UserRole =
  | "ANM"
  | "MO"
  | "PHC_HEAD"
  | "DISTRICT_OFFICER"
  | "STATE_ADMIN";

export interface DemoUser {
  id: string;
  employeeId: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  phcId: string;
  phcName: string;
  districtId: string;
  districtName: string;
  password: string; // plain-text — demo ONLY
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: "user-anm-001",
    employeeId: "ANM-RJ-001",
    name: "Meena Devi",
    role: "ANM",
    roleLabel: "Auxiliary Nurse Midwife",
    phcId: "phc-barmer-03",
    phcName: "PHC Barmer-03",
    districtId: "dist-barmer",
    districtName: "Barmer District (Rajasthan)",
    password: "demo@1234",
  },
  {
    id: "user-mo-001",
    employeeId: "MO-RJ-001",
    name: "Dr. Priya Sharma",
    role: "MO",
    roleLabel: "Medical Officer",
    phcId: "phc-barmer-03",
    phcName: "PHC Barmer-03",
    districtId: "dist-barmer",
    districtName: "Barmer District (Rajasthan)",
    password: "demo@1234",
  },
  {
    id: "user-phchead-001",
    employeeId: "PHC-RJ-001",
    name: "Rajesh Kumar",
    role: "PHC_HEAD",
    roleLabel: "PHC Head",
    phcId: "phc-barmer-03",
    phcName: "PHC Barmer-03",
    districtId: "dist-barmer",
    districtName: "Barmer District (Rajasthan)",
    password: "demo@1234",
  },
  {
    id: "user-do-001",
    employeeId: "DO-RJ-001",
    name: "Anita Singh",
    role: "DISTRICT_OFFICER",
    roleLabel: "District Officer",
    phcId: "phc-district-office",
    phcName: "District Health Office",
    districtId: "dist-barmer",
    districtName: "Barmer District (Rajasthan)",
    password: "demo@1234",
  },
  {
    id: "user-sa-001",
    employeeId: "SA-RJ-001",
    name: "Commissioner Verma",
    role: "STATE_ADMIN",
    roleLabel: "State Admin",
    phcId: "phc-state-office",
    phcName: "State Health Directorate",
    districtId: "dist-raj-state",
    districtName: "Rajasthan — State Level",
    password: "demo@1234",
  },
];

/**
 * Find a user by employeeId + password.
 * Returns null if not found or password doesn't match.
 * PHASE 0: Plain-text compare. Phase 2: bcrypt.compare().
 */
export function findDemoUser(
  employeeId: string,
  password: string
): Omit<DemoUser, "password"> | null {
  const user = DEMO_USERS.find(
    (u) =>
      u.employeeId.toLowerCase() === employeeId.trim().toLowerCase() &&
      u.password === password
  );
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safe } = user;
  return safe;
}
