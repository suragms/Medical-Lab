
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

const schemaOptions = { strict: false };
const Patient = mongoose.model('Patient', new mongoose.Schema({}, schemaOptions));
const Visit = mongoose.model('Visit', new mongoose.Schema({}, schemaOptions));

async function checkData() {
    try {
        await mongoose.connect(MONGODB_URI);
        const patientCount = await Patient.countDocuments();
        const visitCount = await Visit.countDocuments();

        console.log('--------------------------------');
        console.log(`PATIENTS IN DB: ${patientCount}`);
        console.log(`VISITS IN DB:   ${visitCount}`);
        console.log('--------------------------------');

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

checkData();
