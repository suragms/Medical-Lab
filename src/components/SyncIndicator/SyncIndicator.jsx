import React, { useState, useEffect } from 'react';
import { RefreshCw, Wifi, WifiOff, Check, AlertCircle, Database } from 'lucide-react';
import syncService from '../../services/syncService';
import './SyncIndicator.css';

const SyncIndicator = () => {
    const [syncStatus, setSyncStatus] = useState({
        status: 'idle', // 'idle' | 'syncing' | 'success' | 'error' | 'local'
        lastSyncTime: null,
        isOnline: navigator.onLine,
        error: null,
        autoSyncEnabled: false
    });

    useEffect(() => {
        // Subscribe to sync status updates
        const unsubscribe = syncService.addListener((status) => {
            setSyncStatus(prev => ({
                ...prev,
                ...status
            }));
        });

        // Get initial status
        const initialStatus = syncService.getStatus();
        setSyncStatus(prev => ({
            ...prev,
            lastSyncTime: initialStatus.lastSyncTime,
            isOnline: initialStatus.isOnline,
            autoSyncEnabled: initialStatus.autoSyncEnabled
        }));

        // Check if auto-sync is enabled periodically
        const checkInterval = setInterval(() => {
            const currentStatus = syncService.getStatus();
            setSyncStatus(prev => ({
                ...prev,
                autoSyncEnabled: currentStatus.autoSyncEnabled
            }));
        }, 5000);

        return () => {
            unsubscribe();
            clearInterval(checkInterval);
        };
    }, []);

    const handleManualSync = async () => {
        // Don't allow manual sync if auto-sync is disabled (local mode)
        if (!syncStatus.autoSyncEnabled) {
            return;
        }
        await syncService.syncNow();
    };

    const getStatusIcon = () => {
        if (!syncStatus.isOnline) {
            return <WifiOff size={16} className="sync-icon offline" />;
        }

        // If auto-sync is disabled, show local mode icon
        if (!syncStatus.autoSyncEnabled) {
            return <Database size={16} className="sync-icon local" />;
        }

        switch (syncStatus.status) {
            case 'syncing':
                return <RefreshCw size={16} className="sync-icon syncing" />;
            case 'success':
                return <Check size={16} className="sync-icon success" />;
            case 'error':
                return <AlertCircle size={16} className="sync-icon error" />;
            default:
                return <Wifi size={16} className="sync-icon idle" />;
        }
    };

    const getStatusText = () => {
        if (!syncStatus.isOnline) {
            return 'Offline';
        }

        // If auto-sync is disabled, show local mode
        if (!syncStatus.autoSyncEnabled) {
            return 'Local Mode';
        }

        switch (syncStatus.status) {
            case 'syncing':
                return 'Syncing...';
            case 'success':
                return syncStatus.lastSyncTime
                    ? `Synced ${formatTimeAgo(syncStatus.lastSyncTime)}`
                    : 'Synced';
            case 'error':
                return 'Sync failed';
            default:
                return 'Ready';
        }
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 120) return '1 min ago';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
        if (seconds < 7200) return '1 hour ago';
        return `${Math.floor(seconds / 3600)} hours ago`;
    };

    const getTooltip = () => {
        if (!syncStatus.autoSyncEnabled) {
            return 'Running in local-only mode. Configure MongoDB to enable sync.';
        }
        if (syncStatus.error) {
            return syncStatus.error;
        }
        return 'Click to sync now';
    };

    return (
        <div className="sync-indicator">
            <button
                className={`sync-button ${!syncStatus.autoSyncEnabled ? 'local' : syncStatus.status}`}
                onClick={handleManualSync}
                disabled={syncStatus.status === 'syncing' || !syncStatus.isOnline || !syncStatus.autoSyncEnabled}
                title={getTooltip()}
            >
                {getStatusIcon()}
                <span className="sync-text">{getStatusText()}</span>
            </button>
        </div>
    );
};

export default SyncIndicator;
