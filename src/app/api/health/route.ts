import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Health check endpoint used by:
 * - Uptime monitoring
 * - Playwright E2E smoke tests
 * - Load balancer health probes
 *
 * Returns deterministic JSON — no DB call in Phase 0.
 * Phase 1 will add: db ping, migration version, auth service status.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "swasthya-sanket",
      version: process.env.APP_VERSION ?? "0.1.0",
      phase: "0 — Foundation",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
