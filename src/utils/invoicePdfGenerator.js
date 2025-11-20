import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { LOGO_PATHS, SIGNATURE_PATHS, imageToBase64 } from './assetPath';

/**
 * Format date/time for display - matches report format: "20 Nov 2025, 10:23 am"
 */
const formatDateTime = (isoString) => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 || 12;
  
  return `${day} ${month} ${year}, ${hour12}:${minutes} ${period}`;
};

/**
 * Format date only (no time): "20 Nov 2025"
 */
const formatDate = (isoString) => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

/**
 * Generate Invoice/Bill PDF for HEALit Med Laboratories
 * Clean A4 format with professional layout
 */
export const generateInvoicePDF = async (invoiceData) => {
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
  
  // Left Logo - HEALit (convert to base64)
  try {
    const healitBase64 = await imageToBase64(LOGO_PATHS.healit);
    doc.addImage(healitBase64, 'PNG', 15, logoY, logoHeight * 1.5, logoHeight);
  } catch (error) {
    console.error('HEALit logo failed:', error);
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

  // Right Logo - Thyrocare (convert to base64)
  try {
    const partnerBase64 = await imageToBase64(LOGO_PATHS.partner);
    doc.addImage(partnerBase64, 'JPEG', pageWidth - 15 - logoHeight * 1.5, logoY, logoHeight * 1.5, logoHeight);
  } catch (error) {
    console.error('Partner logo failed:', error);
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
    `Date: ${patient.date ? formatDate(patient.date) : '-'}`
  ];

  patientLines.forEach(line => {
    doc.text(line, leftCol, yPos);
    yPos += 5;
  });
  
  // Address - Handle multiline
  const address = patient.address || 'Not provided';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Address:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  
  const addressLines = doc.splitTextToSize(address, 85);
  addressLines.forEach((line, idx) => {
    doc.text(line, leftCol + 18, yPos + (idx * 4));
  });
  yPos += 4 + (addressLines.length - 1) * 4;
  
  yPos += 5;
  doc.text(`Payment: ${patient.paymentStatus || 'Unpaid'}`, leftCol, yPos);
  yPos += 5;

  // Right: Invoice details
  yPos -= 30;
  
  // Add test times if available (from visit data)
  const times = invoiceData.times || {};
  
  const invoiceLines = [
    `Invoice No: ${invoice.invoiceNumber || 'INV-' + Date.now()}`,
    `Generated: ${invoice.generatedOn ? formatDateTime(invoice.generatedOn) : formatDateTime(new Date())}`,
    `Staff: ${invoice.staffName || '-'}`,
    `Method: ${invoice.method || 'Cash'}`
  ];
  
  // Always add time fields (show "—" if not available)
  invoiceLines.push(`Collected On: ${times.collected ? formatDateTime(times.collected) : '—'}`);
  invoiceLines.push(`Received On: ${times.received ? formatDateTime(times.received) : '—'}`);
  invoiceLines.push(`Reported On: ${times.reported ? formatDateTime(times.reported) : '—'}`);

  invoiceLines.forEach(line => {
    doc.text(line, rightCol, yPos);
    yPos += 5;
  });

  yPos += 10;

  // ========== ITEMS TABLE ==========
  const tableData = items.map((item, index) => {
    // Ensure numbers are properly parsed
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.qty) || 1;
    const amount = price * qty;
    
    return [
      String(index + 1),
      String(item.name || '-'),
      'Rs. ' + price.toFixed(2),
      String(qty),
      'Rs. ' + amount.toFixed(2)
    ];
  });

  doc.autoTable({
    startY: yPos,
    head: [['#', 'Test / Package Description', 'Rate', 'Qty', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
      valign: 'middle',
      cellPadding: 5
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [0, 0, 0],
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center', valign: 'middle', fontStyle: 'bold' },
      1: { cellWidth: 85, halign: 'left', valign: 'middle', fontStyle: 'bold' },
      2: { cellWidth: 30, halign: 'right', valign: 'middle' },
      3: { cellWidth: 15, halign: 'center', valign: 'middle' },
      4: { cellWidth: 35, halign: 'right', valign: 'middle', fontStyle: 'bold' }
    },
    margin: { left: 15, right: 15 },
    didDrawPage: (data) => {
      // Add border to table
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.5);
    }
  });

  // ========== SUMMARY SECTION ==========
  yPos = doc.lastAutoTable.finalY + 10;
  
  // Calculate totals correctly - ENSURE NUMBERS
  const calculatedSubtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.qty) || 1;
    return sum + (price * qty);
  }, 0);
  const actualDiscount = parseFloat(discount) || 0;
  const calculatedTotal = calculatedSubtotal - actualDiscount;
  const actualPaid = parseFloat(amountPaid) || calculatedTotal;
  const balance = calculatedTotal - actualPaid;
  
  // Create summary box on right side - Professional Layout
  const summaryX = pageWidth - 105;
  const summaryWidth = 90;
  
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(1);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryX, yPos, summaryWidth, 45, 3, 3, 'FD');
  
  // Summary content
  let summaryY = yPos + 9;
  const labelX = summaryX + 6;
  const valueX = pageWidth - 18;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  
  // Subtotal
  doc.text('Subtotal:', labelX, summaryY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Rs. ' + calculatedSubtotal.toFixed(2), valueX, summaryY, { align: 'right' });
  summaryY += 8;
  
  // Discount
  if (actualDiscount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Discount:', labelX, summaryY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('- Rs. ' + actualDiscount.toFixed(2), valueX, summaryY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    summaryY += 8;
  }
  
  // Tax/GST
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Tax/GST:', labelX, summaryY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Rs. 0.00', valueX, summaryY, { align: 'right' });
  summaryY += 8;
  
  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(labelX, summaryY - 2, valueX, summaryY - 2);
  summaryY += 3;
  
  // Amount Paid
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Amount Paid:', labelX, summaryY);
  doc.setTextColor(22, 163, 74);
  doc.setFont('helvetica', 'bold');
  doc.text('Rs. ' + actualPaid.toFixed(2), valueX, summaryY, { align: 'right' });
  summaryY += 8;
  
  // Balance Due
  doc.setFont('helvetica', 'normal');
  if (balance > 0) {
    doc.setTextColor(100, 116, 139);
    doc.text('Balance Due:', labelX, summaryY);
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text('Rs. ' + balance.toFixed(2), valueX, summaryY, { align: 'right' });
  } else {
    doc.setTextColor(100, 116, 139);
    doc.text('Balance Due:', labelX, summaryY);
    doc.setTextColor(22, 163, 74);
    doc.setFont('helvetica', 'bold');
    doc.text('Rs. 0.00', valueX, summaryY, { align: 'right' });
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
  
  // Add staff signature image (convert to base64)
  try {
    const staffSignatureBase64 = await imageToBase64(SIGNATURE_PATHS.rakhi);
    doc.addImage(staffSignatureBase64, 'JPEG', leftSigX, yPos + 2, 30, 12);
  } catch (error) {
    console.error('Staff signature failed:', error);
    doc.line(leftSigX, yPos + 8, leftSigX + 40, yPos + 8);
  }
  
  doc.setFontSize(8);
  doc.text(invoiceData.invoice?.staffName || 'Staff', leftSigX, yPos + 16);
  
  // RIGHT SIGNATURE - Authorized Signatory
  const rightSigX = pageWidth - 70;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Authorized Signatory:', rightSigX, yPos);
  
  // Add authorized signature image (convert to base64)
  try {
    const authSignatureBase64 = await imageToBase64(SIGNATURE_PATHS.aparna);
    doc.addImage(authSignatureBase64, 'PNG', rightSigX, yPos + 2, 30, 12);
  } catch (error) {
    console.error('Auth signature failed:', error);
    doc.line(rightSigX, yPos + 8, rightSigX + 45, yPos + 8);
  }
  
  doc.setFontSize(8);
  doc.text('Lab In-Charge', rightSigX, yPos + 16);

  return doc;
};

/**
 * Download invoice PDF
 */
export const downloadInvoice = async (invoiceData, fileName) => {
  const doc = await generateInvoicePDF(invoiceData);
  const name = fileName || `Bill-${invoiceData.patient?.visitId || Date.now()}.pdf`;
  doc.save(name);
};

/**
 * Print invoice PDF
 */
export const printInvoice = async (invoiceData) => {
  const doc = await generateInvoicePDF(invoiceData);
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
export const getInvoiceBlob = async (invoiceData) => {
  const doc = await generateInvoicePDF(invoiceData);
  return doc.output('blob');
};
