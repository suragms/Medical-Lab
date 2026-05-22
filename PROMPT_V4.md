# PROMPT_V4.md — Cursor Execution Prompt (Phase 8)
## Lab Report PDF — Client Change Requests from WhatsApp (12 May 2026)

> **File:** `src/utils/labReportPdfGenerator.js` (primary)
> **Mirror:** `src/utils/combinedPdfGenerator.js` (same changes where applicable)
> **Model spec update:** `contextmd/FILE_SPEC.md`
> **Tracking update:** `contextmd/TRACK.md`

---

## ⚠️ CRITICAL RULES (carry over always)

1. LIVE PRODUCTION APP — do not break anything
2. Preserve all existing export function names and signatures exactly
3. No new npm packages
4. Keep all `async/await` + image `try/catch` + fallbacks intact
5. Do NOT touch `invoicePdfGenerator.js` or invoice layout
6. Do NOT touch billing, auth, dashboard, or any non-PDF files unless listed below

---

## 📋 TASK LIST — Client Requested Changes

### ✅ TASK 1 — Remove IP/OP row from patient header
**Client said:** "op/ip not needed"
**File:** `src/utils/labReportPdfGenerator.js` → `drawPageHeader` → `leftFields` array
**Action:** Delete the line `['IP/OP', 'OP']` from `leftFields`
**Result:** Patient header left column shows only: NAME, LAB NO., AGE/SEX, PH NO (4 rows, not 5)

---

### ✅ TASK 2 — Remove RECIEVED ON row from patient header
**Client said:** "remove the recieve on date time"
**File:** `src/utils/labReportPdfGenerator.js` → `drawPageHeader` → `rightFields` array
**Action:** Delete the line `['RECIEVED ON', times.received ? formatDateTime(times.received) : '-']` from `rightFields`
**Result:** Right column shows only: COLLECTED ON, REPORTED ON, REFERRED BY, CORPORATE (4 rows, not 5)
> NOTE: Left and right columns now both have 4 rows — spacing stays uniform using `index * 5.5`

---

### ✅ TASK 3 — Remove "Sample Type" column entirely
**Client said:** "this column not needed" (circled the SERUM / Sample Type column)
**Files:** `src/utils/labReportPdfGenerator.js`

**Sub-steps:**
1. In `COL_WIDTHS` — delete `sampleType: 21`
2. In `COL_X` — delete `sampleType: ...` entry
3. Redistribute the 21mm freed space: add it to `bioRef` → `bioRef: 73` (was 52)
4. Recalculate `COL_X.bioRef` = `MARGIN + COL_WIDTHS.testDesc + COL_WIDTHS.result`
5. In `drawTableHeader` — remove `doc.text('Sample\nType', ...)` call entirely
6. In `drawTestRow` — remove the `doc.text(test.sampleType || ...)` block entirely
7. In `measureTestRow` — `resultLines` calculation remains; remove any sampleType width references

**Result:** Table has 3 columns only: Test Description | Results & Unit | Biological Reference Interval

---

### ✅ TASK 4 — Value and Unit on the SAME line (inline)
**Client said:** "unit should be in the same line" (circled "80" on one line and "mg/dl" below it)
**File:** `src/utils/labReportPdfGenerator.js` → `drawTestRow`

**Current behaviour:** value rendered at `baseY`, unit rendered at `baseY + 4.2` (two lines)
**Required behaviour:** Render as single string `"80 mg/dl"` on one line at `baseY`

**Action in `drawTestRow`:**
```js
// BEFORE
doc.text(value, COL_X.result + COL_WIDTHS.result / 2, baseY, { align: 'center' });
if (unit) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(unit, COL_X.result + COL_WIDTHS.result / 2, baseY + 4.2, { align: 'center' });
}

// AFTER
const displayResult = unit ? `${value} ${unit}` : value;
doc.text(displayResult, COL_X.result + COL_WIDTHS.result / 2, baseY, { align: 'center' });
```

**Action in `measureTestRow`:**
```js
// BEFORE
const resultLines = getResultParts(test).unit ? 2 : 1;

// AFTER
const resultLines = 1; // value+unit now always one line
```

---

### ✅ TASK 5 — Remove group sub-header row (the centered "FBS" / section title row)
**Client said:** "nOt needed" (circled the "FBS" text appearing as a sub-header in the Results & Unit column area)
**File:** `src/utils/labReportPdfGenerator.js` → `renderTestTable`

**Current behaviour:** `drawGroupRow(doc, y, group.name)` renders a centered bold "FBS" / "Kidney Function Test (KFT)" row with underline before each test group

**Required behaviour:** Skip the group header row entirely — tests print directly after the table header

**Action in `renderTestTable`:**
```js
// BEFORE
groups.forEach((group) => {
  y = drawGroupRow(doc, y, group.name);
  group.tests.forEach((test) => {
    y = drawTestRow(doc, y, test);
  });
});

// AFTER
groups.forEach((group) => {
  group.tests.forEach((test) => {
    y = drawTestRow(doc, y, test);
  });
});
```

> The `drawGroupRow` function can remain in the file (do not delete it) in case it is needed later. Just stop calling it.

---

### ✅ TASK 6 — Draw a border box around the body content area
**Client said:** "print format body inside box"
**File:** `src/utils/labReportPdfGenerator.js`

**Action:** After the table is fully rendered and before "*End of Report*" text, draw a rectangle border around the entire table body area.

Add a helper constant:
```js
const BODY_BOX_TOP_OFFSET = 0; // flush with table header top
```

In `renderLabReportSection`, after `yPos = renderTestTable(...)` returns, draw a rect:
```js
// Draw border box around the entire table body (header top → last row bottom)
doc.setDrawColor(...COLOR.border);
doc.setLineWidth(0.4);
doc.rect(MARGIN, tableStartY, CONTENT_W, yPos - tableStartY);
```

To do this, capture `tableStartY` just before calling `renderTestTable`:
```js
const tableStartY = yPos; // capture Y before table renders
yPos = renderTestTable(doc, yPos, testGroups);
// draw box
doc.setDrawColor(...COLOR.border);
doc.setLineWidth(0.4);
doc.rect(MARGIN, tableStartY, CONTENT_W, yPos - tableStartY);
```

> This draws a clean rectangle border around the full results table including the header row and all test rows — matching the "box" layout the client sees in the reference PDF.

---

### ✅ TASK 7 — Mirror all above changes in combinedPdfGenerator.js
**File:** `src/utils/combinedPdfGenerator.js`

Check if `combinedPdfGenerator.js` has its own `drawPageHeader` / `drawTableHeader` / `drawTestRow` / `renderTestTable` logic (it may call `renderLabReportSection` from `labReportPdfGenerator.js` or have its own copy).

- If it **imports and calls** `renderLabReportSection` → changes automatically apply, no action needed
- If it has **its own duplicate** of those functions → apply TASKS 1–6 identically to those duplicate functions

---

### ✅ TASK 8 — Update FILE_SPEC.md to reflect removed fields
**File:** `contextmd/FILE_SPEC.md`

In the **Patient Header Fields** table:
- Delete row: `IP/OP | 'OP' (always OP) | 'OP'`
- Delete row: `RECIEVED ON | times.received → formatDateTime() | '—'`

In the **Test Row Fields** table:
- Delete row: `Sample Type | test.sampleType | 'SERUM'`
- Update row: `Unit | now rendered inline with value as "value unit" string | ''`

In the **Group Header Row** section:
- Add note: `Group sub-header row is NOT rendered in current version (removed per client request V4)`

---

### ✅ TASK 9 — Update TRACK.md
**File:** `contextmd/TRACK.md`

Add a new entry:
```
## V4 — 12 May 2026
- Removed IP/OP from patient header (left column)
- Removed RECIEVED ON from patient header (right column)
- Removed Sample Type column from results table (bioRef column widened to 73mm)
- Value and unit now rendered on same line: "80 mg/dl"
- Group sub-header row removed (drawGroupRow no longer called)
- Border box drawn around full results table body
- Mirrored in combinedPdfGenerator.js
```

---

## 📁 FILES TO MODIFY (summary)

| File | Changes |
|------|---------|
| `src/utils/labReportPdfGenerator.js` | TASKS 1, 2, 3, 4, 5, 6 |
| `src/utils/combinedPdfGenerator.js` | TASK 7 (mirror if needed) |
| `contextmd/FILE_SPEC.md` | TASK 8 |
| `contextmd/TRACK.md` | TASK 9 |

**Do NOT touch any other files.**

---

## 🔍 VALIDATION CHECKLIST (run before declaring done)

After all edits, verify each point by reading the modified file:

- [ ] `leftFields` in `drawPageHeader` has exactly 4 items — no `IP/OP` entry
- [ ] `rightFields` in `drawPageHeader` has exactly 4 items — no `RECIEVED ON` entry
- [ ] `COL_WIDTHS` has no `sampleType` key
- [ ] `COL_X` has no `sampleType` key
- [ ] `COL_WIDTHS.bioRef` is `73` (was 52, gained 21 from removed sampleType)
- [ ] `drawTableHeader` renders exactly 3 column headers: Test Description, Results & Unit, Biological Reference Interval
- [ ] `drawTestRow` renders value and unit as a single `"value unit"` string on one line — no second `doc.text` for unit alone
- [ ] `measureTestRow` uses `resultLines = 1` (not conditional on unit)
- [ ] `renderTestTable` does NOT call `drawGroupRow` inside the loop
- [ ] `drawGroupRow` function still EXISTS in file (just not called)
- [ ] `renderLabReportSection` captures `tableStartY` before calling `renderTestTable`
- [ ] `renderLabReportSection` draws `doc.rect(MARGIN, tableStartY, CONTENT_W, yPos - tableStartY)` after table renders
- [ ] `FILE_SPEC.md` updated — IP/OP, RECIEVED ON, Sample Type rows removed
- [ ] `TRACK.md` has V4 entry dated 12 May 2026
- [ ] No TypeScript/JS syntax errors (check bracket matching)
- [ ] No broken imports or missing variables
- [ ] All `async/await` and `try/catch` blocks for images are still intact

---

## 🚀 EXECUTION ORDER

1. Open `src/utils/labReportPdfGenerator.js`
2. Apply TASK 1 → TASK 6 in order
3. Open `src/utils/combinedPdfGenerator.js` → apply TASK 7
4. Open `contextmd/FILE_SPEC.md` → apply TASK 8
5. Open `contextmd/TRACK.md` → apply TASK 9
6. Run full validation checklist above
7. Done — no deploy steps needed (Netlify auto-deploys on push)
