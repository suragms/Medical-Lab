import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// PDF Generator - EXACT Thyrocare Format
export const generatePatientReport = (patient, profile, snapshot, labInfo) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 10;

  // ========== HEADER SECTION ==========
  // Left: Lab Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Reported At:', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('HEALit Med Laboratories', 15, yPos + 4);
  doc.text(labInfo?.address || 'Kunnathpeedika, Kerala', 15, yPos + 8);
  doc.text(`Phone: ${labInfo?.phone || '7356865161'}`, 15, yPos + 12);

  // Right: Thyrocare Logo placeholder
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 16, 46);
  doc.text('Thyrocare', pageWidth - 15, yPos + 6, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('India you can trust', pageWidth - 15, yPos + 10, { align: 'right' });

  yPos += 18;

  // Blue Header Bar
  doc.setFillColor(41, 128, 185);
  doc.rect(0, yPos, pageWidth, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`${patient.name} - ${profile.name}`, pageWidth / 2, yPos + 5, { align: 'center' });

  yPos += 12;

  // ========== PATIENT & LAB DETAILS SECTION ==========
  // Left: Patient Details
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  const leftCol = 15;
  const rightCol = 120;
  
  doc.text('PATIENT DETAILS', leftCol, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${patient.name}`, leftCol, yPos);
  doc.text(`Age/Gender: ${patient.age}Y / ${patient.gender}`, leftCol + 60, yPos);
  yPos += 4;
  doc.text(`Phone: ${patient.phone}`, leftCol, yPos);
  doc.text(`Ref. By: ${patient.referredBy || 'Self'}`, leftCol + 60, yPos);
  yPos += 4;
  doc.text(`Booking ID: ${patient.id}`, leftCol, yPos);

  // Right: Sample Details
  yPos -= 13;
  doc.setFont('helvetica', 'bold');
  doc.text('SAMPLE DETAILS', rightCol, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Collected: ${patient.collectedAt ? format(new Date(patient.collectedAt), 'dd-MMM-yyyy HH:mm') : 'N/A'}`, rightCol, yPos);
  yPos += 4;
  doc.text(`Received: ${patient.receivedAt ? format(new Date(patient.receivedAt), 'dd-MMM-yyyy HH:mm') : 'N/A'}`, rightCol, yPos);
  yPos += 4;
  doc.text(`Reported: ${patient.reportedAt ? format(new Date(patient.reportedAt), 'dd-MMM-yyyy HH:mm') : format(new Date(), 'dd-MMM-yyyy HH:mm')}`, rightCol, yPos);

  yPos += 8;

  // ========== TEST RESULTS TABLE ==========
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 2;

  // Group by category
  const categories = {};
  snapshot.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = [];
    }
    categories[test.category].push(test);
  });

  Object.keys(categories).forEach((category, idx) => {
    // Category Header
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos, pageWidth - 30, 6, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(category, 17, yPos + 4);
    doc.text('METHODOLOGY', 120, yPos + 4);
    doc.text('VALUE', 150, yPos + 4);
    doc.text('UNITS', 165, yPos + 4);
    doc.text('BIO. REF. INTERVAL', 178, yPos + 4);
    yPos += 8;

    // Tests
    categories[category].forEach(test => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      // Test name
      doc.setTextColor(0, 0, 0);
      doc.text(test.testName, 17, yPos);
      
      // Methodology
      doc.text('Automated', 120, yPos);
      
      // Value with color
      const status = test.validation?.status;
      if (status === 'HIGH') {
        doc.setTextColor(198, 40, 40);
        doc.setFont('helvetica', 'bold');
      } else if (status === 'LOW') {
        doc.setTextColor(25, 118, 210);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      }
      doc.text(String(test.value || '-'), 150, yPos);
      
      // Unit
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text(test.unit || '', 165, yPos);
      
      // Reference Range
      doc.text(test.referenceRange || '-', 178, yPos);
      
      yPos += 5;
    });

    yPos += 2;
  });

  // End of report line
  doc.setDrawColor(0, 0, 0);
  doc.line(15, yPos, pageWidth - 15, yPos);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('--- End of report ---', pageWidth / 2, yPos + 4, { align: 'center' });

  // ========== FOOTER SECTION ==========
  const footerY = pageHeight - 40;
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(15, footerY, pageWidth - 15, footerY);

  // Lab info
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text('COMPLETE CARE LABS LTD.', pageWidth / 2, footerY + 5, { align: 'center' });
  doc.text(`HEALit Med Laboratories - ${labInfo?.address || 'Kunnathpeedika, Kerala'}`, pageWidth / 2, footerY + 9, { align: 'center' });
  doc.text(`Phone: ${labInfo?.phone || '7356865161'} | Email: ${labInfo?.email || 'info@healitlab.com'}`, pageWidth / 2, footerY + 13, { align: 'center' });

  // Signature area
  yPos = footerY + 20;
  doc.setFontSize(8);
  doc.text(`Prepared by: ${patient.resultEnteredBy || 'Staff'}`, 15, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text('___________________', pageWidth - 50, yPos);
  doc.text('Authorized Signatory', pageWidth - 50, yPos + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Lab In-Charge: ${labInfo?.inCharge || 'Awsin'}`, 15, yPos + 4);
  doc.text(`Report Generated: ${format(new Date(), 'dd-MMM-yyyy HH:mm')}`, 15, yPos + 8);

  return doc;
};

// Helper function to get color for test status
const getColorForStatus = (status) => {
  if (status === 'HIGH') return [198, 40, 40]; // Red
  if (status === 'LOW') return [25, 118, 210]; // Blue
  return [0, 0, 0]; // Black (normal)
};

// Download PDF
export const downloadPDF = (doc, patientName) => {
  const fileName = `${patientName.replace(/\s+/g, '_')}_Report_${format(new Date(), 'ddMMMyyyy')}.pdf`;
  doc.save(fileName);
};

// Get PDF as blob for sharing
export const getPDFBlob = (doc) => {
  return doc.output('blob');
};

// Print PDF
export const printPDF = (doc) => {
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
