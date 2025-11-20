import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Format date/time for display - matches format: "20 Nov 2025, 10:23 am"
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
 * Generate Lab Report PDF for HEALit Med Laboratories
 * Professional medical format with test results
 * Features: Colorful table, bold abnormal values, smart pagination, no subtotal
 */
export const generateLabReportPDF = (reportData) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
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
    `Collected: ${times.collected ? formatDateTime(times.collected) : '-'}`,
    `Received: ${times.received ? formatDateTime(times.received) : '-'}`
  ];

  const rightDetails = [
    `Age/Gender: ${patient.age || '-'}Y / ${patient.gender || '-'}`,
    `Visit ID: ${patient.visitId || '-'}`,
    `Profile: ${patient.testProfile || '-'}`,
    `Reported: ${times.reported ? formatDateTime(times.reported) : formatDateTime(new Date())}`
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
  // Flatten all tests for single table display
  const allTests = testGroups.flatMap(group => group.tests || []);
  
  // Prepare table data with proper formatting
  const tableData = allTests.map(test => {
    const value = test.value !== undefined && test.value !== '' ? String(test.value) : '-';
    const status = getTestStatus(test);
    const bioRef = test.bioReference || test.referenceRange || test.ref || test.refText_snapshot || '-';
    
    // Determine if value should be bold (abnormal)
    const isBold = status !== 'NORMAL' && value !== '-';
    
    return [
      { content: test.name || '-', styles: { fontStyle: 'bold' } },
      { 
        content: value, 
        styles: { 
          textColor: getStatusColor(status), 
          fontStyle: isBold ? 'bold' : 'normal',
          fontSize: isBold ? 11 : 10
        } 
      },
      test.unit || test.unit_snapshot || '-',
      { content: bioRef, styles: { fontSize: 8.5 } }
    ];
  });

  // Smart pagination: Calculate if table fits on current page
  const estimatedTableHeight = (allTests.length + 1) * 8; // Rough estimate
  const footerHeight = 25;
  const availableSpace = pageHeight - yPos - footerHeight;
  
  // Check if we need pagination
  if (estimatedTableHeight > availableSpace && allTests.length > 15) {
    // Split into multiple pages
    const testsPerPage = Math.floor(availableSpace / 8) - 1;
    let currentPage = 0;
    
    while (currentPage * testsPerPage < allTests.length) {
      if (currentPage > 0) {
        doc.addPage();
        yPos = 15;
      }
      
      const startIdx = currentPage * testsPerPage;
      const endIdx = Math.min(startIdx + testsPerPage, allTests.length);
      const pageTests = tableData.slice(startIdx, endIdx);
      
      doc.autoTable({
        startY: yPos,
        head: [['Test', 'Result', 'Unit', 'Bio. Ref. Internal']],
        body: pageTests,
        theme: 'striped',
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
          cellPadding: 5,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [240, 248, 255] // Light blue for alternating rows
        },
        columnStyles: {
          0: { cellWidth: 65, halign: 'left', fontStyle: 'bold' },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 50, halign: 'left', fontSize: 8.5 }
        },
        margin: { left: 15, right: 15 },
        didParseCell: function(data) {
          // Add subtle borders
          if (data.section === 'body') {
            data.cell.styles.lineColor = [220, 220, 220];
            data.cell.styles.lineWidth = 0.1;
          }
        }
      });
      
      currentPage++;
    }
    
    yPos = doc.lastAutoTable.finalY + 5;
  } else {
    // Single page table - all tests fit
    doc.autoTable({
      startY: yPos,
      head: [['Test', 'Result', 'Unit', 'Bio. Ref. Internal']],
      body: tableData,
      theme: 'striped',
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
        cellPadding: 5,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [240, 248, 255] // Light blue for alternating rows
      },
      columnStyles: {
        0: { cellWidth: 65, halign: 'left', fontStyle: 'bold' },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 50, halign: 'left', fontSize: 8.5 }
      },
      margin: { left: 15, right: 15 },
      didParseCell: function(data) {
        // Add subtle borders
        if (data.section === 'body') {
          data.cell.styles.lineColor = [220, 220, 220];
          data.cell.styles.lineWidth = 0.1;
        }
      }
    });

    yPos = doc.lastAutoTable.finalY + 5;
  }

  // End of report marker
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(107, 114, 128);
  doc.text('*End of Report*', pageWidth / 2, yPos + 5, { align: 'center' });

  // ========== FOOTER (on last page only) ==========
  const currentPageCount = doc.internal.getNumberOfPages();
  doc.setPage(currentPageCount); // Go to last page
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
