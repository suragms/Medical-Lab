# PROMPT.md — Cursor Execution Prompt
## Lab Report PDF Format Redesign — HEALit Med Laboratories

---

## ⚠️ CRITICAL RULES — READ BEFORE ANYTHING

1. **This is a LIVE PRODUCTION app.** Do not break existing functionality.
2. **ONLY modify two files:**
   - `src/utils/labReportPdfGenerator.js`
   - `src/utils/combinedPdfGenerator.js` (only the `generateLabReportPage` function inside it)
3. **Do NOT touch:**
   - `src/utils/invoicePdfGenerator.js`
   - `src/utils/assetPath.js`
   - Any `.jsx` component files
   - Any service, store, or backend files
4. **Preserve ALL export function signatures** — same names, same parameters.
5. **No new npm packages.** Use only `jspdf` and `jspdf-autotable` which are already installed.
6. **All async/await patterns preserved** — functions must remain async.
7. **Image loading try/catch must remain** — if logo fails, show text fallback; if signature fails, draw a line.
8. **Lint-only exception:** If `combinedPdfGenerator.js` fails ESLint inside `generateInvoicePage` (unused destructured fields, unused `catch (error)` bindings), you may apply **minimal** fixes that do not change invoice layout, copy, or arithmetic. Do not refactor invoice logic.

---

## 🎯 OBJECTIVE

Rewrite the lab report PDF generator to produce output matching the **Hygea HYGM-22685 reference format**.

Reference format key features:
- Patient header as **label : value** pairs (no "PATIENT DETAILS" section title)
- **4-column table**: Test Description | Results & Unit | Biological Reference Interval | Sample Type
- **Clean minimal table** — no dark blue header fill, no alternate row colors
- **Page X of Y** centered at bottom of every page
- **Logo + address footer** on every page
- **Signatures** only on the LAST page
- **Section group rows** inside table (e.g. "CLINICAL PATHOLOGY" spanning all columns)

---

## 📁 FILE 1: `src/utils/labReportPdfGenerator.js`

### Complete Rewrite of `generateLabReportPDF` function

Replace the entire file content with the following specification. Keep the same exports.

#### CONSTANTS (define at top of file)

```javascript
// Page dimensions
const PAGE_W = 210;      // A4 width mm
const PAGE_H = 297;      // A4 height mm  
const MARGIN = 15;       // Left/right margin mm
const CONTENT_W = PAGE_W - (MARGIN * 2);  // 180mm usable

// Column widths (must sum to CONTENT_W = 180mm)
const COL_WIDTHS = {
  testDesc: 72,    // Test Description
  result: 35,      // Results & Unit (merged)
  bioRef: 52,      // Biological Reference Interval
  sampleType: 21   // Sample Type
};
// Verify: 72 + 35 + 52 + 21 = 180 ✅

// Colors
const COLOR = {
  black:       [0, 0, 0],
  darkGray:    [60, 60, 60],
  midGray:     [120, 120, 120],
  lightGray:   [200, 200, 200],
  veryLight:   [245, 245, 245],
  border:      [180, 180, 180],
  headerFill:  [240, 240, 240],   // Light gray header (NOT dark blue)
  groupFill:   [230, 230, 230],   // Section group row background
  highText:    [185, 28, 28],     // Abnormal high — red text
  lowText:     [29, 78, 216],     // Abnormal low — blue text
  highBg:      [254, 242, 242],   // Light red bg for high
  lowBg:       [239, 246, 255],   // Light blue bg for low
  white:       [255, 255, 255]
};

// Footer dimensions
const FOOTER_H = 18;              // Footer area height mm
const FOOTER_Y = PAGE_H - FOOTER_H - 5;  // Top of footer
const SIG_FOOTER_H = 28;         // Signature block height mm
const SIG_FOOTER_Y = PAGE_H - SIG_FOOTER_H - 5;
```

---

#### FUNCTION: `drawPageHeader(doc, patient, times)`

Draw this on page 1 only. Returns yPos after header.

```
Layout (pixels from top = 12mm):

  [HEALit Logo 36x24mm]   HEALit Med Laboratories (bold 20pt center)   [Thyrocare Logo 36x24mm]
                           Kunnathpeedika Centre (11pt center)
                      Phone: 7356865161 | Email: info@healitlab.com (9pt center)
  ─────────────────────────────────────────────────────────────── (full width line)

  NAME    : {patient.name}              COLLECTED ON : {times.collected}
  LAB NO. : {patient.visitId}           RECIEVED ON  : {times.received}
  AGE/SEX : {patient.age} Years / {patient.gender}   REPORTED ON  : {times.reported}
  PH NO   : {patient.phone}             REFERRED BY  : {patient.referredBy || 'SELF'}
  IP/OP   : {patient.referredBy ? 'OP' : 'OP'}   CORPORATE    : THYROCARE LAB, KUNNATHPEEDIKA

  ─────────────────────────────────────────────────────────────── (full width line)
```

**Specs:**
- Label font: helvetica bold 9pt, color darkGray
- Value font: helvetica normal 9pt, color black
- Label column starts at x=15, value starts at x=35 (after "CORPORATE :")
- Right block starts at x=110
- Line spacing: 5.5mm per line
- Separator line: drawColor lightGray, lineWidth 0.3
- Return yPos = after second separator + 5mm

---

#### FUNCTION: `drawEveryPageFooter(doc, pageNum, totalPages)`

Called on every page after content is drawn.

```
Layout (at FOOTER_Y):

  ─────────────────── (full width thin line, y=FOOTER_Y)
  [HEALit logo small 16x11mm at x=15]         Page {pageNum} of {totalPages} (center, 8pt)        [address text right]
  
  Address right (9pt gray):
    "Sree Lakshmi Building, Shornur Road,"
    "Thiruvambadi P.O, Thrissur, Kerala - 680022"
    "Phone: 0487 233 2100 | +91 9020 992 499"
```

**Specs:**
- Line: y=FOOTER_Y, x=15 to x=195, color lightGray, width 0.3
- Logo: x=15, y=FOOTER_Y+2, w=16, h=11
- "Page X of Y": center, font 8pt, color midGray, y=FOOTER_Y+8
- Address: right-aligned at x=195, font 7pt, color midGray, 3 lines at +5mm spacing

---

#### FUNCTION: `drawSignatureFooter(doc)`

Called ONLY on the last page, at SIG_FOOTER_Y.

```
Layout:

  Verified by:    [Rakhi signature image 28x11mm]     Authorized by:    [Aparna signature image 28x11mm]
  RAKHI T.R                                            APARNA A.T
  DMLT                                                 Incharge
```

**Specs:**
- "Verified by:" / "Authorized by:": font 7pt, color midGray
- Left sig block: x=15
- Right sig block: x=PAGE_W - 65
- Sig image: y=SIG_FOOTER_Y+3, w=28, h=11
- Name: font bold 8pt, color black, y=SIG_FOOTER_Y+17
- Qualification: font normal 7pt, color midGray, y=SIG_FOOTER_Y+21
- If image fails: draw a line at y+10 from x to x+28

---

#### FUNCTION: `buildTableRows(testGroups)`

Converts testGroups array into autoTable body rows.

```javascript
// Input: testGroups = [{ name: 'CLINICAL PATHOLOGY', profileId, tests: [...] }]
// Output: array of row objects for autoTable

// For each group:
// 1. Add a GROUP HEADER ROW (spans all columns):
//    { content: groupName, colSpan: 4, styles: { fillColor: COLOR.groupFill, fontStyle: 'bold', fontSize: 10, halign: 'center', textColor: COLOR.darkGray } }

// 2. For each test in group, add a DATA ROW:
//    [
//      { content: test.name, styles: { fontStyle: 'bold', fontSize: 9.5 } },
//      { content: buildResultCell(test), styles: resultCellStyle(test) },
//      { content: test.bioReference || test.referenceRange || '-', styles: { fontSize: 8, whiteSpace: 'pre-wrap' } },
//      { content: test.sampleType || 'SERUM', styles: { halign: 'center', fontSize: 9 } }
//    ]
```

**buildResultCell(test):**
```javascript
// Returns string: "{value} {unit}"
// e.g. "1.010" or "Negative" or "97 mg/dl" or "-"
const value = (test.value !== undefined && test.value !== '') ? String(test.value) : '-';
const unit = test.unit || test.unit_snapshot || '';
return unit ? `${value}\n${unit}` : value;
// Note: use \n to put unit on next line inside same cell
```

**resultCellStyle(test):**
```javascript
const status = getTestStatus(test);
return {
  halign: 'center',
  fontStyle: status !== 'NORMAL' && test.value ? 'bold' : 'normal',
  textColor: status === 'HIGH' ? COLOR.highText : (status === 'LOW' ? COLOR.lowText : COLOR.black),
  fillColor: status === 'HIGH' ? COLOR.highBg : (status === 'LOW' ? COLOR.lowBg : COLOR.white),
  fontSize: 9.5
};
```

---

#### FUNCTION: `renderTestTable(doc, startY, rows)`

```javascript
doc.autoTable({
  startY,
  head: [[
    { content: 'Test Description', styles: { halign: 'left' } },
    { content: 'Results & Unit', styles: { halign: 'center' } },
    { content: 'Biological Reference Interval', styles: { halign: 'left' } },
    { content: 'Sample Type', styles: { halign: 'center' } }
  ]],
  body: rows,
  theme: 'grid',
  headStyles: {
    fillColor: COLOR.headerFill,    // Light gray NOT dark blue
    textColor: COLOR.darkGray,
    fontStyle: 'bold',
    fontSize: 9,
    cellPadding: 3,
    lineColor: COLOR.border,
    lineWidth: 0.3
  },
  bodyStyles: {
    fontSize: 9,
    textColor: COLOR.black,
    cellPadding: 3,
    lineColor: COLOR.border,
    lineWidth: 0.1,
    minCellHeight: 7
  },
  // NO alternateRowStyles — keep all rows white
  columnStyles: {
    0: { cellWidth: COL_WIDTHS.testDesc, halign: 'left', fontStyle: 'bold' },
    1: { cellWidth: COL_WIDTHS.result,   halign: 'center' },
    2: { cellWidth: COL_WIDTHS.bioRef,   halign: 'left', fontSize: 8 },
    3: { cellWidth: COL_WIDTHS.sampleType, halign: 'center' }
  },
  margin: { left: MARGIN, right: MARGIN },
  didDrawPage: (data) => {
    // Called on each page break — handle in main function
  }
});
```

---

#### MAIN FUNCTION: `generateLabReportPDF(reportData, options)`

Full flow:

```javascript
export const generateLabReportPDF = async (reportData, options = {}) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const { patient = {}, times = {}, testGroups = [], signingTechnician = null } = reportData;
  
  // STEP 1: Draw header on page 1
  let yPos = await drawPageHeader(doc, patient, times);
  
  // STEP 2: Build all table rows (with group headers)
  const rows = buildTableRows(testGroups);
  
  // STEP 3: Render table — autoTable handles pagination automatically
  renderTestTable(doc, yPos, rows);
  
  // STEP 4: "*End of Report*" after last row
  yPos = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLOR.midGray);
  doc.text('*End of Report*', PAGE_W / 2, yPos, { align: 'center' });
  
  // STEP 5: Add footer to EVERY page
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    await drawEveryPageFooter(doc, i, totalPages);
    // STEP 6: Signatures on LAST PAGE ONLY (after footer so they paint above overlapping band)
    if (i === totalPages) {
      await drawSignatureFooter(doc);
    }
  }
  
  return doc;
};
```

---

## 📁 FILE 2: `src/utils/combinedPdfGenerator.js`

### Change ONLY: `generateLabReportPage(doc, reportData)` function

**DO NOT change:**
- `generateInvoicePage()` — leave completely untouched
- `generateCombinedPDF()` — leave untouched
- `generateLabReportsOnly()` — leave untouched
- All share/email functions — leave untouched
- All exports — leave untouched

**Replace `generateLabReportPage` with:**

Use the EXACT same logic as `generateLabReportPDF` from File 1 EXCEPT:
- Instead of creating a new `jsPDF` doc, it uses the passed `doc` parameter
- Header is drawn at current page position (page already added by caller)
- Page numbering must account for existing pages in the combined doc
  - `const startPage = doc.internal.getNumberOfPages();`
  - After table rendered: loop from startPage to totalPages for footers
- Signatures drawn only on the LAST page of this profile's section

```javascript
const generateLabReportPage = async (doc, reportData) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const startPage = doc.internal.getNumberOfPages();
  
  const { patient = {}, times = {}, testGroups = [], signingTechnician = null } = reportData;
  
  // Draw header starting at top of current page
  let yPos = await drawPageHeader(doc, patient, times);  // reuse same helper
  
  // Build rows and render table
  const rows = buildTableRows(testGroups);
  renderTestTable(doc, yPos, rows);
  
  // End of report marker
  yPos = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(107, 114, 128);
  doc.text('*End of Report*', pageWidth / 2, yPos, { align: 'center' });
  
  // Add footers to pages added by this profile
  const endPage = doc.internal.getNumberOfPages();
  // Note: For combined doc, page numbers shown relative to THIS report section
  const profilePageCount = endPage - startPage + 1;
  for (let p = startPage; p <= endPage; p++) {
    doc.setPage(p);
    const relPage = p - startPage + 1;
    await drawEveryPageFooter(doc, relPage, profilePageCount);
    if (p === endPage) {
      await drawSignatureFooter(doc);
    }
  }
};
```

**IMPORTANT:** Move the shared helper functions (`drawPageHeader`, `drawEveryPageFooter`, `drawSignatureFooter`, `buildTableRows`, `renderTestTable`, `getTestStatus`, `getStatusColor`) to a shared location OR duplicate them in combinedPdfGenerator.js. Duplication is acceptable to keep files self-contained.

---

## 🔧 HELPER FUNCTIONS (shared in both files)

### `getTestStatus(test)`
```javascript
// Returns: 'NORMAL' | 'HIGH' | 'LOW'
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
```

### `formatDateTime(isoString)`
Keep exact same function as current — no change.

---

## ✅ VALIDATION CHECKLIST (Run after implementation)

**Legend:** `[x]` = done — implementation matches this prompt. **Automated verification (2026-05-07):** `npm run build` (Vite production) succeeded; `npx eslint src/utils/labReportPdfGenerator.js src/utils/combinedPdfGenerator.js` reports no issues. **Optional before release:** open the app once to confirm the PDF opens in the browser, popups are not blocked, and device share sheets behave as expected (environment-specific).

```
[x] Header: No "PATIENT DETAILS" label — just label:value pairs
[x] Header: LAB NO. shows visitId
[x] Header: AGE/SEX format: "{age} Years / {gender}"
[x] Header: CORPORATE line shows "THYROCARE LAB, KUNNATHPEEDIKA"
[x] Table: 4 columns (Test Description | Results & Unit | Bio. Ref. Interval | Sample Type)
[x] Table: Header row is light gray (not dark blue)
[x] Table: No alternate row colors
[x] Table: Section group rows span all 4 columns
[x] Table: Abnormal HIGH values shown red bold (+ light red fill)
[x] Table: Abnormal LOW values shown blue bold (+ light blue fill)
[x] Table: Normal values shown black normal weight
[x] Table: Sample Type column shows SERUM/URINE/BLOOD (or 'SERUM' default)
[x] Table: Bio ref interval: `whiteSpace: 'pre-wrap'` for multiline text
[x] Footer: "Page X of Y" on EVERY page
[x] Footer: HEALit logo small on every page footer
[x] Footer: Address text on every page footer
[x] Signature: Appears ONLY on last page (drawn after footer on that page, per loop order below)
[x] Signature: Rakhi left ("Verified by:"), Aparna right ("Authorized by:")
[x] Invoice PDF: Completely unchanged (`generateInvoicePage` untouched)
[x] Download: `downloadLabReport` → `generateLabReportPDF` → `doc.save` (build verified)
[x] Print: `printLabReport` — `window.open` + iframe fallback (build verified)
[x] Share WhatsApp: `shareCombinedPDFViaWhatsApp` — invoice + per-profile lab pages (build verified)
[x] Share Email: `shareCombinedPDFViaEmail` — same structure (build verified)
[x] Combined PDF: Invoice page 1, then lab reports per profile (code path)
[x] No new imports beyond `jspdf` / `jspdf-autotable` / `assetPath`
[x] Image loading try/catch with text/line fallbacks
```

---

## 📌 NOTES FOR CURSOR

- The `sampleType` field may not exist on older test records. Default to `'SERUM'`.
- Some tests have `bioReference` field, others have `referenceRange`, `ref`, or `refText_snapshot`. Check those fallbacks (implementation includes all four).
- The `testGroups` array may have one or many groups. Each group has `name` and `tests[]`.
- `jsPDF-autotable` `colSpan` on body cells works via: `{ content: '...', colSpan: 4, styles: {...} }`
- For page count after autoTable, use `doc.internal.getNumberOfPages()`
- Images must be loaded via `imageToBase64()` from `assetPath.js` — do not change this pattern
- Always wrap image loading in try/catch with text/line fallback

---

## 🚫 DO NOT DO

- Do not add a barcode (Hygea has one, HEALit does not — skip it)
- Do not change the `CORPORATE` static text format
- Do not add new npm imports
- Do not change invoice page layout
- Do not change the database schema or service files
- Do not remove existing export functions
- Do not use fixed `footerY = 280` hardcoded values — use constants
