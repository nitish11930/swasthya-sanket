/**
 * NextAuth v5 Configuration — SWASTHYA-SANKET
 */

import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { Role } from "@/domain/enums";
import bcrypt from "bcryptjs";

// Safe singleton instantiation for Next.js dev server
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ─── Type augmentation ────────────────────────────────────────
declare module "next-auth" {
  interface User {
    employeeId: string;
    roleLabel: string;
    role: Role;
    phcId: string;
    phcName: string;
    districtId: string;
    districtName: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      employeeId: string;
      role: Role;
      roleLabel: string;
      phcId: string;
      phcName: string;
      districtId: string;
      districtName: string;
    } & DefaultSession["user"];
  }
}

// ─── Demo-mode fallback users (when Postgres is unavailable) ──────────────────
// These MUST match the seed script exactly.
const DEMO_USERS: Record<string, {
  id: string; name: string; employeeId: string;
  role: Role; roleLabel: string;
  phcId: string; phcName: string;
  districtId: string; districtName: string;
}> = {
  "FW-RJ-001": {
    id: "demo-fw-001", name: "Sita Devi",
    employeeId: "FW-RJ-001", role: Role.FIELD_WORKER, roleLabel: "ANM",
    phcId: "phc-barmer-03", phcName: "Barmer-03 PHC",
    districtId: "dist-barmer", districtName: "Barmer",
  },
  "PHC-RJ-001": {
    id: "demo-phc-001", name: "Dr. Rajesh Kumar",
    employeeId: "PHC-RJ-001", role: Role.PHC_ADMIN, roleLabel: "Medical Officer",
    phcId: "phc-barmer-03", phcName: "Barmer-03 PHC",
    districtId: "dist-barmer", districtName: "Barmer",
  },
  "DO-RJ-001": {
    id: "demo-do-001", name: "Vikram Singh",
    employeeId: "DO-RJ-001", role: Role.DISTRICT_OFFICER, roleLabel: "District Officer",
    phcId: "dist-barmer", phcName: "Barmer District HQ",
    districtId: "dist-barmer", districtName: "Barmer",
  },
  "SA-RJ-001": {
    id: "demo-sa-001", name: "Priya Sharma",
    employeeId: "SA-RJ-001", role: Role.SUPER_ADMIN, roleLabel: "State Admin",
    phcId: "state-rajasthan", phcName: "Rajasthan State HQ",
    districtId: "state-rajasthan", districtName: "Rajasthan",
  },
  "AUD-RJ-001": {
    id: "demo-aud-001", name: "Anil Gupta",
    employeeId: "AUD-RJ-001", role: Role.AUDITOR, roleLabel: "Auditor",
    phcId: "state-rajasthan", phcName: "Rajasthan State HQ",
    districtId: "state-rajasthan", districtName: "Rajasthan",
  },
};

const DEMO_PASSWORD = "demo@1234";

import { authConfig } from "./auth.config";

// ─── NextAuth handler ──────────────────────────────────────────
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Employee ID",
      credentials: {
        employeeId: { label: "Employee ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const employeeId = credentials?.employeeId as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!employeeId || !password) return null;

        // ── 1. Try database-backed auth first ─────────────────────
        try {
          const user = await prisma.user.findUnique({
            where: { employeeId: employeeId.trim() },
            include: {
              facility: {
                include: {
                  parent: true
                }
              }
            }
          });

          if (user) {
            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordValid) return null;

            const phcId = user.facility.id;
            const phcName = user.facility.name;
            const districtId = user.facility.parentId || user.facility.id;
            const districtName = user.facility.parent?.name || user.facility.name;

            return {
              id: user.id,
              name: user.name,
              email: `${user.employeeId.toLowerCase()}@swasthya.gov.in`,
              employeeId: user.employeeId,
              role: user.role as Role,
              roleLabel: user.roleLabel,
              phcId, phcName, districtId, districtName,
            };
          }
          // User not found in DB — fall through to demo check
        } catch (e) {
          console.warn("[Auth] DB unavailable, falling back to demo-mode:", (e as Error)?.message?.slice(0, 80));
        }

        // ── 2. Demo-mode fallback (works without Postgres) ────────
        const demoUser = DEMO_USERS[employeeId.trim().toUpperCase()] ?? DEMO_USERS[employeeId.trim()];
        if (demoUser && password === DEMO_PASSWORD) {
          console.info(`[Auth] Demo-mode login: ${demoUser.employeeId} (${demoUser.roleLabel})`);
          return {
            id: demoUser.id,
            name: demoUser.name,
            email: `${demoUser.employeeId.toLowerCase()}@swasthya.gov.in`,
            employeeId: demoUser.employeeId,
            role: demoUser.role,
            roleLabel: demoUser.roleLabel,
            phcId: demoUser.phcId,
            phcName: demoUser.phcName,
            districtId: demoUser.districtId,
            districtName: demoUser.districtName,
          };
        }

        return null;
      },
    }),
  ],
  useSecureCookies: process.env.NODE_ENV === "production",
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
});

// Re-export types
export type { Role as UserRole };
