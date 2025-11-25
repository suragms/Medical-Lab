// PDF Generators for Result Report and Invoice
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Generate Result PDF (Medical Report)
export const generateResultPDF = (patient, labInfo = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('HEALit Med Laboratories', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(labInfo.address || 'Laboratory Address Line', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text(`Phone: ${labInfo.phone || 'Contact Number'} | Email: ${labInfo.email || 'lab@healit.com'}`, pageWidth / 2, yPos, { align: 'center' });
  
  // Line separator
  yPos += 8;
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;

  // Patient Details Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT DETAILS', 15, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Left Column
  const leftCol = 15;
  const rightCol = pageWidth / 2 + 10;
  
  doc.text(`Name: ${patient.name}`, leftCol, yPos);
  doc.text(`Age/Gender: ${patient.age} yrs / ${patient.gender}`, rightCol, yPos);
  yPos += 6;
  
  doc.text(`Phone: ${patient.phone}`, leftCol, yPos);
  doc.text(`Visit ID: ${patient.visitId}`, rightCol, yPos);
  yPos += 6;
  
  if (patient.referredBy) {
    doc.text(`Referred By: ${patient.referredBy}`, leftCol, yPos);
  }
  doc.text(`Profile: ${patient.profileName || 'N/A'}`, rightCol, yPos);
  yPos += 6;
  
  if (patient.collectedOn) {
    doc.text(`Collected On: ${new Date(patient.collectedOn).toLocaleString('en-IN')}`, leftCol, yPos);
  }
  yPos += 6;
  
  if (patient.receivedOn) {
    doc.text(`Received On: ${new Date(patient.receivedOn).toLocaleString('en-IN')}`, leftCol, yPos);
  }
  doc.text(`Reported On: ${patient.reportedOn ? new Date(patient.reportedOn).toLocaleString('en-IN') : 'Pending'}`, rightCol, yPos);
  
  yPos += 10;
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;

  // Test Results Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TEST RESULTS', 15, yPos);
  yPos += 5;

  // Group snapshots by category
  const groupedTests = {};
  (patient.snapshots || []).forEach(snap => {
    const cat = snap.category_snapshot || 'General';
    if (!groupedTests[cat]) groupedTests[cat] = [];
    groupedTests[cat].push(snap);
  });

  // Generate table for each category
  Object.keys(groupedTests).forEach(category => {
    const tests = groupedTests[category];
    
    // Category Header
    doc.setFillColor(59, 130, 246); // Blue
    doc.rect(15, yPos, pageWidth - 30, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(category, 17, yPos + 5);
    yPos += 10;
    
    doc.setTextColor(0, 0, 0);

    // Table rows
    const tableData = tests.map(snap => {
      const value = snap.value_entered || '-';
      const unit = snap.unit_snapshot || '';
      let refRange = snap.ref_snapshot || '';
      
      // Handle gender-specific ranges
      if (snap.genderSpecific && patient.gender) {
        if (patient.gender === 'Male' && snap.maleRange_snapshot) {
          refRange = snap.maleRange_snapshot.text || refRange;
        } else if (patient.gender === 'Female' && snap.femaleRange_snapshot) {
          refRange = snap.femaleRange_snapshot.text || refRange;
        }
      }
      
      return [
        snap.name_snapshot,
        value,
        unit,
        refRange
      ];
    });

    doc.autoTable({
      startY: yPos,
      head: [['Test Name', 'Result', 'Unit', 'Bio. Ref. Internal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        // Highlight abnormal values
        if (data.column.index === 1 && data.section === 'body') {
          const snap = tests[data.row.index];
          const value = parseFloat(snap.value_entered);
          
          if (!isNaN(value) && snap.refLow_snapshot !== null && snap.refHigh_snapshot !== null) {
            if (value < snap.refLow_snapshot) {
              data.cell.styles.textColor = [37, 99, 235]; // Blue for LOW
              data.cell.styles.fontStyle = 'bold';
            } else if (value > snap.refHigh_snapshot) {
              data.cell.styles.textColor = [220, 38, 38]; // Red for HIGH
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  });

  // Footer
  if (yPos > doc.internal.pageSize.height - 40) {
    doc.addPage();
    yPos = 20;
  }

  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('*** End of Report ***', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signature: _____________________', pageWidth - 70, yPos);
  doc.text('Lab In-Charge', pageWidth - 70, yPos + 5);

  return doc;
};

// Generate Invoice PDF (Billing)
export const generateInvoicePDF = (patient, profileStore, labInfo = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('HEALit Med Laboratories', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(12);
  doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(labInfo.address || 'Laboratory Address Line', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text(`Phone: ${labInfo.phone || 'Contact Number'} | Email: ${labInfo.email || 'lab@healit.com'}`, pageWidth / 2, yPos, { align: 'center' });
  
  // Line separator
  yPos += 8;
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;

  // Invoice Details
  doc.setFontSize(10);
  doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-IN')}`, 15, yPos);
  doc.text(`Visit ID: ${patient.visitId}`, pageWidth - 60, yPos);
  yPos += 6;
  
  doc.text(`Patient: ${patient.name}`, 15, yPos);
  doc.text(`Phone: ${patient.phone}`, pageWidth - 60, yPos);
  
  yPos += 10;
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;

  // Items Table
  const profile = profileStore.getProfileById(patient.profileId);
  let tableData = [];
  let subtotal = 0;

  if (profile && profile.packagePrice) {
    // Package pricing
    tableData = [[
      1,
      `${profile.name} (Package)`,
      `₹${profile.packagePrice.toFixed(2)}`,
      1,
      `₹${profile.packagePrice.toFixed(2)}`
    ]];
    subtotal = profile.packagePrice;
  } else {
    // Itemized pricing from snapshots
    tableData = (patient.snapshots || []).map((snap, index) => {
      const price = snap.price_snapshot || 0;
      subtotal += price;
      return [
        index + 1,
        snap.name_snapshot,
        `₹${price.toFixed(2)}`,
        1,
        `₹${price.toFixed(2)}`
      ];
    });
  }

  doc.autoTable({
    startY: yPos,
    head: [['Sl.No', 'Test/Package Name', 'Unit Price', 'Qty', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
    },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Summary
  const summaryX = pageWidth - 80;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryX, yPos);
  doc.text(`₹${subtotal.toFixed(2)}`, summaryX + 50, yPos, { align: 'right' });
  
  yPos += 6;
  const discount = 0; // Can be customized
  doc.text('Discount:', summaryX, yPos);
  doc.text(`₹${discount.toFixed(2)}`, summaryX + 50, yPos, { align: 'right' });
  
  yPos += 8;
  doc.line(summaryX, yPos, summaryX + 50, yPos);
  yPos += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const netTotal = subtotal - discount;
  doc.text('Net Total:', summaryX, yPos);
  doc.text(`₹${netTotal.toFixed(2)}`, summaryX + 50, yPos, { align: 'right' });
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Amount Paid:', summaryX, yPos);
  doc.text(`₹${netTotal.toFixed(2)}`, summaryX + 50, yPos, { align: 'right' });
  
  yPos += 6;
  doc.text('Balance:', summaryX, yPos);
  doc.text('₹0.00', summaryX + 50, yPos, { align: 'right' });
  
  yPos += 6;
  doc.text('Payment Method: Cash', summaryX, yPos);

  // Footer
  yPos = doc.internal.pageSize.height - 30;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for choosing HEALit Med Laboratories!', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signature: _____________________', pageWidth - 70, yPos);

  return doc;
};

// Helper to get PDF as blob
export const getPDFBlob = (doc) => {
  return doc.output('blob');
};

// Helper to download PDF
export const downloadPDF = (doc, filename) => {
  doc.save(filename);
};
