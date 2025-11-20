import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { LOGO_PATHS } from './assetPath';

// HEALit Brand Colors - Simplified for Professional Reports
const COLORS = {
  primary: '#0b64a0',      // HEALit Blue (--accent from HTML)
  accent: '#0b64a0',       // Same as primary
  border: '#e6e6e6',       // Light Gray border
  text: '#111',            // Dark Black text
  muted: '#666',           // Muted text
  high: '#EF4444',         // Red for HIGH
  low: '#3B82F6',          // Blue for LOW
  normal: '#111',          // Black for NORMAL
  headerBg: '#e6e6e6',     // Table header background (subtle)
  rowAlt: '#ffffff',       // No alternating (white)
  noteBg: '#F3F4F6'        // Light background
};

/**
 * Generate Medical Report PDF - HEALit Style
 * @param {Object} visitData - Visit with patient, profile, and test snapshots
 * @returns {jsPDF} PDF document
 */
export const generateReportPDF = (visitData) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  let yPos = margin;

  // ========================================
  // HEADER SECTION - WITH LOGOS
  // ========================================
  
  // Top border
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 3;
  
  // Add logos at top
  const logoHeight = 24;
  const logoY = yPos;
  
  // Left Logo - HEALit
  try {
    doc.addImage(LOGO_PATHS.healit, 'PNG', margin, logoY, logoHeight * 1.5, logoHeight);
  } catch (error) {
    console.log('HEALit logo not loaded');
  }
  
  // Center title - Lab Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text('HEALit Med Laboratories', pageWidth / 2, logoY + 12, { align: 'center' });
  
  // Right Logo - Thyrocare
  try {
    doc.addImage(LOGO_PATHS.partner, 'JPEG', pageWidth - margin - logoHeight * 1.5, logoY, logoHeight * 1.5, logoHeight);
  } catch (error) {
    console.log('Partner logo not loaded');
  }

  yPos += logoHeight + 3;
  
  // Lab Address & Contact (below logos)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor('#111'); // Black text
  doc.text('Kunnathpeedika – Thrissur, Kerala', pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  
  doc.setFontSize(9);
  doc.setTextColor('#666'); // Muted gray
  doc.text('Phone: 7356865161 | Email: healitlab@gmail.com', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;

  // Bottom border separator
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // ========================================
  // PATIENT & TEST DETAILS - TWO COLUMN LAYOUT
  // ========================================
  
  const leftX = margin;
  const rightX = 115; // Right column starts at 115mm
  let leftY = yPos;
  let rightY = yPos;
  const lineHeight = 6;

  doc.setFontSize(9);
  doc.setTextColor('#111'); // Black text

  const addLeftRow = (label, value) => {
    const combined = `${label} ${value || '—'}`;
    doc.setFont('helvetica', 'normal');
    doc.text(combined, leftX, leftY);
    leftY += lineHeight;
  };

  const addRightRow = (label, value) => {
    const combined = `${label} ${value || '—'}`;
    doc.setFont('helvetica', 'normal');
    doc.text(combined, rightX, rightY);
    rightY += lineHeight;
  };

  // LEFT COLUMN - Patient Details
  addLeftRow('Patient Name:', visitData.patient.name);
  addLeftRow('Age / Gender:', `${visitData.patient.age} yrs / ${visitData.patient.gender}`);
  addLeftRow('Phone:', visitData.patient.phone);
  
  // Address - multiline if needed
  const address = visitData.patient.address || 'Not provided';
  doc.setFont('helvetica', 'normal');
  doc.text('Address: ' + address, leftX, leftY);
  leftY += lineHeight;
  
  addLeftRow('Referred By:', visitData.patient.referredBy || 'Self');

  // RIGHT COLUMN - Test Details
  addRightRow('Test Profile:', visitData.profile.name);
  addRightRow('Collected On:', visitData.collectedAt ? formatDateTime(visitData.collectedAt) : '—');
  addRightRow('Received On:', visitData.receivedAt ? formatDateTime(visitData.receivedAt) : '—');
  addRightRow('Reported On:', visitData.reportedAt ? formatDateTime(visitData.reportedAt) : '—');

  yPos = Math.max(leftY, rightY) + 12;

  // ========================================
  // GROUP TESTS BY CATEGORY (if available)
  // ========================================
  
  const groupedTests = groupTestsByCategory(visitData.tests);
  
  Object.keys(groupedTests).forEach((category, categoryIndex) => {
    const tests = groupedTests[category];
    
    // ========================================
    // TEST RESULTS TABLE - COLORFUL STRIPED
    // ========================================
    
    // DEBUG: Log test data
    console.log('PDF Table - Category:', category);
    console.log('PDF Table - First Test Fields:', tests[0] ? Object.keys(tests[0]) : []);
    console.log('PDF Table - First Test Data:', tests[0]);
    
    const tableData = tests.map(test => {
      // Use fallback chain for all fields
      const testName = test.name_snapshot || test.name || test.testName || 'Test';
      const testValue = test.value || '—';
      const testUnit = test.unit_snapshot || test.unit || '';
      const reference = formatReference(test);
      const resultColor = getResultColor(test);
      const isAbnormal = isValueAbnormal(test);
      
      return [
        testName,
        { 
          content: testValue, 
          styles: { 
            textColor: resultColor,
            fontStyle: isAbnormal ? 'bold' : 'normal',
            fontSize: isAbnormal ? 11 : 10
          } 
        },
        testUnit,
        reference
      ];
    });

    // Smart pagination: Calculate if table fits on current page
    const estimatedTableHeight = (tests.length * 8) + 20; // Rough estimate
    const spaceLeft = pageHeight - yPos - 60; // Reserve space for footer
    
    // If not enough space and more than 3 rows, start new page
    if (spaceLeft < estimatedTableHeight && tests.length > 3 && categoryIndex > 0) {
      doc.addPage();
      yPos = margin + 10;
    }

    doc.autoTable({
      startY: yPos,
      head: [['Test Description', 'Result', 'Unit', 'Bio. Ref. Internal']],
      body: tableData,
      theme: 'striped',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 5,
        textColor: [17, 17, 17],
        lineColor: [30, 58, 138],
        lineWidth: 0.2,
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
        valign: 'middle',
        cellPadding: 6
      },
      columnStyles: {
        0: { cellWidth: 70, halign: 'left', fontStyle: 'bold' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 25, halign: 'center', textColor: [100, 100, 100] },
        3: { cellWidth: 'auto', halign: 'left', textColor: [100, 100, 100] }
      },
      alternateRowStyles: {
        fillColor: [240, 248, 255] // Light blue striped rows
      },
      margin: { left: margin, right: margin },
      pageBreak: 'avoid', // Try to keep table on one page
      rowPageBreak: 'avoid',
      tableWidth: 'auto',
      showHead: 'firstPage'
    });

    yPos = doc.lastAutoTable.finalY + 5;
  });

  // ========================================
  // FOOTER - SIGNATURE SECTION (DYNAMIC POSITIONING)
  // ========================================
  
  // Calculate if we need a new page for signatures
  const signatureHeight = 35;
  const footerNoteHeight = 15;
  const requiredSpace = signatureHeight + footerNoteHeight;
  
  if (yPos > pageHeight - requiredSpace - 10) {
    doc.addPage();
    yPos = margin + 10;
  } else {
    yPos += 10;
  }
  
  // Thank you note
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(75, 85, 99);
  doc.text('Thank you for choosing HEALit Med Laboratories. Get well soon!', margin, yPos);
  
  yPos += 8;
  
  // Position signatures
  const leftSigX = margin;
  const rightSigX = pageWidth - 70;
  
  // LEFT SIGNATURE - Lab Technician
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#111'); // COLORS.text
  doc.text('Billed By:', leftSigX, yPos);
  
  // Add technician signature image
  try {
    const technicianSignature = '/images/signatures/rakhi-signature.png';
    doc.addImage(technicianSignature, 'PNG', leftSigX, yPos + 2, 30, 12);
  } catch (error) {
    try {
      const technicianSignature = '/images/RakiSign.jpg';
      doc.addImage(technicianSignature, 'JPEG', leftSigX, yPos + 2, 30, 12);
    } catch (err) {
      doc.line(leftSigX, yPos + 8, leftSigX + 40, yPos + 8);
    }
  }
  
  // Name
  doc.setFontSize(8);
  doc.text('Rakhi T.R', leftSigX, yPos + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor('#666');
  doc.text('DMLT', leftSigX, yPos + 20);
  
  // RIGHT SIGNATURE - Authorized Signatory
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#111'); // COLORS.text
  doc.text('Authorized Signatory:', rightSigX, yPos);
  
  // Add authorized signature image
  try {
    const authSignature = '/images/signatures/aparna-signature.png';
    doc.addImage(authSignature, 'PNG', rightSigX, yPos + 2, 30, 12);
  } catch (error) {
    try {
      const authSignature = '/images/signatures/aparna-signature.jpg';
      doc.addImage(authSignature, 'JPEG', rightSigX, yPos + 2, 30, 12);
    } catch (err) {
      doc.line(rightSigX, yPos + 8, rightSigX + 45, yPos + 8);
    }
  }
  
  doc.setFontSize(8);
  doc.text('Aparna A.T', rightSigX, yPos + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor('#666');
  doc.text('Incharge', rightSigX, yPos + 20);
  
  yPos += 25;
  
  // ========================================
  // FOOTER NOTE - Source Reference
  // ========================================
  
  doc.setDrawColor(COLORS.border);
  doc.setLineDash([2, 2]);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  doc.setLineDash([]);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#666');
  const fileName = `HEALit_Report_${visitData.patient.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.text(`Source file: ${fileName}`, pageWidth / 2, yPos, { align: 'center' });

  return doc;
};

/**
 * Check if value is abnormal (outside reference range)
 */
const isValueAbnormal = (test) => {
  if (!test.value || test.inputType_snapshot !== 'number') {
    return false;
  }
  
  const numValue = parseFloat(test.value);
  if (isNaN(numValue)) return false;
  
  if (test.refHigh_snapshot && numValue > parseFloat(test.refHigh_snapshot)) {
    return true; // HIGH
  }
  
  if (test.refLow_snapshot && numValue < parseFloat(test.refLow_snapshot)) {
    return true; // LOW
  }
  
  return false; // NORMAL
};

/**
 * Format reference range from snapshot
 */
/**
 * Format reference range from snapshot - WITH FALLBACK TO bioReference
 */
const formatReference = (test) => {
  // Priority 1: Use bioReference field (from Profile Manager)
  if (test.bioReference_snapshot || test.bioReference) {
    const refText = test.bioReference_snapshot || test.bioReference;
    // Return as-is to preserve multi-line formatting
    return refText.trim();
  }
  
  // Priority 2: Try structured refLow/refHigh
  if (test.inputType_snapshot === 'number' && test.refLow_snapshot && test.refHigh_snapshot) {
    return `${test.refLow_snapshot} – ${test.refHigh_snapshot}`;
  }
  
  // Priority 3: Fallback to refText
  if (test.refText_snapshot) {
    return test.refText_snapshot.trim();
  }
  
  return '—';
};

/**
 * Get result color based on HIGH/LOW/NORMAL status
 * Returns RGB array for jsPDF compatibility
 */
const getResultColor = (test) => {
  if (!test.value || test.inputType_snapshot !== 'number') {
    return [17, 17, 17]; // Black for NORMAL
  }
  
  const numValue = parseFloat(test.value);
  if (isNaN(numValue)) return [17, 17, 17]; // Black
  
  if (test.refHigh_snapshot && numValue > parseFloat(test.refHigh_snapshot)) {
    return [239, 68, 68]; // RED for HIGH
  }
  
  if (test.refLow_snapshot && numValue < parseFloat(test.refLow_snapshot)) {
    return [59, 130, 246]; // BLUE for LOW
  }
  
  return [17, 17, 17]; // BLACK for NORMAL
};

/**
 * Group tests by category
 */
const groupTestsByCategory = (tests) => {
  const groups = {};
  
  tests.forEach(test => {
    const category = test.category_snapshot || 'General';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(test);
  });
  
  return groups;
};

/**
 * Format date/time for display - matches HTML: "19 Nov 2025, 10:35 pm"
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
 * Download PDF
 */
export const downloadReportPDF = (visitData) => {
  const doc = generateReportPDF(visitData);
  const fileName = `HEALit_Report_${visitData.patient.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
};

/**
 * Print PDF
 */
export const printReportPDF = (visitData) => {
  const doc = generateReportPDF(visitData);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};

/**
 * Get PDF as Base64 for sharing
 */
export const getReportPDFBase64 = (visitData) => {
  const doc = generateReportPDF(visitData);
  return doc.output('dataurlstring');
};

/**
 * Share via WhatsApp (mobile-friendly)
 */
export const shareViaWhatsApp = (visitData, phoneNumber) => {
  const message = `HEALit Medical Report for ${visitData.patient.name}\nReported On: ${formatDateTime(visitData.reportedAt)}\n\nDownload your report here:`;
  
  // In production, upload PDF to server and get shareable URL
  const shareUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
  window.open(shareUrl, '_blank');
};

/**
 * Share via Email
 */
export const shareViaEmail = (visitData, emailAddress) => {
  const subject = `Medical Report - ${visitData.patient.name}`;
  const body = `Dear ${visitData.patient.name},

Your medical test report from HEALit Med Laboratories is attached.

Reported On: ${formatDateTime(visitData.reportedAt)}

Best regards,
HEALit Med Laboratories`;
  
  const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl);
};

export default {
  generateReportPDF,
  downloadReportPDF,
  printReportPDF,
  getReportPDFBase64,
  shareViaWhatsApp,
  shareViaEmail
};
