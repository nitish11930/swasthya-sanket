import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        token.employeeId = u.employeeId;
        token.role = u.role;
        token.roleLabel = u.roleLabel;
        token.phcId = u.phcId;
        token.phcName = u.phcName;
        token.districtId = u.districtId;
        token.districtName = u.districtName;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.sub ?? "",
        name: token.name ?? "",
        employeeId: (token.employeeId as string) ?? "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        role: (token.role as any) ?? "FIELD_WORKER",
        roleLabel: (token.roleLabel as string) ?? "",
        phcId: (token.phcId as string) ?? "",
        phcName: (token.phcName as string) ?? "",
        districtId: (token.districtId as string) ?? "",
        districtName: (token.districtName as string) ?? "",
      };
      return session;
    },
  },
  providers: [], // To be populated in auth.ts
  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60,
  },
} satisfies NextAuthConfig;
