import jsPDF from 'jspdf';
import { LOGO_PATHS, SIGNATURE_PATHS, imageToBase64 } from './assetPath';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COL_WIDTHS = {
  testDesc: 72,
  result: 35,
  bioRef: 73
};

const COL_X = {
  testDesc: MARGIN,
  result: MARGIN + COL_WIDTHS.testDesc,
  bioRef: MARGIN + COL_WIDTHS.testDesc + COL_WIDTHS.result
};

const COLOR = {
  black: [0, 0, 0],
  darkGray: [60, 60, 60],
  midGray: [120, 120, 120],
  lightGray: [200, 200, 200],
  border: [180, 180, 180],
  headerFill: [240, 240, 240],
  highText: [185, 28, 28],
  lowText: [29, 78, 216],
  white: [255, 255, 255]
};

const FOOTER_H = 18;
const FOOTER_Y = PAGE_H - FOOTER_H - 5;
const SIGNATURE_Y = 244;
const BODY_TOP_AFTER_BREAK = 18;
const TABLE_BOTTOM = FOOTER_Y - 7;
const SIGNATURE_SAFE_Y = SIGNATURE_Y - 8;
/** Flush with table header top when drawing body border box (V4). */
const BODY_BOX_TOP_OFFSET = 0;

const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hour12}:${minutes} ${period}`;
};

const getTestStatus = (test) => {
  const type = test.inputType || test.inputType_snapshot || test.type;
  if (type === 'text' || type === 'dropdown' || type === 'select') return 'NORMAL';
  const value = parseFloat(test.value);
  if (isNaN(value)) return 'NORMAL';
  const low = parseFloat(test.low ?? test.refLow ?? test.refLow_snapshot);
  const high = parseFloat(test.high ?? test.refHigh ?? test.refHigh_snapshot);
  if (!isNaN(low) && value < low) return 'LOW';
  if (!isNaN(high) && value > high) return 'HIGH';
  return 'NORMAL';
};

const getStatusColor = (status) => {
  if (status === 'HIGH') return COLOR.highText;
  if (status === 'LOW') return COLOR.lowText;
  return COLOR.black;
};

const getDisplayName = (test) =>
  test.displayName || test.description || test.name || test.testName || '-';

const serializePositiveNegativeScale = (scale) => {
  if (!Array.isArray(scale)) return '';
  return scale
    .map((row) => {
      const symbol = String(row.symbol || '').trim();
      const label = String(row.label || '').trim();
      const value = String(row.value || '').trim();
      if (!symbol && !label && !value) return '';
      const text = [symbol, label].filter(Boolean).join(' : ');
      return value ? `${text} (${value})` : text;
    })
    .filter(Boolean)
    .join('\n');
};

const getBioReference = (test) => {
  const scale = serializePositiveNegativeScale(test.positiveNegativeScale);
  if (scale) return scale;
  if (test.bioReference) return test.bioReference;
  if (test.bioReference_snapshot) return test.bioReference_snapshot;
  if (test.referenceRange) return test.referenceRange;
  if (test.refText_snapshot) return test.refText_snapshot;
  const options = Array.isArray(test.resultOptions || test.options)
    ? (test.resultOptions || test.options).join('\n')
    : (test.resultOptions || test.options || '');
  if (options && (test.inputType === 'select' || test.inputType_snapshot === 'select' || test.type === 'dropdown')) {
    return options;
  }
  const low = test.refLow ?? test.low ?? test.refLow_snapshot;
  const high = test.refHigh ?? test.high ?? test.refHigh_snapshot;
  if (low !== undefined && low !== '' && high !== undefined && high !== '') return `${low} - ${high}`;
  if (low !== undefined && low !== '') return `> ${low}`;
  if (high !== undefined && high !== '') return `< ${high}`;
  return '-';
};

const getMethod = (test) => test.method || test.method_snapshot || '';

const getResultParts = (test) => {
  const value = test.value !== undefined && test.value !== null && test.value !== ''
    ? String(test.value)
    : '-';
  const unit = test.unit || test.unit_snapshot || '';
  return { value, unit };
};

const drawLabelValue = (doc, label, value, labelX, valueX, y) => {
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.darkGray);
  doc.text(label, labelX, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.black);
  doc.text(`: ${value}`, valueX, y);
};

const drawPageHeader = async (doc, patient, times) => {
  let yPos = 12;
  const logoW = 36;
  const logoH = 24;
  const logoY = yPos;

  try {
    const healitBase64 = await imageToBase64(LOGO_PATHS.healit);
    doc.addImage(healitBase64, 'PNG', MARGIN, logoY, logoW, logoH);
  } catch (error) {
    console.error('HEALit logo not loaded:', error);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.darkGray);
    doc.text('HEALit', MARGIN, logoY + 12);
  }

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR.black);
  doc.text('HEALit Med Laboratories', PAGE_W / 2, logoY + 12, { align: 'center' });

  try {
    const partnerBase64 = await imageToBase64(LOGO_PATHS.partner);
    doc.addImage(partnerBase64, 'JPEG', PAGE_W - MARGIN - logoW, logoY, logoW, logoH);
  } catch (error) {
    console.error('Partner logo not loaded:', error);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.darkGray);
    doc.text('Thyrocare', PAGE_W - MARGIN, logoY + 12, { align: 'right' });
  }

  yPos = logoY + logoH;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...COLOR.darkGray);
  doc.text('Kunnathpeedika Centre', PAGE_W / 2, yPos, { align: 'center' });
  yPos += 5;

  doc.setFontSize(9);
  doc.text('Phone: 7356865161 | Email: info@healitlab.com', PAGE_W / 2, yPos, { align: 'center' });
  yPos += 4;

  doc.setDrawColor(...COLOR.lightGray);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, yPos, PAGE_W - MARGIN, yPos);
  yPos += 5;

  const leftFields = [
    ['NAME', patient.name || '-'],
    ['LAB NO.', patient.visitId || '-'],
    ['AGE/SEX', `${patient.age || '-'} Years / ${patient.gender || '-'}`],
    ['PH NO', patient.phone || '-']
  ];
  const rightFields = [
    ['COLLECTED ON', times.collected ? formatDateTime(times.collected) : '-'],
    ['REPORTED ON', times.reported ? formatDateTime(times.reported) : formatDateTime(new Date())],
    ['REFERRED BY', patient.referredBy || 'SELF'],
    ['CORPORATE', 'THYROCARE LAB, KUNNATHPEEDIKA']
  ];

  const startY = yPos;
  doc.setFontSize(9);
  leftFields.forEach(([label, value], index) => drawLabelValue(doc, label, value, MARGIN, 35, startY + index * 5.5));
  rightFields.forEach(([label, value], index) => drawLabelValue(doc, label, value, 110, 135, startY + index * 5.5));

  yPos = startY + leftFields.length * 5.5 + 1;
  doc.setDrawColor(...COLOR.lightGray);
  doc.line(MARGIN, yPos, PAGE_W - MARGIN, yPos);
  return yPos + 5;
};

const drawSignatureFooter = async (doc) => {
  const leftX = MARGIN;
  const rightX = PAGE_W - 65;
  const sigY = SIGNATURE_Y + 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLOR.midGray);
  doc.text('Verified by:', leftX, SIGNATURE_Y);
  doc.text('Authorized by:', rightX, SIGNATURE_Y);

  try {
    const rakhiBase64 = await imageToBase64(SIGNATURE_PATHS.rakhi);
    doc.addImage(rakhiBase64, 'PNG', leftX, sigY, 28, 11);
  } catch (error) {
    console.error('Rakhi signature failed:', error);
    doc.setDrawColor(...COLOR.midGray);
    doc.line(leftX, sigY + 10, leftX + 28, sigY + 10);
  }

  try {
    const aparnaBase64 = await imageToBase64(SIGNATURE_PATHS.aparna);
    doc.addImage(aparnaBase64, 'PNG', rightX, sigY, 28, 11);
  } catch (error) {
    console.error('Aparna signature failed:', error);
    doc.setDrawColor(...COLOR.midGray);
    doc.line(rightX, sigY + 10, rightX + 28, sigY + 10);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR.black);
  doc.text('RAKHI T.R', leftX, SIGNATURE_Y + 17);
  doc.text('APARNA A.T', rightX, SIGNATURE_Y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLOR.midGray);
  doc.text('DMLT', leftX, SIGNATURE_Y + 21);
  doc.text('Incharge', rightX, SIGNATURE_Y + 21);
};

const groupTestsForPrint = (testGroups) => {
  const groups = [];
  (testGroups || []).forEach((group) => {
    const fallbackName = group.name || 'TEST RESULTS';
    const grouped = new Map();
    (group.tests || [])
      .filter((test) => test.printVisible !== false)
      .forEach((test) => {
        const name = test.sectionName || test.groupName || fallbackName;
        if (!grouped.has(name)) grouped.set(name, []);
        grouped.get(name).push(test);
      });
    grouped.forEach((tests, name) => {
      if (tests.length) groups.push({ name, tests });
    });
  });
  return groups;
};

const drawTableHeader = (doc, y) => {
  doc.setFillColor(...COLOR.headerFill);
  doc.rect(MARGIN, y, CONTENT_W, 10, 'F');
  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  doc.line(MARGIN, y + 10, PAGE_W - MARGIN, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(...COLOR.darkGray);
  doc.text('Test Description', COL_X.testDesc + 2, y + 6.3);
  doc.text('Results & Unit', COL_X.result + COL_WIDTHS.result / 2, y + 6.3, { align: 'center' });
  doc.text('Biological Reference Interval', COL_X.bioRef + 2, y + 6.3);
  return y + 10;
};

const ensureSpace = (doc, y, needed) => {
  if (y + needed <= TABLE_BOTTOM) return y;
  doc.addPage();
  return drawTableHeader(doc, BODY_TOP_AFTER_BREAK);
};

const drawGroupRow = (doc, y, groupName) => {
  y = ensureSpace(doc, y, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLOR.darkGray);
  doc.text(groupName || 'TEST RESULTS', PAGE_W / 2, y + 6.3, { align: 'center' });
  const textWidth = doc.getTextWidth(groupName || 'TEST RESULTS');
  doc.setDrawColor(...COLOR.darkGray);
  doc.setLineWidth(0.18);
  doc.line((PAGE_W - textWidth) / 2, y + 7.8, (PAGE_W + textWidth) / 2, y + 7.8);
  return y + 10;
};

const measureTestRow = (doc, test) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  const nameLines = doc.splitTextToSize(getDisplayName(test), COL_WIDTHS.testDesc - 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const methodLines = getMethod(test)
    ? doc.splitTextToSize(`Method: ${getMethod(test)}`, COL_WIDTHS.testDesc - 4)
    : [];
  doc.setFontSize(7.5);
  const refLines = doc.splitTextToSize(getBioReference(test), COL_WIDTHS.bioRef - 4);
  const resultLines = 1; // value+unit now always one line
  return Math.max(
    8,
    4 + nameLines.length * 4 + methodLines.length * 3.3,
    4 + refLines.length * 3.6,
    4 + resultLines * 4.2
  );
};

const drawTestRow = (doc, y, test) => {
  const rowH = measureTestRow(doc, test);
  y = ensureSpace(doc, y, rowH);
  const baseY = y + 4.8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(...COLOR.black);
  const nameLines = doc.splitTextToSize(getDisplayName(test), COL_WIDTHS.testDesc - 4);
  doc.text(nameLines, COL_X.testDesc + 2, baseY);

  const method = getMethod(test);
  if (method) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLOR.midGray);
    doc.text(doc.splitTextToSize(`Method: ${method}`, COL_WIDTHS.testDesc - 4), COL_X.testDesc + 2, baseY + nameLines.length * 4);
  }

  const status = getTestStatus(test);
  const { value, unit } = getResultParts(test);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(...getStatusColor(status));
  const displayResult = unit ? `${value} ${unit}` : value;
  doc.text(displayResult, COL_X.result + COL_WIDTHS.result / 2, baseY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR.black);
  doc.text(doc.splitTextToSize(getBioReference(test), COL_WIDTHS.bioRef - 4), COL_X.bioRef + 2, baseY);

  return y + rowH + 1.2;
};

const renderTestTable = (doc, startY, testGroups) => {
  let y = drawTableHeader(doc, startY);
  const groups = groupTestsForPrint(testGroups);

  if (groups.length === 0) {
    y = ensureSpace(doc, y, 10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR.midGray);
    doc.text('No printable tests', PAGE_W / 2, y + 6, { align: 'center' });
    return y + 10;
  }

  groups.forEach((group) => {
    group.tests.forEach((test) => {
      y = drawTestRow(doc, y, test);
    });
  });
  return y;
};

export const renderLabReportSection = async (doc, reportData, options = {}) => {
  const startPage = options.startPage || doc.internal.getNumberOfPages();
  const { patient = {}, times = {}, testGroups = [] } = reportData || {};

  let yPos = await drawPageHeader(doc, patient, times);
  const tableStartY = yPos;
  const tableStartPage = doc.internal.getNumberOfPages();
  yPos = renderTestTable(doc, yPos, testGroups);
  const tableEndPage = doc.internal.getNumberOfPages();
  if (tableStartPage === tableEndPage) {
    doc.setDrawColor(...COLOR.border);
    doc.setLineWidth(0.4);
    doc.rect(
      MARGIN,
      tableStartY + BODY_BOX_TOP_OFFSET,
      CONTENT_W,
      yPos - tableStartY - BODY_BOX_TOP_OFFSET,
      'S'
    );
  }
  if (yPos + 9 > SIGNATURE_SAFE_Y) {
    doc.addPage();
    yPos = BODY_TOP_AFTER_BREAK + 6;
  } else {
    yPos += 6;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR.midGray);
  doc.text('*End of Report*', PAGE_W / 2, yPos, { align: 'center' });

  const endPage = doc.internal.getNumberOfPages();
  for (let p = startPage; p <= endPage; p++) {
    doc.setPage(p);
    if (p === endPage) {
      await drawSignatureFooter(doc);
    }
  }
};

export const generateLabReportPDF = async (reportData, options = {}) => {
  void options;
  const doc = new jsPDF('p', 'mm', 'a4');
  await renderLabReportSection(doc, reportData, { startPage: 1 });
  return doc;
};

export const downloadLabReport = async (reportData, fileName, options = {}) => {
  const doc = await generateLabReportPDF(reportData, options);
  const name =
    fileName ||
    `${reportData.patient?.visitId || 'Report'}-${reportData.patient?.name?.replace(/\s+/g, '_') || 'Patient'}.pdf`;
  doc.save(name);
};

export const printLabReport = async (reportData, options = {}) => {
  console.log('printLabReport called');
  try {
    const doc = await generateLabReportPDF(reportData, options);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (printWindow) {
      printWindow.onload = () => setTimeout(() => printWindow.print(), 250);
    } else {
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
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        } catch (printError) {
          console.error('Print dialog error:', printError);
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
          throw new Error('Failed to open print dialog: ' + printError.message);
        }
      };

      iframe.onerror = (error) => {
        console.error('Iframe load error:', error);
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
        throw new Error('Failed to load PDF for printing');
      };

      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }
      }, 10000);
    }
  } catch (error) {
    console.error('printLabReport failed:', error);
    throw error;
  }
};

export const getLabReportBlob = async (reportData, options = {}) => {
  const doc = await generateLabReportPDF(reportData, options);
  return doc.output('blob');
};
