"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getDynamicExceptionsAction() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // Fetch recent field reports
  const reports = await prisma.fieldReport.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    include: {
      facility: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const dynamicExceptions = [];

  for (const report of reports) {
    if (report.structuredData) {
      try {
        const events = JSON.parse(report.structuredData);
        const absentEvent = events.find((e: any) => e.type === "STAFF_ABSENT");
        
        if (absentEvent && absentEvent.metadata?.staffName) {
          dynamicExceptions.push({
            id: report.id,
            type: "STAFF_ABSENT",
            severity: "high",
            staffName: absentEvent.metadata.staffName,
            facilityName: report.facility.name,
            timestamp: report.createdAt.toISOString(),
            transcript: report.transcript
          });
        }
      } catch (e) {
        console.error("Failed to parse structuredData in getDynamicExceptionsAction", e);
      }
    }
  }

  return dynamicExceptions;
}
