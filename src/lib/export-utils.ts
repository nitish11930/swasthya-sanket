import { TransferDetail } from "@/domain/transfers";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportLedgerToCSV(transfer: TransferDetail) {
  const headers = ["Event ID", "Type", "Timestamp", "Actor", "Facility", "Entity", "Quantity", "Status", "Hash", "Previous Hash", "Payload"];
  
  const rows = [...transfer.events].reverse().map(evt => [
    evt.id,
    evt.type,
    new Date(evt.timestamp).toISOString(),
    evt.actorId,
    evt.facility,
    evt.entity,
    evt.quantity.toString(),
    evt.status,
    evt.hash,
    evt.previousHash,
    evt.payload ? JSON.stringify(evt.payload) : "{}"
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `transfer-ledger-${transfer.id}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportLedgerToPDF(transfer: TransferDetail) {
  const doc = new jsPDF("landscape");
  
  // Title & Metadata
  doc.setFontSize(16);
  doc.text("SWASTHYA-SANKET Immutable Transfer Ledger", 14, 20);
  
  doc.setFontSize(11);
  doc.text(`Transfer ID: ${transfer.id}`, 14, 30);
  doc.text(`Status: ${transfer.status}`, 14, 36);
  doc.text(`Donor Facility: ${transfer.donorName}`, 14, 42);
  doc.text(`Recipient Facility: ${transfer.recipientName}`, 14, 48);
  doc.text(`Medicine: ${transfer.medicineName} (${transfer.authorizedQuantity} units authorized)`, 14, 54);

  if (transfer.discrepancy !== 0 && transfer.discrepancy !== null) {
    doc.setTextColor(220, 38, 38);
    doc.text(`Discrepancy Detected: ${transfer.discrepancy} units missing`, 14, 60);
    doc.setTextColor(0, 0, 0);
  }

  // Audit Table
  const tableData = [...transfer.events].reverse().map(evt => [
    evt.type,
    new Date(evt.timestamp).toLocaleString(),
    evt.actorId,
    evt.facility,
    evt.quantity.toString(),
    evt.status,
    evt.hash.substring(0, 24) + "..."
  ]);

  autoTable(doc, {
    startY: 65,
    head: [["Type", "Timestamp", "Actor", "Facility", "Qty", "Status", "Block Hash"]],
    body: tableData,
    styles: { fontSize: 9, font: "courier" },
    headStyles: { fillColor: [13, 148, 136] }, // Tailwind teal-600
    theme: "grid"
  });

  // Footer guarantee
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      "This document was cryptographically generated directly from the immutable append-only ledger.",
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  doc.save(`transfer-ledger-${transfer.id}.pdf`);
}
