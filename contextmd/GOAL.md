# GOAL.md — Lab Report Print Format Redesign
## HEALit Med Laboratories | Medical-Lab Project

---

## 🎯 PRIMARY OBJECTIVE

Redesign the **Lab Report PDF print format** to exactly match the **Hygea HYGM-22685** reference format.

**Patient details (name, age, gender, phone, address, dates, lab no etc.) remain the same — only the TABLE LAYOUT and PAGE STRUCTURE changes.**

> **Implementation note:** The Hygea-style header in `PROMPT.md` matches the reference ASCII (NAME, LAB NO., AGE/SEX, PH NO, IP/OP, dates, CORPORATE) — it does **not** repeat a full street-address block in the PDF header. Patient address is unchanged in the database and elsewhere in the app; it is simply not drawn on this report layout. Optional future work: add an address line if product requests it.

> **Deferred vs this prompt:** GOAL’s “Method: …” subtitle under certain results is **not** specified in `PROMPT.md`’s `buildTableRows`; it was not implemented in the Phase 2/3 code pass. Add later if required.

---

## 📄 REFERENCE FORMAT: Hygea HYGM-22685 (Lab_No22685.pdf)

### Page Structure
```
┌─────────────────────────────────────────────────────────┐
│  [BARCODE top-left]                                      │
│  NAME    : Mrs. XYZ          COLLECTED ON : DD-Mon-YYYY  │
│  LAB NO. : HYGM-XXXXX        RECIEVED ON  : ...          │
│  AGE/SEX : 55 Years / Female REPORTED ON  : ...          │
│  PH NO   : ...               REFERRED BY  : SELF         │
│  IP/OP   : ...               CORPORATE    : THYROCARE LAB│
│─────────────────────────────────────────────────────────│
│  Test Description  │ Results & Unit │ Bio. Ref. Interval │ Sample Type │
│────────────────────│────────────────│────────────────────│─────────────│
│  COLOUR            │ Pale Yellow    │ Pale yellow        │ URINE       │
│  ALBUMIN           │ Negative       │ - : Negative       │ URINE       │
│                    │                │ +/- : Pos (15mg/dl)│             │
│  SUGAR             │ Negative       │ - : Negative       │ URINE       │
│  SPECIFIC GRAVITY  │ 1.010          │ 1.000 - 1.030      │ URINE       │
│─────────────────────────────────────────────────────────│
│                              Page X of Y                 │
├─────────────────────────────────────────────────────────┤
│  [HEALit LOGO]   "For the journey that is life"   [addr]│
└─────────────────────────────────────────────────────────┘
```

### Last Page Footer (Signatures)
```
Verified by:           [sig]    Authorized by:          [sig]
RAKHI T.R                       APARNA A.T
DMLT                            Incharge
```

---

## ❌ CURRENT FORMAT PROBLEMS

| Problem | Current | Target |
|---------|---------|--------|
| Table columns | Test Description, Result, Unit, Bio. Ref. Internal | Test Description, **Results & Unit** (merged), Bio. Reference Interval, **Sample Type** |
| Patient header | "PATIENT DETAILS" section label | NO label — direct field:value pairs like Hygea |
| Header layout | Left col / Right col side by side | NAME/LABNO/AGEX/PHNO/IPOP left, dates right |
| Table styling | Dark blue header fill, colored alternate rows | Clean minimal — light or no fills, just borders |
| Sample Type | Missing entirely | New 4th column: SERUM / URINE / BLOOD per test |
| Results & Unit | Two separate columns | Merged: value shown with method note below |
| Page footer | Fixed position signature box | Per-page "Page X of Y", logo+address at bottom |
| Lab number | Not shown | Must show LAB NO. (visitId) prominently |
| Section headers | None | "CLINICAL PATHOLOGY" / "BIOCHEMISTRY" etc. |
| Method text | Not shown | Show "Method: ..." below result row for certain tests |

---

## ✅ WHAT DOES NOT CHANGE

- Logo images (HEALit + Thyrocare) — same assets, same paths
- Signature images (Rakhi, Aparna) — same assets
- Patient data fields — same data from DB
- DB schema — no backend changes
- Invoice format — unchanged
- All non-PDF components — unchanged
- App routing, auth, patient management — unchanged

---

## 🗂 FILES TO CHANGE (ONLY THESE TWO)

```
src/utils/labReportPdfGenerator.js      ← PRIMARY: Full rewrite of generateLabReportPDF()
src/utils/combinedPdfGenerator.js       ← SECONDARY: Rewrite generateLabReportPage() only
```

**Do NOT touch:**
- `invoicePdfGenerator.js`
- `assetPath.js`
- Any `.jsx` pages
- Any service/store files
- Backend/netlify functions

---

## 📐 NEW TABLE COLUMN SPECIFICATIONS

| Column | Header | Width (mm) | Align | Notes |
|--------|--------|-----------|-------|-------|
| 0 | Test Description | 72 | Left | Bold, includes sub-group label rows |
| 1 | Results & Unit | 35 | Center | Value bold if abnormal, unit on same line small |
| 2 | Biological Reference Interval | 52 | Left | Multi-line text, font 8pt |
| 3 | Sample Type | 21 | Center | URINE/SERUM/BLOOD — from test.sampleType |

Total usable width: 180mm (A4 210mm - 15mm margins each side)

---

## 🏷 PATIENT HEADER FIELDS (Hygea Style)

**Left column (label : value pairs, 15mm from left):**
```
NAME    : {patient.name}
LAB NO. : {patient.visitId}
AGE/SEX : {patient.age} Years / {patient.gender}
PH NO   : {patient.phone}
IP/OP   : {patient.referredBy or 'OP'}
```

**Right column (from ~115mm):**
```
COLLECTED ON : {times.collected}
RECIEVED ON  : {times.received}
REPORTED ON  : {times.reported}
REFERRED BY  : {patient.referredBy || 'SELF'}
CORPORATE    : THYROCARE LAB, KUNNATHPEEDIKA
```

---

## 📦 SUCCESS CRITERIA

1. ✅ Print output visually matches Hygea PDF layout
2. ✅ 4-column table: Test Desc | Results & Unit | Bio. Ref. Interval | Sample Type
3. ✅ Patient header in label:value format without "PATIENT DETAILS" section title
4. ✅ Page X of Y on every page
5. ✅ Logo + address in page footer on every page
6. ✅ Signatures only on last page
7. ✅ Section group headers (CLINICAL PATHOLOGY etc.) inside table as merged row
8. ✅ Abnormal values bold/colored in Result column
9. ✅ Combined PDF (combinedPdfGenerator.js) uses same new format
10. ✅ No regressions: invoice PDF, sharing, download all work
11. ✅ Production safe: no broken imports, no missing assets
