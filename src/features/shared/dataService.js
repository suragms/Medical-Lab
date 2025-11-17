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

// Initialize seed data on first load
export const initializeSeedData = () => {
  // No longer initialize TESTS_MASTER - profiles now contain full test objects
  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(PROFILES));
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
  return newPatient;
};

export const updatePatient = (patientId, updates) => {
  const patients = getPatients();
  const index = patients.findIndex(p => p.patientId === patientId);
  if (index !== -1) {
    patients[index] = { ...patients[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    return patients[index];
  }
  return null;
};

// Visit Operations (with Snapshot)
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
    createdAt: new Date().toISOString()
  };
  visits.push(newVisit);
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
  return newVisit;
};

export const updateVisit = (visitId, updates) => {
  const visits = getVisits();
  const index = visits.findIndex(v => v.visitId === visitId);
  if (index !== -1) {
    visits[index] = { ...visits[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    return visits[index];
  }
  return null;
};

// Result Operations
export const saveResults = (visitId, results) => {
  const allResults = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]');
  
  // Remove old results for this visit
  const filtered = allResults.filter(r => r.visitId !== visitId);
  
  // Add new results
  const newResults = {
    visitId,
    results,
    savedAt: new Date().toISOString()
  };
  filtered.push(newResults);
  
  localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(filtered));
  
  // Update visit status
  updateVisit(visitId, { status: 'results_entered' });
  
  return newResults;
};

export const updateVisitResults = (visitId, testsWithResults) => {
  const visits = getVisits();
  const visitIndex = visits.findIndex(v => v.visitId === visitId);
  
  if (visitIndex !== -1) {
    visits[visitIndex].tests = testsWithResults;
    visits[visitIndex].updatedAt = new Date().toISOString();
    visits[visitIndex].status = 'results_entered';
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
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
    }, 300); // 300ms debounce
  });
};

export default {
  initializeSeedData,
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
  searchTests
};
