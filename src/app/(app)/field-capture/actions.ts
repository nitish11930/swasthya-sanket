"use server";

import { z } from "zod";
import { authenticatedAction } from "@/lib/safe-action";
import { Permission } from "@/lib/permissions";
import { prisma } from "@/lib/auth";

const ExtractedEventSchema = z.object({
  id: z.string(), // temporary id for UI
  type: z.enum(["DISPENSE", "BED_OCCUPIED", "STAFF_ABSENT"]),
  label: z.string(),
  status: z.enum(["Pending", "Matched", "Flagged"]),
  statusClass: z.string(),
  icon: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type ExtractedEvent = z.infer<typeof ExtractedEventSchema>;

/**
 * AI Simulator: Parses Hinglish speech into structured events.
 */
export async function parseTranscriptAction(transcript: string): Promise<{ success: boolean; data?: ExtractedEvent[]; error?: string }> {
  // In a real app, this calls an LLM via OpenAI/Gemini with structured JSON output.
  // We use deterministic regex for the demo.
  
  const text = transcript.toLowerCase();
  const events: ExtractedEvent[] = [];

  // 1. "40 ORS packets diye"
  const dispenseMatch = text.match(/(\d+)\s+(ors|paracetamol|amoxicillin|iron|zinc).*?diye/i);
  if (dispenseMatch) {
    const qty = parseInt(dispenseMatch[1], 10);
    const med = dispenseMatch[2].toUpperCase();
    events.push({
      id: crypto.randomUUID(),
      type: "DISPENSE",
      label: `${qty} ${med} dispensed`,
      status: "Matched",
      statusClass: "badge-success",
      icon: "💊",
      metadata: { medicine: med, quantity: qty }
    });
  }

  // 2. "Bed number 3 occupied hai" or "ned no 3 occupied"
  const bedMatch = text.match(/(bed|ned)\s+(?:no\.?|num(?:ber)?)\s*(\d+).*?occupied/i);
  if (bedMatch) {
    events.push({
      id: crypto.randomUUID(),
      type: "BED_OCCUPIED",
      label: `Bed #${bedMatch[2].padStart(2, '0')} occupied`,
      status: "Pending",
      statusClass: "badge-warning",
      icon: "🛏️",
      metadata: { bedNumber: parseInt(bedMatch[2], 10) }
    });
  }

  // 3. "Sita ANM aaj duty par nahi aayi", "Sita aaj chutti pe hai", or "sitna,m off duty aaj"
  const staffMatch = text.match(/([a-z]+).*?(?:duty.*?nahi|chutti|absent|leave|off\s*duty)/i);
  if (staffMatch) {
    const name = staffMatch[1];
    events.push({
      id: crypto.randomUUID(),
      type: "STAFF_ABSENT",
      label: `${name.charAt(0).toUpperCase() + name.slice(1)} ANM absence`,
      status: "Flagged",
      statusClass: "badge-error",
      icon: "⚠️",
      metadata: { staffName: name }
    });
  }

  if (events.length === 0) {
    return { success: false, error: "Could not parse any deterministic events from speech." };
  }

  return { success: true, data: events };
}

/**
 * Commits a batch of offline/online events to the database.
 * Wrapped in our secure safe-action layer.
 */
export const commitFieldEventsAction = async (payload: { idempotencyKey: string; events: ExtractedEvent[]; transcript: string }) => {
  return authenticatedAction(
    z.object({
      idempotencyKey: z.string(),
      events: z.array(ExtractedEventSchema),
      transcript: z.string(),
    }),
    Permission.SUBMIT_FIELD_EVENT,
    payload,
    async (parsed, userId, facilityId) => {
      // 1. Check idempotency to prevent duplicate offline syncs
      const existingReport = await prisma.fieldReport.findFirst({
        where: { id: parsed.idempotencyKey } // We use idempotencyKey as the FieldReport ID
      });

      if (existingReport) {
        return { message: "Already synced." };
      }

      // 2. Create the transaction
      await prisma.$transaction(async (tx) => {
        // A. Create Field Report
        await tx.fieldReport.create({
          data: {
            id: parsed.idempotencyKey,
            facilityId,
            reporterId: userId,
            transcript: parsed.transcript,
            structuredData: JSON.stringify(parsed.events),
          }
        });

        // B. Process Dispense events to update inventory
        for (const evt of parsed.events) {
          if (evt.type === "DISPENSE" && evt.metadata?.medicine && evt.metadata?.quantity) {
            // Find medicine ID
            const medName = evt.metadata.medicine === "ORS" ? "ORS (WHO Formulation)" : evt.metadata.medicine;
            const med = await tx.medicine.findFirst({ where: { name: { contains: medName } } });
            
            if (med) {
              // Decrement stock
              const stock = await tx.facilityStock.findUnique({
                where: { facilityId_medicineId: { facilityId, medicineId: med.id } }
              });

              if (stock) {
                // Ensure we don't go negative, handled by DB constraint natively but we check here too for safety
                const qty = Number(evt.metadata.quantity);
                const newBalance = Math.max(0, stock.stockBalance - qty);
                await tx.facilityStock.update({
                  where: { id: stock.id },
                  data: { stockBalance: newBalance }
                });

                // Create inventory event ledger entry
                await tx.inventoryEvent.create({
                  data: {
                    type: "DISPENSE",
                    quantity: -qty,
                    facilityId,
                    medicineId: med.id,
                    userId,
                    referenceId: parsed.idempotencyKey
                  }
                });
              }
            }
          }
          // We can process BED_OCCUPIED and STAFF_ABSENT similarly in a real app, storing in dedicated tables
        }
      });

      return { message: `Synced ${parsed.events.length} events successfully.` };
    }
  );
};
