/**
 * NextAuth v5 Route Handler
 * Handles: GET/POST /api/auth/[...nextauth]
 * (sign-in, sign-out, session, csrf, callback)
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
