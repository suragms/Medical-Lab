// Firebase Firestore Data Service - Global Cloud Database
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import PROFILES from '../data/seed/profiles';

const COLLECTIONS = {
  TESTS_MASTER: 'tests_master',
  PROFILES: 'profiles',
  PATIENTS: 'patients',
  VISITS: 'visits',
  RESULTS: 'results',
  INVOICES: 'invoices',
  SETTINGS: 'settings',
  AUDIT_LOGS: 'audit_logs',
  FINANCIAL_EXPENSES: 'financial_expenses',
  FINANCIAL_REVENUE: 'financial_revenue'
};

// Initialize Firestore with seed data on first launch
export const initializeFirestoreData = async () => {
  try {
    // Check if tests exist (more reliable than checking settings)
    const testsRef = collection(db, COLLECTIONS.TESTS_MASTER);
    const testsSnapshot = await getDocs(testsRef);
    
    // Only initialize if no tests exist
    if (testsSnapshot.empty) {
      console.log('No tests found. Initializing Firestore with seed data...');
      const batch = writeBatch(db);

      // Initialize Settings
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'app_settings');
      const defaultSettings = {
        dataVersion: '2.0',
        allowStaffInlineCreate: false,
        allowStaffEditPrice: false,
        labName: 'HEALit Med Laboratories',
        labAddress: 'Kunnathpeedika Centre',
        labPhone: '7356865161',
        labEmail: 'info@healitlab.com',
        initialized: true,
        createdAt: serverTimestamp()
      };
      batch.set(settingsRef, defaultSettings);

      // Initialize Profiles
      const profilesCollection = collection(db, COLLECTIONS.PROFILES);
      PROFILES.forEach(profile => {
        const profileRef = doc(profilesCollection, profile.profileId);
        batch.set(profileRef, {
          ...profile,
          createdAt: serverTimestamp()
        });
      });

      // Initialize Tests Master from profiles
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
                active: true
              });
            }
          });
        }
      });

      const testsCollection = collection(db, COLLECTIONS.TESTS_MASTER);
      Array.from(testMap.values()).forEach(test => {
        const testRef = doc(testsCollection, test.testId);
        batch.set(testRef, {
          ...test,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      console.log(`Firestore initialization complete! Added ${testMap.size} tests and ${PROFILES.length} profiles.`);
      return true;
    }
    
    console.log(`Firestore already initialized with ${testsSnapshot.size} tests.`);
    return true;
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    throw error;
  }
};

// Test Master Operations
export const getTestsMaster = async (searchTerm = '') => {
  try {
    const testsRef = collection(db, COLLECTIONS.TESTS_MASTER);
    const snapshot = await getDocs(testsRef);
    let tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    tests = tests.filter(t => t.active);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      tests = tests.filter(t => 
        t.name.toLowerCase().includes(term) ||
        t.code.toLowerCase().includes(term) ||
        (t.category && t.category.toLowerCase().includes(term))
      );
    }
    
    return tests;
  } catch (error) {
    console.error('Error fetching tests:', error);
    return [];
  }
};

export const getTestById = async (testId) => {
  try {
    const testRef = doc(db, COLLECTIONS.TESTS_MASTER, testId);
    const testDoc = await getDoc(testRef);
    return testDoc.exists() ? { id: testDoc.id, ...testDoc.data() } : null;
  } catch (error) {
    console.error('Error fetching test:', error);
    return null;
  }
};

export const addTestToMaster = async (test) => {
  try {
    const newTest = {
      ...test,
      testId: `CUSTOM_${Date.now()}`,
      active: true,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.TESTS_MASTER), newTest);
    return { id: docRef.id, ...newTest };
  } catch (error) {
    console.error('Error adding test:', error);
    throw error;
  }
};

// Profile Operations
export const getProfiles = async () => {
  try {
    const profilesRef = collection(db, COLLECTIONS.PROFILES);
    const q = query(profilesRef, where('active', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
};

export const getProfileById = async (profileId) => {
  try {
    const profileRef = doc(db, COLLECTIONS.PROFILES, profileId);
    const profileDoc = await getDoc(profileRef);
    return profileDoc.exists() ? { id: profileDoc.id, ...profileDoc.data() } : null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

export const addProfile = async (profileData) => {
  try {
    const newProfile = {
      ...profileData,
      profileId: `PROF_${Date.now()}`,
      active: true,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.PROFILES), newProfile);
    return { id: docRef.id, ...newProfile };
  } catch (error) {
    console.error('Error adding profile:', error);
    throw error;
  }
};

export const updateProfile = async (profileId, updates) => {
  try {
    const profilesRef = collection(db, COLLECTIONS.PROFILES);
    const q = query(profilesRef, where('profileId', '==', profileId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, profileId, ...updates };
    }
    return null;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const deleteProfile = async (profileId) => {
  try {
    const profilesRef = collection(db, COLLECTIONS.PROFILES);
    const q = query(profilesRef, where('profileId', '==', profileId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await deleteDoc(docRef);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
};

// Patient Operations
export const getPatients = async () => {
  try {
    const patientsRef = collection(db, COLLECTIONS.PATIENTS);
    const q = query(patientsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching patients:', error);
    return [];
  }
};

export const getPatientById = async (patientId) => {
  try {
    if (!patientId) {
      console.warn('getPatientById called with undefined/null patientId');
      return null;
    }
    
    const patientsRef = collection(db, COLLECTIONS.PATIENTS);
    const q = query(patientsRef, where('patientId', '==', patientId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching patient:', error);
    return null;
  }
};

export const addPatient = async (patientData) => {
  try {
    const newPatient = {
      ...patientData,
      patientId: `PAT_${Date.now()}`,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.PATIENTS), newPatient);
    return { id: docRef.id, ...newPatient };
  } catch (error) {
    console.error('Error adding patient:', error);
    throw error;
  }
};

export const updatePatient = async (patientId, updates) => {
  try {
    const patientsRef = collection(db, COLLECTIONS.PATIENTS);
    const q = query(patientsRef, where('patientId', '==', patientId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, patientId, ...updates };
    }
    return null;
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

export const deletePatient = async (patientId) => {
  try {
    const batch = writeBatch(db);
    
    // Get patient document
    const patientsRef = collection(db, COLLECTIONS.PATIENTS);
    const patientQuery = query(patientsRef, where('patientId', '==', patientId));
    const patientSnapshot = await getDocs(patientQuery);
    
    if (patientSnapshot.empty) return false;
    
    // Delete patient
    patientSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Get and delete all visits
    const visitsRef = collection(db, COLLECTIONS.VISITS);
    const visitsQuery = query(visitsRef, where('patientId', '==', patientId));
    const visitsSnapshot = await getDocs(visitsQuery);
    const visitIds = [];
    
    visitsSnapshot.docs.forEach(doc => {
      visitIds.push(doc.data().visitId);
      batch.delete(doc.ref);
    });
    
    // Delete results for those visits
    const resultsRef = collection(db, COLLECTIONS.RESULTS);
    for (const visitId of visitIds) {
      const resultsQuery = query(resultsRef, where('visitId', '==', visitId));
      const resultsSnapshot = await getDocs(resultsQuery);
      resultsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }
    
    // Delete invoices for those visits
    const invoicesRef = collection(db, COLLECTIONS.INVOICES);
    for (const visitId of visitIds) {
      const invoicesQuery = query(invoicesRef, where('visitId', '==', visitId));
      const invoicesSnapshot = await getDocs(invoicesQuery);
      invoicesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};

// Visit Operations
export const getVisits = async () => {
  try {
    const visitsRef = collection(db, COLLECTIONS.VISITS);
    const q = query(visitsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching visits:', error);
    return [];
  }
};

export const getVisitById = async (visitId) => {
  try {
    if (!visitId) {
      console.warn('getVisitById called with undefined/null visitId');
      return null;
    }
    
    const visitsRef = collection(db, COLLECTIONS.VISITS);
    const q = query(visitsRef, where('visitId', '==', visitId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching visit:', error);
    return null;
  }
};

export const getVisitsByPatientId = async (patientId) => {
  try {
    if (!patientId) {
      console.warn('getVisitsByPatientId called with undefined/null patientId');
      return [];
    }
    
    const visitsRef = collection(db, COLLECTIONS.VISITS);
    const q = query(visitsRef, where('patientId', '==', patientId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching patient visits:', error);
    return [];
  }
};

export const createVisit = async (visitData) => {
  try {
    const newVisit = {
      ...visitData,
      visitId: `VISIT_${Date.now()}`,
      status: 'tests_selected',
      pdfGenerated: false,
      invoiceGenerated: false,
      paymentStatus: 'unpaid',
      paidAt: null,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.VISITS), newVisit);
    return { id: docRef.id, ...newVisit };
  } catch (error) {
    console.error('Error creating visit:', error);
    throw error;
  }
};

export const updateVisit = async (visitId, updates) => {
  try {
    const visitsRef = collection(db, COLLECTIONS.VISITS);
    const q = query(visitsRef, where('visitId', '==', visitId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, visitId, ...updates };
    }
    return null;
  } catch (error) {
    console.error('Error updating visit:', error);
    throw error;
  }
};

export const markPDFGenerated = async (visitId) => {
  return updateVisit(visitId, { 
    pdfGenerated: true, 
    pdfGeneratedAt: new Date().toISOString() 
  });
};

export const markInvoiceGenerated = async (visitId) => {
  return updateVisit(visitId, { 
    invoiceGenerated: true, 
    invoiceGeneratedAt: new Date().toISOString(),
    paymentStatus: 'paid',
    paidAt: new Date().toISOString()
  });
};

export const updatePaymentStatus = async (visitId, status) => {
  const updates = { paymentStatus: status };
  if (status === 'paid') {
    updates.paidAt = new Date().toISOString();
  }
  return updateVisit(visitId, updates);
};

// Result Operations
export const saveResults = async (visitId, results) => {
  try {
    const resultsRef = collection(db, COLLECTIONS.RESULTS);
    const q = query(resultsRef, where('visitId', '==', visitId));
    const snapshot = await getDocs(q);
    
    const resultData = {
      visitId,
      results,
      savedAt: serverTimestamp()
    };
    
    if (!snapshot.empty) {
      // Update existing
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, resultData);
      return { id: docRef.id, ...resultData };
    } else {
      // Create new
      const docRef = await addDoc(resultsRef, resultData);
      return { id: docRef.id, ...resultData };
    }
  } catch (error) {
    console.error('Error saving results:', error);
    throw error;
  }
};

export const updateVisitResults = async (visitId, testsWithResults) => {
  try {
    return await updateVisit(visitId, { tests: testsWithResults });
  } catch (error) {
    console.error('Error updating visit results:', error);
    throw error;
  }
};

export const getResultsByVisitId = async (visitId) => {
  try {
    const resultsRef = collection(db, COLLECTIONS.RESULTS);
    const q = query(resultsRef, where('visitId', '==', visitId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching results:', error);
    return null;
  }
};

// Invoice Operations
export const createInvoice = async (invoiceData) => {
  try {
    const newInvoice = {
      ...invoiceData,
      invoiceId: `INV_${Date.now()}`,
      generatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.INVOICES), newInvoice);
    return { id: docRef.id, ...newInvoice };
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

export const getInvoicesByVisitId = async (visitId) => {
  try {
    const invoicesRef = collection(db, COLLECTIONS.INVOICES);
    const q = query(invoicesRef, where('visitId', '==', visitId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
};

// Settings Operations
export const getSettings = async () => {
  try {
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'app_settings');
    const settingsDoc = await getDoc(settingsRef);
    return settingsDoc.exists() ? settingsDoc.data() : {};
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
};

export const updateSettings = async (updates) => {
  try {
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'app_settings');
    await updateDoc(settingsRef, updates);
    return { ...updates };
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// Audit Log
export const logAudit = async (action, details) => {
  try {
    const logEntry = {
      logId: `LOG_${Date.now()}`,
      action,
      details,
      timestamp: serverTimestamp()
    };
    await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), logEntry);
  } catch (error) {
    console.error('Error logging audit:', error);
  }
};

// Real-time listeners
export const subscribeToPatients = (callback) => {
  const patientsRef = collection(db, COLLECTIONS.PATIENTS);
  const q = query(patientsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(patients);
  });
};

export const subscribeToVisits = (callback) => {
  const visitsRef = collection(db, COLLECTIONS.VISITS);
  const q = query(visitsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const visits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(visits);
  });
};

export default {
  initializeFirestoreData,
  getTestsMaster,
  getTestById,
  addTestToMaster,
  getProfiles,
  getProfileById,
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
  subscribeToPatients,
  subscribeToVisits,
  markPDFGenerated,
  markInvoiceGenerated,
  updatePaymentStatus
};
