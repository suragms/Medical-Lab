import React, { useState } from 'react';
import { Download, Upload, Database, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { downloadDataBackup, uploadDataBackup } from '../../utils/storageService';
import toast from 'react-hot-toast';
import './DataSync.css';

const DataSync = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadDataBackup();
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await uploadDataBackup(file);
      setImportResult(result);
      
      if (result.success) {
        toast.success(`Data imported successfully! ${result.imported} items restored.`);
        // Reload page after 2 seconds to refresh all data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(`Import completed with errors. ${result.imported} items imported, ${result.errors.length} failed.`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(error.message || 'Failed to import data');
      setImportResult({ success: false, errors: [{ error: error.message }] });
    } finally {
      setIsImporting(false);
      event.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="data-sync-section">
      <div className="section-header">
        <Database size={24} />
        <div>
          <h2>Data Backup & Sync</h2>
          <p>Export and import data to sync across different browsers or devices</p>
        </div>
      </div>

      <div className="info-card">
        <AlertCircle size={20} className="info-icon" />
        <div className="info-content">
          <h4>Why use Data Backup?</h4>
          <ul>
            <li><strong>Cross-Browser Sync:</strong> Data is stored locally in each browser. Export from one browser and import to another.</li>
            <li><strong>Device Transfer:</strong> Move your data when switching computers or devices.</li>
            <li><strong>Backup:</strong> Create regular backups to prevent data loss.</li>
            <li><strong>Multi-User:</strong> Share data across multiple users by importing the same backup file.</li>
          </ul>
        </div>
      </div>

      <div className="sync-actions">
        {/* Export Button */}
        <div className="action-card">
          <div className="action-icon export">
            <Download size={32} />
          </div>
          <div className="action-content">
            <h3>Export Data</h3>
            <p>Download all patient data, visits, profiles, and settings as a backup file</p>
            <button 
              onClick={handleExport} 
              disabled={isExporting}
              className="btn btn-primary"
            >
              {isExporting ? (
                <>
                  <span className="spinner"></span>
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Export Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Import Button */}
        <div className="action-card">
          <div className="action-icon import">
            <Upload size={32} />
          </div>
          <div className="action-content">
            <h3>Import Data</h3>
            <p>Restore data from a previously exported backup file</p>
            <label className="btn btn-secondary file-input-label">
              {isImporting ? (
                <>
                  <span className="spinner"></span>
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Import Data
                </>
              )}
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="file-input-hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
          {importResult.success ? (
            <>
              <CheckCircle size={24} />
              <div>
                <h4>Import Successful!</h4>
                <p>{importResult.imported} items have been imported. Page will reload shortly...</p>
              </div>
            </>
          ) : (
            <>
              <XCircle size={24} />
              <div>
                <h4>Import Completed with Errors</h4>
                <p>{importResult.imported || 0} items imported successfully</p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <details className="error-details">
                    <summary>{importResult.errors.length} errors occurred</summary>
                    <ul>
                      {importResult.errors.map((err, idx) => (
                        <li key={idx}>{err.key}: {err.error}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="usage-instructions">
        <h3>How to Sync Data Across Browsers:</h3>
        <ol>
          <li><strong>On the first browser/device:</strong> Click "Export Data" to download a backup file</li>
          <li><strong>Transfer the file:</strong> Email it to yourself, use cloud storage, or USB drive</li>
          <li><strong>On the second browser/device:</strong> Click "Import Data" and select the backup file</li>
          <li><strong>Done!</strong> All data will be available on the new browser/device</li>
        </ol>
      </div>
    </div>
  );
};

export default DataSync;
