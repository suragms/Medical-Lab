import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { LOGO_PATHS, SIGNATURE_PATHS, imageToBase64 } from './assetPath';
import { renderLabReportSection } from './labReportPdfGenerator';

/**
 * COMBINED PDF GENERATOR - Invoice + All Profile Reports in ONE PDF
 * Generates a single PDF document with:
 * - Page 1: Invoice with all profiles
 * - Page 2+: Lab reports for each profile (separate pages)
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

const formatDate = (isoString) => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Generate Invoice Page
 */
const generateInvoicePage = async (doc, invoiceData) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 10;

  const {
    patient = {},
    invoice = {},
    items = [],
    discount = 0,
    amountPaid = 0,
    times = {}
  } = invoiceData;

  // Header
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 2;
  
  const logoHeight = 16;
  const logoY = yPos;
  
  try {
    const healitBase64 = await imageToBase64(LOGO_PATHS.healit);
    doc.addImage(healitBase64, 'PNG', 15, logoY, logoHeight * 1.5, logoHeight);
  } catch (error) {
    console.error('Logo error:', error);
  }

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('HEALit Med Laboratories', pageWidth / 2, logoY + 12, { align: 'center' });

  try {
    const partnerBase64 = await imageToBase64(LOGO_PATHS.partner);
    doc.addImage(partnerBase64, 'JPEG', pageWidth - 15 - logoHeight * 1.5, logoY, logoHeight * 1.5, logoHeight);
  } catch (error) {
    console.error('Partner logo error:', error);
  }

  yPos += logoHeight + 2;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Kunnathpeedika – Thrissur, Kerala', pageWidth / 2, yPos, { align: 'center' });
  yPos += 3;

  doc.setFontSize(7);
  doc.text('Phone: 7356865161 | Email: healitlab@gmail.com', pageWidth / 2, yPos, { align: 'center' });
  yPos += 3;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 5;

  // Invoice Title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('LAB INVOICE / BILL', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  // Patient & Invoice Details
  const leftCol = 15;
  const rightCol = 115;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT DETAILS', leftCol, yPos);
  doc.text('INVOICE DETAILS', rightCol, yPos);
  yPos += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  const patientLines = [
    `Patient: ${patient.name || '-'}`,
    `Ph: ${patient.phone || '-'}`,
    `Age/Gender: ${patient.age || '-'}Y / ${patient.gender || '-'}`,
    `Visit ID: ${patient.visitId || '-'}`,
    `Date: ${patient.date ? formatDate(patient.date) : '-'}`
  ];

  patientLines.forEach(line => {
    doc.text(line, leftCol, yPos);
    yPos += 3.5;
  });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Address:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  
  const address = patient.address || 'Not provided';
  const addressLines = doc.splitTextToSize(address, 85);
  addressLines.forEach((line, idx) => {
    doc.text(line, leftCol + 16, yPos + (idx * 3));
  });
  yPos += 3 + (addressLines.length - 1) * 3 + 3.5;
  
  doc.text(`Payment: ${patient.paymentStatus || 'Unpaid'}`, leftCol, yPos);
  yPos += 3.5;

  yPos -= 22;
  
  const invoiceLines = [
    `Invoice: ${invoice.invoiceNumber || 'INV-' + Date.now()}`,
    `Generated: ${invoice.generatedOn ? formatDateTime(invoice.generatedOn) : formatDateTime(new Date())}`,
    `Staff: ${invoice.staffName || '-'}`,
    `Method: ${invoice.method || 'Cash'}`,
    `Collected: ${times.collected ? formatDateTime(times.collected) : '—'}`,
    `Received: ${times.received ? formatDateTime(times.received) : '—'}`,
    `Reported: ${times.reported ? formatDateTime(times.reported) : '—'}`
  ];

  invoiceLines.forEach(line => {
    doc.text(line, rightCol, yPos);
    yPos += 3.5;
  });

  yPos += 6;

  // Items Table
  const tableData = items.map((item, index) => {
    const amount = parseFloat(item.price) || 0;
    return [
      String(index + 1),
      String(item.name || '-'),
      'Rs. ' + amount.toFixed(2)
    ];
  });

  doc.autoTable({
    startY: yPos,
    head: [['#', 'Test Profile / Package', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: 2
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [0, 0, 0],
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 125, halign: 'left', fontStyle: 'bold' },
      2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 15, right: 15 }
  });

  yPos = doc.lastAutoTable.finalY + 5;
  
  // Summary
  const calculatedSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const actualDiscount = parseFloat(discount) || 0;
  const calculatedTotal = calculatedSubtotal - actualDiscount;
  const actualPaid = parseFloat(amountPaid) || calculatedTotal;
  const balance = calculatedTotal - actualPaid;
  
  const summaryX = pageWidth - 90;
  const summaryWidth = 75;
  
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.7);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryX, yPos, summaryWidth, 34, 2, 2, 'FD');
  
  let summaryY = yPos + 6;
  const labelX = summaryX + 4;
  const valueX = pageWidth - 16;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  
  doc.text('Subtotal:', labelX, summaryY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Rs. ' + calculatedSubtotal.toFixed(2), valueX, summaryY, { align: 'right' });
  summaryY += 5.5;
  
  if (actualDiscount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Discount:', labelX, summaryY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('- Rs. ' + actualDiscount.toFixed(2), valueX, summaryY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    summaryY += 5.5;
  }
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Tax/GST:', labelX, summaryY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Rs. 0.00', valueX, summaryY, { align: 'right' });
  summaryY += 5.5;
  
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(labelX, summaryY - 2, valueX, summaryY - 2);
  summaryY += 2;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Paid:', labelX, summaryY);
  doc.setTextColor(22, 163, 74);
  doc.setFont('helvetica', 'bold');
  doc.text('Rs. ' + actualPaid.toFixed(2), valueX, summaryY, { align: 'right' });
  summaryY += 5.5;
  
  doc.setFont('helvetica', 'normal');
  if (balance > 0) {
    doc.setTextColor(100, 116, 139);
    doc.text('Balance:', labelX, summaryY);
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text('Rs. ' + balance.toFixed(2), valueX, summaryY, { align: 'right' });
  } else {
    doc.setTextColor(100, 116, 139);
    doc.text('Balance:', labelX, summaryY);
    doc.setTextColor(22, 163, 74);
    doc.setFont('helvetica', 'bold');
    doc.text('Rs. 0.00', valueX, summaryY, { align: 'right' });
  }

  // Footer
  const footerY = 245;
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(75, 85, 99);
  doc.text('Thank you for choosing HEALit Med Laboratories. Get well soon!', 15, footerY);
  
  yPos = footerY + 5;
  
  const leftSigX = 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text('Authorized By:', leftSigX, yPos);
  
  try {
    const staffSignatureBase64 = await imageToBase64(SIGNATURE_PATHS.rakhi);
    doc.addImage(staffSignatureBase64, 'PNG', leftSigX, yPos + 1, 25, 10, undefined, 'FAST');
  } catch {
    doc.line(leftSigX, yPos + 6, leftSigX + 25, yPos + 6);
  }
  
  doc.setFontSize(6.5);
  doc.text(invoiceData.invoice?.staffName || 'Staff', leftSigX, yPos + 13);
  
  const rightSigX = pageWidth - 60;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('In-charge:', rightSigX, yPos);
  
  try {
    const authSignatureBase64 = await imageToBase64(SIGNATURE_PATHS.aparna);
    doc.addImage(authSignatureBase64, 'PNG', rightSigX, yPos + 1, 25, 10, undefined, 'FAST');
  } catch {
    doc.line(rightSigX, yPos + 6, rightSigX + 25, yPos + 6);
  }
  
  doc.setFontSize(6.5);
  doc.text('Lab In-Charge', rightSigX, yPos + 13);
};

// =====================================================================
// Lab Report Page — V2 (PROMPT_V2.md / MISMATCH.md)
//   - Header: plain text, NO box, two-line CORPORATE
//   - 4-column table (theme: 'plain', thin borders)
//   - Result cell: bold value (10pt) + small gray unit below via didDrawCell
//   - Group header rows: only col 0 populated, bold + underline, no fill
//   - Footer: signatures (y=258..282), separator (y=283), address+page (y=287..295)
// =====================================================================

/* eslint-disable no-unused-vars -- Legacy duplicate lab helpers are retained so this production file only delegates the report section. */
const LR_PAGE_W = 210;
const LR_PAGE_H = 297;
const LR_MARGIN = 15;

const LR_COL_WIDTHS = {
  testDesc: 72,
  result: 35,
  bioRef: 52,
  sampleType: 21
};

const LR_COLOR = {
  black: [0, 0, 0],
  darkGray: [60, 60, 60],
  midGray: [120, 120, 120],
  lightGray: [200, 200, 200],
  veryLight: [245, 245, 245],
  border: [180, 180, 180],
  headerFill: [240, 240, 240],
  groupFill: [230, 230, 230],
  highText: [185, 28, 28],
  lowText: [29, 78, 216],
  highBg: [254, 242, 242],
  lowBg: [239, 246, 255],
  white: [255, 255, 255]
};

const LR_FOOTER_H = 18;
const LR_FOOTER_Y = LR_PAGE_H - LR_FOOTER_H - 5;
const LR_SIG_FOOTER_H = 28;
const LR_SIG_FOOTER_Y = LR_PAGE_H - LR_SIG_FOOTER_H - 5;

const lrGetTestStatus = (test) => {
  if (test.type === 'text' || test.type === 'dropdown') return 'NORMAL';
  const value = parseFloat(test.value);
  if (isNaN(value)) return 'NORMAL';
  const low = parseFloat(test.low ?? test.refLow);
  const high = parseFloat(test.high ?? test.refHigh);
  if (!isNaN(low) && value < low) return 'LOW';
  if (!isNaN(high) && value > high) return 'HIGH';
  return 'NORMAL';
};

const lrGetStatusColor = (status) => {
  if (status === 'HIGH') return LR_COLOR.highText;
  if (status === 'LOW') return LR_COLOR.lowText;
  return LR_COLOR.black;
};

const lrGetBioReference = (test) =>
  test.bioReference ||
  test.bioReference_snapshot ||
  test.referenceRange ||
  test.refText_snapshot ||
  test.ref ||
  '-';

const lrBuildResultCell = (test) => {
  const value = test.value !== undefined && test.value !== null && test.value !== ''
    ? String(test.value)
    : '-';
  const unit = test.unit || test.unit_snapshot || '';
  return unit ? `${value}\n${unit}` : value;
};

const lrResultCellStyle = (test) => {
  const status = lrGetTestStatus(test);
  const hasValue = test.value !== undefined && test.value !== null && test.value !== '';

  return {
    halign: 'center',
    fontStyle: status !== 'NORMAL' && hasValue ? 'bold' : 'normal',
    textColor: lrGetStatusColor(status),
    fillColor: status === 'HIGH' ? LR_COLOR.highBg : (status === 'LOW' ? LR_COLOR.lowBg : LR_COLOR.white),
    fontSize: 9.5
  };
};

const lrDrawLabelValue = (doc, label, value, labelX, valueX, y) => {
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...LR_COLOR.darkGray);
  doc.text(label, labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...LR_COLOR.black);
  doc.text(`: ${value}`, valueX, y);
};

const drawLabReportHeader = async (doc, patient, times) => {
  let yPos = 12;
  const logoW = 36;
  const logoH = 24;
  const logoY = yPos;

  try {
    const healitBase64 = await imageToBase64(LOGO_PATHS.healit);
    doc.addImage(healitBase64, 'PNG', LR_MARGIN, logoY, logoW, logoH);
  } catch (error) {
    console.error('HEALit logo not loaded:', error);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...LR_COLOR.darkGray);
    doc.text('HEALit', LR_MARGIN, logoY + 12);
  }

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...LR_COLOR.black);
  doc.text('HEALit Med Laboratories', LR_PAGE_W / 2, logoY + 12, { align: 'center' });

  try {
    const partnerBase64 = await imageToBase64(LOGO_PATHS.partner);
    doc.addImage(partnerBase64, 'JPEG', LR_PAGE_W - LR_MARGIN - logoW, logoY, logoW, logoH);
  } catch (error) {
    console.error('Partner logo not loaded:', error);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...LR_COLOR.darkGray);
    doc.text('Thyrocare', LR_PAGE_W - LR_MARGIN, logoY + 12, { align: 'right' });
  }

  yPos = logoY + logoH;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...LR_COLOR.darkGray);
  doc.text('Kunnathpeedika Centre', LR_PAGE_W / 2, yPos, { align: 'center' });
  yPos += 5;

  doc.setFontSize(9);
  doc.text('Phone: 7356865161 | Email: info@healitlab.com', LR_PAGE_W / 2, yPos, { align: 'center' });
  yPos += 4;

  doc.setDrawColor(...LR_COLOR.lightGray);
  doc.setLineWidth(0.3);
  doc.line(LR_MARGIN, yPos, LR_PAGE_W - LR_MARGIN, yPos);
  yPos += 5;

  const lineH = 5.5;
  const leftLabelX = LR_MARGIN;
  const leftValueX = 35;
  const rightLabelX = 110;
  const rightValueX = 135;
  const headerStartY = yPos;
  const ageGenderText = `${patient.age || '-'} Years / ${patient.gender || '-'}`;

  const leftFields = [
    ['NAME', patient.name || '-'],
    ['LAB NO.', patient.visitId || '-'],
    ['AGE/SEX', ageGenderText],
    ['PH NO', patient.phone || '-'],
    ['IP/OP', 'OP']
  ];

  const rightFields = [
    ['COLLECTED ON', times.collected ? formatDateTime(times.collected) : '-'],
    ['RECIEVED ON', times.received ? formatDateTime(times.received) : '-'],
    ['REPORTED ON', times.reported ? formatDateTime(times.reported) : formatDateTime(new Date())],
    ['REFERRED BY', patient.referredBy || 'SELF'],
    ['CORPORATE', 'THYROCARE LAB, KUNNATHPEEDIKA']
  ];

  doc.setFontSize(9);
  leftFields.forEach(([label, value], index) => {
    lrDrawLabelValue(doc, label, value, leftLabelX, leftValueX, headerStartY + index * lineH);
  });
  rightFields.forEach(([label, value], index) => {
    lrDrawLabelValue(doc, label, value, rightLabelX, rightValueX, headerStartY + index * lineH);
  });

  yPos = headerStartY + (leftFields.length * lineH) + 1;
  doc.setDrawColor(...LR_COLOR.lightGray);
  doc.setLineWidth(0.3);
  doc.line(LR_MARGIN, yPos, LR_PAGE_W - LR_MARGIN, yPos);

  return yPos + 5;
};

const drawLabReportPageFooter = async (doc, pageNum, totalPages) => {
  doc.setDrawColor(...LR_COLOR.lightGray);
  doc.setLineWidth(0.3);
  doc.line(LR_MARGIN, LR_FOOTER_Y, LR_PAGE_W - LR_MARGIN, LR_FOOTER_Y);

  try {
    const healitBase64 = await imageToBase64(LOGO_PATHS.healit);
    doc.addImage(healitBase64, 'PNG', LR_MARGIN, LR_FOOTER_Y + 2, 16, 11);
  } catch (error) {
    console.error('Footer logo not loaded:', error);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...LR_COLOR.midGray);
    doc.text('HEALit', LR_MARGIN, LR_FOOTER_Y + 8);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...LR_COLOR.midGray);
  doc.text(`Page ${pageNum} of ${totalPages}`, LR_PAGE_W / 2, LR_FOOTER_Y + 8, { align: 'center' });

  doc.setFontSize(7);
  doc.text('Sree Lakshmi Building, Shornur Road,', LR_PAGE_W - LR_MARGIN, LR_FOOTER_Y + 5, { align: 'right' });
  doc.text('Thiruvambadi P.O, Thrissur, Kerala - 680022', LR_PAGE_W - LR_MARGIN, LR_FOOTER_Y + 9, { align: 'right' });
  doc.text('Phone: 0487 233 2100 | +91 9020 992 499', LR_PAGE_W - LR_MARGIN, LR_FOOTER_Y + 13, { align: 'right' });
};

const drawLabReportSignatureFooter = async (doc) => {
  const leftX = LR_MARGIN;
  const rightX = LR_PAGE_W - 65;
  const sigY = LR_SIG_FOOTER_Y + 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...LR_COLOR.midGray);
  doc.text('Verified by:', leftX, LR_SIG_FOOTER_Y);
  doc.text('Authorized by:', rightX, LR_SIG_FOOTER_Y);

  try {
    const rakhiBase64 = await imageToBase64(SIGNATURE_PATHS.rakhi);
    doc.addImage(rakhiBase64, 'PNG', leftX, sigY, 28, 11);
  } catch (error) {
    console.error('Rakhi signature failed:', error);
    doc.setDrawColor(...LR_COLOR.midGray);
    doc.line(leftX, sigY + 10, leftX + 28, sigY + 10);
  }

  try {
    const aparnaBase64 = await imageToBase64(SIGNATURE_PATHS.aparna);
    doc.addImage(aparnaBase64, 'PNG', rightX, sigY, 28, 11);
  } catch (error) {
    console.error('Aparna signature failed:', error);
    doc.setDrawColor(...LR_COLOR.midGray);
    doc.line(rightX, sigY + 10, rightX + 28, sigY + 10);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...LR_COLOR.black);
  doc.text('RAKHI T.R', leftX, LR_SIG_FOOTER_Y + 17);
  doc.text('APARNA A.T', rightX, LR_SIG_FOOTER_Y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...LR_COLOR.midGray);
  doc.text('DMLT', leftX, LR_SIG_FOOTER_Y + 21);
  doc.text('Incharge', rightX, LR_SIG_FOOTER_Y + 21);
};

const buildLabReportTableRows = (testGroups) => {
  const rows = [];

  (testGroups || []).forEach((group) => {
    const tests = (group.tests || []).filter((test) => test.printVisible !== false);
    if (tests.length === 0) return;

    rows.push([
      {
        content: group.name || 'TEST RESULTS',
        colSpan: 4,
        styles: {
          fillColor: LR_COLOR.groupFill,
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center',
          textColor: LR_COLOR.darkGray
        }
      }
    ]);

    tests.forEach((test) => {
      rows.push([
        { content: test.name || test.description || '-', styles: { fontStyle: 'bold', fontSize: 9.5 } },
        { content: lrBuildResultCell(test), styles: lrResultCellStyle(test) },
        { content: lrGetBioReference(test), styles: { fontSize: 8, whiteSpace: 'pre-wrap' } },
        { content: test.sampleType || test.sampleType_snapshot || 'SERUM', styles: { halign: 'center', fontSize: 9 } }
      ]);
    });
  });

  return rows;
};

const renderTestTable = (doc, startY, rows) => {
  doc.autoTable({
    startY,
    head: [[
      { content: 'Test Description', styles: { halign: 'left' } },
      { content: 'Results & Unit', styles: { halign: 'center' } },
      { content: 'Biological Reference Interval', styles: { halign: 'left' } },
      { content: 'Sample Type', styles: { halign: 'center' } }
    ]],
    body: rows,
    theme: 'plain',
    headStyles: {
      fillColor: LR_COLOR.headerFill,
      textColor: LR_COLOR.darkGray,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3,
      lineColor: LR_COLOR.border,
      lineWidth: { top: 0.3, right: 0, bottom: 0.3, left: 0 }
    },
    bodyStyles: {
      fontSize: 9,
      textColor: LR_COLOR.black,
      cellPadding: 3,
      lineColor: LR_COLOR.border,
      lineWidth: { top: 0, right: 0, bottom: 0.12, left: 0 },
      minCellHeight: 7
    },
    columnStyles: {
      0: { cellWidth: LR_COL_WIDTHS.testDesc, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: LR_COL_WIDTHS.result, halign: 'center' },
      2: { cellWidth: LR_COL_WIDTHS.bioRef, halign: 'left', fontSize: 8 },
      3: { cellWidth: LR_COL_WIDTHS.sampleType, halign: 'center' }
    },
    margin: { left: LR_MARGIN, right: LR_MARGIN, bottom: 43 },
    pageBreak: 'auto',
    rowPageBreak: 'avoid'
  });
};

/* eslint-enable no-unused-vars */

/**
 * Generate Lab Report Page for a Profile (Hygea HYGM-22685 layout)
 * Page numbering for the footer is relative to this profile section.
 */
const generateLabReportPage = async (doc, reportData) => {
  const startPage = doc.internal.getNumberOfPages();
  await renderLabReportSection(doc, reportData, { startPage });
};
/**
 * Build lab-reports-only PDF document (all profiles, no invoice).
 * @returns {{ doc, fileName, profileCount } | { error: string }}
 */
export const buildLabReportsPdfDoc = async (visitData, profiles = []) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  const groupedTests = {};
  (visitData.tests || []).forEach((test) => {
    const profileId = test.profileId || test.profile || 'UNKNOWN';
    if (!groupedTests[profileId]) groupedTests[profileId] = [];
    groupedTests[profileId].push(test);
  });

  const profileEntries = Object.entries(groupedTests);
  if (profileEntries.length === 0) {
    return { error: 'No profiles found' };
  }

  for (let i = 0; i < profileEntries.length; i++) {
    const [profileId, tests] = profileEntries[i];
    if (i > 0) doc.addPage();

    const profile = profiles.find((p) => p.profileId === profileId);
    const profileName = profile?.name || tests[0]?.profileName || 'Test Results';

    const reportData = {
      patient: {
        ...visitData.patient,
        testProfile: profileName,
        visitId: visitData.visitId || visitData.patient?.visitId
      },
      times: {
        collected: visitData.collectedAt,
        received: visitData.receivedAt,
        reported: visitData.reportedAt
      },
      signingTechnician: visitData.signingTechnician,
      testGroups: [{ name: profileName, tests }]
    };

    await generateLabReportPage(doc, reportData);
  }

  const patientName = (visitData.patient?.name || 'Patient').replace(/\s+/g, '_');
  const fileName = `LabReports_${patientName}_${visitData.visitId || 'report'}.pdf`;

  return { doc, fileName, profileCount: profileEntries.length };
};

/**
 * Generate Lab Reports ONLY (NO Invoice) - All profiles in ONE PDF
 */
export const generateLabReportsOnly = async (visitData, profiles = [], options = {}) => {
  const { download = true, print = false } = options;

  console.log('📄 Generating Lab Reports ONLY (NO Invoice) - All Profiles in ONE PDF');

  try {
    const built = await buildLabReportsPdfDoc(visitData, profiles);
    if (built.error) {
      console.error('❌', built.error);
      return { success: false, error: built.error };
    }

    const { doc, fileName, profileCount } = built;

    if (download) {
      console.log(`⬇️ Downloading: ${fileName}`);
      doc.save(fileName);
    }
    if (print) {
      console.log(`🖨️ Printing: ${fileName}`);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => printWindow.print(), 250);
        };
      }
    }

    console.log('✅ Lab Reports PDF generated successfully (NO Invoice)');
    return { success: true, fileName, profileCount };
  } catch (error) {
    console.error('❌ Failed to generate lab reports:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share lab reports only (no invoice) via WhatsApp
 */
export const shareLabReportsOnlyViaWhatsApp = async (visitData, profiles = [], phoneNumber) => {
  try {
    const built = await buildLabReportsPdfDoc(visitData, profiles);
    if (built.error) {
      return { success: false, error: built.error };
    }

    const { doc, fileName } = built;
    const pdfBlob = doc.output('blob');
    const patientName = visitData.patient?.name || 'Patient';

    if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      await navigator.share({
        title: `Lab Report - ${patientName}`,
        text: `HEALit lab report for ${patientName}`,
        files: [file]
      });
      return { success: true, message: 'Lab report PDF shared successfully!' };
    }

    const message = `HEALit lab report for ${patientName}`;
    const formattedPhone = (phoneNumber || visitData.patient?.phone || '').replace(/\D/g, '');
    const shareUrl = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    window.open(shareUrl, '_blank');

    return { success: true, message: 'WhatsApp opened. Lab report PDF downloaded for sharing.' };
  } catch (error) {
    console.error('❌ Lab report WhatsApp share error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share lab reports only (no invoice) via Email
 */
export const shareLabReportsOnlyViaEmail = async (visitData, profiles = [], emailAddress) => {
  try {
    const built = await buildLabReportsPdfDoc(visitData, profiles);
    if (built.error) {
      return { success: false, error: built.error };
    }

    const { doc, fileName } = built;
    const pdfBlob = doc.output('blob');
    const patientName = visitData.patient?.name || 'Patient';
    const email = emailAddress || visitData.patient?.email;

    if (!email) {
      return { success: false, error: 'Patient email not found' };
    }

    if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      await navigator.share({
        title: `Lab Report - ${patientName}`,
        text: `HEALit lab report for ${patientName}`,
        files: [file]
      });
      return { success: true, message: 'Lab report PDF shared successfully!' };
    }

    const subject = `Lab Test Report - ${patientName}`;
    const body = `Dear ${patientName},

Your lab test report from HEALit Med Laboratories is ready.

Best regards,
HEALit Med Laboratories`;
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: 'Email client opened. Lab report PDF downloaded for attachment.' };
  } catch (error) {
    console.error('❌ Lab report email share error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * MAIN EXPORT: Generate Combined PDF (Invoice + All Reports)
 */
export const generateCombinedPDF = async (visitData, profiles = [], options = {}) => {
  const { download = true, print = false } = options;
  
  console.log('📄 Generating COMBINED PDF: Invoice + All Profile Reports');
  
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const groupedTests = {};
  (visitData.tests || []).forEach(test => {
    const profileId = test.profileId || test.profile || 'UNKNOWN';
    if (!groupedTests[profileId]) groupedTests[profileId] = [];
    groupedTests[profileId].push(test);
  });
  
  const items = [];
  let totalAmount = 0;
  
  for (const [profileId, tests] of Object.entries(groupedTests)) {
    const profile = profiles.find(p => p.profileId === profileId);
    const profileInfo = profile ? {
      name: profile.name,
      price: profile.packagePrice || profile.price || 0
    } : {
      name: tests[0]?.profileName || 'Custom Package',
      price: tests.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0)
    };
    
    items.push(profileInfo);
    totalAmount += profileInfo.price;
  }
  
  const invoiceData = {
    patient: {
      name: visitData.patient?.name || '',
      age: visitData.patient?.age || '',
      gender: visitData.patient?.gender || '',
      phone: visitData.patient?.phone || '',
      email: visitData.patient?.email || '',
      address: visitData.patient?.address || '',
      visitId: visitData.visitId,
      date: visitData.createdAt,
      paymentStatus: visitData.paymentStatus || 'unpaid'
    },
    invoice: {
      invoiceNumber: visitData.visitId,
      generatedOn: new Date().toISOString(),
      staffName: visitData.created_by_name || visitData.signingTechnician?.fullName || 'Staff',
      method: visitData.paymentMethod || 'Cash'
    },
    items,
    times: {
      collected: visitData.collectedAt,
      received: visitData.receivedAt,
      reported: visitData.reportedAt
    },
    discount: 0,
    subtotal: totalAmount,
    finalTotal: totalAmount,
    amountPaid: visitData.paymentStatus === 'paid' ? totalAmount : 0
  };
  
  // PAGE 1: Invoice
  await generateInvoicePage(doc, invoiceData);
  
  // PAGE 2+: Lab Reports for each profile
  for (const [profileId, tests] of Object.entries(groupedTests)) {
    doc.addPage();
    
    const profile = profiles.find(p => p.profileId === profileId);
    const profileName = profile?.name || tests[0]?.profileName || 'Test Results';
    
    const reportData = {
      patient: {
        ...visitData.patient,
        testProfile: profileName,
        visitId: visitData.visitId || visitData.patient?.visitId
      },
      times: {
        collected: visitData.collectedAt,
        received: visitData.receivedAt,
        reported: visitData.reportedAt
      },
      signingTechnician: visitData.signingTechnician,
      testGroups: [{
        name: profileName,
        tests: tests
      }]
    };
    
    await generateLabReportPage(doc, reportData);
  }
  
  const patientName = (visitData.patient?.name || 'Patient').replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const profileNames = items.map(item => item.name.replace(/\s+/g, '_')).join('_');
  const fileName = `${patientName}_${dateStr}_${profileNames}.pdf`;
  
  try {
    if (download) {
      console.log(`⬇️ Downloading: ${fileName}`);
      doc.save(fileName);
    }
    if (print) {
      console.log(`🖨️ Printing: ${fileName}`);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => printWindow.print(), 250);
        };
      }
    }
    
    console.log('✅ Combined PDF generated successfully');
    return {
      success: true,
      fileName,
      profileCount: Object.keys(groupedTests).length
    };
  } catch (error) {
    console.error('❌ Failed to generate combined PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Share Combined PDF via WhatsApp
 */
export const shareCombinedPDFViaWhatsApp = async (visitData, profiles = [], phoneNumber) => {
  try {
    console.log('📱 Sharing Combined PDF via WhatsApp...');
    
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const groupedTests = {};
    (visitData.tests || []).forEach(test => {
      const profileId = test.profileId || test.profile || 'UNKNOWN';
      if (!groupedTests[profileId]) groupedTests[profileId] = [];
      groupedTests[profileId].push(test);
    });
    
    const items = [];
    let totalAmount = 0;
    
    for (const [profileId, tests] of Object.entries(groupedTests)) {
      const profile = profiles.find(p => p.profileId === profileId);
      const profileInfo = profile ? {
        name: profile.name,
        price: profile.packagePrice || profile.price || 0
      } : {
        name: tests[0]?.profileName || 'Custom Package',
        price: tests.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0)
      };
      
      items.push(profileInfo);
      totalAmount += profileInfo.price;
    }
    
    const invoiceData = {
      patient: {
        name: visitData.patient?.name || '',
        age: visitData.patient?.age || '',
        gender: visitData.patient?.gender || '',
        phone: visitData.patient?.phone || '',
        email: visitData.patient?.email || '',
        address: visitData.patient?.address || '',
        visitId: visitData.visitId,
        date: visitData.createdAt,
        paymentStatus: visitData.paymentStatus || 'unpaid'
      },
      invoice: {
        invoiceNumber: visitData.visitId,
        generatedOn: new Date().toISOString(),
        staffName: visitData.created_by_name || visitData.signingTechnician?.fullName || 'Staff',
        method: visitData.paymentMethod || 'Cash'
      },
      items,
      times: {
        collected: visitData.collectedAt,
        received: visitData.receivedAt,
        reported: visitData.reportedAt
      },
      discount: 0,
      subtotal: totalAmount,
      finalTotal: totalAmount,
      amountPaid: visitData.paymentStatus === 'paid' ? totalAmount : 0
    };
    
    await generateInvoicePage(doc, invoiceData);
    
    for (const [profileId, tests] of Object.entries(groupedTests)) {
      doc.addPage();
      const profile = profiles.find(p => p.profileId === profileId);
      const profileName = profile?.name || tests[0]?.profileName || 'Test Results';
      
      const reportData = {
        patient: {
          ...visitData.patient,
          testProfile: profileName,
          visitId: visitData.visitId || visitData.patient?.visitId
        },
        times: {
          collected: visitData.collectedAt,
          received: visitData.receivedAt,
          reported: visitData.reportedAt
        },
        signingTechnician: visitData.signingTechnician,
        testGroups: [{ name: profileName, tests: tests }]
      };
      
      await generateLabReportPage(doc, reportData);
    }
    
    const pdfBlob = doc.output('blob');
    const patientName = (visitData.patient?.name || 'Patient').replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const profileNames = items.map(item => item.name.replace(/\s+/g, '_')).join('_');
    const fileName = `${patientName}_${dateStr}_${profileNames}.pdf`;
    
    if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName)] })) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      await navigator.share({
        title: `Medical Report & Invoice - ${visitData.patient?.name}`,
        text: `HEALit Complete Report (Invoice + Tests) for ${visitData.patient?.name}`,
        files: [file]
      });
      
      return { success: true, message: 'Combined PDF shared successfully!' };
    } else {
      const message = `HEALit Complete Report (Invoice + Tests) for ${visitData.patient?.name}`;
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      const shareUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      window.open(shareUrl, '_blank');
      
      return { success: true, message: 'WhatsApp opened. Combined PDF downloaded for sharing.' };
    }
  } catch (error) {
    console.error('❌ WhatsApp share error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share Combined PDF via Email
 */
export const shareCombinedPDFViaEmail = async (visitData, profiles = [], emailAddress) => {
  try {
    console.log('📧 Sharing Combined PDF via Email...');
    
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const groupedTests = {};
    (visitData.tests || []).forEach(test => {
      const profileId = test.profileId || test.profile || 'UNKNOWN';
      if (!groupedTests[profileId]) groupedTests[profileId] = [];
      groupedTests[profileId].push(test);
    });
    
    const items = [];
    let totalAmount = 0;
    
    for (const [profileId, tests] of Object.entries(groupedTests)) {
      const profile = profiles.find(p => p.profileId === profileId);
      const profileInfo = profile ? {
        name: profile.name,
        price: profile.packagePrice || profile.price || 0
      } : {
        name: tests[0]?.profileName || 'Custom Package',
        price: tests.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0)
      };
      
      items.push(profileInfo);
      totalAmount += profileInfo.price;
    }
    
    const invoiceData = {
      patient: {
        name: visitData.patient?.name || '',
        age: visitData.patient?.age || '',
        gender: visitData.patient?.gender || '',
        phone: visitData.patient?.phone || '',
        email: visitData.patient?.email || '',
        address: visitData.patient?.address || '',
        visitId: visitData.visitId,
        date: visitData.createdAt,
        paymentStatus: visitData.paymentStatus || 'unpaid'
      },
      invoice: {
        invoiceNumber: visitData.visitId,
        generatedOn: new Date().toISOString(),
        staffName: visitData.created_by_name || visitData.signingTechnician?.fullName || 'Staff',
        method: visitData.paymentMethod || 'Cash'
      },
      items,
      times: {
        collected: visitData.collectedAt,
        received: visitData.receivedAt,
        reported: visitData.reportedAt
      },
      discount: 0,
      subtotal: totalAmount,
      finalTotal: totalAmount,
      amountPaid: visitData.paymentStatus === 'paid' ? totalAmount : 0
    };
    
    await generateInvoicePage(doc, invoiceData);
    
    for (const [profileId, tests] of Object.entries(groupedTests)) {
      doc.addPage();
      const profile = profiles.find(p => p.profileId === profileId);
      const profileName = profile?.name || tests[0]?.profileName || 'Test Results';
      
      const reportData = {
        patient: {
          ...visitData.patient,
          testProfile: profileName,
          visitId: visitData.visitId || visitData.patient?.visitId
        },
        times: {
          collected: visitData.collectedAt,
          received: visitData.receivedAt,
          reported: visitData.reportedAt
        },
        signingTechnician: visitData.signingTechnician,
        testGroups: [{ name: profileName, tests: tests }]
      };
      
      await generateLabReportPage(doc, reportData);
    }
    
    const pdfBlob = doc.output('blob');
    const patientName = (visitData.patient?.name || 'Patient').replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const profileNames = items.map(item => item.name.replace(/\s+/g, '_')).join('_');
    const fileName = `${patientName}_${dateStr}_${profileNames}.pdf`;
    
    if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName)] })) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      await navigator.share({
        title: `Medical Report & Invoice - ${visitData.patient?.name}`,
        text: `HEALit Complete Report (Invoice + Tests) for ${visitData.patient?.name}`,
        files: [file]
      });
      
      return { success: true, message: 'Combined PDF shared successfully!' };
    } else {
      const subject = `Medical Report & Invoice - ${visitData.patient?.name}`;
      const body = `Dear ${visitData.patient?.name},

Your complete medical report (including invoice and test results) from HEALit Med Laboratories is ready.

Best regards,
HEALit Med Laboratories`;
      
      const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl);
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true, message: 'Email client opened. Combined PDF downloaded for attachment.' };
    }
  } catch (error) {
    console.error('❌ Email share error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  generateCombinedPDF,
  generateLabReportsOnly,
  buildLabReportsPdfDoc,
  shareLabReportsOnlyViaWhatsApp,
  shareLabReportsOnlyViaEmail,
  shareCombinedPDFViaWhatsApp,
  shareCombinedPDFViaEmail
};
