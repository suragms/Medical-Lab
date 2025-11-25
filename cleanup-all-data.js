/**
 * Complete Database Cleanup for Handover
 * This script removes ALL data from MongoDB to prepare for handover
 * 
 * ⚠️ WARNING: This will delete ALL patients, visits, results, invoices, and financial data!
 * Only run this if you want to start with a completely clean database.
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
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
}

// Define schemas
const schemaOptions = { strict: false };

const Patient = mongoose.model('Patient', new mongoose.Schema({}, schemaOptions));
const Visit = mongoose.model('Visit', new mongoose.Schema({}, schemaOptions));
const Result = mongoose.model('Result', new mongoose.Schema({}, schemaOptions));
const Invoice = mongoose.model('Invoice', new mongoose.Schema({}, schemaOptions));
const FinancialExpense = mongoose.model('FinancialExpense', new mongoose.Schema({}, schemaOptions));
const FinancialCategory = mongoose.model('FinancialCategory', new mongoose.Schema({}, schemaOptions));
const FinancialReminder = mongoose.model('FinancialReminder', new mongoose.Schema({}, schemaOptions));
const AuditLog = mongoose.model('AuditLog', new mongoose.Schema({}, schemaOptions));

async function cleanupAllData() {
    try {
        console.log('🧹 COMPLETE DATABASE CLEANUP FOR HANDOVER');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('⚠️  WARNING: This will delete ALL data from the database!');
        console.log('   - All patients');
        console.log('   - All visits');
        console.log('   - All test results');
        console.log('   - All invoices');
        console.log('   - All financial records');
        console.log('   - All audit logs\n');

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('📊 Current database status:');
        const patientCount = await Patient.countDocuments();
        const visitCount = await Visit.countDocuments();
        const resultCount = await Result.countDocuments();
        const invoiceCount = await Invoice.countDocuments();
        const expenseCount = await FinancialExpense.countDocuments();
        const categoryCount = await FinancialCategory.countDocuments();
        const reminderCount = await FinancialReminder.countDocuments();
        const auditCount = await AuditLog.countDocuments();

        console.log(`   Patients: ${patientCount}`);
        console.log(`   Visits: ${visitCount}`);
        console.log(`   Results: ${resultCount}`);
        console.log(`   Invoices: ${invoiceCount}`);
        console.log(`   Expenses: ${expenseCount}`);
        console.log(`   Categories: ${categoryCount}`);
        console.log(`   Reminders: ${reminderCount}`);
        console.log(`   Audit Logs: ${auditCount}\n`);

        const totalRecords = patientCount + visitCount + resultCount + invoiceCount +
            expenseCount + categoryCount + reminderCount + auditCount;

        if (totalRecords === 0) {
            console.log('✅ Database is already clean! No data to delete.\n');
            await mongoose.disconnect();
            return;
        }

        console.log('🗑️  Deleting all data...\n');

        const results = await Promise.all([
            Patient.deleteMany({}),
            Visit.deleteMany({}),
            Result.deleteMany({}),
            Invoice.deleteMany({}),
            FinancialExpense.deleteMany({}),
            FinancialCategory.deleteMany({}),
            FinancialReminder.deleteMany({}),
            AuditLog.deleteMany({})
        ]);

        console.log(`   ✅ Deleted ${results[0].deletedCount} patients`);
        console.log(`   ✅ Deleted ${results[1].deletedCount} visits`);
        console.log(`   ✅ Deleted ${results[2].deletedCount} results`);
        console.log(`   ✅ Deleted ${results[3].deletedCount} invoices`);
        console.log(`   ✅ Deleted ${results[4].deletedCount} expenses`);
        console.log(`   ✅ Deleted ${results[5].deletedCount} categories`);
        console.log(`   ✅ Deleted ${results[6].deletedCount} reminders`);
        console.log(`   ✅ Deleted ${results[7].deletedCount} audit logs\n`);

        console.log('🔍 Verifying cleanup...');
        const remainingPatients = await Patient.countDocuments();
        const remainingVisits = await Visit.countDocuments();
        const remainingResults = await Result.countDocuments();

        console.log(`   Remaining patients: ${remainingPatients}`);
        console.log(`   Remaining visits: ${remainingVisits}`);
        console.log(`   Remaining results: ${remainingResults}\n`);

        if (remainingPatients === 0 && remainingVisits === 0 && remainingResults === 0) {
            console.log('✅ CLEANUP COMPLETE!');
            console.log('   Database is now completely clean and ready for handover.');
            console.log('   All test data has been removed.\n');
        } else {
            console.log('⚠️  Some data remains. Please run the script again.\n');
        }

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run cleanup
cleanupAllData();
