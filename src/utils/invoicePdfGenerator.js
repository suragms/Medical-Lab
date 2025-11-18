import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Generate Invoice/Bill PDF for HEALit Med Laboratories
 * Clean A4 format with professional layout
 */
export const generateInvoicePDF = (invoiceData) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  const {
    patient = {},
    invoice = {},
    items = [],
    discount = 0,
    subtotal = 0,
    finalTotal = 0,
    amountPaid = 0
  } = invoiceData;

  // ========== HEADER ==========
  // Header border top
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 3;
  
  // Add logos - SAME AS REPORT PDF
  const logoHeight = 24;
  const logoY = yPos;
  
  // Left Logo - HEALit
  try {
    const healitLogo = '/images/@heal original editable file (png).png';
    doc.addImage(healitLogo, 'PNG', 15, logoY, logoHeight * 1.5, logoHeight);
  } catch (error) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('[HEALit]', 15, yPos + 12);
  }

  // Center title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('HEALit Med Laboratories', pageWidth / 2, logoY + 12, { align: 'center' });

  // Right Logo - Thyrocare
  try {
    const partnerLogo = '/images/download.jpeg.jpg';
    doc.addImage(partnerLogo, 'JPEG', pageWidth - 15 - logoHeight * 1.5, logoY, logoHeight * 1.5, logoHeight);
  } catch (error) {
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text('[Thyrocare]', pageWidth - 25, yPos + 12, { align: 'right' });
  }

  yPos += logoHeight + 3;

  // Sub-title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Kunnathpeedika – Thrissur, Kerala', pageWidth / 2, yPos, { align: 'center' });

  yPos += 4;

  // Contact
  doc.setFontSize(9);
  doc.text('Phone: 7356865161 | Email: healitlab@gmail.com', pageWidth / 2, yPos, { align: 'center' });

  yPos += 5;

  // Line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 8;

  // ========== INVOICE TITLE ==========
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('LAB INVOICE / BILL', pageWidth / 2, yPos, { align: 'center' });

  yPos += 10;

  // ========== PATIENT & INVOICE DETAILS ==========
  const leftCol = 15;
  const rightCol = 115;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('PATIENT DETAILS', leftCol, yPos);
  doc.text('INVOICE DETAILS', rightCol, yPos);

  yPos += 6;

  // Left: Patient details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const patientLines = [
    `Patient Name: ${patient.name || '-'}`,
    `Phone: ${patient.phone || '-'}`,
    `Age/Gender: ${patient.age || '-'}Y / ${patient.gender || '-'}`,
    `Visit ID: ${patient.visitId || '-'}`,
    `Date: ${patient.date ? format(new Date(patient.date), 'dd-MMM-yyyy') : '-'}`,
    `Payment: ${patient.paymentStatus || 'Unpaid'}`
  ];

  patientLines.forEach(line => {
    doc.text(line, leftCol, yPos);
    yPos += 5;
  });

  // Right: Invoice details
  yPos -= 30;
  const invoiceLines = [
    `Invoice No: ${invoice.invoiceNumber || 'INV-' + Date.now()}`,
    `Generated: ${invoice.generatedOn ? format(new Date(invoice.generatedOn), 'dd-MMM-yyyy HH:mm') : format(new Date(), 'dd-MMM-yyyy HH:mm')}`,
    `Staff: ${invoice.staffName || '-'}`,
    `Method: ${invoice.method || 'Cash'}`
  ];

  invoiceLines.forEach(line => {
    doc.text(line, rightCol, yPos);
    yPos += 5;
  });

  yPos += 10;

  // ========== ITEMS TABLE ==========
  const tableData = items.map((item, index) => [
    index + 1,
    item.name || '-',
    `₹${item.price || 0}`,
    item.qty || 1,
    `₹${(item.price || 0) * (item.qty || 1)}`
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['Sl.', 'Test / Package Name', 'Unit Price', 'Qty', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138], // Dark blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [0, 0, 0]
    },
    alternateRowStyles: {
      fillColor: [243, 244, 246] // Light grey
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 85 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: 15, right: 15 }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // ========== SUMMARY ==========
  const summaryX = pageWidth - 65;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const summaryLines = [
    ['Subtotal:', `₹${subtotal || finalTotal + discount}`],
    discount > 0 ? ['Discount:', `- ₹${discount}`] : null,
    ['Tax:', '₹0'],
    ['Net Amount:', `₹${finalTotal}`]
  ].filter(Boolean);

  summaryLines.forEach(([label, value], index) => {
    doc.text(label, summaryX, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(value, pageWidth - 15, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    yPos += 6;
  });

  yPos += 2;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(summaryX, yPos, pageWidth - 15, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Amount Paid:', summaryX, yPos);
  doc.text(`₹${amountPaid || finalTotal}`, pageWidth - 15, yPos, { align: 'right' });

  yPos += 6;
  const balance = finalTotal - (amountPaid || finalTotal);
  if (balance > 0) {
    doc.setTextColor(239, 68, 68); // Red
    doc.text('Balance:', summaryX, yPos);
    doc.text(`₹${balance}`, pageWidth - 15, yPos, { align: 'right' });
  }

  // ========== FOOTER WITH SIGNATURES ==========
  const footerY = 260;
  
  // Thank you note
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(75, 85, 99);
  doc.text('Thank you for choosing HEALit Med Laboratories. Get well soon!', 15, footerY);
  
  yPos = footerY + 8;
  
  // LEFT SIGNATURE - Billing Staff
  const leftSigX = 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Billed By:', leftSigX, yPos);
  
  // Add staff signature image if available
  try {
    const staffSignature = '/images/signatures/rakhi-signature.png'; // PNG format
    doc.addImage(staffSignature, 'PNG', leftSigX, yPos + 2, 30, 12);
  } catch (error) {
    // Fallback to JPG
    try {
      const staffSignature = '/images/RakiSign.jpg';
      doc.addImage(staffSignature, 'JPEG', leftSigX, yPos + 2, 30, 12);
    } catch (err) {
      doc.line(leftSigX, yPos + 8, leftSigX + 40, yPos + 8);
    }
  }
  
  doc.setFontSize(8);
  doc.text(invoiceData.invoice?.staffName || 'Staff', leftSigX, yPos + 16);
  
  // RIGHT SIGNATURE - Authorized Signatory
  const rightSigX = pageWidth - 70;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Authorized Signatory:', rightSigX, yPos);
  
  // Add authorized signature image
  try {
    const authSignature = '/images/signatures/aparna-signature.png'; // PNG format
    doc.addImage(authSignature, 'PNG', rightSigX, yPos + 2, 30, 12);
  } catch (error) {
    // Fallback to JPG
    try {
      const authSignature = '/images/signatures/aparna-signature.jpg';
      doc.addImage(authSignature, 'JPEG', rightSigX, yPos + 2, 30, 12);
    } catch (err) {
      doc.line(rightSigX, yPos + 8, rightSigX + 45, yPos + 8);
    }
  }
  
  doc.setFontSize(8);
  doc.text('Lab In-Charge', rightSigX, yPos + 16);

  return doc;
};

/**
 * Download invoice PDF
 */
export const downloadInvoice = (invoiceData, fileName) => {
  const doc = generateInvoicePDF(invoiceData);
  const name = fileName || `Bill-${invoiceData.patient?.visitId || Date.now()}.pdf`;
  doc.save(name);
};

/**
 * Print invoice PDF
 */
export const printInvoice = (invoiceData) => {
  const doc = generateInvoicePDF(invoiceData);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow.print();
  };
};

/**
 * Get invoice PDF as blob for sharing
 */
export const getInvoiceBlob = (invoiceData) => {
  const doc = generateInvoicePDF(invoiceData);
  return doc.output('blob');
};
