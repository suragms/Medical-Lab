# FILE_SPEC.md — Detailed Field & Format Specification
## Lab Report PDF — HEALit Med Laboratories

---

## 1. DATA FIELD MAPPING

### Patient Header Fields

| Display Label | Data Source | Fallback |
|---------------|-------------|---------|
| NAME | `patient.name` | '-' |
| LAB NO. | `patient.visitId` | '-' |
| AGE/SEX | `${patient.age} Years / ${patient.gender}` | '-' |
| PH NO | `patient.phone` | '-' |
| COLLECTED ON | `times.collected` → `formatDateTime()` | '—' |
| REPORTED ON | `times.reported` → `formatDateTime()` | `formatDateTime(new Date())` |
| REFERRED BY | `patient.referredBy` | 'SELF' |
| CORPORATE | Static: `'THYROCARE LAB, KUNNATHPEEDIKA'` | — |

### Test Row Fields

| Table Column | Data Source | Fallback |
|-------------|-------------|---------|
| Test Description | `test.name \|\| test.description` | '-' |
| Results (value) | `test.value` | `'-'` |
| Unit | Rendered inline with value as a single `"value unit"` string in the Results & Unit column (not a separate line) | `''` |
| Bio. Reference Interval | `test.bioReference \|\| test.referenceRange \|\| test.ref \|\| test.refText_snapshot` | '-' |

### Group Header Row Field

> **V4:** Group sub-header row is **not** rendered in the current PDF (removed per client request). The `drawGroupRow` helper remains in code for possible future use.

| Display | Data Source | Fallback |
|---------|-------------|---------|
| Section name | `group.name` | `'TEST RESULTS'` |

---

## 2. PAGE LAYOUT COORDINATES (A4, mm)

```
┌─────────────────────────────────────────────────────────────────┐ y=0
│  y=12: Top margin start                                          │
│  y=12: Logo row (HEALit left, title center, Thyrocare right)    │
│  y=36: Centre subtitle "Kunnathpeedika Centre"                   │
│  y=41: Contact line                                              │
│  y=46: Separator line ─────────────────                         │
│  y=51: Header fields start (NAME, LAB NO., etc.)                │
│  y=51: Left col x=15   Right col x=110                          │
│  y=51  NAME : ...      COLLECTED ON : ...                        │
│  y=56  LAB NO. : ...   REPORTED ON  : ...                        │
│  y=61  AGE/SEX : ...   REFERRED BY  : ...                        │
│  y=66  PH NO   : ...   CORPORATE    : ...                        │
│  y=71: Separator line ─────────────────                         │
│  y=76: Table starts (manual layout; page breaks via ensureSpace) │
│                                                                  │
│  [Results table: header + rows; V4 border box when single-page]  │
│                                                                  │
│  y=270: (reserved bottom margin; no per-page footer in V4+)       │
│  y=285: (end of content area / signature area)                  │
│  y=297: Page bottom                                              │
└─────────────────────────────────────────────────────────────────┘ y=297
```

---

## 3. TYPOGRAPHY SPECIFICATION

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Lab name title | helvetica | 20pt | bold | black |
| Centre subtitle | helvetica | 11pt | normal | gray (75,85,99) |
| Contact line | helvetica | 9pt | normal | gray (75,85,99) |
| Header label | helvetica | 9pt | bold | darkGray (60,60,60) |
| Header value | helvetica | 9pt | normal | black |
| Table header | helvetica | 9pt | bold | darkGray |
| Test name | helvetica | 9.5pt | bold | black |
| Result value (normal) | helvetica | 9.5pt | normal | black |
| Result value (HIGH) | helvetica | 9.5pt | bold | red (185,28,28) |
| Result value (LOW) | helvetica | 9.5pt | bold | blue (29,78,216) |
| Result + unit (inline) | helvetica | 8.8pt | bold for cell; same line as `"value unit"` | status color |
| Bio ref text | helvetica | 7.5pt | normal | black |
| Group header row | *(not rendered in V4 PDF)* | — | — |
| End of report | helvetica | 8pt | italic | midGray (107,114,128) |
| Page X of Y | *(not rendered — footer removed V4+)* | — | — | — |
| Sig label | helvetica | 7pt | normal | gray (75,85,99) |
| Sig name | helvetica | 8pt | bold | near-black (17,17,17) |
| Sig qualification | helvetica | 7pt | normal | midGray (102,102,102) |

---

## 4. TABLE SPECIFICATION

### Header Row (3 columns — V4)
```
┌────────────────────────────┬─────────────────┬──────────────────────────────────────────┐
│ Test Description           │ Results & Unit   │ Biological Reference Interval           │
│ (left align, bold)         │ (center align)   │ (left align)                             │
│ Width: 72mm                │ Width: 35mm      │ Width: 73mm (was 52mm + former Sample col)│
└────────────────────────────┴─────────────────┴──────────────────────────────────────────┘
Fill: COLOR.headerFill [240,240,240]
Text: COLOR.darkGray [60,60,60]
Border: COLOR.border [180,180,180], lineWidth: 0.3
```

### Group Header Row (section separator)

Not drawn in V4 (see §1 Group Header Row Field).

### Data Row (Normal)
```
┌──────────────────────────┬──────────────────┬────────────────────────────────────────────┐
│ COLOUR                   │ Pale Yellow      │ Pale yellow                                │
└──────────────────────────┴──────────────────┴────────────────────────────────────────────┘
Fill: white [255,255,255]
Border: [200,200,200], lineWidth: 0.1
```

### Data Row (Abnormal HIGH)
```
┌──────────────────────────┬──────────────────┬────────────────────────────────────────────┐
│ URIC ACID                │ ██8.5 mg/dL██    │ FEMALE: 2.6 - 6.0                          │
└──────────────────────────┴──────────────────┴────────────────────────────────────────────┘
Result text: COLOR.highText [185,28,28], bold (full inline string value + unit)
```

### Table body border (V4)

After all rows render, a single rectangle (`doc.rect`) is drawn with `COLOR.border`, `lineWidth` 0.4mm, from the table header top through the last row bottom **only when the entire table fits on one page** (if `addPage` ran during the table, the box is skipped so coordinates are not misaligned across pages).

### Multi-line Bio Reference Example
```
Bio Reference cell content for ALBUMIN:
"- : Negative
+/- : Positive (15mg/dL)
+ : Positive (30 mg/dL)
++ : Positive (100mg/dL)
+++: Positive (300 mg/dL)"

Bio reference uses `splitTextToSize` for wrapping within the 73mm column
```

---

## 5. FOOTER SPECIFICATION (Every Page)

V4+ (client request, 22 May 2026): **No per-page footer** — no horizontal rule, no page number, no logo, no address block. Signature block on the last page only (see section 6).

---

## 6. SIGNATURE BLOCK (Last Page Only)

```
y=SIG_FOOTER_Y (≈269mm):

  x=15:    "Verified by:"                    x=(PAGE_W-65): "Authorized by:"
           [rakhi-signature.png              [aparna-signature.png
            28w × 11h mm]                    28w × 11h mm]
  y+17:    "Rakhi T.R"  (bold 8pt)          "Aparna A.T"  (bold 8pt)
  y+21:    "DMLT"  (normal 7pt, gray)       "Incharge"  (normal 7pt, gray)
```

**Note:** Signature block is drawn on the last page only; there is no per-page footer below it (V4+).

---

## 7. COMBINED PDF PAGE ORDER

```
Page 1:   Invoice (generateInvoicePage — UNCHANGED)
Page 2:   Lab Report — Profile 1 header + table
Page 3+:  (overflow pages for Profile 1 if tests > 1 page)
Page N:   Lab Report — Profile 2 header + table
...
```

Each profile section starts a fresh page with full header. Per-page footers are not rendered (V4+).

---

## 8. KNOWN DATA QUIRKS

### bioReference field inconsistency
Tests can have reference range in different fields depending on when the profile was created:
```javascript
const bioRef = test.bioReference      // Primary field
  || test.referenceRange              // Alternate
  || test.ref                         // Short form
  || test.refText_snapshot            // Snapshot from profile
  || '-';                             // Default
```

### sampleType in data vs PDF
Many existing test records do not have `sampleType`; the app/data layer may still default to `'SERUM'`. **V4 lab report PDF does not render a Sample Type column** (client request); the field remains on tests for forms and other uses.

### value can be 0
A value of `0` is a valid result. Do not falsy-check value.
```javascript
// WRONG:
const value = test.value || '-';  // 0 becomes '-'

// CORRECT:
const value = (test.value !== undefined && test.value !== null && test.value !== '') 
  ? String(test.value) : '-';
```

### testGroups vs flat tests
`reportData.testGroups` is an array of groups. Each group has:
- `group.name` — string; used internally for grouping only in V4 (no PDF sub-header row)
- `group.tests` — array of test objects

V4 does not render a per-group sub-header row before tests.

---

## 9. IMPORT PRESERVATION

Both files must keep these exact imports at top:
```javascript
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { LOGO_PATHS, SIGNATURE_PATHS, imageToBase64 } from './assetPath';
```

No additional imports needed.

---

## 10. EXPORT PRESERVATION

### labReportPdfGenerator.js — must export:
```javascript
export const generateLabReportPDF = async (reportData, options = {}) => { ... };
export const downloadLabReport = async (reportData, fileName, options = {}) => { ... };
export const printLabReport = async (reportData, options = {}) => { ... };
export const getLabReportBlob = async (reportData, options = {}) => { ... };
```

### combinedPdfGenerator.js — must export (all unchanged):
```javascript
export const generateCombinedPDF = async (visitData, profiles = [], options = {}) => { ... };
export const generateLabReportsOnly = async (visitData, profiles = [], options = {}) => { ... };
export const shareCombinedPDFViaWhatsApp = async (visitData, profiles = [], phoneNumber) => { ... };
export const shareCombinedPDFViaEmail = async (visitData, profiles = [], emailAddress) => { ... };
export default { generateCombinedPDF, shareCombinedPDFViaWhatsApp, shareCombinedPDFViaEmail };
```

---

## 11. PRINT/DOWNLOAD FLOW (UNCHANGED)

These utility wrappers remain identical — only `generateLabReportPDF` internal changes:

```javascript
export const downloadLabReport = async (reportData, fileName, options = {}) => {
  const doc = await generateLabReportPDF(reportData, options);
  const name = fileName || `${reportData.patient?.visitId || 'Report'}-${...}.pdf`;
  doc.save(name);
};

export const printLabReport = async (reportData, options = {}) => {
  const doc = await generateLabReportPDF(reportData, options);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => setTimeout(() => printWindow.print(), 250);
  } else {
    // iframe fallback — keep existing code
  }
};
```
