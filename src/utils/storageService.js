/**
 * Storage Service - Hybrid LocalStorage + IndexedDB
 * Provides data persistence with export/import for cross-browser sync
 */

const DB_NAME = 'HEALitLabDB';
const DB_VERSION = 1;
const STORES = {
  PATIENTS: 'patients',
  VISITS: 'visits',
  PROFILES: 'profiles',
  TESTS_MASTER: 'tests_master',
  SETTINGS: 'settings',
  USERS: 'users'
};

let db = null;

/**
 * Initialize IndexedDB
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported, falling back to localStorage');
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB failed to open:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('IndexedDB initialized successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create object stores if they don't exist
      Object.values(STORES).forEach(storeName => {
        if (!database.objectStoreNames.contains(storeName)) {
          const store = database.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          console.log(`Created object store: ${storeName}`);
        }
      });
    };
  });
};

/**
 * Save data to IndexedDB (fallback to localStorage)
 */
export const saveData = async (storeName, key, data) => {
  try {
    if (db) {
      // Use IndexedDB
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Store with key as id
      const dataWithId = { id: key, data, timestamp: Date.now() };
      await store.put(dataWithId);
      
      return true;
    }
  } catch (error) {
    console.error('IndexedDB save failed, using localStorage:', error);
  }
  
  // Fallback to localStorage
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('localStorage save failed:', error);
    return false;
  }
};

/**
 * Get data from IndexedDB (fallback to localStorage)
 */
export const getData = async (storeName, key) => {
  try {
    if (db) {
      // Use IndexedDB
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      return new Promise((resolve) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
        request.onerror = () => {
          console.error('IndexedDB get failed, trying localStorage');
          const fallback = localStorage.getItem(key);
          resolve(fallback ? JSON.parse(fallback) : null);
        };
      });
    }
  } catch (error) {
    console.error('IndexedDB get failed, using localStorage:', error);
  }
  
  // Fallback to localStorage
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('localStorage get failed:', error);
    return null;
  }
};

/**
 * Export all data to JSON (for backup/sync)
 */
export const exportAllData = async () => {
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '2.0',
    data: {}
  };

  // Get all data from localStorage
  const keys = [
    'healit_patients',
    'healit_visits',
    'healit_profiles',
    'healit_tests_master',
    'healit_users',
    'healit_settings',
    'healit_results',
    'healit_invoices',
    'healit_audit_logs',
    'healit_financial_expenses',
    'healit_financial_categories',
    'healit_financial_reminders'
  ];

  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        exportData.data[key] = JSON.parse(value);
      }
    } catch (error) {
      console.error(`Failed to export ${key}:`, error);
    }
  });

  return exportData;
};

/**
 * Import data from JSON (for restore/sync)
 */
export const importAllData = async (importData) => {
  if (!importData || !importData.data) {
    throw new Error('Invalid import data format');
  }

  let importedCount = 0;
  const errors = [];

  Object.entries(importData.data).forEach(([key, value]) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      importedCount++;
    } catch (error) {
      console.error(`Failed to import ${key}:`, error);
      errors.push({ key, error: error.message });
    }
  });

  // Dispatch update event to refresh UI
  window.dispatchEvent(new CustomEvent('healit-data-update', { detail: { type: 'all' } }));

  return {
    success: errors.length === 0,
    imported: importedCount,
    errors
  };
};

/**
 * Download data as JSON file
 */
export const downloadDataBackup = async () => {
  const data = await exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `healit-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Upload and restore data from JSON file
 */
export const uploadDataBackup = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        const result = await importAllData(importData);
        resolve(result);
      } catch (error) {
        reject(new Error('Invalid backup file format'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read backup file'));
    };
    
    reader.readAsText(file);
  });
};

export default {
  initDB,
  saveData,
  getData,
  exportAllData,
  importAllData,
  downloadDataBackup,
  uploadDataBackup
};
