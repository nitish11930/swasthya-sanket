import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Root page — checks session and redirects accordingly.
 */
export default async function RootPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  redirect("/login");
}
