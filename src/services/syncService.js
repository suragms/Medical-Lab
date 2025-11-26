/**
 * Real-time Data Sync Service
 * Ensures all browsers/devices stay in sync with the backend
 */

import dataMigrationService from './dataMigrationService';
import apiService from './apiService';

class SyncService {
    constructor() {
        this.syncInterval = null;
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.syncIntervalMs = 30000; // 30 seconds
        this.listeners = new Set();
        this.isOnline = navigator.onLine;
        
        // 🚀 CIRCUIT BREAKER: Prevent MongoDB from blocking app
        this.failureCount = 0;
        this.maxFailures = 3;
        this.circuitBreakerOpen = false;
        this.circuitBreakerResetTime = null;
        this.resetTimeoutMs = 300000; // 5 minutes

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.failureCount = 0; // Reset failures on reconnect
            this.circuitBreakerOpen = false;
            console.log('🌐 Back online - resuming sync');
            this.syncNow();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📡 Offline - sync paused');
        });
    }

    /**
     * Start automatic background sync
     */
    startAutoSync() {
        if (this.syncInterval) {
            console.log('⚠️ Auto-sync already running');
            return;
        }

        console.log(`🔄 Starting auto-sync (every ${this.syncIntervalMs / 1000}s)`);

        // Sync immediately on start
        this.syncNow();

        // Then sync periodically
        this.syncInterval = setInterval(() => {
            this.syncNow();
        }, this.syncIntervalMs);
    }

    /**
     * Stop automatic background sync
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏸️ Auto-sync stopped');
        }
    }

    /**
     * Perform sync now (can be called manually)
     */
    async syncNow() {
        // Skip if already syncing
        if (this.isSyncing) {
            console.log('⏭️ Sync already in progress, skipping...');
            return { success: false, message: 'Sync already in progress' };
        }

        // Skip if offline
        if (!this.isOnline) {
            console.log('📡 Offline - skipping sync');
            return { success: false, message: 'Offline' };
        }
        
        // 🚀 CIRCUIT BREAKER: Skip if circuit is open
        if (this.circuitBreakerOpen) {
            const now = Date.now();
            if (now < this.circuitBreakerResetTime) {
                const remainingSeconds = Math.floor((this.circuitBreakerResetTime - now) / 1000);
                console.log(`⚠️ Circuit breaker OPEN - MongoDB temporarily disabled (resets in ${remainingSeconds}s)`);
                console.log('✅ App continues working with localStorage only');
                return { success: false, message: 'Circuit breaker open - using localStorage only' };
            } else {
                // Reset circuit breaker after timeout
                console.log('🔄 Circuit breaker RESET - Attempting MongoDB reconnection...');
                this.circuitBreakerOpen = false;
                this.failureCount = 0;
            }
        }

        this.isSyncing = true;
        this.notifyListeners({ status: 'syncing' });
        
        // 🚀 TIMEOUT: Prevent sync from hanging forever
        const SYNC_TIMEOUT = 10000; // 10 seconds max
        const syncPromise = this.performSync();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Sync timeout - taking too long')), SYNC_TIMEOUT)
        );

        try {
            // Race between sync and timeout
            await Promise.race([syncPromise, timeoutPromise]);
            
            // Success - reset failure count
            this.failureCount = 0;
            this.lastSyncTime = new Date();
            this.isSyncing = false;

            console.log('✅ Sync completed successfully');
            this.notifyListeners({
                status: 'success',
                lastSyncTime: this.lastSyncTime
            });
            return { success: true, lastSyncTime: this.lastSyncTime };
        } catch (error) {
            console.error('❌ Sync error:', error);
            this.isSyncing = false;
            
            // 🚀 CIRCUIT BREAKER: Increment failure count
            this.failureCount++;
            console.warn(`⚠️ Sync failure count: ${this.failureCount}/${this.maxFailures}`);
            
            if (this.failureCount >= this.maxFailures) {
                // Open circuit breaker
                this.circuitBreakerOpen = true;
                this.circuitBreakerResetTime = Date.now() + this.resetTimeoutMs;
                console.error(`🚫 CIRCUIT BREAKER OPENED - MongoDB disabled for 5 minutes`);
                console.log('✅ App will continue working with localStorage only');
                console.log('🔄 MongoDB will auto-retry in 5 minutes');
            }
            
            this.notifyListeners({ status: 'error', error: error.message });
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Perform the actual sync (separated for timeout handling)
     */
    async performSync() {
            // 🚀 CRITICAL FIX: Download FIRST, then upload
            // This prevents MongoDB overwriting newer localStorage data
            
            // Step 1: Download latest data from backend (merge, don't overwrite)
            console.log('📥 Step 1: Downloading latest data from MongoDB...');
            try {
                const result = await dataMigrationService.syncFromBackend();
                if (!result.success) {
                    console.warn('⚠️ Download failed, skipping upload to prevent data loss');
                    throw new Error(result.error || 'Download failed');
                }
                console.log('✅ Download complete');
            } catch (downloadError) {
                console.error('❌ Download error:', downloadError);
                throw downloadError;
            }
            
            // Step 2: Upload local changes to backend (after download)
            console.log('📤 Step 2: Uploading local changes to MongoDB...');
            const localData = dataMigrationService.getLocalData();

            // Only upload if there's data
            const hasLocalData =
                localData.patients.length > 0 ||
                localData.visits.length > 0 ||
                localData.results.length > 0 ||
                localData.invoices.length > 0 ||
                localData.financialExpenses.length > 0;

            if (hasLocalData) {
                try {
                    await apiService.syncAllData(localData);
                    console.log('✅ Upload complete');
                } catch (uploadError) {
                    console.error('❌ Upload error:', uploadError);
                    // Don't fail entire sync - local data is safe
                }
            } else {
                console.log('ℹ️ No local data to upload');
            }
    }

    /**
     * Add a listener for sync status changes
     * @param {Function} callback - Called with sync status updates
     * @returns {Function} - Unsubscribe function
     */
    addListener(callback) {
        this.listeners.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Notify all listeners of sync status change
     */
    notifyListeners(status) {
        this.listeners.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.error('Error in sync listener:', error);
            }
        });
    }

    /**
     * Get current sync status
     */
    getStatus() {
        return {
            isSyncing: this.isSyncing,
            lastSyncTime: this.lastSyncTime,
            isOnline: this.isOnline,
            autoSyncEnabled: !!this.syncInterval
        };
    }

    /**
     * Force upload local data to server
     */
    async forceUpload() {
        try {
            const localData = dataMigrationService.getLocalData();
            const result = await apiService.syncAllData(localData);
            console.log('✅ Force upload completed');
            return result;
        } catch (error) {
            console.error('❌ Force upload failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Force download data from server
     */
    async forceDownload() {
        try {
            const result = await dataMigrationService.syncFromBackend();
            console.log('✅ Force download completed');
            return result;
        } catch (error) {
            console.error('❌ Force download failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
export const syncService = new SyncService();
export default syncService;
