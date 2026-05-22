// LocalStorage Data Service - Acts as Backend
import PROFILES from '../../data/seed/profiles';

const STORAGE_KEYS = {
  TESTS_MASTER: 'healit_tests_master',
  PROFILES: 'healit_profiles',
  PATIENTS: 'healit_patients',
  VISITS: 'healit_visits',
  RESULTS: 'healit_results',
  INVOICES: 'healit_invoices',
  SETTINGS: 'healit_settings',
  AUDIT_LOGS: 'healit_audit_logs'
};

const API_URL = import.meta.env.PROD
  ? '/.netlify/functions/api'
  : 'http://localhost:8888/.netlify/functions/api';

// Helper for API calls (fire and forget for mutations)
const apiCall = async (endpoint, method, body) => {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    return await res.json();
  } catch (error) {
    // Silent fail - server not required for local operation
    // Only log in development for debugging
    if (import.meta.env.DEV) {
      console.debug(`[API] ${method} ${endpoint} - Server offline (using localStorage)`);
    }
    return null;
  }
};

// Event dispatcher for real-time updates
const dispatchDataUpdate = (type) => {
  window.dispatchEvent(new CustomEvent('healit-data-update', { detail: { type } }));
};

// Initialize seed data on first load
export const initializeSeedData = async () => {
  // Try to sync from server first
  try {
    console.log('Attempting to sync with server...');
    const res = await apiCall('/sync', 'GET');
    console.log('Server response:', res);

    if (res && res.success) {
      // Case 1: Database not configured
      if (res.message && res.message.includes('Database not configured')) {
        console.warn('⚠️ Database not configured - running in local-only mode');
        // Continue to load local data...
      }
      // Case 2: Server has data - Sync down (Server Wins)
      else if (res.data && (
        (res.data.patients && res.data.patients.length > 0) ||
        (res.data.visits && res.data.visits.length > 0)
      )) {
        console.log('📥 Downloading data from server...');
        const { patients, visits, results, invoices, settings, profiles, testsMaster } = res.data;

        if (patients) localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
        if (visits) localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
        if (results) localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
        if (invoices) localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
        if (settings && Object.keys(settings).length > 0) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        if (profiles && profiles.length > 0) localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
        if (testsMaster && testsMaster.length > 0) localStorage.setItem(STORAGE_KEYS.TESTS_MASTER, JSON.stringify(testsMaster));

        console.log('✅ Synced with server successfully');
        dispatchDataUpdate('all');
        return; // Exit if sync successful
      }
      // Case 3: Server is empty but connected - Upload local data (Initial Seed)
      else {
        console.log('📤 Server is empty. Uploading local data to seed database...');
        await syncLocalToServer();
        return;
      }
    } else {
      console.warn('⚠️ Server returned unsuccessful response');
    }
  } catch (e) {
    console.warn('❌ Server sync failed, falling back to local seed data', e);
  }

  // Fallback to local seed data logic...
  const currentVersion = '2.0';
  const storedVersion = localStorage.getItem('healit_data_version');

  if (storedVersion !== currentVersion) {
    console.log('Data structure updated, reloading profiles...');
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.TESTS_MASTER);
    localStorage.setItem('healit_data_version', currentVersion);
  }

  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(PROFILES));
  }

  if (!localStorage.getItem(STORAGE_KEYS.TESTS_MASTER)) {
    const testMap = new Map();
    PROFILES.forEach(profile => {
      if (profile.tests && Array.isArray(profile.tests)) {
        profile.tests.forEach(test => {
          if (!testMap.has(test.testId)) {
            testMap.set(test.testId, {
              testId: test.testId,
              name: test.name,
              description: test.description || '',
              code: test.testId,
              unit: test.unit || '',
              bioReference: test.bioReference || '',
              refLow: null,
              refHigh: null,
              refText: test.bioReference || '',
              inputType: 'number',
              dropdownOptions: [],
              price: test.price || 0,
              category: test.testId.match(/^([A-Z]+)/)?.[1] || 'General',
              active: true,
              createdAt: new Date().toISOString()
            });
          }
        });
      }
    });

    const testsMaster = Array.from(testMap.values());
    localStorage.setItem(STORAGE_KEYS.TESTS_MASTER, JSON.stringify(testsMaster));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    const defaultSettings = {
      allowStaffInlineCreate: false,
      allowStaffEditPrice: false,
      labName: 'HEALit Med Laboratories',
      labAddress: 'Kunnathpeedika Centre',
      labPhone: '7356865161',
      labEmail: 'info@healitlab.com'
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
  }
};

// Clear all data and start fresh
export const clearAllData = () => {
  localStorage.removeItem(STORAGE_KEYS.PATIENTS);
  localStorage.removeItem(STORAGE_KEYS.VISITS);
  localStorage.removeItem(STORAGE_KEYS.RESULTS);
  localStorage.removeItem(STORAGE_KEYS.INVOICES);
  localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
  localStorage.removeItem(STORAGE_KEYS.PROFILES);
  localStorage.removeItem(STORAGE_KEYS.TESTS_MASTER);
  localStorage.removeItem('healit_financial_expenses');
  localStorage.removeItem('healit_financial_categories');
  localStorage.removeItem('healit_financial_reminders');
  localStorage.removeItem('healit_data_version');

  initializeSeedData();
  dispatchDataUpdate('all');
  return true;
};

// Test Master Operations
export const getTestsMaster = (searchTerm = '') => {
  const tests = JSON.parse(localStorage.getItem(STORAGE_KEYS.TESTS_MASTER) || '[]');
  if (!searchTerm) return tests.filter(t => t.active);

  const term = searchTerm.toLowerCase();
  return tests.filter(t =>
    t.active && (
      t.name.toLowerCase().includes(term) ||
      t.code.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term)
    )
  );
};

export const getTestById = (testId) => {
  const tests = JSON.parse(localStorage.getItem(STORAGE_KEYS.TESTS_MASTER) || '[]');
  return tests.find(t => t.testId === testId);
};

export const addTestToMaster = (test) => {
  const tests = JSON.parse(localStorage.getItem(STORAGE_KEYS.TESTS_MASTER) || '[]');
  const newTest = {
    ...test,
    testId: `CUSTOM_${Date.now()}`,
    active: true,
    createdAt: new Date().toISOString()
  };
  tests.push(newTest);
  localStorage.setItem(STORAGE_KEYS.TESTS_MASTER, JSON.stringify(tests));

  // Sync to Server
  apiCall('/tests', 'POST', newTest);

  return newTest;
};

// Profile Operations
export const getProfiles = () => {
  const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
  return profiles.filter(p => p.active);
};

export const getProfileById = (profileId) => {
  const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
  return profiles.find(p => p.profileId === profileId);
};

export const getProfileWithTests = (profileId) => {
  const profile = getProfileById(profileId);
  if (!profile) return null;

  const testsMaster = JSON.parse(localStorage.getItem(STORAGE_KEYS.TESTS_MASTER) || '[]');
  const tests = profile.testIds.map(testId => {
    const test = testsMaster.find(t => t.testId === testId);
    return test || null;
  }).filter(Boolean);

  return { ...profile, tests };
};

export const addProfile = (profileData) => {
  const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
  const newProfile = {
    ...profileData,
    profileId: `PROF_${Date.now()}`,
    active: true,
    createdAt: new Date().toISOString()
  };
  profiles.push(newProfile);
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));

  // Sync to Server
  apiCall('/profiles', 'POST', newProfile);

  return newProfile;
};

// Patient Operations
export const getPatients = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS) || '[]');
};

export const getPatientById = (patientId) => {
  const patients = getPatients();
  return patients.find(p => p.patientId === patientId);
};

export const addPatient = (patientData) => {
  const patients = getPatients();
  const newPatient = {
    ...patientData,
    patientId: `PAT_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  patients.push(newPatient);
  localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  dispatchDataUpdate('patients');

  // Sync to Server
  apiCall('/patients', 'POST', newPatient);

  return newPatient;
};

export const updatePatient = (patientId, updates) => {
  const patients = getPatients();
  const index = patients.findIndex(p => p.patientId === patientId);
  if (index !== -1) {
    patients[index] = { ...patients[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    dispatchDataUpdate('patients');

    // Sync to Server
    apiCall(`/patients/${patientId}`, 'PUT', patients[index]);

    return patients[index];
  }
  return null;
};

export const deletePatient = (patientId) => {
  const patients = getPatients();
  const visits = getVisits();
  const results = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]');
  const invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');

  // CRITICAL: Calculate revenue loss from paid visits before deletion
  const patientVisits = visits.filter(v => v.patientId === patientId);
  const paidVisits = patientVisits.filter(v => v.paymentStatus === 'paid');
  const totalRevenueLoss = paidVisits.reduce((sum, visit) => sum + (visit.finalAmount || visit.totalAmount || 0), 0);

  // Log revenue reduction for financial tracking
  if (totalRevenueLoss > 0) {
    logAudit('REVENUE_REDUCTION', {
      reason: 'Patient deletion',
      patientId,
      amount: totalRevenueLoss,
      visitCount: paidVisits.length,
      timestamp: new Date().toISOString()
    });

    // Update financial records (reduce revenue)
    try {
      const expenses = JSON.parse(localStorage.getItem('healit_financial_expenses') || '[]');
      expenses.push({
        expenseId: `EXP_DELETION_${Date.now()}`,
        category: 'Refund/Adjustment',
        amount: totalRevenueLoss,
        description: `Revenue reduction due to patient deletion (${paidVisits.length} visit(s))`,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('healit_financial_expenses', JSON.stringify(expenses));
    } catch (error) {
      console.error('Failed to log revenue reduction:', error);
    }
  }

  const visitIds = patientVisits.map(v => v.visitId);
  const updatedPatients = patients.filter(p => p.patientId !== patientId);
  const updatedVisits = visits.filter(v => v.patientId !== patientId);
  const updatedResults = results.filter(r => !visitIds.includes(r.visitId));
  const updatedInvoices = invoices.filter(i => !visitIds.includes(i.visitId));

  localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(updatedPatients));
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(updatedVisits));
  localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(updatedResults));
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updatedInvoices));

  dispatchDataUpdate('patients');

  // Sync to Server
  apiCall(`/patients/${patientId}`, 'DELETE');

  return {
    success: true,
    deletedVisits: patientVisits.length,
    revenueLoss: totalRevenueLoss
  };
};

// Visit Operations
export const getVisits = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.VISITS) || '[]');
};

export const getVisitById = (visitId) => {
  const visits = getVisits();
  return visits.find(v => v.visitId === visitId || v.id === visitId);
};

export const getVisitsByPatientId = (patientId) => {
  const visits = getVisits();
  return visits.filter(v => v.patientId === patientId);
};

export const createVisit = (visitData) => {
  const visits = getVisits();
  const newVisit = {
    ...visitData,
    visitId: `VISIT_${Date.now()}`,
    status: 'tests_selected',
    pdfGenerated: false,
    invoiceGenerated: false,
    paymentStatus: 'unpaid',
    paidAt: null,
    createdAt: new Date().toISOString()
  };
  visits.push(newVisit);
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
  dispatchDataUpdate('visits');

  // Sync to Server
  apiCall('/visits', 'POST', newVisit);

  return newVisit;
};

export const updateVisit = (visitId, updates) => {
  const visits = getVisits();
  const index = visits.findIndex(v => v.visitId === visitId);
  if (index !== -1) {
    visits[index] = { ...visits[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    dispatchDataUpdate('visits');

    // Sync to Server
    apiCall(`/visits/${visitId}`, 'PUT', visits[index]);

    return visits[index];
  }
  return null;
};

export const markPDFGenerated = (visitId) => {
  return updateVisit(visitId, {
    pdfGenerated: true,
    pdfGeneratedAt: new Date().toISOString()
  });
};

export const markInvoiceGenerated = (visitId) => {
  return updateVisit(visitId, {
    invoiceGenerated: true,
    invoiceGeneratedAt: new Date().toISOString(),
    paymentStatus: 'paid',
    paidAt: new Date().toISOString()
  });
};

export const updatePaymentStatus = (visitId, status) => {
  const updates = { paymentStatus: status };
  if (status === 'paid') {
    updates.paidAt = new Date().toISOString();
  }
  return updateVisit(visitId, updates);
};

// Result Operations
export const saveResults = (visitId, results) => {
  const allResults = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]');
  const filtered = allResults.filter(r => r.visitId !== visitId);

  const newResults = {
    visitId,
    results,
    savedAt: new Date().toISOString()
  };
  filtered.push(newResults);

  localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(filtered));

  // Sync to Server
  apiCall('/results', 'POST', newResults);

  return newResults;
};

export const updateVisitResults = (visitId, testsWithResults) => {
  const visits = getVisits();
  const visitIndex = visits.findIndex(v => v.visitId === visitId);

  if (visitIndex !== -1) {
    visits[visitIndex].tests = testsWithResults;
    visits[visitIndex].updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    dispatchDataUpdate('visits');

    // Sync to Server
    apiCall(`/visits/${visitId}`, 'PUT', visits[visitIndex]);

    return visits[visitIndex];
  }
  return null;
};

export const getResultsByVisitId = (visitId) => {
  const allResults = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]');
  return allResults.find(r => r.visitId === visitId);
};

// Invoice Operations
export const createInvoice = (invoiceData) => {
  const invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');
  const newInvoice = {
    ...invoiceData,
    invoiceId: `INV_${Date.now()}`,
    generatedAt: new Date().toISOString()
  };
  invoices.push(newInvoice);
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));

  // Sync to Server
  apiCall('/invoices', 'POST', newInvoice);

  return newInvoice;
};

export const getInvoicesByVisitId = (visitId) => {
  const invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');
  return invoices.filter(inv => inv.visitId === visitId);
};

// Settings Operations
export const getSettings = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
};

export const updateSettings = (updates) => {
  const settings = getSettings();
  const newSettings = { ...settings, ...updates };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));

  // Sync to Server
  apiCall('/settings', 'PUT', newSettings);

  return newSettings;
};

// Audit Log
export const logAudit = (action, details) => {
  const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
  logs.push({
    logId: `LOG_${Date.now()}`,
    action,
    details,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
};

// Search with debounce helper
export const searchTests = (searchTerm) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getTestsMaster(searchTerm));
    }, 300);
  });
};

// Sync local data to server (Bulk Upload)
export const syncLocalToServer = async () => {
  try {
    const payload = {
      patients: getPatients(),
      visits: getVisits(),
      results: JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]'),
      invoices: JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]'),
      settings: getSettings(),
      profiles: getProfiles(),
      testsMaster: JSON.parse(localStorage.getItem(STORAGE_KEYS.TESTS_MASTER) || '[]'),
      auditLogs: JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]')
    };

    console.log('Uploading local data payload:', payload);
    const res = await apiCall('/sync', 'POST', payload);

    if (res && res.success) {
      console.log('✅ Local data uploaded to server successfully');
      return true;
    } else {
      console.error('❌ Failed to upload local data:', res);
      return false;
    }
  } catch (error) {
    console.error('❌ Error uploading local data:', error);
    return false;
  }
};

export default {
  initializeSeedData,
  clearAllData,
  getTestsMaster,
  getTestById,
  addTestToMaster,
  getProfiles,
  getProfileById,
  getProfileWithTests,
  addProfile,
  getPatients,
  getPatientById,
  addPatient,
  updatePatient,
  deletePatient,
  getVisits,
  getVisitById,
  getVisitsByPatientId,
  createVisit,
  updateVisit,
  saveResults,
  getResultsByVisitId,
  createInvoice,
  getInvoicesByVisitId,
  getSettings,
  updateSettings,
  logAudit,
  logAudit,
  searchTests,
  syncLocalToServer
};
