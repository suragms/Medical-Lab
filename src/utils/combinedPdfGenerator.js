import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { LOGO_PATHS, SIGNATURE_PATHS, imageToBase64 } from './assetPath';

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
    subtotal = 0,
    finalTotal = 0,
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
  doc.text('Billed By:', leftSigX, yPos);
  
  try {
    const staffSignatureBase64 = await imageToBase64(SIGNATURE_PATHS.rakhi);
    doc.addImage(staffSignatureBase64, 'PNG', leftSigX, yPos + 1, 25, 10, undefined, 'FAST');
  } catch (error) {
    doc.line(leftSigX, yPos + 6, leftSigX + 25, yPos + 6);
  }
  
  doc.setFontSize(6.5);
  doc.text(invoiceData.invoice?.staffName || 'Staff', leftSigX, yPos + 13);
  
  const rightSigX = pageWidth - 60;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Authorized Signatory:', rightSigX, yPos);
  
  try {
    const authSignatureBase64 = await imageToBase64(SIGNATURE_PATHS.aparna);
    doc.addImage(authSignatureBase64, 'PNG', rightSigX, yPos + 1, 25, 10, undefined, 'FAST');
  } catch (error) {
    doc.line(rightSigX, yPos + 6, rightSigX + 25, yPos + 6);
  }
  
  doc.setFontSize(6.5);
  doc.text('Lab In-Charge', rightSigX, yPos + 13);
};

/**
 * Generate Lab Report Page for a Profile
 */
const generateLabReportPage = async (doc, reportData) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 15;

  const {
    patient = {},
    times = {},
    testGroups = [],
    signingTechnician = null
  } = reportData;

  // Header
  const logoHeight = 24;
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

  yPos += logoHeight + 3;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Kunnathpeedika Centre', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;

  doc.setFontSize(9);
  doc.text('Phone: 7356865161 | Email: info@healitlab.com', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;

  // Patient Details
  const leftCol = 15;
  const rightCol = 115;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('PATIENT DETAILS', leftCol, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const leftDetails = [
    `Patient Name: ${patient.name || '-'}`,
    `Phone: ${patient.phone || '-'}`,
    `Referred By: ${patient.referredBy || 'Self'}`
  ];

  const rightDetails = [
    `Age/Gender: ${patient.age || '-'}Y / ${patient.gender || '-'}`,
    `Visit ID: ${patient.visitId || '-'}`,
    `Profile: ${patient.testProfile || '-'}`,
    `Collected: ${times.collected ? formatDateTime(times.collected) : '-'}`,
    `Received: ${times.received ? formatDateTime(times.received) : '-'}`,
    `Reported: ${times.reported ? formatDateTime(times.reported) : formatDateTime(new Date())}`
  ];

  leftDetails.forEach(line => {
    doc.text(line, leftCol, yPos);
    yPos += 5;
  });
  
  const address = patient.address || 'Not provided';
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  
  const addressLines = doc.splitTextToSize(address, 80);
  addressLines.forEach((line, idx) => {
    doc.text(line, leftCol + 18, yPos + (idx * 4));
  });
  yPos += 4 + (addressLines.length - 1) * 4 + 5;

  yPos -= 30;
  rightDetails.forEach(line => {
    doc.text(line, rightCol, yPos);
    yPos += 5;
  });

  yPos += 15;

  // Test Results
  let allTests = testGroups.flatMap(group => group.tests || []);
  
  const tableData = allTests.map(test => {
    const value = test.value !== undefined && test.value !== '' ? String(test.value) : '-';
    const status = getTestStatus(test);
    const bioRef = test.bioReference || test.referenceRange || test.ref || test.refText_snapshot || '-';
    
    // Enhanced highlighting for abnormal values
    const isAbnormal = status !== 'NORMAL' && value !== '-';
    const textColor = getStatusColor(status);
    const bgColor = getStatusBgColor(status);
    
    return [
      { content: test.name || test.description || '-', styles: { fontStyle: 'bold', fontSize: 10 } },
      { 
        content: value, 
        styles: { 
          textColor: isAbnormal ? [0, 0, 0] : textColor,  // Black text for abnormal
          fillColor: bgColor,
          fontStyle: isAbnormal ? 'bold' : 'normal',  // Bold for abnormal
          fontSize: isAbnormal ? 12 : 10,  // BIGGER font for abnormal (12 vs 10)
          halign: 'center'
        } 
      },
      { content: test.unit || test.unit_snapshot || '-', styles: { halign: 'center', fontSize: 9.5 } },
      { content: bioRef, styles: { fontSize: 8.5, whiteSpace: 'pre-wrap' } }
    ];
  });

  renderTestTable(doc, yPos, tableData);
  yPos = doc.lastAutoTable.finalY + 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(107, 114, 128);
  doc.text('*End of Report*', pageWidth / 2, yPos + 5, { align: 'center' });

  // Footer
  const currentPageCount = doc.internal.getNumberOfPages();
  doc.setPage(currentPageCount);
  const footerY = 265;
  doc.setDrawColor(229, 231, 235);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  
  const technicianName = signingTechnician?.fullName || signingTechnician?.name || 'Lab Staff';
  
  const leftSigX = 15;
  const rightSigX = pageWidth - 65;
  
  doc.setFontSize(7);
  doc.setTextColor(75, 85, 99);
  doc.text('Billed By:', leftSigX, footerY);
  
  try {
    const technicianSignatureBase64 = await imageToBase64(SIGNATURE_PATHS.rakhi);
    doc.addImage(technicianSignatureBase64, 'PNG', leftSigX, footerY + 2, 28, 11);
  } catch (error) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(technicianName, leftSigX, footerY + 8);
    doc.setFont('helvetica', 'normal');
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(17, 17, 17);
  doc.text('Rakhi T.R', leftSigX, footerY + 15);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(102, 102, 102);
  doc.text('DMLT', leftSigX, footerY + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(75, 85, 99);
  doc.text('Authorized Signatory:', rightSigX, footerY);
  
  try {
    const authSignatureBase64 = await imageToBase64(SIGNATURE_PATHS.aparna);
    doc.addImage(authSignatureBase64, 'PNG', rightSigX, footerY + 2, 28, 11);
  } catch (error) {
    doc.setDrawColor(150, 150, 150);
    doc.line(rightSigX + 1, footerY + 10, rightSigX + 29, footerY + 10);
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(17, 17, 17);
  doc.text('Aparna A.T', rightSigX, footerY + 15);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(102, 102, 102);
  doc.text('Incharge', rightSigX, footerY + 19);
};

const getTestStatus = (test) => {
  if (test.type === 'text' || test.type === 'dropdown') return 'NORMAL';
  const value = parseFloat(test.value);
  if (isNaN(value)) return 'NORMAL';
  const low = parseFloat(test.low || test.refLow);
  const high = parseFloat(test.high || test.refHigh);
  if (!isNaN(low) && value < low) return 'LOW';
  if (!isNaN(high) && value > high) return 'HIGH';
  return 'NORMAL';
};

const getStatusColor = (status) => {
  if (status === 'HIGH') return [185, 28, 28];
  if (status === 'LOW') return [29, 78, 216];
  return [0, 0, 0];
};

const getStatusBgColor = (status) => {
  if (status === 'HIGH') return [254, 242, 242];
  if (status === 'LOW') return [239, 246, 255];
  return [255, 255, 255];
};

const renderTestTable = (doc, startY, tableData) => {
  doc.autoTable({
    startY,
    head: [['Test Description', 'Result', 'Unit', 'Bio. Ref. Internal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
      cellPadding: 5
    },
    bodyStyles: {
      fontSize: 9.5,
      textColor: [0, 0, 0],
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: [245, 250, 255]
    },
    columnStyles: {
      0: { cellWidth: 70, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 55, halign: 'left', fontSize: 8.5 }
    },
    margin: { left: 15, right: 15 }
  });
};

/**
 * MAIN EXPORT: Generate Combined PDF (Invoice + All Reports)
 */
export const generateCombinedPDF = async (visitData, profiles = [], options = {}) => {
  const { download = true, print = false } = options;
  
  console.log('📄 Generating COMBINED PDF: Invoice + All Profile Reports');
  
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Group tests by profile
  const groupedTests = {};
  (visitData.tests || []).forEach(test => {
    const profileId = test.profileId || test.profile || 'UNKNOWN';
    if (!groupedTests[profileId]) groupedTests[profileId] = [];
    groupedTests[profileId].push(test);
  });
  
  // Build invoice data
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
  
  // Generate descriptive filename: PatientName_Date_ProfileNames.pdf
  const patientName = (visitData.patient?.name || 'Patient').replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
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
    
    // Generate combined PDF as blob
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Group tests by profile
    const groupedTests = {};
    (visitData.tests || []).forEach(test => {
      const profileId = test.profileId || test.profile || 'UNKNOWN';
      if (!groupedTests[profileId]) groupedTests[profileId] = [];
      groupedTests[profileId].push(test);
    });
    
    // Build invoice data
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
    
    // Generate pages
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
    
    // Check if Web Share API is available
    if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName)] })) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      await navigator.share({
        title: `Medical Report & Invoice - ${visitData.patient?.name}`,
        text: `HEALit Complete Report (Invoice + Tests) for ${visitData.patient?.name}`,
        files: [file]
      });
      
      return { success: true, message: 'Combined PDF shared successfully!' };
    } else {
      // Fallback: Download PDF and open WhatsApp
      const message = `HEALit Complete Report (Invoice + Tests) for ${visitData.patient?.name}`;
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      const shareUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
      
      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Open WhatsApp
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
    
    // Generate combined PDF (same as WhatsApp)
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
    
    // Check if Web Share API is available
    if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName)] })) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      await navigator.share({
        title: `Medical Report & Invoice - ${visitData.patient?.name}`,
        text: `HEALit Complete Report (Invoice + Tests) for ${visitData.patient?.name}`,
        files: [file]
      });
      
      return { success: true, message: 'Combined PDF shared successfully!' };
    } else {
      // Fallback: Download PDF and open mailto
      const subject = `Medical Report & Invoice - ${visitData.patient?.name}`;
      const body = `Dear ${visitData.patient?.name},

Your complete medical report (including invoice and test results) from HEALit Med Laboratories is ready.

Best regards,
HEALit Med Laboratories`;
      
      const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl);
      
      // Download PDF
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
  shareCombinedPDFViaWhatsApp,
  shareCombinedPDFViaEmail
};
