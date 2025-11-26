n2# Quick Test Guide - Cross-Browser Data Sync

## 🚀 Quick Start

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Open Two Browsers
- **Browser A**: Chrome - `http://localhost:5173`
- **Browser B**: Firefox - `http://localhost:5173`

### 3. Login to Both
- Username: `admin`
- Password: `admin123`

---

## ✅ Quick Tests (5 minutes)

### Test 1: Add Patient (30 seconds)
1. **Chrome**: Add patient "John Doe"
2. **Wait 30 seconds** (watch sync indicator)
3. **Firefox**: Refresh → John Doe should appear ✅

### Test 2: Edit Patient (30 seconds)
1. **Firefox**: Edit "John Doe" → Change to "John Smith"
2. **Wait 30 seconds**
3. **Chrome**: Refresh → Should show "John Smith" ✅

### Test 3: Delete Patient (30 seconds)
1. **Chrome**: Delete "John Smith"
2. **Wait 30 seconds**
3. **Firefox**: Refresh → Patient should be gone ✅

### Test 4: Financial Data (1 minute)
1. **Chrome**: Go to Financial → Add expense "Rent - ₹10,000"
2. Note the Revenue and Profit values
3. **Wait 30 seconds**
4. **Firefox**: Go to Financial
5. **Expected**: Same expense, same Revenue/Profit values ✅

---

## 🎯 What to Watch

### Sync Indicator (Top Right)
- **🔄 Spinning**: Currently syncing
- **✅ Green**: Synced successfully
- **⚠️ Red**: Error (click to retry)
- **📡 Orange**: Offline

### Browser Console
Open DevTools (F12) and watch for:
```
✅ Data synchronized with backend
✅ Auto-sync enabled
🔄 Syncing from server (Server Wins)...
✅ Sync completed successfully
```

---

## 🐛 If Something Goes Wrong

### Data Not Syncing?
1. Check if both browsers are logged in
2. Click the sync button manually
3. Check browser console for errors
4. Verify MongoDB is connected (check Netlify logs)

### Sync Indicator Not Showing?
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Check browser console for errors

---

## 📊 Expected Behavior

| Action in Browser A | Expected in Browser B (after 30s) |
|---------------------|-----------------------------------|
| Add patient | Patient appears |
| Edit patient | Changes appear |
| Delete patient | Patient removed |
| Add visit | Visit appears |
| Enter results | Results appear |
| Add expense | Expense + updated totals appear |
| Change settings | Settings updated |

---

## ✨ Success Criteria

✅ **PASS** if:
- Changes in Browser A appear in Browser B within 30 seconds
- Sync indicator shows "Synced" status
- No console errors
- All data types sync correctly

❌ **FAIL** if:
- Changes don't appear after 1 minute
- Sync indicator shows error
- Console shows MongoDB connection errors
- Data appears in one browser but not the other

---

**Quick Tip**: You can click the sync indicator button to force immediate sync instead of waiting 30 seconds!
