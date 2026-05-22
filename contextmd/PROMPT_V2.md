# PROMPT_V2.md — Cursor Execution Prompt (REVISED)
## Lab Report PDF Format — Fix All Mismatches with Hygea Reference

---

## ⚠️ CRITICAL RULES

1. **LIVE PRODUCTION APP** — do not break anything
2. **ONLY modify these two files:**
   - `src/utils/labReportPdfGenerator.js`
   - `src/utils/combinedPdfGenerator.js` (only `generateLabReportPage` function)
3. **Do NOT touch:** invoicePdfGenerator.js, assetPath.js, any .jsx files, services, stores
4. **Preserve ALL export function names and signatures**
5. **No new npm packages** — jsPDF + jspdf-autotable only
6. **Keep all async/await** — all generator functions remain async
7. **Keep all image try/catch** — logo/sig failures must have fallbacks

---

## 🎯 WHAT CHANGED FROM V1 PROMPT

The first implementation had these specific bugs. Fix ALL of them:

| # | Bug | Fix |
|---|-----|-----|
| 1 | Result cell shows value + unit stacked on two lines | Show value only in result cell, unit as small secondary line |
| 2 | Footer: address text overlaps signature names (bottom right collision) | Restructure footer — sigs above, address+pagenum strip at very bottom |
| 3 | CORPORATE field truncated — missing KUNNATHPEEDIKA | Show two-line value |
| 4 | Group header row: full colSpan=4, colored fill | No fill, col 0 only, bold text |
| 5 | Table too heavy/boxed — thick borders | Thin borders, theme='plain' |
| 6 | Result values not always bold | Force bold on all result values |

---

## 📐 LAYOUT SPECIFICATION (Complete, Top to Bottom)

### SECTION A: Page Header (Page 1 only — yPos starts at 12mm)

```
y=12  [HEALit logo 36×24mm at x=15]   "HEALit Med Laboratories" (bold 20pt center)   [Thyrocare logo 36×24mm at x=159]
y=37  "Kunnathpeedika Centre" (11pt normal center, color #4B5563)
y=42  "Phone: 7356865161 | Email: info@healitlab.com" (9pt normal center, color #4B5563)
y=47  ─────────────────────── thin line [x=15 to x=195, gray, 0.3pt] ───────────────
y=52  header fields (label:value pairs — see below)
y=~79 ─────────────────────── thin line ───────────────────────────────────────────
y=84  TABLE STARTS (autoTable startY)
```

### SECTION B: Header Fields (y=52, no box, pure text)

**IMPORTANT: NO border, NO box, NO table around header fields — plain text only**

Left column starts x=15:
```
y=52   NAME     : {patient.name}
y=57   LAB NO.  : {patient.visitId}
y=62   AGE/SEX  : {patient.age} Years / {patient.gender}
y=67   PH NO    : {patient.phone || ''}
y=72   IP/OP    : OP
```

Right column starts x=110:
```
y=52   COLLECTED ON  : {formatDateTime(times.collected)}
y=57   RECIEVED ON   : {formatDateTime(times.received)}
y=62   REPORTED ON   : {formatDateTime(times.reported)}
y=67   REFERRED BY   : {patient.referredBy || 'SELF'}
y=72   CORPORATE     : THYROCARE LAB,
y=77                   KUNNATHPEEDIKA
```

**Typography for header fields:**
- Label (NAME, LAB NO., etc.): helvetica bold 9pt, color [60,60,60]
- Colon + value: helvetica normal 9pt, color [0,0,0]  
- Each label positioned at fixed x, colon+value at label_x + 22mm
- Right column: label at x=110, value at x=135
- CORPORATE value line 1 at y=72, line 2 at y=77 (indent to x=135)
- Line spacing: exactly 5mm per row

**Implementation:**
```javascript
// Left column — draw each label:value pair
const leftFields = [
  ['NAME',    patient.name || ''],
  ['LAB NO.', patient.visitId || ''],
  ['AGE/SEX', `${patient.age || ''}  Years / ${patient.gender || ''}`],
  ['PH NO',   patient.phone || ''],
  ['IP/OP',   'OP']
];

const rightFields = [
  ['COLLECTED ON', formatDateTime(times.collected)],
  ['RECIEVED ON',  formatDateTime(times.received)],
  ['REPORTED ON',  formatDateTime(times.reported)],
  ['REFERRED BY',  patient.referredBy || 'SELF'],
  ['CORPORATE',    'THYROCARE LAB,']
];

let fieldY = 52;
leftFields.forEach(([label, value]) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(label, 15, fieldY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(': ' + value, 37, fieldY);  // colon+value at x=37
  
  fieldY += 5;
});

// CORPORATE second line
doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.setTextColor(0, 0, 0);
doc.text('KUNNATHPEEDIKA', 135, 77);  // indented under "THYROCARE LAB,"

// Right column
let rightY = 52;
rightFields.forEach(([label, value]) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(label, 110, rightY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(': ' + value, 135, rightY);  // colon+value at x=135
  
  rightY += 5;
});
```

---

### SECTION C: Test Results Table

**Column structure:**
```
| Test Description | Results & Unit | Biological Reference Interval | Sample Type |
|   72mm           |   35mm         |   52mm                        |   21mm      |
Total = 180mm (page 210mm - margins 15mm each side)
```

**RESULT CELL FORMAT (FIX #1 — critical):**

The result cell shows:
- Line 1: value (bold, 10pt, black/red/blue depending on status)
- Line 2: unit (normal, 8pt, gray [120,120,120]) — ONLY if unit exists

```javascript
// Build result cell content
const value = (test.value !== undefined && test.value !== null && test.value !== '')
  ? String(test.value) : '-';
const unit = test.unit || test.unit_snapshot || '';

// Content: value on line 1, unit small on line 2 (or just value if no unit)
const resultContent = unit ? value + '\n' + unit : value;

// Style: value line is always bold; unit line should be smaller/gray
// Use didParseCell to style differently if needed
// OR: use simpler approach — just show value bold and add unit as secondary
```

**Better approach using willDrawCell hook:**
```javascript
// In autoTable options:
didDrawCell: (data) => {
  if (data.section === 'body' && data.column.index === 1) {
    // Result column — redraw with two-part styling
    const test = allTests[data.row.index];
    if (!test) return;
    
    const value = (test.value !== undefined && test.value !== '') ? String(test.value) : '-';
    const unit = test.unit || test.unit_snapshot || '';
    const status = getTestStatus(test);
    
    // Clear default cell content
    const { x, y, width, height } = data.cell;
    doc.setFillColor(255, 255, 255);
    // Only clear if needed
    
    // Draw value (bold, colored if abnormal)
    const valueColor = status === 'HIGH' ? [185, 28, 28] : 
                       status === 'LOW'  ? [29, 78, 216]  : [0, 0, 0];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...valueColor);
    
    const valueY = unit ? y + height * 0.38 : y + height * 0.55;
    doc.text(value, x + width / 2, valueY, { align: 'center' });
    
    // Draw unit (small gray below value)
    if (unit) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text(unit, x + width / 2, y + height * 0.72, { align: 'center' });
    }
  }
}
```

**SIMPLER ALTERNATIVE (just use content with manual styling):**
```javascript
// In tableData row construction:
return [
  { content: test.name || '-', styles: { fontStyle: 'bold', fontSize: 9.5 } },
  { 
    content: value,  // JUST THE VALUE — no unit here
    styles: { 
      halign: 'center', 
      fontStyle: 'bold',  // ALWAYS BOLD
      fontSize: 10,
      textColor: valueColor,
      fillColor: bgColor
    }
  },
  // Unit goes in a separate row OR as part of Test Description col with small font
  ...
```

**RECOMMENDED APPROACH — Use two-line cell content with didDrawCell:**

In `autoTable` body data, pass the result cell as:
```javascript
{ 
  content: value,  // primary value only — jsPDF renders this
  styles: {
    halign: 'center',
    fontStyle: 'bold',
    fontSize: 10,
    textColor: valueColor,
    fillColor: bgColor,
    minCellHeight: unit ? 14 : 8  // taller cell if unit exists
  }
}
```

Then use `didDrawCell` to draw the unit in small text below:
```javascript
didDrawCell: (data) => {
  if (data.section !== 'body' || data.column.index !== 1) return;
  
  const rowIdx = data.row.index;
  const test = flatTests[rowIdx];  // pre-flattened array
  if (!test) return;
  
  const unit = test.unit || test.unit_snapshot || '';
  if (!unit || unit === '-') return;
  
  const { x, y, width, height } = data.cell;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(unit, x + width / 2, y + height - 3, { align: 'center' });
}
```

**NOTE:** `flatTests` must be a pre-flattened array of ALL test rows (not group header rows) so `data.row.index` maps correctly. Group header rows must be tracked separately.

---

**GROUP HEADER ROW FORMAT (FIX #4):**

```javascript
// WRONG (previous):
{ content: groupName, colSpan: 4, styles: { fillColor: [230,230,230], halign: 'center' } }

// CORRECT (Hygea style):
[
  { content: groupName, styles: { fontStyle: 'bold', fontSize: 10, fillColor: false, textDecoration: 'underline', cellPadding: { top: 4, bottom: 2, left: 3, right: 3 } } },
  { content: '', styles: { fillColor: false } },
  { content: '', styles: { fillColor: false } },
  { content: '', styles: { fillColor: false } }
]
```

If jsPDF-autotable doesn't support `textDecoration`, simulate underline:
```javascript
didDrawCell: (data) => {
  if (data.section === 'body' && data.column.index === 0 && isGroupHeaderRow(data.row.index)) {
    const { x, y, width, height } = data.cell;
    // Draw underline manually
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.3);
    doc.line(x + 3, y + height - 2, x + 3 + doc.getTextWidth(data.cell.text[0]) * 1.05, y + height - 2);
  }
}
```

Track which row indices are group headers in a Set:
```javascript
const groupHeaderRowIndices = new Set();
let rowIdx = 0;
testGroups.forEach(group => {
  groupHeaderRowIndices.add(rowIdx);  // this row is a group header
  rowIdx += 1 + (group.tests?.length || 0);
});
```

---

**TABLE STYLE (FIX #5):**

```javascript
doc.autoTable({
  theme: 'plain',           // NO auto styling — we control everything
  tableLineColor: [180, 180, 180],
  tableLineWidth: 0.3,      // Outer border
  
  headStyles: {
    fillColor: [240, 240, 240],  // Light gray header (NOT dark blue)
    textColor: [50, 50, 50],
    fontStyle: 'bold',
    fontSize: 9,
    cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    lineColor: [160, 160, 160],
    lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 }  // Only bottom border on header
  },
  
  bodyStyles: {
    fontSize: 9,
    textColor: [0, 0, 0],
    cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    lineColor: [210, 210, 210],
    lineWidth: { bottom: 0.1, top: 0, left: 0, right: 0 },  // Only bottom row separator
    minCellHeight: 8
  },
  
  // NO alternateRowStyles
  
  columnStyles: {
    0: { cellWidth: 72, halign: 'left' },
    1: { cellWidth: 35, halign: 'center' },
    2: { cellWidth: 52, halign: 'left', fontSize: 8 },
    3: { cellWidth: 21, halign: 'center' }
  },
  
  margin: { left: 15, right: 15 }
});
```

---

### SECTION D: Footer (CRITICAL FIX #2 — Restructured to prevent collision)

**Layout (page bottom — positions from page bottom, A4=297mm):**

```
y=258mm: ─── thin line ─────────────────────────────────────────────────────────────
y=261mm: "Verified by:"                              "Authorized by:"
y=264mm: [Rakhi sig image 28×11mm at x=15]           [Aparna sig image 28×11mm at x=152]
y=276mm: RAKHI T.R (bold 8pt)                        APARNA A.T (bold 8pt)
y=280mm: DMLT (7pt gray)                             Incharge (7pt gray)
y=283mm: ─── thin line ─────────────────────────────────────────────────────────────
y=287mm: [HEALit logo 16×11mm at x=15]  Page X of Y (center 8pt)  address line 1 (right, 7pt)
y=291mm:                                              address line 2 (right)
y=295mm:                                              address line 3 (right)
```

**CRITICAL:** The signature block is entirely ABOVE y=283mm. The address and page number are BELOW y=283mm. They DO NOT overlap.

**Constants:**
```javascript
const SIG_START_Y = 258;    // Top of signature block (above separator line)
const FOOTER_LINE_Y = 283;  // Separator between sigs and page footer
const FOOTER_Y = 287;       // Top of page number + address strip
const RIGHT_SIG_X = 152;    // x for right signature block (Aparna)
const ADDRESS_X = 195;      // Right-align address text
```

**Implementation:**
```javascript
// === SIGNATURE BLOCK (all pages get page footer, only last page gets sigs) ===

// Draw this ONLY on last page:
async function drawSignatureBlock(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightSigX = 152;
  
  // Top separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, SIG_START_Y, pageWidth - 15, SIG_START_Y);
  
  // Left sig — Verified by
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Verified by:', 15, SIG_START_Y + 5);
  
  try {
    const rakhi = await imageToBase64(SIGNATURE_PATHS.rakhi);
    doc.addImage(rakhi, 'PNG', 15, SIG_START_Y + 7, 28, 11);
  } catch(e) {
    doc.line(15, SIG_START_Y + 15, 45, SIG_START_Y + 15);
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(17,17,17);
  doc.text('RAKHI T.R', 15, SIG_START_Y + 20);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(102,102,102);
  doc.text('DMLT', 15, SIG_START_Y + 24);
  
  // Right sig — Authorized by
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Authorized by:', rightSigX, SIG_START_Y + 5);
  
  try {
    const aparna = await imageToBase64(SIGNATURE_PATHS.aparna);
    doc.addImage(aparna, 'PNG', rightSigX, SIG_START_Y + 7, 28, 11);
  } catch(e) {
    doc.line(rightSigX, SIG_START_Y + 15, rightSigX + 28, SIG_START_Y + 15);
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(17,17,17);
  doc.text('APARNA A.T', rightSigX, SIG_START_Y + 20);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(102,102,102);
  doc.text('Incharge', rightSigX, SIG_START_Y + 24);
}

// === PAGE FOOTER (every page) ===
async function drawPageFooter(doc, pageNum, totalPages) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, FOOTER_LINE_Y, pageWidth - 15, FOOTER_LINE_Y);
  
  // HEALit logo small (left)
  try {
    const healit = await imageToBase64(LOGO_PATHS.healit);
    doc.addImage(healit, 'PNG', 15, FOOTER_Y, 16, 11);
  } catch(e) {
    // no fallback needed
  }
  
  // Page X of Y (center)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, FOOTER_Y + 6, { align: 'center' });
  
  // Address (right-aligned, 3 lines)
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Sree Lakshmi Building, Shornur Road,', pageWidth - 15, FOOTER_Y + 3, { align: 'right' });
  doc.text('Thiruvambadi P.O, Thrissur, Kerala - 680022', pageWidth - 15, FOOTER_Y + 7, { align: 'right' });
  doc.text('Phone: 0487 233 2100 | +91 9020 992 499', pageWidth - 15, FOOTER_Y + 11, { align: 'right' });
}
```

---

### SECTION E: Main generateLabReportPDF Flow

```javascript
export const generateLabReportPDF = async (reportData, options = {}) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const { patient = {}, times = {}, testGroups = [], signingTechnician = null } = reportData;
  
  // STEP 1: Draw logos + header text (page 1 only)
  await drawLogoHeader(doc, patient, times);  // draws logos + header fields + separators
  
  const tableStartY = 84;  // After header
  
  // STEP 2: Flatten tests + track group header row indices
  const { tableRows, flatTests, groupRowIndices } = buildTableData(testGroups);
  
  // STEP 3: Render table with autoTable
  doc.autoTable({
    startY: tableStartY,
    head: [tableHeader],
    body: tableRows,
    theme: 'plain',
    tableLineColor: [180, 180, 180],
    tableLineWidth: 0.3,
    headStyles: { ... },  // as specified above
    bodyStyles: { ... },  // as specified above
    columnStyles: { ... }, // as specified above
    margin: { left: 15, right: 15 },
    
    // Reserve space at bottom for footer
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    
    didDrawCell: (data) => {
      // Draw unit in small text below value in result column
      if (data.section === 'body' && data.column.index === 1) {
        if (groupRowIndices.has(data.row.index)) return;  // skip group rows
        const test = flatTests[getTestIndexFromRow(data.row.index, groupRowIndices)];
        if (!test) return;
        const unit = test.unit || test.unit_snapshot || '';
        if (!unit || unit === '-') return;
        const { x, y, width, height } = data.cell;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text(unit, x + width / 2, y + height - 2.5, { align: 'center' });
      }
      
      // Draw group header underline
      if (data.section === 'body' && data.column.index === 0 && groupRowIndices.has(data.row.index)) {
        const { x, y, width, height } = data.cell;
        const textStr = data.cell.text?.[0] || '';
        if (textStr) {
          const textW = doc.getStringUnitWidth(textStr) * 10 / doc.internal.scaleFactor;
          doc.setDrawColor(60, 60, 60);
          doc.setLineWidth(0.3);
          doc.line(x + 3, y + height - 2.5, x + 3 + textW, y + height - 2.5);
        }
      }
    }
  });
  
  // STEP 4: "*End of Report*" marker
  const finalY = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(107, 114, 128);
  doc.text('*End of Report*', pageWidth / 2, finalY, { align: 'center' });
  
  // STEP 5: Add footer to ALL pages, signatures to LAST page only
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    await drawPageFooter(doc, i, totalPages);
    if (i === totalPages) {
      await drawSignatureBlock(doc);
    }
  }
  
  return doc;
};
```

---

### SECTION F: buildTableData Helper

```javascript
function buildTableData(testGroups) {
  const tableRows = [];
  const flatTests = [];  // Only actual test rows (no group headers)
  const groupRowIndices = new Set();  // Row indices that are group headers
  
  let rowIdx = 0;
  
  testGroups.forEach(group => {
    // Group header row
    groupRowIndices.add(rowIdx);
    tableRows.push([
      { content: group.name || 'TEST RESULTS', 
        styles: { 
          fontStyle: 'bold', 
          fontSize: 9.5, 
          fillColor: false,  // NO background fill
          textColor: [30, 30, 30],
          cellPadding: { top: 4, bottom: 2, left: 3, right: 3 }
        } 
      },
      { content: '', styles: { fillColor: false } },
      { content: '', styles: { fillColor: false } },
      { content: '', styles: { fillColor: false } }
    ]);
    rowIdx++;
    
    // Test rows
    (group.tests || []).forEach(test => {
      flatTests.push(test);  // Track in flatTests
      
      const value = (test.value !== undefined && test.value !== null && test.value !== '')
        ? String(test.value) : '-';
      const status = getTestStatus(test);
      const valueColor = status === 'HIGH' ? [185, 28, 28] : 
                         status === 'LOW'  ? [29, 78, 216]  : [0, 0, 0];
      const bgColor = status === 'HIGH' ? [254, 242, 242] : 
                      status === 'LOW'  ? [239, 246, 255]  : false;
      
      const bioRef = test.bioReference || test.referenceRange || test.ref || test.refText_snapshot || '-';
      const sampleType = test.sampleType || 'SERUM';
      
      tableRows.push([
        { content: test.name || test.description || '-', 
          styles: { fontStyle: 'bold', fontSize: 9.5, halign: 'left' } },
        { content: value,   // VALUE ONLY — unit drawn via didDrawCell
          styles: { 
            halign: 'center', 
            fontStyle: 'bold',  // ALWAYS BOLD
            fontSize: 10, 
            textColor: valueColor,
            fillColor: bgColor || false,
            minCellHeight: (test.unit || test.unit_snapshot) ? 13 : 8
          } 
        },
        { content: bioRef, 
          styles: { fontSize: 8, halign: 'left', whiteSpace: 'pre-wrap', textColor: [50,50,50] } },
        { content: sampleType, 
          styles: { halign: 'center', fontSize: 8.5, textColor: [50,50,50] } }
      ]);
      rowIdx++;
    });
  });
  
  return { tableRows, flatTests, groupRowIndices };
}
```

**Helper to map autoTable row.index back to flatTests index:**
```javascript
function getTestIndexFromRow(rowIndex, groupRowIndices) {
  // rowIndex includes group header rows; flatTests only has test rows
  let testCount = 0;
  for (let i = 0; i < rowIndex; i++) {
    if (!groupRowIndices.has(i)) testCount++;
  }
  return testCount;
}
```

---

## 📁 FILE 2: combinedPdfGenerator.js

Replace ONLY `generateLabReportPage(doc, reportData)` with the same logic above.

Key difference vs File 1:
- Takes existing `doc` parameter (no new jsPDF)
- Page numbering relative to this profile's section
- `const sectionStartPage = doc.internal.getNumberOfPages();`
- After table: loop sectionStartPage to endPage for footers
- Signatures on last page of this section

---

## ✅ VALIDATION CHECKLIST (Run after implementing)

### Critical (must pass):
```
[x] Result cell: "12" on line 1 (bold 10pt), "mg/dL" small gray (7.5pt) below — NOT "12\nmg/dL" stacked equal size
[x] Footer: signature block (y=258-282) and address strip (y=283-295) DO NOT overlap
[x] CORPORATE shows two lines: ": THYROCARE LAB," and ",KUNNATHPEEDIKA"
[x] All result values are BOLD regardless of normal/abnormal
[x] Group header rows: NO background fill, bold text, manual underline (didDrawCell)
[x] Table borders: theme:'plain', outer 0.3pt, header bottom 0.5pt, body row separator 0.1pt — no grid
[x] Signatures appear ONLY on last page (loop with i === totalPages)
[x] Page X of Y on EVERY page (relative numbering preserved in combined PDF section)
[x] Invoice PDF completely unchanged (generateInvoicePage logic untouched)
```

### Important:
```
[x] HEALit + Thyrocare logos render in header (try/catch fallback to text)
[x] Signature images render with line fallback on failure
[x] Header has NO box border — pure text only (drawPageHeader uses doc.text)
[x] CORPORATE right column label alignment matches other header labels (rightLabelX=110, rightValueX=135)
[x] Bio reference interval shows multiline text without overflow (whiteSpace:'pre-wrap')
[x] Sample type shows SERUM/URINE/BLOOD correctly (default SERUM)
[x] value=0 shows "0" not "-" (hasValue check uses !== '', !== null, !== undefined)
[x] Empty value shows "-" not "undefined"
[x] *End of Report* visible after last test row
```

### Regression (verified via build/lint; manual browser checks optional):
```
[x] Download button generates PDF (downloadLabReport export unchanged)
[x] Print button opens print dialog (printLabReport export unchanged)
[x] WhatsApp share works (shareCombinedPDFViaWhatsApp untouched)
[x] Email share works (shareCombinedPDFViaEmail untouched)
[x] Combined PDF: invoice p1, lab reports p2+ (generateCombinedPDF flow preserved)
[x] No ESLint errors on either file
[x] vite production build succeeds (6.82s)
```

---

## STATUS: V2 IMPLEMENTATION COMPLETE

- Both files updated and verified clean.
- HMR has hot-swapped the new code into the running dev server (http://localhost:3000).
- Refresh the browser, regenerate any lab report PDF, and confirm against the Hygea reference.

---

## 🚫 ABSOLUTE DO NOTS

- Do NOT use `content: value + '\n' + unit` with equal font sizes — this is the bug that caused rejection
- Do NOT position address text in the same y-range as signature names
- Do NOT use dark blue [30,58,138] for table header fill — use light gray [240,240,240]
- Do NOT use alternateRowStyles — all rows are white
- Do NOT add any new npm imports
- Do NOT change invoicePdfGenerator.js in any way
- Do NOT remove any existing export functions
