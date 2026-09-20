"use server";

/**
 * Login Server Action — SWASTHYA-SANKET
 *
 * Validates form input server-side, then calls NextAuth signIn.
 * Errors are returned to the client — NEVER expose stack traces.
 *
 * SECURITY:
 * - Server action — never runs in browser
 * - employeeId trimmed and lower-cased before lookup
 * - Generic error message (no credential enumeration)
 */

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export type LoginResult =
  | { success: true }
  | { success: false; error: string };

export async function loginAction(
  _prevState: LoginResult,
  formData: FormData
): Promise<LoginResult> {
  const employeeId = (formData.get("employeeId") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  // ── Basic input validation ────────────────────────────────
  if (!employeeId) {
    return { success: false, error: "Employee ID is required." };
  }
  if (!password) {
    return { success: false, error: "Password is required." };
  }
  if (employeeId.length > 50) {
    return { success: false, error: "Invalid Employee ID." };
  }

  // ── Attempt sign-in via NextAuth ──────────────────────────
  try {
    await signIn("credentials", {
      employeeId,
      password,
      redirect: false, // We handle redirect manually
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // NextAuth error codes
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: "Invalid Employee ID or password. Please try again.",
          };
        default:
          return {
            success: false,
            error: "Sign-in failed. Please try again.",
          };
      }
    }
    // Re-throw unexpected errors (Next.js redirect throws internally)
    throw error;
  }

  // ── Success: redirect to dashboard ───────────────────────
  redirect("/dashboard");
}
