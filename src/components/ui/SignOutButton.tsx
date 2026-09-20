"use client";

/**
 * SignOutButton — calls NextAuth signOut server action.
 * Displayed as the user avatar in the header.
 */

import { signOut } from "next-auth/react";

interface Props {
  initials: string;
}

export default function SignOutButton({ initials }: Props) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      title="Sign out"
      aria-label="Sign out"
      style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.25)",
        border: "2px solid rgba(255,255,255,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        color: "white",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        transition: "background 0.15s ease",
        flexShrink: 0,
      }}
    >
      {initials.toUpperCase()}
    </button>
  );
}
