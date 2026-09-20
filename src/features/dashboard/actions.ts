"use server";

import { prisma } from "@/lib/db";
import { TransferStore } from "@/lib/transfer-store";
import { Role } from "@/domain/enums";

export async function getDashboardTelemetry(facilityId: string) {
  // Active queue: Pending, Approved, Dispatched, In_Transit (not fully resolved)
  const activeTransfers = await prisma.transfer.count({
    where: {
      OR: [
        { sourceFacilityId: facilityId },
        { destFacilityId: facilityId }
      ],
      status: {
        in: ["RECOMMENDED", "APPROVED", "DISPATCHED", "IN_TRANSIT"]
      }
    }
  });

  // Reconciled today (dummy date filter for demo purposes, realistically we'd filter by timestamp > 24h ago)
  const reconciledTransfers = await prisma.transfer.count({
    where: {
      OR: [
        { sourceFacilityId: facilityId },
        { destFacilityId: facilityId }
      ],
      status: "RECONCILED"
    }
  });

  // Freshness (mocking for now, could be based on latest InventoryEvent)
  const freshnessAvg = "98%";

  return {
    activeQueue: activeTransfers,
    urgentCount: Math.max(0, activeTransfers - 2), // Demo: Just a derived metric
    freshnessAvg,
    reconciledToday: reconciledTransfers,
  };
}

export async function getLatestActiveTransfer(facilityId: string) {
  const latestTransfer = await prisma.transfer.findFirst({
    where: {
      OR: [
        { sourceFacilityId: facilityId },
        { destFacilityId: facilityId }
      ],
      status: {
        notIn: ["RECONCILED"] // Anything active or in exception
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  if (!latestTransfer) return null;

  // Fetch full details using our store
  const detail = await TransferStore.getTransfer(latestTransfer.id);
  if (!detail) return null;

  // Compute the stepper state based on events
  const steps = [
    { label: "Approved", id: "APPROVED" },
    { label: "Dispatched", id: "DISPATCHED" },
    { label: "In Transit", id: "IN_TRANSIT" },
    { label: "Received", id: "RECEIVED" },
    { label: "Reconciled", id: "RECONCILED" },
  ];

  let currentStepIndex = -1;
  const lifecycle = steps.map((s, index) => {
    const event = detail.events.find(e => e.type === s.id);
    let state = "pending";
    if (event) {
      state = "completed";
      currentStepIndex = index;
    }
    return {
      label: s.label,
      state,
      time: event ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"
    };
  });

  // Make the step after the last completed one the "current" step (unless it's an exception or done)
  if (detail.status === "EXCEPTION") {
    // Keep it as is, or mark a custom error state
  } else if (currentStepIndex >= 0 && currentStepIndex < steps.length - 1) {
    lifecycle[currentStepIndex + 1].state = "current";
  }

  return {
    transId: detail.id,
    badge: detail.status,
    donorFacility: detail.donorName,
    recipientFacility: detail.recipientName,
    medicine: detail.medicineName,
    authorizedQty: detail.authorizedQuantity,
    dispatchedQty: detail.dispatchedQuantity,
    receivedQty: detail.receivedQuantity,
    currentStep: Math.min(currentStepIndex + 2, steps.length), // 1-indexed next step
    totalSteps: steps.length,
    lifecycle,
    isException: detail.status === "EXCEPTION",
    discrepancy: detail.discrepancy
  };
}

export async function getProactiveOutcome(facilityId: string) {
  // In a real app we'd fetch the latest forecast alert
  // For the demo we fetch a static representation if there are no real alerts
  return {
    avertedShortage: "+31h",
    currentBalance: 240,
    safetyThreshold: 100,
    safeMargin: 140
  };
}

export async function getInventoryOverview(facilityId: string) {
  const stock = await prisma.facilityStock.findMany({
    where: { facilityId },
    include: { medicine: true },
    take: 3
  });

  return stock.map(s => {
    const percentage = Math.min(100, Math.round((s.stockBalance / (s.safetyBuffer * 2 || 1)) * 100));
    let statusColor = "var(--success)";
    if (s.stockBalance <= s.safetyBuffer) statusColor = "var(--error)";
    else if (s.stockBalance <= s.safetyBuffer * 1.5) statusColor = "var(--warning)";

    return {
      id: s.id,
      medicineName: s.medicine.name,
      balance: s.stockBalance,
      unit: s.medicine.unit,
      threshold: s.safetyBuffer,
      percentage,
      statusColor
    };
  });
}

export async function getEpidemiologicalRisk(facilityId: string) {
  // Mock data representing a severe heatwave in Rajasthan
  return {
    condition: "Severe Heatwave",
    temperature: "43.5°C",
    location: "Barmer Block",
    projectedImpact: "+45% Pediatric Dehydration Caseload",
    urgency: "HIGH", // HIGH, MEDIUM, LOW
  };
}

export async function getWorkforceRoster(facilityId: string) {
  const { prisma } = await import("@/lib/db");
  
  // Find any STAFF_ABSENT events submitted today for this facility
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reports = await prisma.fieldReport.findMany({
    where: {
      facilityId,
      createdAt: {
        gte: today,
      },
    },
  });

  let absentName = null;
  // Parse structuredData to see if any report contains STAFF_ABSENT
  for (const report of reports) {
    if (report.structuredData) {
      try {
        const events = JSON.parse(report.structuredData);
        const absentEvent = events.find((e: any) => e.type === "STAFF_ABSENT");
        if (absentEvent && absentEvent.metadata?.staffName) {
          absentName = absentEvent.metadata.staffName;
          break; // Found one absent staff
        }
      } catch (e) {
        console.error("Failed to parse field report structuredData", e);
      }
    }
  }

  const total = 3;
  const onDuty = absentName ? total - 1 : total;

  return {
    onDuty,
    total,
    absentName,
    role: "ANM",
    impact: absentName ? "Community dispersion reduced, inpatient triage elevated." : "Optimal distribution capability.",
  };
}
