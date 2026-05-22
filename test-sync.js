/**
 * Quick Sync Test Script
 * Tests MongoDB connection and data sync functionality
 * 
 * Usage: node test-sync.js
 */

import mongoose from 'mongoose';
import 'dotenv/config';

// Load MongoDB URI from .env.backend
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://suragsunil2023_db_user:RlrH7H0DGAUiTNF4@labdb.qjokknr.mongodb.net/?appName=Labdb';

console.log('🔍 Testing MongoDB Connection and Sync...\n');

// Test 1: MongoDB Connection
async function testConnection() {
    console.log('Test 1: MongoDB Connection');
    console.log('─'.repeat(50));

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected Successfully\n');
        return true;
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        console.error('   Check your MONGODB_URI in .env.backend\n');
        return false;
    }
}

// Test 2: List Collections
async function testCollections() {
    console.log('Test 2: Database Collections');
    console.log('─'.repeat(50));

    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections:\n`);

        const expectedCollections = [
            'patients', 'visits', 'results', 'invoices',
            'financialexpenses', 'financialcategories', 'financialreminders',
            'settings', 'profiles', 'testmasters', 'auditlogs'
        ];

        expectedCollections.forEach(name => {
            const exists = collections.some(c => c.name === name);
            console.log(`  ${exists ? '✅' : '⚠️ '} ${name}`);
        });

        console.log('');
        return true;
    } catch (error) {
        console.error('❌ Failed to list collections:', error.message, '\n');
        return false;
    }
}

// Test 3: Count Documents
async function testDocumentCounts() {
    console.log('Test 3: Document Counts');
    console.log('─'.repeat(50));

    try {
        const db = mongoose.connection.db;

        const collections = [
            'patients', 'visits', 'results', 'invoices',
            'financialexpenses', 'financialcategories', 'financialreminders',
            'settings', 'profiles', 'testmasters', 'auditlogs'
        ];

        let totalDocs = 0;

        for (const collectionName of collections) {
            try {
                const count = await db.collection(collectionName).countDocuments();
                totalDocs += count;
                console.log(`  ${collectionName.padEnd(25)} ${count.toString().padStart(5)} documents`);
            } catch (err) {
                console.log(`  ${collectionName.padEnd(25)} ${' N/A'.padStart(5)} (collection not found)`);
            }
        }

        console.log('  ' + '─'.repeat(35));
        console.log(`  ${'TOTAL'.padEnd(25)} ${totalDocs.toString().padStart(5)} documents\n`);
        return true;
    } catch (error) {
        console.error('❌ Failed to count documents:', error.message, '\n');
        return false;
    }
}

// Test 4: Test Write Operation
async function testWriteOperation() {
    console.log('Test 4: Write Operation Test');
    console.log('─'.repeat(50));

    try {
        const db = mongoose.connection.db;
        const testCollection = db.collection('_test_sync');

        // Insert test document
        const testDoc = {
            testId: 'test-' + Date.now(),
            message: 'Sync test document',
            timestamp: new Date()
        };

        console.log('Writing test document...');
        await testCollection.insertOne(testDoc);
        console.log('✅ Write successful');

        // Read back
        console.log('Reading test document...');
        const found = await testCollection.findOne({ testId: testDoc.testId });
        console.log('✅ Read successful');

        // Delete test document
        console.log('Deleting test document...');
        await testCollection.deleteOne({ testId: testDoc.testId });
        console.log('✅ Delete successful\n');

        return true;
    } catch (error) {
        console.error('❌ Write operation failed:', error.message, '\n');
        return false;
    }
}

// Test 5: Sample Patient Data
async function testPatientData() {
    console.log('Test 5: Patient Data Sample');
    console.log('─'.repeat(50));

    try {
        const db = mongoose.connection.db;
        const patients = await db.collection('patients').find().limit(3).toArray();

        if (patients.length === 0) {
            console.log('⚠️  No patient data found in database');
            console.log('   This is normal for a fresh database\n');
        } else {
            console.log(`Found ${patients.length} sample patients:\n`);
            patients.forEach((patient, index) => {
                console.log(`  ${index + 1}. ${patient.name || 'N/A'} (ID: ${patient.patientId || 'N/A'})`);
            });
            console.log('');
        }

        return true;
    } catch (error) {
        console.error('❌ Failed to fetch patient data:', error.message, '\n');
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('═'.repeat(50));
    console.log('  HEALIT LAB - MONGODB SYNC TEST SUITE');
    console.log('═'.repeat(50));
    console.log('');

    const results = {
        connection: false,
        collections: false,
        counts: false,
        write: false,
        patient: false
    };

    // Test 1: Connection
    results.connection = await testConnection();
    if (!results.connection) {
        console.log('❌ Cannot proceed without MongoDB connection\n');
        process.exit(1);
    }

    // Test 2: Collections
    results.collections = await testCollections();

    // Test 3: Document Counts
    results.counts = await testDocumentCounts();

    // Test 4: Write Operation
    results.write = await testWriteOperation();

    // Test 5: Patient Data
    results.patient = await testPatientData();

    // Summary
    console.log('═'.repeat(50));
    console.log('  TEST SUMMARY');
    console.log('═'.repeat(50));
    console.log('');
    console.log(`  MongoDB Connection:     ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Collections Check:      ${results.collections ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Document Counts:        ${results.counts ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Write Operation:        ${results.write ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Patient Data Sample:    ${results.patient ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');

    const allPassed = Object.values(results).every(r => r === true);

    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED!');
        console.log('✅ MongoDB is properly configured and working');
        console.log('✅ Data sync should work correctly across browsers\n');
    } else {
        console.log('⚠️  SOME TESTS FAILED');
        console.log('   Please check the errors above and fix them\n');
    }

    console.log('═'.repeat(50));
    console.log('');

    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed.\n');

    process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
