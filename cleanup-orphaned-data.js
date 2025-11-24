/**
 * Database Cleanup Script
 * Removes orphaned visits (visits without patients) from MongoDB
 * Run this once to clean up old data before the cascade delete fix
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';

// Read MongoDB URI from .env file
let MONGODB_URI;
try {
    const envContent = readFileSync('.env', 'utf-8');
    const match = envContent.match(/MONGODB_URI=(.+)/);
    MONGODB_URI = match ? match[1].trim().replace(/['"]/g, '') : null;
} catch (error) {
    console.error('❌ Could not read .env file');
}

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
}

// Define schemas (minimal versions)
const patientSchema = new mongoose.Schema({
    patientId: { type: String, required: true, unique: true }
}, { strict: false });

const visitSchema = new mongoose.Schema({
    visitId: { type: String, required: true, unique: true },
    patientId: { type: String, required: true }
}, { strict: false });

const resultSchema = new mongoose.Schema({
    visitId: { type: String, required: true }
}, { strict: false });

const invoiceSchema = new mongoose.Schema({
    invoiceId: { type: String, required: true, unique: true },
    visitId: { type: String }
}, { strict: false });

const Patient = mongoose.model('Patient', patientSchema);
const Visit = mongoose.model('Visit', visitSchema);
const Result = mongoose.model('Result', resultSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);

async function cleanupOrphanedData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Step 1: Get all patient IDs
        console.log('\n📊 Analyzing data...');
        const patients = await Patient.find({}, { patientId: 1 });
        const patientIds = new Set(patients.map(p => p.patientId));
        console.log(`   Found ${patientIds.size} patients`);

        // Step 2: Find orphaned visits (visits without patients)
        const allVisits = await Visit.find({});
        const orphanedVisits = allVisits.filter(v => !patientIds.has(v.patientId));
        console.log(`   Found ${allVisits.length} total visits`);
        console.log(`   Found ${orphanedVisits.length} orphaned visits`);

        if (orphanedVisits.length === 0) {
            console.log('\n✅ No orphaned data found. Database is clean!');
            await mongoose.disconnect();
            return;
        }

        // Step 3: Get orphaned visit IDs
        const orphanedVisitIds = orphanedVisits.map(v => v.visitId);

        // Step 4: Delete orphaned data
        console.log('\n🗑️  Cleaning up orphaned data...');

        const visitDeleteResult = await Visit.deleteMany({ visitId: { $in: orphanedVisitIds } });
        console.log(`   ✅ Deleted ${visitDeleteResult.deletedCount} orphaned visits`);

        const resultDeleteResult = await Result.deleteMany({ visitId: { $in: orphanedVisitIds } });
        console.log(`   ✅ Deleted ${resultDeleteResult.deletedCount} orphaned results`);

        const invoiceDeleteResult = await Invoice.deleteMany({ visitId: { $in: orphanedVisitIds } });
        console.log(`   ✅ Deleted ${invoiceDeleteResult.deletedCount} orphaned invoices`);

        // Step 5: Verify cleanup
        console.log('\n🔍 Verifying cleanup...');
        const remainingOrphans = await Visit.find({ patientId: { $nin: Array.from(patientIds) } });
        console.log(`   Remaining orphaned visits: ${remainingOrphans.length}`);

        if (remainingOrphans.length === 0) {
            console.log('\n✅ Cleanup completed successfully!');
            console.log('   All orphaned data has been removed.');
            console.log('   Revenue and profit calculations should now be accurate.');
        } else {
            console.log('\n⚠️  Some orphaned visits remain. Please run the script again.');
        }

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');

    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run cleanup
console.log('🧹 Starting database cleanup...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
cleanupOrphanedData();
