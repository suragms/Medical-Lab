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
  let yPos = 10; // Reduced from 12

  const {
    patient = {},
    invoice = {},
    items = [],
    discount = 0,
    subtotal = 0,
    finalTotal = 0,
    amountPaid = 0
  } = invoiceData;

  // ========== SUPER COMPACT HEADER ==========
  // Header border top
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 2;
  
  // Smaller logos
  const logoHeight = 16; // Reduced from 18
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

  yPos += logoHeight + 2; // Reduced spacing

  // Sub-title - Smaller
  doc.setFontSize(8); // Reduced from 9
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Kunnathpeedika – Thrissur, Kerala', pageWidth / 2, yPos, { align: 'center' });

  yPos += 3; // Reduced from 3

  // Contact - Smaller
  doc.setFontSize(7); // Reduced from 8
  doc.text('Phone: 7356865161 | Email: healitlab@gmail.com', pageWidth / 2, yPos, { align: 'center' });

  yPos += 3; // Reduced from 4

  // Line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);

  yPos += 5; // Reduced from 6

  // ========== INVOICE TITLE - SMALLER ==========
  doc.setFontSize(13); // Reduced from 14
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('LAB INVOICE / BILL', pageWidth / 2, yPos, { align: 'center' });

  yPos += 6; // Reduced from 8

  // ========== PATIENT & INVOICE DETAILS - COMPACT ==========
  const leftCol = 15;
  const rightCol = 115;

  doc.setFontSize(7.5); // Reduced from 8.5
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('PATIENT DETAILS', leftCol, yPos);
  doc.text('INVOICE DETAILS', rightCol, yPos);

  yPos += 4; // Reduced from 5

  // Left: Patient details - Smaller font
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7); // Reduced from 8
  
  const patientLines = [
    `Patient: ${patient.name || '-'}`,
    `Ph: ${patient.phone || '-'}`,
    `Age/Gender: ${patient.age || '-'}Y / ${patient.gender || '-'}`,
    `Visit ID: ${patient.visitId || '-'}`,
    `Date: ${patient.date ? formatDate(patient.date) : '-'}`
  ];

  patientLines.forEach(line => {
    doc.text(line, leftCol, yPos);
    yPos += 3.5; // Reduced from 4
  });
  
  // Address - Handle multiline - Compact
  const address = patient.address || 'Not provided';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Address:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  
  const addressLines = doc.splitTextToSize(address, 85);
  addressLines.forEach((line, idx) => {
    doc.text(line, leftCol + 16, yPos + (idx * 3)); // Reduced spacing
  });
  yPos += 3 + (addressLines.length - 1) * 3;
  
  yPos += 3.5; // Reduced from 4
  doc.text(`Payment: ${patient.paymentStatus || 'Unpaid'}`, leftCol, yPos);
  yPos += 3.5; // Reduced from 4

  // Right: Invoice details - Smaller
  yPos -= 22; // Adjusted positioning
  
  // Add test times if available (from visit data)
  const times = invoiceData.times || {};
  
  const invoiceLines = [
    `Invoice: ${invoice.invoiceNumber || 'INV-' + Date.now()}`,
    `Generated: ${invoice.generatedOn ? formatDateTime(invoice.generatedOn) : formatDateTime(new Date())}`,
    `Staff: ${invoice.staffName || '-'}`,
    `Method: ${invoice.method || 'Cash'}`
  ];
  
  // Always add time fields (show "—" if not available)
  invoiceLines.push(`Collected: ${times.collected ? formatDateTime(times.collected) : '—'}`);
  invoiceLines.push(`Received: ${times.received ? formatDateTime(times.received) : '—'}`);
  invoiceLines.push(`Reported: ${times.reported ? formatDateTime(times.reported) : '—'}`);

  invoiceLines.forEach(line => {
    doc.text(line, rightCol, yPos);
    yPos += 3.5; // Reduced from 4
  });

  yPos += 6; // Reduced from 8

  // ========== ITEMS TABLE - PROFILE ONLY (NO INDIVIDUAL TEST PRICES) ==========
  const tableData = items.map((item, index) => {
    // Show only profile-level pricing, no individual test prices
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
      valign: 'middle',
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
      0: { cellWidth: 15, halign: 'center', valign: 'middle', fontStyle: 'bold' },
      1: { cellWidth: 125, halign: 'left', valign: 'middle', fontStyle: 'bold' },
      2: { cellWidth: 40, halign: 'right', valign: 'middle', fontStyle: 'bold' }
    },
    margin: { left: 15, right: 15 },
    didDrawPage: (data) => {
      // Add border to table
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.5);
    }
  });

  // ========== SUMMARY SECTION - COMPACT ==========
  yPos = doc.lastAutoTable.finalY + 5; // Reduced from 6
  
  // Calculate totals correctly - Profile-level pricing only
  const calculatedSubtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    return sum + price; // No quantity multiplication for profiles
  }, 0);
  const actualDiscount = parseFloat(discount) || 0;
  const calculatedTotal = calculatedSubtotal - actualDiscount;
  const actualPaid = parseFloat(amountPaid) || calculatedTotal;
  const balance = calculatedTotal - actualPaid;
  
  // Create summary box on right side - Compact Layout
  const summaryX = pageWidth - 90; // Smaller width
  const summaryWidth = 75; // Reduced from 80
  
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.7); // Thinner border
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryX, yPos, summaryWidth, 34, 2, 2, 'FD'); // Smaller height
  
  // Summary content - Smaller fonts
  let summaryY = yPos + 6; // Reduced padding
  const labelX = summaryX + 4; // Reduced padding
  const valueX = pageWidth - 16;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5); // Reduced from 8.5
  doc.setTextColor(100, 116, 139);
  
  // Subtotal
  doc.text('Subtotal:', labelX, summaryY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Rs. ' + calculatedSubtotal.toFixed(2), valueX, summaryY, { align: 'right' });
  summaryY += 5.5; // Reduced spacing
  
  // Discount
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
  
  // Tax/GST
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Tax/GST:', labelX, summaryY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Rs. 0.00', valueX, summaryY, { align: 'right' });
  summaryY += 5.5;
  
  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(labelX, summaryY - 2, valueX, summaryY - 2);
  summaryY += 2;
  
  // Amount Paid
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Paid:', labelX, summaryY);
  doc.setTextColor(22, 163, 74);
  doc.setFont('helvetica', 'bold');
  doc.text('Rs. ' + actualPaid.toFixed(2), valueX, summaryY, { align: 'right' });
  summaryY += 5.5;
  
  // Balance Due
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

  // ========== COMPACT FOOTER WITH SIGNATURES ==========
  const footerY = 245; // Moved up from 250
  
  // Thank you note - Smaller
  doc.setFontSize(7); // Reduced from 8
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(75, 85, 99);
  doc.text('Thank you for choosing HEALit Med Laboratories. Get well soon!', 15, footerY);
  
  yPos = footerY + 5; // Reduced spacing
  
  // LEFT SIGNATURE - Authorized By (Rakhi)
  const leftSigX = 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text('Authorized By:', leftSigX, yPos);
  
  // Add signature image
  try {
    const signatureBase64 = await imageToBase64(SIGNATURE_PATHS.rakhi);
    doc.addImage(signatureBase64, 'PNG', leftSigX, yPos + 1, 25, 10, undefined, 'FAST');
  } catch (error) {
    console.error('Signature failed:', error);
    doc.line(leftSigX, yPos + 6, leftSigX + 25, yPos + 6);
  }
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Rakhi T.R', leftSigX, yPos + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('DMLT', leftSigX, yPos + 16);
  
  // RIGHT SIGNATURE - In-charge (Aparna)
  const rightSigX = pageWidth - 60;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text('In-charge:', rightSigX, yPos);
  
  // Add signature image
  try {
    const authSignatureBase64 = await imageToBase64(SIGNATURE_PATHS.aparna);
    doc.addImage(authSignatureBase64, 'PNG', rightSigX, yPos + 1, 25, 10, undefined, 'FAST');
  } catch (error) {
    console.error('Auth signature failed:', error);
    doc.line(rightSigX, yPos + 6, rightSigX + 25, yPos + 6);
  }
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Aparna A.T', rightSigX, yPos + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Incharge', rightSigX, yPos + 16);

  return doc;
};

/**
 * Download invoice PDF
 */
export const downloadInvoice = async (invoiceData, fileName) => {
  console.log('⬇️ downloadInvoice called with fileName:', fileName);
  
  try {
    console.log('1️⃣ Generating invoice PDF...');
    const doc = await generateInvoicePDF(invoiceData);
    
    console.log('2️⃣ Saving PDF...');
    const name = fileName || `Bill-${invoiceData.patient?.visitId || Date.now()}.pdf`;
    doc.save(name);
    
    console.log('✅ Invoice downloaded successfully:', name);
  } catch (error) {
    console.error('❌ CRITICAL: downloadInvoice failed:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

/**
 * Print invoice PDF
 */
export const printInvoice = async (invoiceData) => {
  console.log('🖨️ printInvoice called with data:', invoiceData);
  
  try {
    console.log('1️⃣ Generating invoice PDF...');
    const doc = await generateInvoicePDF(invoiceData);
    
    console.log('2️⃣ Converting to blob...');
    const blob = doc.output('blob');
    console.log('Blob size:', blob.size, 'bytes');
    
    console.log('3️⃣ Creating object URL...');
    const url = URL.createObjectURL(blob);
    console.log('Blob URL:', url);
    
    console.log('4️⃣ Opening PDF in new window for printing...');
    // UPDATED: Use window.open instead of iframe for better compatibility  
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        console.log('✅ Print window loaded! Triggering print...');
        setTimeout(() => {
          printWindow.print();
          console.log('✅ Print dialog opened successfully!');
        }, 250); // Small delay to ensure PDF is fully loaded
      };
    } else {
      console.error('❌ Print window blocked by popup blocker');
      // Fallback to iframe if popup blocked
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = url;
      
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        console.log('✅ Iframe loaded! Opening print dialog...');
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          console.log('✅ Print dialog opened successfully!');
          
          // Clean up after print
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
            console.log('🧹 Cleaned up iframe and blob URL');
          }, 1000);
        } catch (printError) {
          console.error('❌ Print dialog error:', printError);
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
          throw new Error('Failed to open print dialog: ' + printError.message);
        }
      };
      
      iframe.onerror = (error) => {
        console.error('❌ Iframe load error:', error);
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
        throw new Error('Failed to load PDF for printing');
      };
      
      // Timeout fallback
      setTimeout(() => {
        if (iframe.parentNode) {
          console.warn('⚠️ Print timeout - cleaning up...');
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }
      }, 10000); // 10 second timeout
    }
    
  } catch (error) {
    console.error('❌ CRITICAL: printInvoice failed:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

/**
 * Get invoice PDF as blob for sharing
 */
export const getInvoiceBlob = async (invoiceData) => {
  const doc = await generateInvoicePDF(invoiceData);
  return doc.output('blob');
};
