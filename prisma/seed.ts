import { PrismaClient } from '@prisma/client';
import { LocationType, Role, TransferStatus, AlertSeverity } from '../src/domain/enums';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Phase 2 Database (Barmer District, Rajasthan)...");

  // 1. Clean existing data (in correct foreign-key order)
  await prisma.auditLog.deleteMany({});
  await prisma.transfer.deleteMany({});
  await prisma.forecastSnapshot.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.fieldReport.deleteMany({});
  await prisma.inventoryEvent.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.facilityStock.deleteMany({});
  await prisma.medicine.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.facility.deleteMany({});

  // 2. Setup Hierarchy
  const state = await prisma.facility.create({
    data: { name: "Rajasthan State Health Directorate", type: LocationType.STATE }
  });

  const distBarmer = await prisma.facility.create({
    data: { name: "Barmer District", type: LocationType.DISTRICT, parentId: state.id }
  });

  const phc03 = await prisma.facility.create({
    data: { name: "PHC Barmer-03", type: LocationType.PHC, parentId: distBarmer.id }
  });
  
  const phc07 = await prisma.facility.create({
    data: { name: "PHC Jodhpur-07", type: LocationType.PHC, parentId: distBarmer.id } // Modeled under same dist for demo simplicity
  });

  // 3. Setup Medicines
  const meds = [
    { name: "ORS (WHO Formulation)", unit: "packets", defaultBuffer: 100 },
    { name: "Paracetamol 500mg", unit: "tablets", defaultBuffer: 60 },
    { name: "Amoxicillin 500mg", unit: "capsules", defaultBuffer: 30 },
    { name: "Iron + Folic Acid", unit: "tablets", defaultBuffer: 20 },
    { name: "Zinc Sulfate", unit: "tablets", defaultBuffer: 40 }
  ];

  const dbMeds = [];
  for (const m of meds) {
    dbMeds.push(await prisma.medicine.create({ data: m }));
  }

  // 4. Setup Stock for PHC-03 (matching Stitch UI screenshot exactly)
  const stockBalances = [240, 180, 42, 12, 88]; // Matching Engine snapshot exactly
  for (let i = 0; i < dbMeds.length; i++) {
    await prisma.facilityStock.create({
      data: {
        facilityId: phc03.id,
        medicineId: dbMeds[i].id,
        stockBalance: stockBalances[i],
        safetyBuffer: dbMeds[i].defaultBuffer
      }
    });
  }

  // 5. Setup Demo Users
  const plainPassword = "demo@1234";
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const users = [
    { employeeId: "FW-RJ-001", name: "Meena Devi", role: Role.FIELD_WORKER, roleLabel: "Field Worker (ANM)", facilityId: phc03.id, passwordHash },
    { employeeId: "PHC-RJ-001", name: "Dr. Priya Sharma", role: Role.PHC_ADMIN, roleLabel: "PHC Admin (MO)", facilityId: phc03.id, passwordHash },
    { employeeId: "DO-RJ-001", name: "Anita Singh", role: Role.DISTRICT_OFFICER, roleLabel: "District Officer", facilityId: distBarmer.id, passwordHash },
    { employeeId: "SA-RJ-001", name: "Commissioner Verma", role: Role.SUPER_ADMIN, roleLabel: "Super Admin", facilityId: state.id, passwordHash },
    { employeeId: "AUD-RJ-001", name: "Ramesh Audit", role: Role.AUDITOR, roleLabel: "Auditor", facilityId: state.id, passwordHash },
  ];

  const dbUsers = [];
  for (const u of users) {
    dbUsers.push(await prisma.user.create({ data: u }));
  }

  // 6. Setup active Transfer TR-00427 (matching UI)
  // Revert back to RECOMMENDED state with proper Audit and Event ledger
  const orsMedicine = dbMeds.find(m => m.name.includes("ORS"))!;
  const proposer = dbUsers.find(u => u.employeeId === "PHC-RJ-001")!;
  
  const activeTransfer = await prisma.transfer.create({
    data: {
      id: "TR-00427",
      sourceFacilityId: phc07.id,
      destFacilityId: phc03.id,
      medicineId: orsMedicine.id,
      quantity: 120,
      status: TransferStatus.RECOMMENDED,
      proposerId: proposer.id
    }
  });

  const INITIAL_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
  const correlationId = "CORR-SEED";

  // Create initial TransferEvent
  const eventDataString = `EVT-SEED:${activeTransfer.id}:${TransferStatus.RECOMMENDED}:SYSTEM:${phc07.name}:${orsMedicine.name}:120:${TransferStatus.RECOMMENDED}:${correlationId}:${new Date().toISOString()}:${INITIAL_HASH}:{"reason":"AI predictive shortage detection"}`;
  const crypto = require('crypto');
  const eventHash = crypto.createHash('sha256').update(eventDataString).digest('hex');

  await prisma.transferEvent.create({
    data: {
      id: "EVT-SEED",
      transferId: activeTransfer.id,
      type: TransferStatus.RECOMMENDED,
      actorId: "SYSTEM",
      facility: phc07.name,
      entity: orsMedicine.name,
      quantity: 120,
      status: TransferStatus.RECOMMENDED,
      correlationId: correlationId,
      payload: JSON.stringify({ reason: "AI predictive shortage detection" }),
      previousHash: INITIAL_HASH,
      hash: eventHash
    }
  });

  // Create initial AuditLog
  const auditDataString = `AUD-SEED:${INITIAL_HASH}:SYSTEM:SYSTEM:${new Date().toISOString()}:TRANSFER_RECOMMENDED:Transfer:${activeTransfer.id}:null:${JSON.stringify(activeTransfer)}:${correlationId}`;
  const auditHash = crypto.createHash('sha256').update(auditDataString).digest('hex');

  await prisma.auditLog.create({
    data: {
      id: "AUD-SEED",
      action: "TRANSFER_RECOMMENDED",
      entityName: "Transfer",
      entityId: activeTransfer.id,
      userId: null,
      role: "SYSTEM",
      changesBefore: "null",
      changesAfter: JSON.stringify(activeTransfer),
      correlationId: correlationId,
      previousHash: INITIAL_HASH,
      hash: auditHash
    }
  });

  // 7. Setup active Exceptions (matching UI)
  await prisma.alert.create({
    data: {
      type: "DISCREPANCY",
      severity: AlertSeverity.CRITICAL,
      description: "SVT-8899: Discrepancy logged: −20 ORS. Sub-centre transit failure.",
      facilityId: phc03.id,
      medicineId: dbMeds.find(m => m.name.includes("ORS"))!.id,
      status: "ACTIVE"
    }
  });

  // 8. Forecast Snapshots (matching Engine page)
  for (let i = 0; i < dbMeds.length; i++) {
    const med = dbMeds[i];
    const stock = stockBalances[i];
    const buffer = med.defaultBuffer;
    let days = 0;
    let status = "healthy";

    if (stock <= buffer) {
      days = 0;
      status = "critical";
    } else {
      // Mock logic just to mimic screenshots
      days = Math.floor((stock - buffer) / 2); // random mock consumption rate
      if (days < 10) status = "low";
      else if (days < 25) status = "monitor";
    }

    await prisma.forecastSnapshot.create({
      data: {
        facilityId: phc03.id,
        medicineId: med.id,
        daysRemaining: days,
        status: status
      }
    });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
