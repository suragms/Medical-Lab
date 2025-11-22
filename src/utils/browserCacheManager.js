/**
 * Browser Cache Manager
 * Automatically clears browser data (localStorage, sessionStorage, IndexedDB, cache)
 * to ensure fresh data and prevent storage bloat
 */

const CACHE_CONFIG = {
  // Auto-clear interval in milliseconds (24 hours)
  AUTO_CLEAR_INTERVAL: 24 * 60 * 60 * 1000,
  // Last clear timestamp key
  LAST_CLEAR_KEY: 'last_cache_clear',
  // Protected keys that should NOT be cleared
  PROTECTED_KEYS: [
    'auth-storage', // Zustand auth persistence
    'settings-storage', // Zustand settings persistence
    'patient-storage', // Patient data persistence
    'test-result-storage', // Test results persistence
    'financial-storage', // Financial data persistence
    'activity-storage', // Staff activity logs
    'healit_users', // User data
    'healit_data_version', // Data version tracker
    'last_cache_clear', // Cache clear timestamp
  ]
};

/**
 * Clear all browser storage except protected keys
 */
export const clearBrowserStorage = async (options = {}) => {
  const {
    clearLocalStorage = true,
    clearSessionStorage = true,
    clearIndexedDB = true,
    clearCacheAPI = true,
    preserveProtected = true
  } = options;

  console.log('🧹 Starting browser storage cleanup...');
  
  try {
    // 1. Clear localStorage (except protected keys)
    if (clearLocalStorage) {
      await clearLocalStorageData(preserveProtected);
    }

    // 2. Clear sessionStorage
    if (clearSessionStorage) {
      sessionStorage.clear();
      console.log('✓ Session storage cleared');
    }

    // 3. Clear IndexedDB
    if (clearIndexedDB) {
      await clearIndexedDBData();
    }

    // 4. Clear Cache API
    if (clearCacheAPI) {
      await clearCacheAPIData();
    }

    // Update last clear timestamp
    localStorage.setItem(CACHE_CONFIG.LAST_CLEAR_KEY, Date.now().toString());
    
    console.log('✅ Browser storage cleanup completed successfully');
    return { success: true, clearedAt: new Date().toISOString() };
  } catch (error) {
    console.error('❌ Error during storage cleanup:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear localStorage while preserving protected keys
 */
const clearLocalStorageData = async (preserveProtected = true) => {
  try {
    if (!preserveProtected) {
      localStorage.clear();
      console.log('✓ All localStorage cleared');
      return;
    }

    // Preserve protected keys
    const protectedData = {};
    CACHE_CONFIG.PROTECTED_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        protectedData[key] = value;
      }
    });

    // Clear all localStorage
    localStorage.clear();

    // Restore protected data
    Object.entries(protectedData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    console.log('✓ localStorage cleared (protected keys preserved)');
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

/**
 * Clear all IndexedDB databases
 */
const clearIndexedDBData = async () => {
  try {
    if (!window.indexedDB) {
      console.log('⚠ IndexedDB not supported');
      return;
    }

    // Get all databases
    const databases = await indexedDB.databases();
    
    if (!databases || databases.length === 0) {
      console.log('✓ No IndexedDB databases to clear');
      return;
    }

    // Delete each database
    for (const db of databases) {
      if (db.name) {
        await new Promise((resolve, reject) => {
          const request = indexedDB.deleteDatabase(db.name);
          request.onsuccess = () => {
            console.log(`✓ Deleted IndexedDB: ${db.name}`);
            resolve();
          };
          request.onerror = () => reject(request.error);
          request.onblocked = () => {
            console.warn(`⚠ IndexedDB deletion blocked: ${db.name}`);
            resolve(); // Continue anyway
          };
        });
      }
    }

    console.log('✓ All IndexedDB databases cleared');
  } catch (error) {
    console.error('Error clearing IndexedDB:', error);
  }
};

/**
 * Clear Cache API data
 */
const clearCacheAPIData = async () => {
  try {
    if (!('caches' in window)) {
      console.log('⚠ Cache API not supported');
      return;
    }

    const cacheNames = await caches.keys();
    
    if (cacheNames.length === 0) {
      console.log('✓ No cache data to clear');
      return;
    }

    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );

    console.log(`✓ Cleared ${cacheNames.length} cache(s)`);
  } catch (error) {
    console.error('Error clearing Cache API:', error);
  }
};

/**
 * Check if auto-clear is needed and perform if necessary
 */
export const checkAndAutoClear = async () => {
  try {
    const lastClear = localStorage.getItem(CACHE_CONFIG.LAST_CLEAR_KEY);
    
    if (!lastClear) {
      // First time - set timestamp but don't clear
      localStorage.setItem(CACHE_CONFIG.LAST_CLEAR_KEY, Date.now().toString());
      console.log('📅 Auto-clear timer initialized');
      return { cleared: false, reason: 'first_run' };
    }

    const timeSinceLastClear = Date.now() - parseInt(lastClear, 10);
    
    if (timeSinceLastClear >= CACHE_CONFIG.AUTO_CLEAR_INTERVAL) {
      console.log('⏰ Auto-clear interval reached, clearing browser data...');
      const result = await clearBrowserStorage({
        clearLocalStorage: true,
        clearSessionStorage: true,
        clearIndexedDB: true,
        clearCacheAPI: true,
        preserveProtected: true
      });
      return { cleared: true, ...result };
    }

    console.log(`⏳ Next auto-clear in ${Math.round((CACHE_CONFIG.AUTO_CLEAR_INTERVAL - timeSinceLastClear) / 1000 / 60 / 60)} hours`);
    return { cleared: false, reason: 'interval_not_reached' };
  } catch (error) {
    console.error('Error in auto-clear check:', error);
    return { cleared: false, error: error.message };
  }
};

/**
 * Get storage usage information
 */
export const getStorageInfo = async () => {
  const info = {
    localStorage: {
      supported: typeof Storage !== 'undefined',
      itemCount: 0,
      estimatedSize: 0
    },
    sessionStorage: {
      supported: typeof Storage !== 'undefined',
      itemCount: 0,
      estimatedSize: 0
    },
    indexedDB: {
      supported: !!window.indexedDB,
      databases: []
    },
    cache: {
      supported: 'caches' in window,
      caches: []
    }
  };

  try {
    // LocalStorage info
    if (info.localStorage.supported) {
      info.localStorage.itemCount = localStorage.length;
      let size = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        size += key.length + (value ? value.length : 0);
      }
      info.localStorage.estimatedSize = size;
    }

    // SessionStorage info
    if (info.sessionStorage.supported) {
      info.sessionStorage.itemCount = sessionStorage.length;
      let size = 0;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        size += key.length + (value ? value.length : 0);
      }
      info.sessionStorage.estimatedSize = size;
    }

    // IndexedDB info
    if (info.indexedDB.supported) {
      const databases = await indexedDB.databases();
      info.indexedDB.databases = databases.map(db => db.name);
    }

    // Cache API info
    if (info.cache.supported) {
      info.cache.caches = await caches.keys();
    }

    return info;
  } catch (error) {
    console.error('Error getting storage info:', error);
    return info;
  }
};

/**
 * Clear only temporary/cache data, preserve all user data
 */
export const clearCacheOnly = async () => {
  console.log('🧹 Clearing cache data only...');
  
  try {
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear Cache API
    await clearCacheAPIData();
    
    console.log('✅ Cache cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('Error clearing cache:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize auto-clear on app startup
 */
export const initializeAutoClear = async () => {
  console.log('🚀 Initializing browser cache auto-clear...');
  
  // Check and perform auto-clear if needed
  await checkAndAutoClear();
  
  // Set up periodic checks (every hour)
  setInterval(() => {
    checkAndAutoClear();
  }, 60 * 60 * 1000); // Check every hour
  
  console.log('✅ Auto-clear initialized');
};

export default {
  clearBrowserStorage,
  checkAndAutoClear,
  getStorageInfo,
  clearCacheOnly,
  initializeAutoClear,
  CACHE_CONFIG
};
