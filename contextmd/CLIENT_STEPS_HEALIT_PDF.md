# HEALit Lab Report PDF — Staff & Client Quick Guide

This explains how to get printed lab reports that match the Hygea-style layout: **Method** line under each test, correct **Sample Type** (e.g. URINE), multi-line **Biological Reference** text (including negative / positive grading scales), and the **signature block** at the bottom of the last page.

---

## Who can do what

| Role | Profiles (tests, method, sample type, bio reference) | Enter results | Print / download report |
|------|--------------------------------------------------------|----------------|-------------------------|
| **Admin** | Yes — sidebar **Profiles** (or **Tests** on mobile) | Yes | Yes |
| **Staff** | Yes — same **Profiles** page (not admin-only in the app) | Yes | Yes |

Staff and admin use the **same** profile editor. There is no separate “staff-only” screen for Method / Sample Type; everyone who can open **Profiles** can maintain these fields.

---

## Part A — One-time setup per test (in Profiles)

Do this when you **create a new profile** or **edit an existing profile**, before you expect perfect PDF text for that test.

1. Sign in to HEALit (admin or staff).
2. Open **Profiles** from the sidebar (mobile: **Tests** → same page).
3. Tap **Add Profile** or **Edit** on a row — this opens the **full-screen Profile Editor** (not a small popup). URLs look like `/profiles/new`, `/profiles/edit/<id>`, or the same under `/admin/profile-manager/...` if you use the admin menu.
4. For **each test** (expand the test card, or add via **Add from catalog** / **Add custom test**):

   - **Bio.Ref.Internal** (reference range text)  
     Paste the **full** reference text, including line breaks.  
     Example for dipstick-style tests (one line per grade):

     ```text
     - : Negative
     +/- : Positive (15 mg/dL)
     + : Positive (30 mg/dL)
     ++ : Positive (100 mg/dL)
     +++: Positive (300 mg/dL)
     ```

     For numeric tests, a single line is fine, e.g. `7.94 - 20.07`.

   - **Method**  
     Enter the line that should appear under the test name on the PDF, e.g. `Manual Microscopy`, `Ehrlich Reaction`, `Glucose oxidase – peroxidase method`.  
     Leave blank if you do not want a “Method: …” line for that test.

   - **Sample Type**  
     Choose **SERUM**, **URINE**, **BLOOD**, **PLASMA**, **STOOL**, **WHOLE BLOOD**, or **OTHER**.  
     This is what appears in the **Sample Type** column on the PDF (it is no longer always “SERUM” unless you leave the default).

5. Use the **sticky actions** at the bottom: **Cancel**, **Save draft** (optional), and **Create Profile** / **Update Profile** to save.

**Drafts:** If you leave a **new** profile half-finished, the editor may restore an auto-saved draft the next time you open **Add Profile** on the same browser.

**Important:** Tests that were added to a **visit before** you filled Method / Sample Type / long bio reference may still carry old snapshot data. For those visits, either re-add the test from the profile or use a new visit after the profile is updated (depending on your workflow).

---

## Part B — Day-to-day workflow (patient → result → PDF)

1. **Register the patient / visit** as you already do (Patients → add flow → sample times if needed).
2. **Assign the correct profile** so the visit includes tests that already have Method, Sample Type, and bio reference set in **Profiles**.
3. Open **Results** for that visit and enter values.
4. Use **Download**, **Print**, or **Combined PDF** / share actions as you already do.

The PDF generator reads whatever is stored on the test (including `method`, `sampleType`, and multi-line `bioReference`). If a field is empty in the profile, that part of the PDF will be empty or default (e.g. Sample Type defaults to SERUM).

---

## Part C — What to tell the end client (patient / referring doctor)

You can send them a short message like this:

> Your lab report is generated from our system as a PDF.  
> Please open the PDF with any normal PDF viewer (phone or computer) and use **Print** or **Save** from that viewer.  
> The report shows your results, reference information we have configured for each test, and authorised signatures on the **last page** only.  
> If any reference text or method line is missing on a specific test, that means the lab has not yet entered that detail in the test catalogue for that item; you can ask the lab to update the profile for future reports.

---

## Troubleshooting (for internal staff)

| Symptom | What to check |
|--------|-----------------|
| No “Method: …” under a test | **Profiles** → that test → **Method** field empty? Fill and save; new visits (or re-added tests) pick it up. |
| Sample type always SERUM | **Profiles** → set **Sample Type** to URINE (etc.) and save. |
| Bio reference is one short line | **Profiles** → **Bio.Ref.Internal** — use Enter for multiple lines; paste the full grading scale if needed. |
| The yellow ⚠ banner says "Method has multiple lines" | You pasted the bio reference scale (`- : Negative / +/- : Positive ...`) into **Method** by mistake. **Cut** it from Method and **paste** into the **Bio.Ref.Internal** field for that test. |
| Old visit still wrong after profile edit | Visit may have been created with an old snapshot. Prefer new visit or re-attach tests after profile update. |
| Signature names look different from an old paper | The PDF uses the lab’s configured signature **images** plus fixed authorisation text; asset files are managed by the lab IT/admin. |
| Profile editor feels cramped or nested scroll | Use the latest build — editing opens the **full-page Profile Editor** with collapsible test cards and a sticky bottom action bar (no old centered modal). |

---

## Technical note (for IT / vendor)

- Profile list: `src/pages/Admin/ProfileManager.jsx`  
- Full-page create/edit workspace: `src/pages/Admin/ProfileEditorWorkspace.jsx` (+ `ProfileEditorWorkspace.css`)  
- Visit snapshots when adding tests: `src/features/results/ResultEntryPage.jsx`  
- PDF output: `src/utils/labReportPdfGenerator.js` and combined flow in `src/utils/combinedPdfGenerator.js`  

No extra “staff profile” route is required: **Profiles** is available to both `admin` and `staff` in `App.jsx` and `Layout.jsx`.
