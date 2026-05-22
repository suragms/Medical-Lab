# PROMPT_V3.md — Cursor Execution Prompt (Phase 7)
## Hygea Parity Round 2 — Signature labels, Method line, Profile-form fields

This builds on `PROMPT_V2.md`. V2 fixed table/footer/header layout. V3 fixes the
**content gaps** the client flagged after testing the V2 build.

---

## ⚠️ CRITICAL RULES (carry over from V1/V2)

1. LIVE PRODUCTION APP — do not break anything
2. Preserve all existing export function names and signatures
3. No new npm packages
4. Keep all `async/await` + image `try/catch` + fallbacks
5. Do NOT touch `invoicePdfGenerator.js` or invoice layout
6. Lint-only fixes are permitted in `combinedPdfGenerator.js#generateInvoicePage`

---

## 🎯 What's still wrong (after V2 deploy)

Two screenshots confirm V2 layout is correct, but content is wrong:

| # | Bug | Source |
|---|---|---|
| 1 | Sig labels say "RAKHI T.R / DMLT" + "APARNA A.T / Incharge" | Hygea reference shows **"APARNA SARATH / BSC MLT"** (Verified by) and **"DR. ROHIT RS / DCP, MD (Consultant Pathologist)"** (Authorized by) |
| 2 | No "Method: ..." line under each test row | Hygea reference shows small italic "Method: Manual Microscopy", "Method: Ehrlich Reaction", etc. — currently absent in our output |
| 3 | Bio.Ref column is too short (single line "7.94 - 20.07") | Hygea shows multi-line grading scales ("- : Negative / +/-: 15 Leu/μL / + : 70 Leu/μL / ++: 125 Leu/μL / +++: 500 Leu/μL"). PDF supports multi-line; the **data was never entered** because the form has no good UX hint and (point 4) no `method` / `sampleType` fields. |
| 4 | Profile/test creation form has no `method` field, no `sampleType` field | Add them so admin can enter the missing data per test |

---

## 📁 Files to modify

| File | Change |
|---|---|
| `src/utils/labReportPdfGenerator.js` | Sig labels + Method italic line via `didDrawCell` |
| `src/utils/combinedPdfGenerator.js` | Mirror the same in `generateLabReportPage` only |
| `src/models/dataModels.js` | Add `method`, `sampleType` to `TestMaster` and `TestSnapshot` |
| `src/pages/Admin/ProfileManager.jsx` | New Method text input + Sample Type dropdown (new-test form + edit table) |
| `src/features/results/ResultEntryPage.jsx` | Snapshot `bioReference`, `method`, `sampleType` in both snapshot blocks; pass through in `getReportData` |
| `contextmd/TRACK.md`, `contextmd/MISMATCH.md` | Doc updates |

---

## 🖋️ FIX 1 — Signature labels match Hygea exactly

In `labReportPdfGenerator.js#drawSignatureBlock` and
`combinedPdfGenerator.js#drawLabReportSignatureFooter`:

Replace:
```javascript
doc.text('RAKHI T.R',  MARGIN,       SIG_START_Y + 21);
doc.text('DMLT',       MARGIN,       SIG_START_Y + 24);
doc.text('APARNA A.T', RIGHT_SIG_X,  SIG_START_Y + 21);
doc.text('Incharge',   RIGHT_SIG_X,  SIG_START_Y + 24);
```

With:
```javascript
doc.text('APARNA SARATH', MARGIN,      SIG_START_Y + 21);
doc.text('BSC MLT',       MARGIN,      SIG_START_Y + 24);
doc.text('DR. ROHIT RS',                          RIGHT_SIG_X, SIG_START_Y + 21);
doc.text('DCP, MD (Consultant Pathologist)',      RIGHT_SIG_X, SIG_START_Y + 24);
```

The right-side qualification is long; render at fontSize 6.5 if needed so it
doesn't overflow the right margin (`PAGE_W - MARGIN = 195`, sig block starts
at x=152, available width ≈ 43mm).

Image references (`SIGNATURE_PATHS.rakhi`, `.aparna`) are kept as-is — only
the text labels change. Admin can swap the asset files later.

---

## 🧪 FIX 2 — Method italic line below test rows

When `test.method` is non-empty, render below the test row:

```
Method:  Manual Microscopy
```

Style: helvetica italic, 7.5pt, gray `[120,120,120]`, indented to col 0 + 3mm.

**Approach:** the cleanest way is to *include the method as a second line
inside the Test Description cell* with a smaller italic style. autoTable
doesn't support per-line styling, so we use `didDrawCell` for col 0:

1. Bump `minCellHeight` for rows with method: from `8` to `13`.
2. In `didDrawCell` for `column.index === 0` and not group rows: if the
   matching `flatTests[idx].method` is set, draw `Method: <text>` at
   `y + height - 2.5` in italic 7.5pt gray.

Track `flatTests` like we already do. The test name stays as the primary
content of col 0 (bold 9.5pt black), the method renders below it.

---

## 🧾 FIX 3 — Profile form: Method input + SampleType dropdown

In `ProfileManager.jsx` `newTest` state:
```javascript
const [newTest, setNewTest] = useState({
  description: '',
  unit: '',
  bioReference: '',
  method: '',          // NEW
  sampleType: 'SERUM', // NEW (default)
  price: ''
});
```

In `handleAddTest`, include both fields when pushing into
`formData.tests[]`. Reset them after.

UI: add two new columns to the edit table, two new inputs to the "Add New
Test" form below it.

Sample type options: `SERUM`, `URINE`, `BLOOD`, `PLASMA`, `STOOL`, `WHOLE BLOOD`, `OTHER`.

Method placeholder: `e.g., Manual Microscopy, Ehrlich Reaction, Glucose oxidase – peroxidase method`.

---

## 🗂 FIX 4 — dataModels + ResultEntryPage

`dataModels.js`:

```javascript
// TestMaster — add:
this.method = data.method || '';
this.sampleType = data.sampleType || 'SERUM';

// TestSnapshot — add:
this.method_snapshot     = data.method_snapshot     || data.method     || '';
this.sampleType_snapshot = data.sampleType_snapshot || data.sampleType || 'SERUM';
```

`ResultEntryPage.jsx` — both snapshot constructor blocks (search for
`name_snapshot:` and add right after `refText_snapshot:`):

```javascript
bioReference_snapshot: test.bioReference,    // already in model, was missed
method_snapshot:       test.method,
sampleType_snapshot:   test.sampleType,
```

In `getReportData`'s test mapping (where `unit` and `bioReference` are
already exposed), add:

```javascript
method:     test.method     || test.method_snapshot     || '',
sampleType: test.sampleType || test.sampleType_snapshot || 'SERUM',
```

---

## ✅ VALIDATION CHECKLIST

```
[x] Sig footer reads APARNA SARATH / BSC MLT (left) + DR. ROHIT RS / DCP, MD (Consultant Pathologist) (right)
[x] Long qualification text doesn't overflow right margin (rendered at fontSize 6.5)
[x] Test rows with test.method show "Method: <text>" italic 7.5pt gray below the test name
[x] Test rows without test.method are unchanged in height (rowMinHeight = 8 when no unit/method)
[x] ProfileManager: new "Method" text input + "Sample Type" dropdown both in the new-test form AND the edit table
[x] Newly created tests carry method + sampleType into formData.tests
[x] Editing an existing test's method/sampleType updates the profile correctly via updateTestInProfile
[x] dataModels TestMaster + TestSnapshot have new fields with safe defaults
[x] ResultEntryPage both snapshot blocks write method_snapshot + sampleType_snapshot + bioReference_snapshot
[x] getProfileGroupedTests passes method + sampleType through to the PDF generator
[x] PDF Sample Type column now shows whatever the test's sampleType is (URINE/BLOOD/etc.) instead of always SERUM
[x] eslint: no NEW errors introduced on touched files (pre-existing lint debt unchanged)
[x] vite production build: succeeds (7.94s)
[x] Invoice page output is byte-equivalent to before (generateInvoicePage untouched)
```

---

## STATUS: V3 COMPLETE

- All 5 production files updated: `dataModels.js`, `ProfileManager.jsx`, `ResultEntryPage.jsx`, `labReportPdfGenerator.js`, `combinedPdfGenerator.js` (+ `loadSampleData.js` for dev seed data)
- Vite dev server running at http://localhost:3000 (HMR will hot-swap on next page load)
- Manual retest path:
  1. Admin → Profile Manager → edit/create a profile
  2. Add a test with **Method = "Manual Microscopy"** and **Sample Type = URINE**, plus multi-line bio reference like:
     ```
     - : Negative
     +/- : Positive (15 mg/dL)
     + : Positive (30 mg/dL)
     ++ : Positive (100 mg/dL)
     +++: Positive (300 mg/dL)
     ```
  3. Add that test to a visit, enter a result
  4. Generate the lab report PDF — confirm:
     - Sig footer reads `APARNA SARATH / BSC MLT` and `DR. ROHIT RS / DCP, MD (Consultant Pathologist)`
     - Each row shows `Method: Manual Microscopy` in small italic gray
     - Sample Type column shows `URINE` (not the default `SERUM`)
     - Bio Reference column renders the multi-line grading scale
