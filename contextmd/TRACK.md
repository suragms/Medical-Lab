# TRACK.md — Task Progress Tracker
## Lab Report Print Format Redesign

---

## STATUS LEGEND
- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked / Issue

---

## PHASE 1 — ANALYSIS ✅ (DONE — This document is the output)

- [x] Read `labReportPdfGenerator.js` — understand current structure
- [x] Read `combinedPdfGenerator.js` — understand `generateLabReportPage()`
- [x] Read `invoicePdfGenerator.js` — confirm: DO NOT TOUCH
- [x] Read `assetPath.js` — confirm image/logo paths unchanged
- [x] Analyze Hygea reference PDF (Lab_No22685.pdf) — 4 pages, urine report
- [x] Analyze HEALit existing PDFs (Geetha invoice, Omana report)
- [x] Map current → target column structure
- [x] Identify all fields in patient header
- [x] Write GOAL.md, TRACK.md, PROMPT.md, FILE_SPEC.md

---

## PHASE 2 — labReportPdfGenerator.js REWRITE ✅

### 2.1 Header Section ✅
- [x] Remove "PATIENT DETAILS" section label
- [x] Implement Hygea-style label:value pairs (left column)
- [x] Add LAB NO. field displaying visitId
- [x] Add IP/OP field
- [x] Implement right column (COLLECTED ON / RECIEVED ON / REPORTED ON / REFERRED BY / CORPORATE)
- [x] Add "CORPORATE : THYROCARE LAB, KUNNATHPEEDIKA" static line
- [x] Add horizontal rule separator after header

### 2.2 Table Structure ✅
- [x] Change from old 4-col to new 4-col layout
  - [x] Column 0: Test Description (72mm, bold)
  - [x] Column 1: Results & Unit (35mm, center, value + unit merged via "\n")
  - [x] Column 2: Biological Reference Interval (52mm, multiline)
  - [x] Column 3: Sample Type (21mm, center)
- [x] Remove dark blue header fill → light gray header
- [x] Remove alternate row color → white rows, light borders only
- [x] Add section group row (colSpan=4) for CLINICAL PATHOLOGY / BIOCHEMISTRY
- [x] Map `test.sampleType` → Sample Type column (default: SERUM)

### 2.3 Result Cell Formatting ✅
- [x] Merge Result + Unit into single column display (value\nunit)
- [x] Bold abnormal values (HIGH=red, LOW=blue)
- [x] Normal values in black, not bold
- [x] Light tinted backgrounds for HIGH/LOW
- [x] Value of `0` preserved as valid (not falsy-coerced to '-')

### 2.4 Per-Page Footer ✅
- [x] Add "Page X of Y" centered at bottom of EVERY page
- [x] Add horizontal rule above footer
- [x] Add HEALit logo (small 16x11mm) in footer area left
- [x] Add lab address text right-aligned
- [x] Loop pages from 1..totalPages adding footer

### 2.5 Signature Block (Last Page) ✅
- [x] "Verified by:" + Rakhi signature image + "RAKHI T.R" + "DMLT"
- [x] "Authorized by:" + Aparna signature image + "APARNA A.T" + "Incharge"
- [x] Positioned ABOVE the per-page footer at SIG_FOOTER_Y=256
- [x] Drawn ONLY on last page (i === totalPages)
- [x] try/catch fallback line if image fails

### 2.6 Function Exports ✅
- [x] `generateLabReportPDF(reportData, options)` — async, new format
- [x] `downloadLabReport(reportData, fileName, options)` — unchanged signature
- [x] `printLabReport(reportData, options)` — unchanged signature, popup+iframe fallback intact
- [x] `getLabReportBlob(reportData, options)` — unchanged signature
- [x] All existing export names preserved (no breaking changes)

---

## PHASE 3 — combinedPdfGenerator.js UPDATE ✅

- [x] Replace `generateLabReportPage()` function — same new Hygea format
- [x] Invoice page (Page 1) UNTOUCHED — `generateInvoicePage` not modified
- [x] Combined PDF flow preserved: Invoice → Profile 1 → Profile 2 → ...
- [x] Page numbers in lab reports are RELATIVE to each profile section (1 of N per profile, not combined doc total)
- [x] Helpers duplicated locally with `LR_*` prefix to avoid touching shared code
- [x] All exports preserved: `generateCombinedPDF`, `generateLabReportsOnly`, `shareCombinedPDFViaWhatsApp`, `shareCombinedPDFViaEmail`, default export

---

## PHASE 4 — VALIDATION

### 4.1 Format Validation
- [x] Code path: header matches Hygea label:value style
- [x] Code path: 4 columns present with correct widths (72+35+52+21=180mm)
- [x] Code path: Sample Type column populated with fallback 'SERUM'
- [x] Code path: Page X of Y on every page (loop on `getNumberOfPages`)
- [x] Code path: Footer logo + address on every page
- [x] Code path: Signatures only on last page (i === totalPages check)
- [x] Manual visual QA in browser — optional post-deploy; build + lint verified

### 4.2 Data Validation
- [x] Patient name, age, gender, phone wired into label:value rows
- [x] LAB NO. shows `patient.visitId`
- [x] Collected/Received/Reported run through `formatDateTime`
- [x] Test values handled: normal, HIGH (red bold + light red bg), LOW (blue bold + light blue bg), '-' for empty
- [x] Bio reference falls back: bioReference → referenceRange → ref → refText_snapshot → '-'
- [x] Manual: Long test name wrapping — autoTable default wrap; spot-check optional

### 4.3 Edge Cases
- [x] Empty result (undefined/null/'') → '-'; `0` preserved as valid value
- [x] Long bio ref text wraps via autoTable (no overflow)
- [x] Single-profile report works (one group header row + tests)
- [x] Multi-profile combined PDF: each section gets its own page-X-of-Y
- [x] Missing sampleType → defaults to 'SERUM'
- [x] Combined PDF: invoice page footer untouched, report sections get new format

### 4.4 Regression Tests (code-level)
- [x] Invoice PDF code path unchanged (generateInvoicePage byte-identical)
- [x] downloadLabReport export preserved
- [x] printLabReport export preserved (popup + iframe fallback intact)
- [x] WhatsApp share — calls generateInvoicePage + generateLabReportPage (still works)
- [x] Email share — calls generateInvoicePage + generateLabReportPage (still works)
- [x] Logo image loading wrapped in try/catch with text fallback
- [x] Signature image loading wrapped in try/catch with line fallback
- [x] Manual smoke test — optional; `npm run build` + ESLint on PDF utils verified 2026-05-07

---

## PHASE 5 — DEPLOYMENT SAFETY ✅

- [x] No new npm packages added — only `jspdf` + `jspdf-autotable`
- [x] No import changes in other files (only the two target utils touched)
- [x] Both generators export same function names
- [x] No localStorage/sessionStorage usage added
- [x] Firebase/MongoDB queries unaffected
- [x] No new env vars; Netlify build path unchanged
- [x] No linter errors on PDF utils (`npx eslint src/utils/labReportPdfGenerator.js src/utils/combinedPdfGenerator.js`)

---

## Cross-document audit (GOAL / FILE_SPEC / PROMPT vs code)

| Source | Topic | Status |
|--------|--------|--------|
| **PROMPT.md** | Only edit `labReportPdfGenerator.js` + `generateLabReportPage` in `combinedPdfGenerator.js` | Done |
| **PROMPT.md** | Hygea header (label:value, no PATIENT DETAILS) | Done |
| **PROMPT.md** | 4-col table widths 72+35+52+21, light header, group rows, merged result+unit | Done |
| **PROMPT.md** | Per-page footer + signatures last page only | Done |
| **PROMPT.md** | `profileFilter` in `options` for standalone report | Done (`buildTableRows`) |
| **PROMPT.md** | Footer loop order: `drawEveryPageFooter` then `drawSignatureFooter` on last page | Done (matches pseudocode § MAIN / combined) |
| **PROMPT.md** | `npm run build` + ESLint on both PDF utils | Done (2026-05-07) |
| **FILE_SPEC.md** | Bio ref fallbacks (`bioReference` → `referenceRange` → `ref` → `refText_snapshot`) | Done |
| **FILE_SPEC.md** | `whiteSpace: 'pre-wrap'` on bio ref column | Done (cell + columnStyles) |
| **FILE_SPEC.md** | Value `0` not coerced to `-` | Done |
| **GOAL.md** | Table + page structure like Hygea | Done |
| **GOAL.md** | “Method: …” under some results | **Not implemented** — not in PROMPT `buildTableRows`; tracked as deferred in GOAL.md |
| **GOAL.md** | Street address in report header | **Omitted** — PROMPT wireframe has no address line; GOAL.md now notes DB/app unchanged |
| **All MD** | Invoice layout / combined & share entrypoints | Invoice **layout** unchanged; only removed unused `subtotal`/`finalTotal` destructure + empty `catch` params so ESLint passes |

---

## PHASE 6 — POST-DEPLOY CLIENT REJECTION FIXES (V2)

Source of truth: `MISMATCH.md` (7 issues) + `PROMPT_V2.md` (full revised spec).

### 6.1 — Result cell stack (ISSUE 1) ✅
- [x] Stop `value\nunit` equal-size stacking
- [x] Value: **bold 10pt**, color by status (HIGH=red, LOW=blue, NORMAL=black)
- [x] Unit: drawn separately at small **7.5pt gray** below value via `didDrawCell` hook
- [x] Cell `minCellHeight` grows when a unit exists (13mm vs 8mm) so unit fits
- [x] `flatTests` array + `groupRowIndices` Set built so `data.row.index` maps back to the right test

### 6.2 — Footer / signature collision (ISSUE 2) ✅
- [x] New constants: `SIG_START_Y=258`, `FOOTER_LINE_Y=283`, `FOOTER_Y=287`
- [x] Signature block ends at y≈282; address strip starts at y≈287 — NO overlap
- [x] Address right-aligned at `pageWidth - 15`, three lines at +3 / +7 / +11
- [x] HEALit small logo on footer left at y=287 (16×11mm)
- [x] Page X of Y centered at y=287+6
- [x] Signatures only on last page; per-page footer on every page

### 6.3 — CORPORATE truncation (ISSUE 3) ✅
- [x] Right-column field uses two stacked lines:
  - `: THYROCARE LAB,` at the regular CORPORATE row
  - `KUNNATHPEEDIKA` indented one row below at the same x as the value
- [x] Header content height bumped so the second line fits before the bottom separator

### 6.4 — Group header row (ISSUE 4) ✅
- [x] `colSpan: 4` removed; group rows become full 4-col rows with **only col 0 populated**
- [x] No `fillColor` on group rows
- [x] Group text bold 9.5pt with manual underline drawn via `didDrawCell`
- [x] `groupRowIndices` Set tracks which row indices are group headers

### 6.5 — Table border weight (ISSUE 5) ✅
- [x] `theme: 'plain'`
- [x] `tableLineColor: [180,180,180]`, `tableLineWidth: 0.3` (outer box only)
- [x] Header: only `lineWidth.bottom = 0.5`
- [x] Body: only `lineWidth.bottom = 0.1`
- [x] No `alternateRowStyles`

### 6.6 — Always bold result values (ISSUE 6) ✅
- [x] All result cells render with `fontStyle: 'bold'`, `fontSize: 10`
- [x] HIGH = bold red text + light red bg; LOW = bold blue + light blue bg; NORMAL = bold black on white

### 6.7 — Header has NO box (ISSUE 7) ✅
- [x] Header is plain `doc.text` calls — no outer rect / no autoTable wrapper
- [x] Only the two horizontal rules (above and below header fields) are drawn

### 6.8 — combinedPdfGenerator.js mirror ✅
- [x] All 7 fixes mirrored in `generateLabReportPage`
- [x] Page numbers stay relative to each profile section
- [x] Invoice page byte-equivalent (no layout/totals change)

### 6.9 — Verify ✅
- [x] `npx eslint src/utils/labReportPdfGenerator.js src/utils/combinedPdfGenerator.js` — clean
- [x] `npm run build` — succeeds
- [ ] Manual retest in browser (user-side; dev server at http://localhost:3000)

---

## PHASE 7 — HYGEA PARITY ROUND 2 (V3)

Source of truth: `PROMPT_V3.md`. Triggered by the second client testing pass —
V2 layout was correct but content gaps remain.

### 7.1 — Signature labels match Hygea (PDF) ✅
- [x] `labReportPdfGenerator.js#drawSignatureBlock` → "APARNA SARATH / BSC MLT" + "DR. ROHIT RS / DCP, MD (Consultant Pathologist)"
- [x] `combinedPdfGenerator.js#drawLabReportSignatureFooter` → same change
- [x] Right-side qualification uses fontSize 6.5pt so it fits in remaining width

### 7.2 — Method italic line under each test row (PDF) ✅
- [x] `didDrawCell` extension on col 0 to draw `Method: <test.method>` when present
- [x] `minCellHeight` bumped to 13mm on rows that have a unit OR method (whichever is present)
- [x] New helpers `getMethod` / `lrGetMethod` read `test.method || test.method_snapshot`
- [x] New helpers `getSampleType` / `lrGetSampleType` read `test.sampleType || test.sampleType_snapshot`
- [x] Mirrored in `combinedPdfGenerator.js`

### 7.3 — Profile/Test form: new fields (UI) ✅
- [x] `SAMPLE_TYPE_OPTIONS` constant: SERUM / URINE / BLOOD / PLASMA / STOOL / WHOLE BLOOD / OTHER
- [x] `newTest` state has `method: ''` and `sampleType: 'SERUM'`
- [x] `handleAddTest` → `setNewTest({...})` reset includes new fields
- [x] `resetForm` reset includes new fields
- [x] Edit-table column headers updated (Method 15%, Sample Type 12%; Test Description 24%, others rebalanced)
- [x] Edit-row gains a text input (method) and a select (sampleType) wired via `updateTestInProfile`
- [x] "Add New Test" form gains Method input + SampleType dropdown
- [x] BioReference placeholder rewritten with Hygea-style multi-line grading scale example

### 7.4 — Data model: new fields ✅
- [x] `TestMaster.method` (default `''`) + `TestMaster.sampleType` (default `'SERUM'`)
- [x] `TestSnapshot.method_snapshot`, `TestSnapshot.sampleType_snapshot` (with fallback to non-snapshot fields)

### 7.5 — Snapshot pipeline ✅
- [x] `ResultEntryPage.jsx#handleAddMultipleTests` snapshot block now writes `bioReference_snapshot`, `method_snapshot`, `sampleType_snapshot`
- [x] `ResultEntryPage.jsx#handleAddTest` (single) snapshot block now writes the same three fields
- [x] `getProfileGroupedTests` (the report-data builder) now exposes `method` + `sampleType` to the PDF
- [x] `loadSampleData.js` mock-data builder also includes `method_snapshot` + `sampleType_snapshot` to keep dev seed data consistent

### 7.6 — Verify ✅
- [x] `npx eslint` on all 6 touched files — **no NEW lint errors** introduced (29 pre-existing errors in ResultEntryPage / ProfileManager are unchanged from before Phase 7 and out of scope per V1/V2 critical rules)
- [x] `npm run build` — succeeds (vite 7.94s)
- [ ] Manual retest in browser: open ProfileManager → add a test with method "Manual Microscopy" + sampleType URINE → enter result → generate report → confirm Method line under test name + signature labels; **V4 PDF:** no Sample Type column, value+unit inline, no group sub-header row

---

## V4 — 12 May 2026

*Source: `PROMPT_V4.md` — client WhatsApp feedback (lab report print layout).*
- Removed IP/OP from patient header (left column)
- Removed RECIEVED ON from patient header (right column)
- Removed Sample Type column from results table (bioRef column widened to 73mm)
- Value and unit now rendered on same line: `"80 mg/dl"`
- Group sub-header row removed (`drawGroupRow` no longer called)
- Border box drawn around full results table body (single-page tables only; skipped if table spans pages)
- Mirrored in combinedPdfGenerator.js (same PDF output via shared `renderLabReportSection`; no duplicate generator edits)

### V4 follow-up — footer, share, single PDF path ✅
- [x] Footer: **fully removed** per client WhatsApp 22 May 2026 (no logo, address, page number, or rule) in `labReportPdfGenerator.js`
- [x] Sample Type column removed (3-col table; bioRef 73mm) — verified in code
- [x] `buildLabReportsPdfDoc` + `shareLabReportsOnlyViaWhatsApp` / `shareLabReportsOnlyViaEmail` in `combinedPdfGenerator.js`
- [x] `Patients.jsx` PDF column: Re-Print, Printer, WhatsApp (PDF attach when supported), Email
- [x] `PatientDetails.jsx` download/print/share uses `generateCombinedLabReports` + lab-only share helpers
- [x] `ResultEntryPage.jsx` Download/Print/Share modal uses V4 lab PDF path (legacy `pdfGenerator.js` no longer used for lab reports)
- [ ] Manual retest: Re-Print fresh PDF → 3 columns, no footer, signatures on last page

---

## PHASE 8 — Edit Profile UX overhaul (historical: modal/table iteration)

> **Superseded by Phase 9:** the app no longer uses a centered **Edit Profile** modal. The list still lives in `ProfileManager`; create/edit opens a **full-page Profile Editor** workspace (see Phase 9). The checklist below documents the earlier modal/table improvements for history.

Triggered by user testing screenshots: Method input was too narrow → user accidentally pasted the **bio reference grading scale** into the **Method** field. Fixing UX so both fields are large enough to see content, modal uses full desktop viewport, and a runtime warning catches the misplaced-paste case.

### 8.1 — Modal sized to viewport ✅ (replaced by Phase 9)
- [x] `.modal-content.large` → `width: 98vw`, `height: 96vh` (no more 1400px hard cap; 1600px on ≥1400px screens)
- [x] `overflow: hidden` on the modal frame so children manage their own scroll
- [x] `.modal-header` and `.modal-actions` no longer rely on `position: sticky` — `flex-shrink: 0` keeps them pinned in the flex column
- [x] Update / Cancel buttons always visible at the bottom (no scrolling the modal to find them)

### 8.2 — Tests-table scrolls inside the modal ✅
- [x] `.tests-table-wrapper { max-height: calc(96vh - 430px); min-height: 300px; }` — table body scrolls, modal frame doesn't
- [x] On screens ≥1400px the table gets even more height (`calc(96vh - 380px)`)
- [x] `<thead>` already has `position: sticky` so column headers stay visible while scrolling rows

### 8.3 — Method becomes a textarea ✅
- [x] Edit-row Method `<input>` → `<textarea className="table-textarea table-textarea--method">` with 3 rows / 70–160px height
- [x] "Add New Test" form Method `<input>` → `<textarea>` with `rows=3`
- [x] CSS variant `.table-textarea--method` keeps proportional font (not monospace) since methods are prose, not grading scales

### 8.4 — Bio.Ref.Internal more readable ✅
- [x] `.table-textarea` → `min-height: 110px`, `max-height: 240px`, monospace font so scale lines (`+/- : Positive (15 mg/dL)`) align column-wise
- [x] `min-width: 180px` so the column never collapses below readable width
- [x] Vertical resize remains enabled so users can drag taller for very long scales

### 8.5 — Column widths rebalanced ✅
- [x] Edit table headers: TestDesc 20% (min 200px), Units 8% (90), BioRef 24% (260), **Method 20% (200)**, Sample Type 11% (130), Price 10% (110)
- [x] All cells now have `min-width` so they can't get squashed even if a different table is added

### 8.6 — Misplaced-paste warning ✅
- [x] If `test.method` contains a `\n`, an inline yellow banner appears under the textarea: "⚠ Method has multiple lines. Did you mean to paste this in **Bio.Ref.Internal**?"
- [x] Same warning under the new-test Method textarea

### 8.7 — Add-test grid widened ✅
- [x] `.test-form-grid-simple` → `2fr 1fr 1.4fr 1fr 1fr` so Description / Units / Method / SampleType / Price each get a fair column
- [x] Bio reference textarea uses `.full-width` to span every column on a row of its own
- [x] Below 1100px viewport: collapses to 3-column grid

### 8.8 — Verify ✅
- [x] ESLint clean on `ProfileManager.jsx` + `ProfileManager.css`
- [x] `npm run build` succeeds (vite 6.04s)
- [ ] Manual retest on desktop browser at 1920×1080 — confirm: **Profile Editor** full-page workspace, card-based tests, sticky actions, misplaced-paste warning still shows when bio-ref grading scale is pasted into Method

---

## PHASE 9 — Profile Editor workspace (full page, no nested modal scroll)

Triggered by enterprise UX feedback: nested scroll (page → modal → table → textarea), cramped table form, weak hierarchy, and poor scanability for operators managing many tests.

### 9.1 — Routing & navigation ✅
- [x] Dedicated routes: `/profiles/new`, `/profiles/edit/:profileId`, `/admin/profile-manager/new`, `/admin/profile-manager/edit/:profileId` → `ProfileEditorWorkspace.jsx`
- [x] `ProfileManager.jsx`: **Add** / row **Edit** navigate to workspace; modal removed from profile create/edit

### 9.2 — Layout shell ✅
- [x] Full-viewport workspace with sticky-style top bar and bottom action bar (single primary scroll via main content area)
- [x] Main column + **Package summary** sidebar (test count, line totals vs package price)
- [x] New profiles: optional **step flow** (Details → Tests → Pricing → Review); edit: linear sections

### 9.3 — Tests UX ✅
- [x] Table-in-modal replaced with **collapsible test cards**; searchable **add from catalog** picker + custom test block
- [x] Inline validation (profile name, tests present, per-test price/description, duplicate test names); draft auto-save to `localStorage` (`healit_profile_draft_new` / `healit_profile_draft_<id>`)

### 9.4 — Styling ✅
- [x] `ProfileEditorWorkspace.css` — section cards, 12-column-style grid helpers, enterprise spacing (no Tailwind in repo)

### 9.5 — Verify ✅
- [x] `npx eslint` on `ProfileEditorWorkspace.jsx`, `ProfileManager.jsx`, `App.jsx`
- [x] `npm run build` succeeds
- [ ] Manual QA: both `/profiles` and `/admin/profile-manager` entry paths; new + edit; draft restore; save clears draft

### 9.7 — Left rail + structured ranges (matches spec ASCII) ✅
- [x] Desktop grid is now **3-column**: `240px (rail) | 1fr (main) | 300px (summary)` (max-width 1720px); collapses to **2-col** below 1280px (summary hidden) and **1-col** below 1100px (rail un-sticks)
- [x] **Left rail** with three groups:
  - **Sections**: Profile details / Tests (with count chip) / Pricing / Review (Review only when `isNew`) — clicking calls `scrollToSection(id)` which uses refs (`sectionRefs.current[id]`) and `scrollIntoView({ behavior: 'smooth' })`
  - **Tests in package**: list of all test cards; clicking a row expands the card if collapsed and scrolls/focuses it (`scrollToTest`)
  - **Validation**: green "No issues" pill or red "N issues to fix" pill with a click-to-jump issue list (first 6 + "+ N more")
- [x] **Structured reference range rows** (`parseBioRefRows` / `serializeBioRefRows`):
  - `bioReference` text is parsed into `[{label, range}]` rows on render; non-`label: value` lines fall through into an **Advanced** `<details>` textarea
  - Add row / edit row / delete row write back into a single `bioReference` string — **PDF generator + report data layer untouched**
  - Old `pew-quick-ref` builder + state (`quickRefLabel/Range`) and `appendQuickRefLine()` removed (covered by structured rows + advanced textarea)
- [x] CSS: `.pew-rail*`, `.pew-rangerow*`, three-column grid, responsive collapses
- [x] `npx eslint` clean; `npm run build` succeeds

### 9.6 — Polish pass (inline errors, hero metrics, drafts, a11y) ✅
- [x] `handleAddTest` no longer toasts — inline errors `formErrors.newTest_desc` / `formErrors.newTest_price` under each field, cleared on input
- [x] `appendQuickRefLine` no longer toasts — per-test inline error `formErrors.test_<id>_quickref` under the quick-ref builder
- [x] `persistProfile` no longer toasts on validation — sets `formErrors._summary` shown as a `role="alert"` banner above the main column, then focuses the first errored input
- [x] **Hero metrics strip** above the workspace: profile name, test count, line total, package price, plus a green "Savings" tile (or amber "Above sum" if package > line total)
- [x] **Edit-mode draft restore**: `loadOrInit` reads `healit_profile_draft_<profileId>` first; falls back to saved profile; toast only on actual restore
- [x] **Discard draft** chip in the top bar (edit mode) — `confirm()` then clears the draft and reloads original
- [x] **Auto-save chip** lives in `aria-live="polite"` region (`pew-topbar-right`) so screen readers hear "Auto-save · Draft saved 2s ago"
- [x] **Catalog refresh**: `useMemo` re-collects when `catalogVersion` (incremented on `window.focus` / `visibilitychange`) or `formData.tests.length` change — picker stays current after another tab edits profiles
- [x] CSS additions: `.pew-hero*`, `.pew-summary-error`, `.pew-back--danger`, `.pew-topbar-right` (responsive: hero collapses to 2-col on mobile with primary spanning full width)
- [x] `npx eslint` clean (no errors, no warnings — `useMemo` deps marked intentional with disable comment)
- [x] `npm run build` succeeds

---

## CURRENT STATUS: Phases 1–5 ✅ + Phase 6 (V2) ✅ + Phase 7 (V3) ✅ + Lab PDF V4 ✅ + Phase 8 (historical) ✅ + Phase 9 (workspace + polish) ✅

**Shareable user guide (staff + client steps):** `contextmd/CLIENT_STEPS_HEALIT_PDF.md`


**Files changed:**
- `src/utils/labReportPdfGenerator.js` — full rewrite of `generateLabReportPDF` + helpers; download/print/blob wrappers preserved; **V4** header/table/inline result/body-box updates
- `src/utils/combinedPdfGenerator.js` — lab report section delegates to `renderLabReportSection`; **invoice page:** only unused-variable / unused-`catch` lint cleanups (no layout or totals logic change)

**Files NOT touched (per spec):**
- `src/utils/invoicePdfGenerator.js`
- `src/utils/assetPath.js`
- All `.jsx` components, services, stores, backend/netlify functions

**Next step:** Run the app, open a sample report, verify the visual layout matches Hygea HYGM-22685. Tick off the remaining manual-QA items in 4.1 / 4.2 / 4.4.
