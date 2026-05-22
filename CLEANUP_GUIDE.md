# 🧹 Database Cleanup Guide

This script removes orphaned data (visits without patients) from your MongoDB database.

## Why Run This?

Before the cascade delete fix was deployed, deleting patients left their visits, results, and invoices in the database. This caused:
- ❌ Revenue showing even with 0 patients
- ❌ Profit calculations being incorrect
- ❌ "Orphaned" visits cluttering the database

## Prerequisites

1. ✅ MongoDB Atlas configured
2. ✅ `MONGODB_URI` in your `.env` file
3. ✅ Node.js installed

## How to Run

### Step 1: Ensure .env file has MongoDB URI

Open `.env` and verify it contains:
```
MONGODB_URI="mongodb+srv://suragsunil2023_db_user:<password>@labdb.qjokknr.mongodb.net/?appName=Labdb"
```
(Replace `<password>` with your actual password)

### Step 2: Run the cleanup script

```bash
node cleanup-orphaned-data.js
```

### Step 3: Expected Output

```
🧹 Starting database cleanup...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Analyzing data...
   Found 0 patients
   Found 5 total visits
   Found 5 orphaned visits

🗑️  Cleaning up orphaned data...
   ✅ Deleted 5 orphaned visits
   ✅ Deleted 4 orphaned results
   ✅ Deleted 3 orphaned invoices

🔍 Verifying cleanup...
   Remaining orphaned visits: 0

✅ Cleanup completed successfully!
   All orphaned data has been removed.
   Revenue and profit calculations should now be accurate.

🔌 Disconnected from MongoDB
```

## After Running

1. **Refresh your Netlify app**
2. **Check Dashboard**:
   - Revenue should now be ₹0 (if you have 0 patients)
   - Profit should now be ₹0 (if you have 0 patients)
3. **Verify Patient page**:
   - Active Visits should be 0
   - Completed Reports should be 0

## If It Doesn't Work

1. **Check .env file** - Make sure MONGODB_URI is correct
2. **Check MongoDB connection** - Ensure Network Access allows `0.0.0.0/0`
3. **Run again** - Sometimes the script needs to run twice

## Safety

✅ This script is **safe** - it only deletes visits that don't have a matching patient
✅ It does **NOT** delete patients or their valid data
✅ You can run it multiple times without issues

---

**After cleanup, the cascade delete fix will prevent this issue from happening again!**
