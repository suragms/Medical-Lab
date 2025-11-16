import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// PDF Generator for HEALit Med Laboratories
export const generatePatientReport = (patient, profile, snapshot, labInfo) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 15;

  // ========== HEADER WITH LOGOS ==========
  
  // HEALit Logo (Left) - Load from images folder
  try {
    const healitLogo = '/images/@heal original editable file (png).png';
    doc.addImage(healitLogo, 'PNG', 15, yPos, 35, 15);
  } catch (e) {
    console.log('HEALit logo not loaded');
  }

  // Lab Name (Center)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 35, 126); // Navy blue
  doc.text('HEALit Med Laboratories', pageWidth / 2, yPos + 5, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(labInfo?.address || 'Kunnathpeedika, Kerala', pageWidth / 2, yPos + 10, { align: 'center' });
  doc.text(`Phone: ${labInfo?.phone || '7356865161'} | Email: ${labInfo?.email || 'info@healitlab.com'}`, pageWidth / 2, yPos + 14, { align: 'center' });

  // Thyrocare Logo (Right)
  try {
    const thyrocareLogo = '/images/download.jpeg.jpg';
    doc.addImage(thyrocareLogo, 'JPEG', pageWidth - 50, yPos, 35, 15);
  } catch (e) {
    console.log('Thyrocare logo not loaded');
  }

  yPos += 20;

  // Divider line
  doc.setDrawColor(198, 40, 40); // Red
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 8;

  // ========== PATIENT INFORMATION ==========
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('PATIENT DETAILS', 15, yPos);
  yPos += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const patientDetails = [
    [`Patient Name: ${patient.name}`, `Age/Gender: ${patient.age} years / ${patient.gender}`],
    [`Phone: ${patient.phone}`, `Visit ID: ${patient.id}`],
    [`Referred By: ${patient.referredBy || 'Self'}`, `Test Profile: ${profile.name}`]
  ];

  patientDetails.forEach(row => {
    doc.text(row[0], 15, yPos);
    doc.text(row[1], 110, yPos);
    yPos += 5;
  });

  yPos += 2;

  // ========== TIMESTAMPS ==========
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 35, 126);
  
  const timestamps = [
    ['Collected On:', patient.collectedAt ? format(new Date(patient.collectedAt), 'dd-MMM-yyyy hh:mm a') : '-'],
    ['Received On:', patient.receivedAt ? format(new Date(patient.receivedAt), 'dd-MMM-yyyy hh:mm a') : '-'],
    ['Reported On:', patient.reportedAt ? format(new Date(patient.reportedAt), 'dd-MMM-yyyy hh:mm a') : format(new Date(), 'dd-MMM-yyyy hh:mm a')]
  ];

  timestamps.forEach(([label, value]) => {
    doc.text(label, 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(value, 45, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    yPos += 5;
  });

  yPos += 3;

  // ========== TEST RESULTS TABLE ==========
  doc.setDrawColor(198, 40, 40);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(198, 40, 40);
  doc.text(profile.name.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Group tests by category
  const categories = {};
  snapshot.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = [];
    }
    categories[test.category].push(test);
  });

  // Render each category
  Object.keys(categories).forEach((category, idx) => {
    if (idx > 0) yPos += 5;

    // Category header
    doc.setFillColor(26, 35, 126);
    doc.rect(15, yPos - 5, pageWidth - 30, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(category, 17, yPos);
    yPos += 8;

    // Tests table
    const tableData = categories[category]
      .sort((a, b) => a.order - b.order)
      .map(test => {
        const value = test.value || '-';
        const status = test.validation?.status;
        
        return [
          test.testName,
          { content: value, styles: { fontStyle: 'bold', textColor: getColorForStatus(status) } },
          test.unit,
          test.referenceRange
        ];
      });

    doc.autoTable({
      startY: yPos,
      head: [['Test', 'Result', 'Unit', 'Reference Range']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 50, halign: 'center' }
      },
      margin: { left: 15, right: 15 },
      didDrawPage: function (data) {
        // Handle page overflow
        if (data.cursor.y > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
      }
    });

    yPos = doc.lastAutoTable.finalY + 5;
  });

  // ========== FOOTER ==========
  const footerY = pageHeight - 30;
  
  doc.setDrawColor(198, 40, 40);
  doc.setLineWidth(0.3);
  doc.line(15, footerY, pageWidth - 15, footerY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('** End of Report **', pageWidth / 2, footerY + 5, { align: 'center' });
  
  doc.setFontSize(7);
  doc.text(`Prepared by: ${patient.resultEnteredBy || 'Staff'}`, 15, footerY + 10);
  doc.text(`Lab In-Charge: ${labInfo?.inCharge || 'Awsin'}`, 15, footerY + 14);
  doc.text('Report digitally verified', pageWidth - 15, footerY + 10, { align: 'right' });
  doc.text(`Generated: ${format(new Date(), 'dd-MMM-yyyy hh:mm a')}`, pageWidth - 15, footerY + 14, { align: 'right' });

  // Page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

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
