"use server";

import { prisma } from "@/lib/db";
import { TransferStore } from "@/lib/transfer-store";
import { auth } from "@/lib/auth";

interface ApproveEnginePayload {
  donorPhcId: string;        // e.g. "Jodhpur-07"
  recipientFacilityName: string; // e.g. "Barmer-03 PHC"
  quantity: number;
  medicineName: string;      // e.g. "ORS"
  scenarioId: string;        // e.g. "OPT_3"
  expectedEffect: string;    // human-readable summary
}

export async function approveEngineTransferAction(payload: ApproveEnginePayload) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // 1. Resolve donor facility by name pattern
    const donorFacility = await prisma.facility.findFirst({
      where: { name: { contains: payload.donorPhcId } },
    });
    if (!donorFacility) {
      return { success: false, error: `Donor facility "${payload.donorPhcId}" not found.` };
    }

    // 2. Resolve recipient facility
    const recipientFacility = await prisma.facility.findFirst({
      where: { name: { contains: payload.recipientFacilityName.split(" ")[0] } },
    });
    if (!recipientFacility) {
      return { success: false, error: `Recipient facility not found.` };
    }

    // 3. Resolve medicine (ORS)
    const medicine = await prisma.medicine.findFirst({
      where: { name: { contains: payload.medicineName } },
    });
    if (!medicine) {
      return { success: false, error: `Medicine "${payload.medicineName}" not found.` };
    }

    // 4. Resolve proposer (current user)
    const user = await prisma.user.findUnique({
      where: { employeeId: session.user.employeeId },
    });
    if (!user) {
      return { success: false, error: "Current user not found in DB." };
    }

    // 5. Generate a unique Transfer ID
    const count = await prisma.transfer.count();
    const transferId = `TR-${String(count + 428).padStart(5, "0")}`;

    // 6. Create the Transfer record in APPROVED status
    await prisma.transfer.create({
      data: {
        id: transferId,
        sourceFacilityId: donorFacility.id,
        destFacilityId: recipientFacility.id,
        medicineId: medicine.id,
        quantity: payload.quantity,
        status: "APPROVED",
        proposerId: user.id,
        approverId: user.id,
      },
    });

    // 7. Append RECOMMENDED event (Engine generated)
    await TransferStore.appendEvent(
      transferId,
      "RECOMMENDED" as any,
      "DECISION_ENGINE",
      donorFacility.name,
      medicine.name,
      payload.quantity,
      `CORR-${transferId}`,
      {
        scenarioId: payload.scenarioId,
        reason: "Deterministic shortage prediction engine recommendation",
        effect: payload.expectedEffect,
      }
    );

    // 8. Append APPROVED event (User approved)
    await TransferStore.appendEvent(
      transferId,
      "APPROVED" as any,
      user.employeeId,
      recipientFacility.name,
      medicine.name,
      payload.quantity,
      `CORR-${transferId}`,
      {
        approvedBy: user.name,
        role: session.user.role,
      }
    );

    return {
      success: true,
      transferId,
    };
  } catch (err: any) {
    console.error("Engine approve error:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}
