/**
 * Audit Logging Service
 * Tracks all critical actions in the system for security and compliance
 */

import { AuditLog, STORAGE_KEYS } from '../models/dataModels';
import { getCurrentUser } from './authService';

// ============= AUDIT ACTION TYPES =============
export const AUDIT_ACTIONS = {
  // Patient actions
  ADD_PATIENT: 'ADD_PATIENT',
  EDIT_PATIENT: 'EDIT_PATIENT',
  DELETE_PATIENT: 'DELETE_PATIENT',
  
  // Visit actions
  CREATE_VISIT: 'CREATE_VISIT',
  UPDATE_VISIT: 'UPDATE_VISIT',
  DELETE_VISIT: 'DELETE_VISIT',
  
  // Test actions
  ADD_TEST: 'ADD_TEST',
  EDIT_TEST: 'EDIT_TEST',
  DELETE_TEST: 'DELETE_TEST',
  
  // Profile actions
  ADD_PROFILE: 'ADD_PROFILE',
  EDIT_PROFILE: 'EDIT_PROFILE',
  DELETE_PROFILE: 'DELETE_PROFILE',
  
  // Result actions
  SAVE_RESULTS: 'SAVE_RESULTS',
  EDIT_RESULTS: 'EDIT_RESULTS',
  
  // PDF generation
  GENERATE_REPORT: 'GENERATE_REPORT',
  GENERATE_INVOICE: 'GENERATE_INVOICE',
  REGENERATE_PDF: 'REGENERATE_PDF',
  
  // Sample time tracking
  SET_SAMPLE_TIMES: 'SET_SAMPLE_TIMES',
  EDIT_SAMPLE_TIMES: 'EDIT_SAMPLE_TIMES',
  
  // Technician actions
  CHANGE_SIGNING_TECHNICIAN: 'CHANGE_SIGNING_TECHNICIAN',
  ADD_TECHNICIAN: 'ADD_TECHNICIAN',
  EDIT_TECHNICIAN: 'EDIT_TECHNICIAN',
  DELETE_TECHNICIAN: 'DELETE_TECHNICIAN',
  
  // Staff actions
  CREATE_STAFF: 'CREATE_STAFF',
  EDIT_STAFF: 'EDIT_STAFF',
  DELETE_STAFF: 'DELETE_STAFF',
  RESET_PASSWORD: 'RESET_PASSWORD',
  
  // Settings actions
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  UPDATE_PERMISSIONS: 'UPDATE_PERMISSIONS',
  UPDATE_BRANDING: 'UPDATE_BRANDING',
  
  // Financial actions
  ADD_EXPENSE: 'ADD_EXPENSE',
  EDIT_EXPENSE: 'EDIT_EXPENSE',
  DELETE_EXPENSE: 'DELETE_EXPENSE',
  
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  
  // Data export
  EXPORT_DATA: 'EXPORT_DATA',
  BACKUP_DATA: 'BACKUP_DATA'
};

// ============= AUDIT LOG STORAGE =============
const getAuditLogs = () => {
  try {
    const logs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Error loading audit logs:', error);
    return [];
  }
};

const saveAuditLogs = (logs) => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(logs));
  } catch (error) {
    console.error('Error saving audit logs:', error);
  }
};

// ============= CREATE AUDIT LOG =============
export const createAuditLog = (action, entity, entityId, before = null, after = null, additionalData = {}) => {
  try {
    const currentUser = getCurrentUser();
    
    const auditLog = new AuditLog({
      userId: currentUser?.userId || 'SYSTEM',
      userName: currentUser?.fullName || 'System',
      role: currentUser?.role || 'system',
      action,
      entity,
      entityId,
      before: before ? JSON.stringify(before) : null,
      after: after ? JSON.stringify(after) : null,
      ipAddress: additionalData.ipAddress || 'localhost',
      userAgent: navigator.userAgent || '',
      timestamp: new Date().toISOString()
    });
    
    const logs = getAuditLogs();
    logs.unshift(auditLog); // Add to beginning (most recent first)
    
    // Keep only last 10000 logs (prevent localStorage overflow)
    if (logs.length > 10000) {
      logs.splice(10000);
    }
    
    saveAuditLogs(logs);
    
    // Also log to console for development
    console.log('🔒 AUDIT LOG:', {
      action,
      entity,
      entityId,
      user: currentUser?.fullName || 'System',
      timestamp: auditLog.timestamp
    });
    
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

// ============= QUERY AUDIT LOGS =============
export const getAuditLogsByEntity = (entity, entityId) => {
  const logs = getAuditLogs();
  return logs.filter(log => log.entity === entity && log.entityId === entityId);
};

export const getAuditLogsByUser = (userId) => {
  const logs = getAuditLogs();
  return logs.filter(log => log.userId === userId);
};

export const getAuditLogsByAction = (action) => {
  const logs = getAuditLogs();
  return logs.filter(log => log.action === action);
};

export const getAuditLogsByDateRange = (startDate, endDate) => {
  const logs = getAuditLogs();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= start && logDate <= end;
  });
};

export const getRecentAuditLogs = (limit = 100) => {
  const logs = getAuditLogs();
  return logs.slice(0, limit);
};

// ============= SEARCH AUDIT LOGS =============
export const searchAuditLogs = (filters = {}) => {
  let logs = getAuditLogs();
  
  // Filter by user
  if (filters.userId) {
    logs = logs.filter(log => log.userId === filters.userId);
  }
  
  // Filter by action
  if (filters.action) {
    logs = logs.filter(log => log.action === filters.action);
  }
  
  // Filter by entity
  if (filters.entity) {
    logs = logs.filter(log => log.entity === filters.entity);
  }
  
  // Filter by date range
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    logs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= start && logDate <= end;
    });
  }
  
  // Filter by search term
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    logs = logs.filter(log => 
      log.userName.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.entity.toLowerCase().includes(searchLower)
    );
  }
  
  return logs;
};

// ============= CLEAR OLD LOGS =============
export const clearOldAuditLogs = (daysToKeep = 90) => {
  const logs = getAuditLogs();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= cutoffDate;
  });
  
  saveAuditLogs(filteredLogs);
  
  const deletedCount = logs.length - filteredLogs.length;
  console.log(`Cleared ${deletedCount} old audit logs (older than ${daysToKeep} days)`);
  
  return deletedCount;
};

// ============= EXPORT AUDIT LOGS =============
export const exportAuditLogs = (format = 'json') => {
  const logs = getAuditLogs();
  
  if (format === 'json') {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  } else if (format === 'csv') {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Entity', 'Entity ID'];
    const rows = logs.map(log => [
      log.timestamp,
      log.userName,
      log.role,
      log.action,
      log.entity,
      log.entityId || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  
  createAuditLog(AUDIT_ACTIONS.EXPORT_DATA, 'audit_logs', null, null, { format });
};

// ============= GET AUDIT STATISTICS =============
export const getAuditStatistics = (days = 30) => {
  const logs = getAuditLogs();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentLogs = logs.filter(log => new Date(log.timestamp) >= cutoffDate);
  
  // Count by action
  const actionCounts = {};
  recentLogs.forEach(log => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  });
  
  // Count by user
  const userCounts = {};
  recentLogs.forEach(log => {
    userCounts[log.userName] = (userCounts[log.userName] || 0) + 1;
  });
  
  // Count by entity
  const entityCounts = {};
  recentLogs.forEach(log => {
    entityCounts[log.entity] = (entityCounts[log.entity] || 0) + 1;
  });
  
  return {
    totalLogs: recentLogs.length,
    period: `Last ${days} days`,
    actionCounts,
    userCounts,
    entityCounts,
    mostActiveUser: Object.keys(userCounts).reduce((a, b) => userCounts[a] > userCounts[b] ? a : b, ''),
    mostCommonAction: Object.keys(actionCounts).reduce((a, b) => actionCounts[a] > actionCounts[b] ? a : b, '')
  };
};

export default {
  createAuditLog,
  getAuditLogs,
  getAuditLogsByEntity,
  getAuditLogsByUser,
  getAuditLogsByAction,
  getAuditLogsByDateRange,
  getRecentAuditLogs,
  searchAuditLogs,
  clearOldAuditLogs,
  exportAuditLogs,
  getAuditStatistics,
  AUDIT_ACTIONS
};
