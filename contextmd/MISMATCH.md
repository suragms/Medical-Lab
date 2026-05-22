# MISMATCH.md — Exact Rejection Analysis
## HEALit Output vs Hygea Reference — Side by Side

---

## 🔴 CRITICAL ISSUES (Why Client Rejected)

---

### ISSUE 1: Result Cell — Value and Unit on Two Separate Lines (WORST ISSUE)

**HEALit output:**
```
┌──────────────┐
│     12       │  ← value on line 1
│    mg/dL     │  ← unit on line 2 (via \n)
└──────────────┘
```

**Hygea reference:**
```
┌──────────────┐
│  Pale Yellow │  ← single bold value (no unit for text results)
└──────────────┘
┌──────────────┐
│    1.010     │  ← just numeric value, no unit in this column
└──────────────┘
```

**Root cause:** Current code does `content: value + '\n' + unit` — this splits into two lines and looks ugly/broken.

**Fix:** Result cell content = just the **value** (bold). Unit goes in a **separate sub-line** only when value is numeric. Or better: match Hygea exactly — value only in Result column, unit shown as small secondary text below value inline (font size 8pt, gray).

**Exact fix in code:**
```javascript
// WRONG (current):
content: `${value}\n${unit}`

// CORRECT (Hygea style):
content: value  // Just the value, bold
// Then unit shown as small gray text below via willDrawCell hook OR
// keep unit in same cell but styled: value large bold, newline, unit 8pt gray
```

---

### ISSUE 2: Footer — Address Text Collides with Signature Names (CRITICAL)

**HEALit output (bottom right corner):**
```
Authorized by:   [sig image]
APARNA A.T       Sree Lakshmi Building, Shornur Road,    ← OVERLAP!
Incharge         Thiruvambadi P.O, Thrissur, Kerala
                 Phone: 0487 233 2100 | +91 9020 992 499
```

The address text renders ON TOP OF the "APARNA A.T / Incharge" text because both are positioned in the right side of the footer area without enough gap.

**Hygea reference:**
```
[Page X of Y] centered

[HYGEA logo + tagline left]    [address + phone RIGHT]

[Verified by sig]    [Authorized by sig]
APARNA SARATH       DR. ROHIT RS
```
→ Page number is center, address is right of logo in ONE footer strip, signatures are ABOVE that.

**Fix:** Footer must have this layout:
```
y=258mm: thin separator line
y=261mm: Verified by (left)           Authorized by: (right=PAGE_W-65)
y=264mm: [Rakhi sig image]            [Aparna sig image]
y=277mm: RAKHI T.R (bold)             APARNA A.T (bold)
y=281mm: DMLT (gray)                  Incharge (gray)
y=284mm: ─────────── thin line ──────────────────────
y=287mm: [HEALit logo small left]   Page X of Y (center)   [address right]
y=290mm: (logo still)               (page num)              address line 2
y=293mm: (logo still)               (page num)              address line 3
```

Signatures must be ABOVE the footer strip. Address goes in the FOOTER STRIP at very bottom, not overlapping with signatures.

---

### ISSUE 3: CORPORATE Field Truncated

**HEALit output:**
```
CORPORATE    : THYROCARE LAB,
```
Missing "KUNNATHPEEDIKA" — text is cut off.

**Hygea reference:**
```
CORPORATE    : THYROCARE LAB
               ,KUNNATHPEEDIKA
```
(Two lines — first line is "THYROCARE LAB", second line is ",KUNNATHPEEDIKA")

**Fix:** Corporate value must be split into two lines:
```javascript
const corpLine1 = 'THYROCARE LAB,';
const corpLine2 = 'KUNNATHPEEDIKA';
doc.text('CORPORATE', rightCol, yPos);
doc.text(': ' + corpLine1, rightCol + 22, yPos);
doc.text('  ' + corpLine2, rightCol + 22, yPos + 4.5); // indent to align under corpLine1
```
OR use `doc.splitTextToSize()` to wrap.

---

### ISSUE 4: Group Header Row Style Mismatch

**HEALit output:**
```
┌──────────────────────────────────────────────────┐
│       Kidney Function Test (KFT)  (centered)     │  ← merged row, colored background
└──────────────────────────────────────────────────┘
```

**Hygea reference:**
```
│ URINE ROUTINE EXAMINATION         │        │                    │       │  ← underlined bold text, no fill
│ PHYSICAL EXAMINATION, URINE       │        │                    │ URINE │  ← sample type in last col
│ CHEMICAL EXAMINATION, URINE       │        │                    │ URINE │  ← same pattern
```

Key differences:
- Hygea: group header text is in Test Description column (col 0), NOT spanning all 4 cols
- Hygea: Sample Type column shows the sample type even on group header rows
- Hygea: No background fill on group headers — just bold/underlined text
- Hygea: Group headers for sub-sections (PHYSICAL EXAM, CHEMICAL EXAM) are separate rows with only col 0 and col 3 filled

**Fix for group rows:**
```javascript
// Replace full colSpan=4 row with:
{
  cells: [
    { content: group.name, styles: { fontStyle: 'bold', decoration: 'underline', fontSize: 9.5, fillColor: false } },
    { content: '', styles: { fillColor: false } },
    { content: '', styles: { fillColor: false } },
    { content: '', styles: { fillColor: false } }  // or sampleType of first test
  ]
}
```

---

### ISSUE 5: Table Border Style — Too Heavy/Boxed

**HEALit output:** `theme: 'grid'` with default lineWidth → every cell has visible border → looks like a spreadsheet, not a medical report.

**Hygea reference:** Clean minimal borders:
- Outer box: single solid border around the entire table
- Row separators: very thin gray lines (0.1pt)
- Column separators: visible but light
- Header row: has slightly darker bottom border
- No alternate row colors

**Fix:**
```javascript
theme: 'plain',  // or 'grid' with very thin lines
tableLineColor: [180, 180, 180],
tableLineWidth: 0.3,
// headStyles lineWidth: 0.5 for bottom border
// bodyStyles lineWidth: 0.1 very thin
```

---

### ISSUE 6: Result Value Not Bold Enough

**HEALit output:** Normal weight results visible in cells.
**Hygea reference:** All result values are **BOLD** — "**Pale Yellow**", "**Clear**", "**Negative**", "**1.010**", "**6.0**".

**Fix:**
```javascript
// Result cell styles:
styles: { fontStyle: 'bold', fontSize: 10 }  // always bold
```

---

### ISSUE 7: Header — No Box Required

**HEALit output:** Header section has a light box/table border around the label:value pairs area.
**Hygea reference:** Header is plain text, NO box. Just text lines with a horizontal rule BELOW the header.

This may or may not be visible from the PDF text extraction — need to verify in actual render. If the header has a visible border box, it must be removed.

---

## 🟡 MINOR ISSUES

### ISSUE 8: "Verified by:" label — Left Label Text
- HEALit: "Verified by:" 
- Hygea: "Verified by:" ✓ Same — OK

### ISSUE 9: Page Number Positioning
- HEALit: "Page 1 of 1" appears to be in the footer area — position OK
- Hygea: "Page 1 of 4" centered at bottom ✓ Same general position — OK

### ISSUE 10: HEALit Logo in Footer
- HEALit: HEALit logo appearing in footer area (small)
- Hygea: Hygea logo + tagline in footer left
- This is fine — keep HEALit logo in footer left as already designed

---

## ✅ WHAT IS CORRECT (Do Not Change)

- ✓ Header label:value format (NAME, LAB NO., AGE/SEX, PH NO, IP/OP)
- ✓ Right column dates (COLLECTED ON, RECIEVED ON, REPORTED ON)
- ✓ Four-column table structure (Test Desc | Results & Unit | Bio. Ref. | Sample Type)
- ✓ Logo positions (HEALit left, title center, Thyrocare right)
- ✓ "Page X of Y" present
- ✓ "REFERRED BY : SELF"
- ✓ Signature images loading correctly (Rakhi left, Aparna right)
- ✓ "*End of Report*" marker
- ✓ Table column header text ("Test Description", "Results & Unit", "Biological Reference Interval", "Sample Type")
- ✓ Group row text ("Kidney Function Test (KFT)") present in table

---

## PRIORITY ORDER FOR FIXES

1. 🔴 ISSUE 1 — Result cell: value only (no \n unit stacking) — **[x] FIXED** (didDrawCell renders unit small/gray below bold value)
2. 🔴 ISSUE 2 — Footer: signature + address collision fix — **[x] FIXED** (sigs y=258..282, separator y=283, footer strip y=287..295)
3. 🔴 ISSUE 3 — CORPORATE field: show KUNNATHPEEDIKA — **[x] FIXED** (two-line value: "THYROCARE LAB," then ",KUNNATHPEEDIKA")
4. 🟠 ISSUE 4 — Group header row: no fill, col 0 only, bold — **[x] FIXED** (groupRowIndices Set + manual underline via didDrawCell)
5. 🟠 ISSUE 5 — Table borders: lighter, thinner — **[x] FIXED** (theme:'plain', tableLineWidth 0.3, header bottom 0.5, body 0.1)
6. 🟠 ISSUE 6 — Result values: always bold — **[x] FIXED** (fontStyle:'bold', fontSize:10 on every result cell)
7. 🟡 ISSUE 7 — Header: no box border around header fields — **[x] FIXED** (plain doc.text rows, only top + bottom horizontal rules)

---

## VERIFIED

- `npx eslint src/utils/labReportPdfGenerator.js src/utils/combinedPdfGenerator.js` → 0 errors
- `npm run build` → succeeded (vite production build, 6.82s)
- Both files mirror the V2 spec; `generateInvoicePage` untouched
- Dev server: http://localhost:3000 (HMR-active)

Pending: client retest in browser.
