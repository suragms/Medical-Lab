/**
 * Data Migration Service
 * Syncs localStorage data with backend API
 */

import apiService from './apiService';

export class DataMigrationService {
  constructor() {
    this.migrationKey = 'data_migrated_to_api';
  }

  /**
   * Check if data has been migrated
   */
  hasMigrated() {
    return localStorage.getItem(this.migrationKey) === 'true';
  }

  /**
   * Mark migration as complete
   */
  markMigrated() {
    localStorage.setItem(this.migrationKey, 'true');
  }

  /**
   * Get all localStorage data
   */
  getLocalData() {
    const getData = (key) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error(`Error parsing ${key}:`, error);
        return null;
      }
    };

    return {
      patients: getData('patient-storage')?.state?.patients || [],
      testResults: getData('test-result-storage')?.state?.results || [],
      financialRecords: {
        revenue: getData('financial-storage')?.state?.revenue || [],
        expenses: getData('financial-storage')?.state?.expenses || []
      },
      activities: getData('activity-storage')?.state?.activities || [],
      settings: getData('settings-storage')?.state || {},
      users: getData('healit_users') || []
    };
  }

  /**
   * Upload local data to backend
   */
  async migrateToBackend() {
    try {
      console.log('🔄 Starting data migration to backend...');

      const localData = this.getLocalData();

      // Check if there's any data to migrate
      const hasData = 
        localData.patients.length > 0 ||
        localData.testResults.length > 0 ||
        localData.financialRecords.revenue.length > 0 ||
        localData.financialRecords.expenses.length > 0 ||
        localData.activities.length > 0;

      if (!hasData) {
        console.log('ℹ️ No local data to migrate');
        this.markMigrated();
        return { success: true, message: 'No data to migrate' };
      }

      // Sync all data with backend
      const response = await apiService.syncAllData(localData);

      if (response.success) {
        console.log('✅ Data migration completed successfully');
        this.markMigrated();
        return { success: true, data: localData };
      } else {
        console.error('❌ Data migration failed:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('❌ Error during data migration:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download data from backend to localStorage
   */
  async syncFromBackend() {
    try {
      console.log('🔄 Syncing data from backend...');

      const response = await apiService.getAllData();

      if (response.success && response.data) {
        const data = response.data;

        // Update localStorage with backend data
        const updateStorage = (key, stateData) => {
          try {
            const existing = localStorage.getItem(key);
            const parsed = existing ? JSON.parse(existing) : { state: {}, version: 1 };
            parsed.state = { ...parsed.state, ...stateData };
            localStorage.setItem(key, JSON.stringify(parsed));
          } catch (error) {
            console.error(`Error updating ${key}:`, error);
          }
        };

        if (data.patients) {
          updateStorage('patient-storage', { patients: data.patients });
        }

        if (data.testResults) {
          updateStorage('test-result-storage', { results: data.testResults });
        }

        if (data.financialRecords) {
          updateStorage('financial-storage', {
            revenue: data.financialRecords.revenue || [],
            expenses: data.financialRecords.expenses || []
          });
        }

        if (data.activities) {
          updateStorage('activity-storage', { activities: data.activities });
        }

        if (data.settings) {
          updateStorage('settings-storage', data.settings);
        }

        console.log('✅ Data synced from backend successfully');
        return { success: true };
      }

      return { success: false, error: 'No data received from backend' };
    } catch (error) {
      console.error('❌ Error syncing from backend:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Full sync: Upload local data and then download to ensure consistency
   */
  async fullSync() {
    try {
      // First check if we need to migrate
      if (!this.hasMigrated()) {
        const uploadResult = await this.migrateToBackend();
        if (!uploadResult.success) {
          console.warn('Upload failed, continuing with download...');
        }
      }

      // Then sync from backend to get latest data
      const downloadResult = await this.syncFromBackend();

      return downloadResult;
    } catch (error) {
      console.error('Error in full sync:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset migration flag (useful for testing)
   */
  resetMigration() {
    localStorage.removeItem(this.migrationKey);
    console.log('🔄 Migration flag reset');
  }
}

export const dataMigrationService = new DataMigrationService();
export default dataMigrationService;
