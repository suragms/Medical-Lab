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
  // HEADER SECTION - CENTER ALIGNED
  // ========================================
  
  // Header border top
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Add logos at top
  const logoHeight = 22;
  const logoWidth = logoHeight * 1.6;
  const logoY = yPos;
  
  // Left Logo - HEALit
  try {
    const healitLogo = '/images/@heal original editable file (png).png';
    doc.addImage(healitLogo, 'PNG', margin, logoY, logoWidth, logoHeight);
  } catch (error) {
    console.log('HEALit logo not loaded');
  }
  
  // Right Logo - Partner
  try {
    const partnerLogo = '/images/download.jpeg.jpg';
    doc.addImage(partnerLogo, 'JPEG', pageWidth - margin - logoWidth, logoY, logoWidth, logoHeight);
  } catch (error) {
    console.log('Partner logo not loaded');
  }

  yPos += logoHeight + 5;

  // Center Header - Lab Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(COLORS.primary);
  doc.text('HEALit Med Laboratories', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  
  // Center Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.text('Kunnathpeedika – Thrissur, Kerala', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  
  doc.setFontSize(9);
  doc.setTextColor('#6B7280');
  doc.text('Phone: 7356865161 | Email: healitlab@gmail.com', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  // Bottom border
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

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
  
  // Address - multiline if needed
  const address = visitData.patient.address || 'Not provided';
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', leftX, leftY);
  doc.setFont('helvetica', 'normal');
  
  // Handle long addresses with text wrapping
  const addressLines = doc.splitTextToSize(address, 80);
  addressLines.forEach((line, idx) => {
    doc.text(line, leftX + 30, leftY + (idx * 5));
  });
  leftY += lineHeight + (addressLines.length - 1) * 5;
  
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
        fontSize: 10,
        halign: 'center',
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 70, halign: 'left', fontStyle: 'bold' },
        1: { cellWidth: 35, halign: 'center', fontStyle: 'bold', fontSize: 11 },
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

  // Add some spacing before billing section
  yPos += 5;

  // ========================================
  // BILLING SUMMARY SECTION
  // ========================================
  
  // Calculate billing totals
  const subtotal = visitData.tests.reduce((sum, test) => {
    return sum + (test.price_snapshot || test.price || 0);
  }, 0);
  
  const discount = visitData.discount || 0;
  const discountAmount = (subtotal * discount) / 100;
  const totalAmount = subtotal - discountAmount;
  
  // Check if there's enough space, otherwise add new page
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }
  
  // Billing Summary Box - Professional Layout
  const billingSectionY = yPos;
  const billingBoxWidth = 90;
  const billingBoxX = pageWidth - margin - billingBoxWidth;
  const billingBoxHeight = discount > 0 ? 38 : 30;
  
  // Draw billing box with border and shadow effect
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.8);
  doc.setFillColor('#F8FAFC');
  doc.roundedRect(billingBoxX, billingSectionY, billingBoxWidth, billingBoxHeight, 3, 3, 'FD');
  
  let billingY = billingSectionY + 8;
  const labelX = billingBoxX + 6;
  const valueX = billingBoxX + billingBoxWidth - 6;
  
  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#64748B');
  doc.text('Subtotal:', labelX, billingY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text);
  doc.text(`₹ ${subtotal.toFixed(2)}`, valueX, billingY, { align: 'right' });
  billingY += 7;
  
  // Discount (only if > 0)
  if (discount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#64748B');
    doc.text(`Discount (${discount}%):`, labelX, billingY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#EF4444'); // Red for discount
    doc.text(`- ₹ ${discountAmount.toFixed(2)}`, valueX, billingY, { align: 'right' });
    billingY += 7;
  }
  
  // Divider line
  doc.setDrawColor('#CBD5E1');
  doc.setLineWidth(0.5);
  doc.line(labelX, billingY, valueX, billingY);
  billingY += 6;
  
  // Total Amount - Highlighted
  doc.setFillColor('#EFF6FF');
  doc.roundedRect(billingBoxX + 3, billingY - 5, billingBoxWidth - 6, 10, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLORS.primary);
  doc.text('Total Amount:', labelX, billingY);
  doc.setFontSize(14);
  doc.text(`₹ ${totalAmount.toFixed(2)}`, valueX, billingY, { align: 'right' });
  billingY += 8;
  
  // Payment Status Badge
  if (visitData.paymentStatus === 'paid') {
    doc.setFillColor('#D1FAE5'); // Light green
    doc.setDrawColor('#059669');
    doc.setLineWidth(0.5);
    const badgeWidth = 35;
    const badgeHeight = 7;
    const badgeX = billingBoxX + (billingBoxWidth - badgeWidth) / 2;
    doc.roundedRect(badgeX, billingY - 4, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor('#065F46');
    doc.text('✓ PAID', billingBoxX + billingBoxWidth / 2, billingY, { align: 'center' });
  }
  
  // Update yPos to position after billing box
  yPos = billingSectionY + billingBoxHeight + 15;

  // ========================================
  // FOOTER - SIGNATURE SECTION (NO NAMES/QUALIFICATIONS)
  // ========================================
  
  // Ensure signatures are on the same page as billing
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = margin + 10;
  }
  
  yPos = pageHeight - 40;
  
  // Signature Section Border
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
  
  // LEFT SIGNATURE - Lab Technician
  const leftSigX = margin + 15;
  const sigHeight = 18;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  doc.text('Lab Technician', leftSigX, yPos);
  
  // Add technician signature image
  try {
    const technicianSignature = '/images/signatures/rakhi-signature.png';
    doc.addImage(technicianSignature, 'PNG', leftSigX, yPos + 2, 35, sigHeight);
  } catch (error) {
    try {
      const technicianSignature = '/images/RakiSign.jpg';
      doc.addImage(technicianSignature, 'JPEG', leftSigX, yPos + 2, 35, sigHeight);
    } catch (err) {
      doc.line(leftSigX, yPos + 10, leftSigX + 35, yPos + 10);
    }
  }
  
  // Technician Name and Qualification
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.text('Rakhi T.R', leftSigX, yPos + sigHeight + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor('#6B7280');
  doc.text('DMLT', leftSigX, yPos + sigHeight + 10);
  
  // RIGHT SIGNATURE - Authorized Signatory (In-charge)
  const rightSigX = pageWidth - margin - 50;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  doc.text('Authorized Signatory', rightSigX, yPos);
  
  // Add in-charge signature image
  try {
    const inchargeSignature = '/images/signatures/aparna-signature.png';
    doc.addImage(inchargeSignature, 'PNG', rightSigX, yPos + 2, 35, sigHeight);
  } catch (error) {
    try {
      const inchargeSignature = '/images/signatures/aparna-signature.jpg';
      doc.addImage(inchargeSignature, 'JPEG', rightSigX, yPos + 2, 35, sigHeight);
    } catch (err) {
      doc.line(rightSigX, yPos + 10, rightSigX + 35, yPos + 10);
    }
  }
  
  // In-charge Name and Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.text('Aparna A.T', rightSigX, yPos + sigHeight + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor('#6B7280');
  doc.text('Incharge', rightSigX, yPos + sigHeight + 10);

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
