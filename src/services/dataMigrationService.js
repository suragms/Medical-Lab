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
      patients: getData('healit_patients') || [],
      visits: getData('healit_visits') || [],
      results: getData('healit_results') || [],
      invoices: getData('healit_invoices') || [],
      settings: getData('healit_settings') || {},
      profiles: getData('healit_profiles') || [],
      testsMaster: getData('healit_tests_master') || [],
      auditLogs: getData('healit_audit_logs') || [],
      financialExpenses: getData('healit_financial_expenses') || [],
      financialCategories: getData('healit_financial_categories') || [],
      financialReminders: getData('healit_financial_reminders') || []
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
        localData.visits.length > 0 ||
        localData.results.length > 0 ||
        localData.invoices.length > 0 ||
        localData.financialExpenses.length > 0;

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

        // Update localStorage with backend data directly
        if (data.patients && data.patients.length > 0) {
          localStorage.setItem('healit_patients', JSON.stringify(data.patients));
        }

        if (data.visits && data.visits.length > 0) {
          localStorage.setItem('healit_visits', JSON.stringify(data.visits));
        }

        if (data.results && data.results.length > 0) {
          localStorage.setItem('healit_results', JSON.stringify(data.results));
        }

        if (data.invoices && data.invoices.length > 0) {
          localStorage.setItem('healit_invoices', JSON.stringify(data.invoices));
        }

        if (data.settings) {
          localStorage.setItem('healit_settings', JSON.stringify(data.settings));
        }

        if (data.profiles && data.profiles.length > 0) {
          localStorage.setItem('healit_profiles', JSON.stringify(data.profiles));
        }

        if (data.testsMaster && data.testsMaster.length > 0) {
          localStorage.setItem('healit_tests_master', JSON.stringify(data.testsMaster));
        }

        if (data.auditLogs && data.auditLogs.length > 0) {
          localStorage.setItem('healit_audit_logs', JSON.stringify(data.auditLogs));
        }

        if (data.financialExpenses && data.financialExpenses.length > 0) {
          localStorage.setItem('healit_financial_expenses', JSON.stringify(data.financialExpenses));
        }

        if (data.financialCategories && data.financialCategories.length > 0) {
          localStorage.setItem('healit_financial_categories', JSON.stringify(data.financialCategories));
        }

        if (data.financialReminders && data.financialReminders.length > 0) {
          localStorage.setItem('healit_financial_reminders', JSON.stringify(data.financialReminders));
        }

        // Dispatch event to refresh UI
        window.dispatchEvent(new CustomEvent('healit-data-update', { detail: { type: 'all' } }));

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
   * Full sync: Always download from server (Server Wins strategy)
   * This ensures all browsers show the same data from MongoDB
   */
  async fullSync() {
    try {
      // ALWAYS sync from backend first (Server Wins)
      console.log('🔄 Syncing from server (Server Wins)...');
      const downloadResult = await this.syncFromBackend();

      // If download was successful, mark as migrated
      if (downloadResult.success) {
        this.markMigrated();
      }

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
