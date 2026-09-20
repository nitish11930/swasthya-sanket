import AppShell from "@/components/layout/AppShell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure the user is authenticated for all routes in (app)
  // Gracefully handles DB connection failures (e.g. no Postgres running locally)
  try {
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e && (e as any).digest?.startsWith('NEXT_REDIRECT')) {
      throw e;
    }
    // If DB is unavailable, allow demo-mode rendering rather than blank page
    console.warn("[AppLayout] Auth check failed (DB likely unavailable):", (e as Error)?.message);
  }

  return <AppShell>{children}</AppShell>;
}
