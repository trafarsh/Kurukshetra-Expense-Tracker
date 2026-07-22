import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateReceiptPDF(txData, memberData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;

  // Colors & Fonts
  const primaryColor = [15, 23, 42]; // slate-900
  const lightBg = [247, 247, 247]; // slate-100

  // ----------------------------------------------------
  // HEADER SECTION (Matches Python Script)
  // ----------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("TEAM KURUKSHETRA", pageWidth / 2, 25, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Sri Krishna College of Engineering and Technology", pageWidth / 2, 35, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Department of Electrical and Electronics Engineering (EEE)", pageWidth / 2, 42, { align: "center" });

  // ----------------------------------------------------
  // PREPARE DATA FOR GRID
  // ----------------------------------------------------
  const receiptNo = `KT-${txData.createdAt?.toMillis ? txData.createdAt.toMillis().toString().slice(-6) : Date.now().toString().slice(-6)}`;
  const dateStr = txData.createdAt?.toDate ? txData.createdAt.toDate().toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

  // We map the python script layout to jsPDF-autotable
  const tableData = [
    ["Receipt No.", receiptNo, "Date", dateStr],
    ["Paid By:", memberData?.name ? memberData.name.toUpperCase() : 'UNKNOWN', "Register No.:", "N/A"], // Assuming reg no isn't tracked yet
    ["Email:", memberData?.email || 'N/A', "Phone:", "N/A"],
    ["Amount Paid (₹):", `${txData.amount.toLocaleString()}`, "Payment Mode", txData.paymentMode || "UPI / Online"],
    ["Transaction ID / UTR", "N/A", "", ""],
    ["Received By", txData.receivedBy || "Admin", "Designation", "Team Treasurer / Admin"],
    ["Remarks", txData.description || 'Club Dues', "Remaining Dues", `₹${(memberData?.totalDue || 0).toLocaleString()}`]
  ];

  // ----------------------------------------------------
  // DRAW GRID TABLE
  // ----------------------------------------------------
  autoTable(doc, {
    startY: 55,
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 6,
      textColor: [0, 0, 0], // Black text
      lineColor: [150, 150, 150], // Grey grid lines
      lineWidth: 0.1
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: lightBg, cellWidth: 40 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', fillColor: lightBg, cellWidth: 40 },
      3: { cellWidth: 50 },
    },
    // Custom logic to handle empty cells or colspan if needed
    didParseCell: function(data) {
      // Make "Transaction ID / UTR" span 3 columns since it's wide
      if (data.row.index === 4 && data.column.index === 1) {
        data.cell.colSpan = 3;
      }
      if (data.row.index === 7 && data.column.index === 1) {
         data.cell.colSpan = 3;
      }
    }
  });

  // ----------------------------------------------------
  // FOOTER & DECLARATION
  // ----------------------------------------------------
  const finalY = doc.lastAutoTable.finalY + 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Declaration", 15, finalY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    "Thank you for supporting Team Kurukshetra. This is a computer-generated receipt and does not require a physical signature.",
    15,
    finalY + 7,
    { maxWidth: pageWidth - 30 }
  );

  // ----------------------------------------------------
  // SAVE PDF
  // ----------------------------------------------------
  doc.save(`${receiptNo}_Receipt.pdf`);
}
