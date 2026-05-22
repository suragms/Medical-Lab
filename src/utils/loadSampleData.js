/**
 * Utility to load 10 sample patients with test data
 * For testing PDF generation, range highlighting, and edge cases
 */

import samplePatientsData from '../data/samplePatients.json';
import { addPatient, createVisit, updateVisitResults, getProfiles } from '../features/shared/dataService';

/**
 * Load all 10 sample patients into the system
 * Creates patients, visits, and test results
 */
export const loadSamplePatients = async () => {
  const results = {
    success: [],
    errors: []
  };

  try {
    // Get available profiles to match tests
    const profiles = getProfiles();
    
    // Use first available profile or create a generic one
    const defaultProfile = profiles[0] || {
      profileId: 'PROF_SAMPLE',
      name: 'Sample Test Profile',
      packagePrice: 500,
      tests: []
    };

    for (const sampleData of samplePatientsData) {
      try {
        // 1. Create patient
        const patientData = {
          name: sampleData.patient.name,
          age: sampleData.patient.age,
          gender: sampleData.patient.gender,
          phone: sampleData.patient.phone,
          address: sampleData.patient.address,
          referredBy: sampleData.patient.referredBy || 'Self'
        };

        const patient = addPatient(patientData);

        // 2. Create visit with test snapshots
        const testSnapshots = sampleData.tests.map((test, index) => ({
          snapshotId: `SNAP_${Date.now()}_${index}`,
          testId: `TEST_${test.name.replace(/\s+/g, '_').toUpperCase()}`,
          name_snapshot: test.name,
          unit_snapshot: test.unit || '',
          bioReference_snapshot: test.bioReference || '',
          refText_snapshot: test.bioReference || '',
          inputType_snapshot: 'number',
          price_snapshot: 50,
          value: test.value,
          included: true,
          versionSnapshot: new Date().toISOString()
        }));

        const visit = createVisit({
          patientId: patient.patientId,
          profileId: defaultProfile.profileId,
          profileName: defaultProfile.name,
          tests: testSnapshots,
          collectedAt: new Date().toISOString(),
          receivedAt: new Date().toISOString(),
          reportedAt: new Date().toISOString(),
          status: 'results_entered',
          subtotal: defaultProfile.packagePrice,
          discount: 0,
          finalAmount: defaultProfile.packagePrice
        });

        // 3. Update visit with results
        updateVisitResults(visit.visitId, testSnapshots);

        results.success.push({
          patient: patient.name,
          visitId: visit.visitId,
          testCount: testSnapshots.length
        });

        console.log(`✅ Loaded patient: ${patient.name} (${testSnapshots.length} tests)`);
      } catch (error) {
        results.errors.push({
          patient: sampleData.patient.name,
          error: error.message
        });
        console.error(`❌ Failed to load patient: ${sampleData.patient.name}`, error);
      }
    }

    console.log('\n📊 Sample Data Load Summary:');
    console.log(`✅ Success: ${results.success.length} patients`);
    console.log(`❌ Errors: ${results.errors.length} patients`);

    return results;
  } catch (error) {
    console.error('Fatal error loading sample data:', error);
    throw error;
  }
};

/**
 * Clear all sample patients (for cleanup)
 */
export const clearSamplePatients = () => {
  console.log('🗑️ Clearing sample patients...');
  // Implementation depends on your data service
  // You might want to add a method to identify and delete sample data
  console.warn('Manual cleanup required - delete patients via UI or database');
};

/**
 * Verify sample data loaded correctly
 */
export const verifySampleData = () => {
  const patients = JSON.parse(localStorage.getItem('healit_patients') || '[]');
  const samplePatientNames = samplePatientsData.map(s => s.patient.name);
  
  const loadedSamples = patients.filter(p => 
    samplePatientNames.includes(p.name)
  );

  console.log(`\n✅ Found ${loadedSamples.length} sample patients in database`);
  
  loadedSamples.forEach(p => {
    console.log(`  - ${p.name} (ID: ${p.patientId})`);
  });

  return loadedSamples;
};

export default {
  loadSamplePatients,
  clearSamplePatients,
  verifySampleData
};
