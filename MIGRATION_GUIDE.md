# Migration Guide - Multiline Bio-References

## 📋 Overview

This guide helps you migrate existing test profiles to use enhanced multiline bio-references (Bio.Ref.Internal field).

**Impact:** Low - backward compatible  
**Time Required:** 15-30 minutes  
**When to Run:** Before production deployment (optional)

---

## ✅ Pre-Migration Checklist

- [ ] Backup existing profile data
- [ ] Review current bio-reference fields
- [ ] Identify tests needing multiline refs
- [ ] Test migration on 1-2 profiles first

---

## 🔄 Migration Steps

### Step 1: Backup Current Data

```javascript
// In browser console (F12)
const profiles = JSON.parse(localStorage.getItem('healit_profiles') || '[]');
console.log('Current profiles:', profiles.length);

// Download backup
const backup = JSON.stringify(profiles, null, 2);
const blob = new Blob([backup], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `profiles_backup_${Date.now()}.json`;
a.click();
```

### Step 2: Identify Tests for Migration

Common tests needing multiline bio-references:

| Test | Current (Single-line) | Enhanced (Multiline) |
|------|----------------------|---------------------|
| **Hemoglobin** | `13-17 g/dL` | `Male: 13.0 - 17.0 g/dL\nFemale: 12.0 - 15.0 g/dL\nPregnant: 11.0 - 14.0 g/dL` |
| **Blood Sugar** | `70-100 mg/dL` | `Normal (Fasting): 70 - 100 mg/dL\nPre-diabetic: 100 - 125 mg/dL\nDiabetic: > 126 mg/dL` |
| **Cholesterol** | `< 200 mg/dL` | `Desirable: < 200 mg/dL\nBorderline: 200 - 239 mg/dL\nHigh: ≥ 240 mg/dL` |
| **T3 Total** | `1.2-2.8 nmol/L` | `Adult: 1.2 - 2.8 nmol/L\nChildren: 1.5 - 3.2 nmol/L\nElderly: 0.8 - 2.0 nmol/L` |

### Step 3: Update via Profile Manager UI

**Recommended Approach (No Code):**

1. Navigate to **Admin → Profile Manager**
2. Click **Edit** on a profile (e.g., "Complete Blood Count")
3. Find test to update (e.g., "Hemoglobin")
4. Click in **Bio.Ref.Internal** textarea
5. Replace single-line with multiline:
   ```
   Male: 13.0 - 17.0 g/dL
   Female: 12.0 - 15.0 g/dL
   Pregnant: 11.0 - 14.0 g/dL
   ```
6. Click **Update Profile**
7. Repeat for other tests/profiles

### Step 4: Programmatic Migration (Advanced)

**Optional - for bulk updates:**

```javascript
// Migration script - run in browser console
const migrateProfiles = () => {
  const profiles = JSON.parse(localStorage.getItem('healit_profiles') || '[]');
  
  const updates = {
    'Hemoglobin': 'Male: 13.0 - 17.0 g/dL\nFemale: 12.0 - 15.0 g/dL\nPregnant: 11.0 - 14.0 g/dL',
    'Blood Sugar Fasting': 'Normal (Fasting): 70 - 100 mg/dL\nPre-diabetic: 100 - 125 mg/dL\nDiabetic: > 126 mg/dL',
    'Total Cholesterol': 'Desirable: < 200 mg/dL\nBorderline: 200 - 239 mg/dL\nHigh: ≥ 240 mg/dL',
    'T3 Total': 'Adult: 1.2 - 2.8 nmol/L\nChildren: 1.5 - 3.2 nmol/L\nElderly: 0.8 - 2.0 nmol/L'
  };
  
  let updatedCount = 0;
  
  profiles.forEach(profile => {
    if (profile.tests && Array.isArray(profile.tests)) {
      profile.tests.forEach(test => {
        const testName = test.name || test.description;
        if (updates[testName]) {
          test.bioReference = updates[testName];
          updatedCount++;
          console.log(`✅ Updated: ${testName} in profile "${profile.name}"`);
        }
      });
    }
  });
  
  // Save updated profiles
  localStorage.setItem('healit_profiles', JSON.stringify(profiles));
  console.log(`\n📊 Migration complete: ${updatedCount} tests updated`);
  
  return updatedCount;
};

// Run migration
migrateProfiles();
```

### Step 5: Verify Migration

```javascript
// Check updated profiles
const profiles = JSON.parse(localStorage.getItem('healit_profiles') || '[]');
profiles.forEach(profile => {
  console.log(`\nProfile: ${profile.name}`);
  if (profile.tests) {
    profile.tests.forEach(test => {
      if (test.bioReference && test.bioReference.includes('\n')) {
        console.log(`  ✅ ${test.name || test.description} - Multiline`);
        console.log(`     ${test.bioReference.replace(/\n/g, '\n     ')}`);
      }
    });
  }
});
```

---

## 🧪 Testing After Migration

### Test Checklist
1. **Create New Patient** with migrated profile
2. **Enter Results** with values at different ranges
3. **Generate PDF** and verify:
   - ✅ Bio-ref displays multiline text
   - ✅ Line breaks preserved
   - ✅ Text wraps properly in 55mm column
   - ✅ Range parser still detects HIGH/LOW/NORMAL

### Sample Test Data

**Hemoglobin Test:**
```
bioReference: "Male: 13.0 - 17.0 g/dL\nFemale: 12.0 - 15.0 g/dL\nPregnant: 11.0 - 14.0 g/dL"

Test Values:
- 14.5 g/dL → NORMAL (within Male range 13-17)
- 11.8 g/dL → LOW (below Female range 12-15)
- 17.0 g/dL → BOUNDARY (at Male max)
- 12.0 g/dL → BOUNDARY (at Female min)
```

**Expected PDF Output:**
```
Test Description     | Result | Unit  | Bio. Ref. Internal
--------------------|--------|-------|-------------------
Hemoglobin          | 11.8   | g/dL  | Male: 13.0 - 17.0 g/dL
                    |        |       | Female: 12.0 - 15.0 g/dL
                    |        |       | Pregnant: 11.0 - 14.0 g/dL

(Result cell: BLUE + BOLD - LOW status)
```

---

## 🔄 Rollback Procedure

If migration causes issues:

### Option 1: Restore from Backup
```javascript
// Restore from downloaded backup file
const backupData = /* paste backup JSON here */;
localStorage.setItem('healit_profiles', JSON.stringify(backupData));
window.location.reload();
```

### Option 2: Revert to Single-line
```javascript
const revertProfiles = () => {
  const profiles = JSON.parse(localStorage.getItem('healit_profiles') || '[]');
  
  profiles.forEach(profile => {
    if (profile.tests) {
      profile.tests.forEach(test => {
        if (test.bioReference && test.bioReference.includes('\n')) {
          // Extract first line as single-line ref
          const firstLine = test.bioReference.split('\n')[0];
          test.bioReference = firstLine;
          console.log(`↩️ Reverted: ${test.name} to "${firstLine}"`);
        }
      });
    }
  });
  
  localStorage.setItem('healit_profiles', JSON.stringify(profiles));
  console.log('✅ Rollback complete');
};

revertProfiles();
```

---

## 📝 Best Practices

### Multiline Bio-Reference Format

**Good Examples:**

```
✅ Gender-specific:
Male: 13.0 - 17.0 g/dL
Female: 12.0 - 15.0 g/dL
Pregnant: 11.0 - 14.0 g/dL

✅ Age-specific:
Adult: 1.2 - 2.8 nmol/L
Children: 1.5 - 3.2 nmol/L
Elderly: 0.8 - 2.0 nmol/L

✅ Categorical:
Desirable: < 200 mg/dL
Borderline: 200 - 239 mg/dL
High: ≥ 240 mg/dL

✅ Fasting vs Non-fasting:
Fasting: 70 - 100 mg/dL
2-hour Post-prandial: < 140 mg/dL
Random: 70 - 125 mg/dL
```

**Bad Examples:**

```
❌ Too long (>500 chars):
"Normal range varies by age, gender, diet, medications, time of day, season, altitude, physical activity, stress level, pregnancy status, genetic factors, ethnicity, body mass index..."

❌ No numeric ranges:
"Varies by individual"
"Consult physician"

❌ Inconsistent formatting:
"Male:13-17,Female:12-15,Pregnant:11-14" (use line breaks!)
```

### Formatting Guidelines

1. **One condition per line**
2. **Use colon after label:** `Male:` not `Male -`
3. **Include units:** `g/dL`, `mg/dL`, `%`
4. **Use ranges:** `13.0 - 17.0` not `13 to 17`
5. **Keep concise:** <5 lines preferred, <500 chars max
6. **Align colons:** Optional but improves readability

---

## ⚠️ Common Issues

### Issue 1: Bio-ref text cut off in PDF
**Symptom:** Only first line visible  
**Cause:** Missing `whiteSpace: 'pre-wrap'` in column style  
**Fix:** Already fixed in `pdfGenerator.js` (line 247)

### Issue 2: Range parser fails with multiline
**Symptom:** All values show as NORMAL  
**Cause:** Parser extracts first numeric range  
**Fix:** Ensure first line has parseable range (e.g., `Male: 13-17 g/dL`)

### Issue 3: Textarea not resizing
**Symptom:** Bio-ref input too small  
**Cause:** Browser cache or CSS issue  
**Fix:** Hard refresh (Ctrl+Shift+R), verify `ProfileManager.jsx` has `rows="3"` and `min-height: 120px`

---

## 🎯 Migration Checklist Summary

- [ ] ✅ Backup current profile data
- [ ] ✅ Identify tests needing multiline refs
- [ ] ✅ Update via Profile Manager UI (or script)
- [ ] ✅ Test with 1-2 profiles first
- [ ] ✅ Generate PDF and verify display
- [ ] ✅ Check range parser works (HIGH/LOW detection)
- [ ] ✅ Rollout to all profiles
- [ ] ✅ Train staff on new format

---

## 📊 Expected Results

### Before Migration
```javascript
{
  name: "Hemoglobin",
  bioReference: "13-17 g/dL"
}
```

**PDF Output:**
```
Hemoglobin | 14.5 | g/dL | 13-17 g/dL
```

### After Migration
```javascript
{
  name: "Hemoglobin",
  bioReference: "Male: 13.0 - 17.0 g/dL\nFemale: 12.0 - 15.0 g/dL\nPregnant: 11.0 - 14.0 g/dL"
}
```

**PDF Output:**
```
Hemoglobin | 14.5 | g/dL | Male: 13.0 - 17.0 g/dL
           |      |      | Female: 12.0 - 15.0 g/dL
           |      |      | Pregnant: 11.0 - 14.0 g/dL
```

---

## 💡 Tips

1. **Start small:** Migrate 1-2 profiles first
2. **Test thoroughly:** Generate PDFs for each migrated profile
3. **User feedback:** Ask medical staff which tests need multiline refs
4. **Document changes:** Keep list of updated tests
5. **Schedule migration:** Do during low-traffic hours

---

## 🚀 Next Steps After Migration

1. Generate sample PDFs and share with medical staff
2. Collect feedback on bio-ref clarity
3. Refine ranges based on clinical needs
4. Document custom ranges for future reference

---

**Migration Status:** ✅ Optional (backward compatible)  
**Risk Level:** Low  
**Recommended:** Yes (improves clarity)

---

**Questions?** Check `IMPLEMENTATION_NOTES.md` section F (Database/Data Model)
