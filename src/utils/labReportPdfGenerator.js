import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Generate Lab Report PDF for HEALit Med Laboratories
 * Professional medical format with test results
 */
export const generateLabReportPDF = (reportData) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  const {
    patient = {},
    times = {},
    testGroups = []
  } = reportData;

  // ========== HEADER ==========
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('[HEALit]', 15, yPos);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('HEALit Med Laboratories', pageWidth / 2, yPos, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text('[Thyrocare]', pageWidth - 25, yPos, { align: 'right' });

  yPos += 6;

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

  // ========== PATIENT DETAILS ==========
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
    `Referred By: ${patient.referredBy || 'Self'}`,
    `Collected: ${times.collected ? format(new Date(times.collected), 'dd-MMM-yyyy HH:mm') : '-'}`,
    `Received: ${times.received ? format(new Date(times.received), 'dd-MMM-yyyy HH:mm') : '-'}`
  ];

  const rightDetails = [
    `Age/Gender: ${patient.age || '-'}Y / ${patient.gender || '-'}`,
    `Visit ID: ${patient.visitId || '-'}`,
    `Profile: ${patient.testProfile || '-'}`,
    `Reported: ${times.reported ? format(new Date(times.reported), 'dd-MMM-yyyy HH:mm') : format(new Date(), 'dd-MMM-yyyy HH:mm')}`
  ];

  leftDetails.forEach(line => {
    doc.text(line, leftCol, yPos);
    yPos += 5;
  });
  
  // Address - Handle multiline
  const address = patient.address || 'Not provided';
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  
  const addressLines = doc.splitTextToSize(address, 80);
  addressLines.forEach((line, idx) => {
    doc.text(line, leftCol + 18, yPos + (idx * 4));
  });
  yPos += 4 + (addressLines.length - 1) * 4;
  yPos += 5;

  yPos -= 25;
  rightDetails.forEach(line => {
    doc.text(line, rightCol, yPos);
    yPos += 5;
  });

  yPos += 10;

  // ========== TEST RESULTS ==========
  testGroups.forEach((group, groupIndex) => {
    if (groupIndex > 0) yPos += 8;

    // Group Title
    doc.setFillColor(30, 58, 138);
    doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(group.groupName || 'Tests', pageWidth / 2, yPos, { align: 'center' });

    yPos += 8;

    // Table data
    const tableData = (group.tests || []).map(test => {
      const value = test.value !== undefined ? String(test.value) : '-';
      const status = getTestStatus(test);
      
      return [
        test.name || '-',
        { content: value, styles: { textColor: getStatusColor(status), fontStyle: 'bold' } },
        test.unit || '-',
        test.referenceRange || test.ref || '-'
      ];
    });

    doc.autoTable({
      startY: yPos,
      head: [['Test', 'Result', 'Unit', 'Bio. Ref. Internal']],
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
        fontSize: 10,
        textColor: [0, 0, 0],
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 70, halign: 'left', fontStyle: 'bold' },
        1: { cellWidth: 30, halign: 'center', fontStyle: 'bold', fontSize: 11 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 50, halign: 'center' }
      },
      margin: { left: 15, right: 15 }
    });

    yPos = doc.lastAutoTable.finalY + 5;
  });

  // End of report
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(107, 114, 128);
  doc.text('*End of Report*', pageWidth / 2, yPos + 5, { align: 'center' });

  // ========== FOOTER ==========
  const footerY = 280;
  doc.setDrawColor(229, 231, 235);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  
  doc.text('Prepared by:', 15, footerY);
  doc.line(40, footerY + 1, 80, footerY + 1);

  doc.text('Lab In-Charge:', 15, footerY + 5);
  doc.line(45, footerY + 6, 80, footerY + 6);

  doc.text('Authorized Signature', pageWidth - 15, footerY + 3, { align: 'right' });
  doc.line(pageWidth - 55, footerY + 4, pageWidth - 15, footerY + 4);

  return doc;
};

/**
 * Determine test status based on value and reference
 */
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

/**
 * Get color based on status
 */
const getStatusColor = (status) => {
  if (status === 'HIGH') return [185, 28, 28]; // Red
  if (status === 'LOW') return [29, 78, 216]; // Blue
  return [0, 0, 0]; // Black
};

/**
 * Download lab report PDF
 */
export const downloadLabReport = (reportData, fileName) => {
  const doc = generateLabReportPDF(reportData);
  const name = fileName || `${reportData.patient?.visitId || 'Report'}-${reportData.patient?.name?.replace(/\s+/g, '_') || 'Patient'}.pdf`;
  doc.save(name);
};

/**
 * Print lab report PDF
 */
export const printLabReport = (reportData) => {
  const doc = generateLabReportPDF(reportData);
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
 * Get lab report PDF as blob for sharing
 */
export const getLabReportBlob = (reportData) => {
  const doc = generateLabReportPDF(reportData);
  return doc.output('blob');
};
