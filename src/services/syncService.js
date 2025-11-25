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

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
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

        this.isSyncing = true;
        this.notifyListeners({ status: 'syncing' });

        try {
            // Step 1: Upload local changes to backend
            console.log('📤 Uploading local changes...');
            const localData = dataMigrationService.getLocalData();

            // Only upload if there's data
            const hasLocalData =
                localData.patients.length > 0 ||
                localData.visits.length > 0 ||
                localData.results.length > 0 ||
                localData.invoices.length > 0 ||
                localData.financialExpenses.length > 0;

            if (hasLocalData) {
                await apiService.syncAllData(localData);
            }

            // Step 2: Download latest data from backend
            console.log('📥 Downloading latest data...');
            const result = await dataMigrationService.syncFromBackend();

            this.lastSyncTime = new Date();
            this.isSyncing = false;

            if (result.success) {
                console.log('✅ Sync completed successfully');
                this.notifyListeners({
                    status: 'success',
                    lastSyncTime: this.lastSyncTime
                });
                return { success: true, lastSyncTime: this.lastSyncTime };
            } else {
                console.error('❌ Sync failed:', result.error);
                this.notifyListeners({ status: 'error', error: result.error });
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ Sync error:', error);
            this.isSyncing = false;
            this.notifyListeners({ status: 'error', error: error.message });
            return { success: false, error: error.message };
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
