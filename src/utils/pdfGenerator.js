import jsPDF from 'jspdf';
import 'jspdf-autotable';

// HEALit Brand Colors
const COLORS = {
  primary: '#1E3A8A',      // HEALit Blue
  accent: '#2563EB',       // Bright Blue
  border: '#E5E7EB',       // Light Gray
  text: '#111827',         // Dark Black
  high: '#EF4444',         // Red for HIGH
  low: '#3B82F6',          // Blue for LOW
  normal: '#111827',       // Black for NORMAL
  headerBg: '#2563EB',     // Table header background
  rowAlt: '#F9FAFB',       // Alternating row color
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
  // HEADER SECTION WITH LOGOS - FIXED POSITIONING
  // ========================================
  
  // Header border top
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Add logos - BIGGER SIZE, NO OVERLAP
  const logoHeight = 28;
  const logoWidth = logoHeight * 1.6;
  const logoY = yPos;
  
  // Left Logo - HEALit (TOP LEFT)
  try {
    const healitLogo = '/images/@heal original editable file (png).png';
    doc.addImage(healitLogo, 'PNG', margin, logoY, logoWidth, logoHeight);
  } catch (error) {
    console.log('HEALit logo not loaded');
  }
  
  // Right Logo - Partner (TOP RIGHT)
  try {
    const partnerLogo = '/images/download.jpeg.jpg';
    doc.addImage(partnerLogo, 'JPEG', pageWidth - margin - logoWidth, logoY, logoWidth, logoHeight);
  } catch (error) {
    console.log('Partner logo not loaded');
  }

  // Center Title - NO OVERLAP, positioned between logos
  const centerY = logoY + logoHeight / 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(COLORS.primary);
  doc.text('HEALit Med Laboratories', pageWidth / 2, centerY, { align: 'center' });
  
  yPos += logoHeight + 2;

  // Subtitle - Address & Contact
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(COLORS.text);
  doc.text('Kunnathpeedika – Thrissur, Kerala', pageWidth / 2, yPos, { align: 'center' });
  yPos += 4; // Reduced from 5
  
  doc.setFontSize(10);
  doc.setTextColor('#6B7280');
  doc.text('Phone: 7356865161 | Email: healitlab@gmail.com', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5; // Reduced from 6

  // Bottom border
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8; // Reduced from 10

  // ========================================
  // PATIENT DETAILS BLOCK
  // ========================================
  
  const blockHeight = 45;
  const blockWidth = pageWidth - 2 * margin;
  const midPoint = pageWidth / 2;

  // Background box
  doc.setFillColor('#F9FAFB');
  doc.rect(margin, yPos, blockWidth, blockHeight, 'F');
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, blockWidth, blockHeight);

  // Vertical divider
  doc.line(midPoint, yPos, midPoint, yPos + blockHeight);

  const leftX = margin + 6;
  const rightX = midPoint + 6;
  let leftY = yPos + 8;
  let rightY = yPos + 8;
  const lineHeight = 6;

  // LEFT COLUMN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);

  const addLeftRow = (label, value) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, leftX, leftY);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value || '—'), leftX + 30, leftY);
    leftY += lineHeight;
  };

  addLeftRow('Patient Name:', visitData.patient.name);
  addLeftRow('Age / Gender:', `${visitData.patient.age} yrs / ${visitData.patient.gender}`);
  addLeftRow('Phone:', visitData.patient.phone);
  addLeftRow('Address:', visitData.patient.address || 'Not provided');
  addLeftRow('Referred By:', visitData.patient.referredBy || '—');

  // RIGHT COLUMN
  const addRightRow = (label, value) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, rightX, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value || '—'), rightX + 40, rightY);
    rightY += lineHeight;
  };

  addRightRow('Test Profile:', visitData.profile.name);
  addRightRow('Collected On:', visitData.collectedAt ? formatDateTime(visitData.collectedAt) : '—');
  addRightRow('Received On:', visitData.receivedAt ? formatDateTime(visitData.receivedAt) : '—');
  addRightRow('Reported On:', visitData.reportedAt ? formatDateTime(visitData.reportedAt) : '—');

  yPos += blockHeight + 12;

  // ========================================
  // GROUP TESTS BY CATEGORY (if available)
  // ========================================
  
  const groupedTests = groupTestsByCategory(visitData.tests);
  
  Object.keys(groupedTests).forEach((category) => {
    const tests = groupedTests[category];
    
    // Category Header (if multiple categories)
    if (Object.keys(groupedTests).length > 1 && category !== 'General') {
      doc.setFillColor(COLORS.headerBg);
      doc.roundedRect(margin, yPos, blockWidth, 8, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor('#FFFFFF');
      doc.text(category.toUpperCase(), pageWidth / 2, yPos + 5.5, { align: 'center' });
      yPos += 12;
    }

    // ========================================
    // TEST RESULTS TABLE
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
      
      return [
        testName,
        { content: testValue, styles: { textColor: resultColor } },
        testUnit,
        reference
      ];
    });

    doc.autoTable({
      startY: yPos,
      head: [['Test Description', 'Result', 'Unit', 'Bio. Ref. Internal']],
      body: tableData,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 4,
        textColor: COLORS.text,
        lineColor: COLORS.border,
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: '#FFFFFF',
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 70, halign: 'left' },
        1: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 'auto', halign: 'center' }
      },
      alternateRowStyles: {
        fillColor: COLORS.rowAlt
      },
      margin: { left: margin, right: margin }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  });

  // ========================================
  // FOOTER - SIGNATURE SECTION
  // ========================================
  
  yPos = pageHeight - 45; // More space for signature images
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  
  // LEFT SIGNATURE - Lab Technician with IMAGE
  const leftSigX = margin + 10;
  doc.text('Lab Technician:', leftSigX, yPos);
  
  // Add technician signature image if available
  try {
    const technicianSignature = '/images/signatures/rakhi-signature.png'; // Lab Technician signature PNG
    doc.addImage(technicianSignature, 'PNG', leftSigX, yPos + 2, 35, 15);
  } catch (error) {
    // Fallback to JPG if PNG not found
    try {
      const technicianSignature = '/images/RakiSign.jpg';
      doc.addImage(technicianSignature, 'JPEG', leftSigX, yPos + 2, 35, 15);
    } catch (err) {
      doc.line(leftSigX, yPos + 8, leftSigX + 45, yPos + 8);
    }
  }
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Name: ' + (visitData.signingTechnician?.fullName || 'Rakhi T.R'), leftSigX, yPos + 20);
  doc.text('Qualification: DMLT', leftSigX, yPos + 24);
  
  // RIGHT SIGNATURE - Lab In-Charge with IMAGE
  const rightSigX = pageWidth - margin - 60;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Authorized Signatory:', rightSigX, yPos);
  
  // Add lab in-charge signature image
  try {
    const inchargeSignature = '/images/signatures/aparna-signature.png'; // Lab In-Charge signature PNG
    doc.addImage(inchargeSignature, 'PNG', rightSigX, yPos + 2, 35, 15);
  } catch (error) {
    // Fallback to JPG if PNG not found
    try {
      const inchargeSignature = '/images/signatures/aparna-signature.jpg';
      doc.addImage(inchargeSignature, 'JPEG', rightSigX, yPos + 2, 35, 15);
    } catch (err) {
      doc.line(rightSigX, yPos + 8, rightSigX + 50, yPos + 8);
    }
  }
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Name: Aparna A.T', rightSigX, yPos + 20);
  doc.text('Lab In-Charge', rightSigX, yPos + 24);

  return doc;
};

/**
 * Format reference range from snapshot
 */
/**
 * Format reference range from snapshot - WITH FALLBACK TO bioReference
 */
const formatReference = (test) => {
  const parts = [];
  
  // Try structured refLow/refHigh first
  if (test.inputType_snapshot === 'number' && test.refLow_snapshot && test.refHigh_snapshot) {
    parts.push(`${test.refLow_snapshot} – ${test.refHigh_snapshot}`);
  }
  // Fallback to bioReference string (from seed data)
  else if (test.bioReference || test.refText_snapshot) {
    const refText = test.bioReference || test.refText_snapshot;
    // Clean up text: remove labels like "Adult:", "Normal:", etc.
    const cleaned = refText.replace(/^(Adult|Normal|Pre-diabetic|Diabetic|Desirable|Borderline|Optimal|High|Low):\s*/gi, '').trim();
    parts.push(cleaned);
  }
  
  return parts.length > 0 ? parts.join('\n') : '—';
};

/**
 * Get result color based on HIGH/LOW/NORMAL status
 */
const getResultColor = (test) => {
  if (!test.value || test.inputType_snapshot !== 'number') {
    return COLORS.normal;
  }
  
  const numValue = parseFloat(test.value);
  if (isNaN(numValue)) return COLORS.normal;
  
  if (test.refHigh_snapshot && numValue > parseFloat(test.refHigh_snapshot)) {
    return COLORS.high; // RED for HIGH
  }
  
  if (test.refLow_snapshot && numValue < parseFloat(test.refLow_snapshot)) {
    return COLORS.low; // BLUE for LOW
  }
  
  return COLORS.normal; // BLACK for NORMAL
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
 * Format date/time for display
 */
const formatDateTime = (isoString) => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
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
