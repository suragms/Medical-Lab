// Settings Service - System Configuration Management
const STORAGE_KEY = 'lab_settings';

// Default settings
const DEFAULT_SETTINGS = {
  // Lab Information
  labName: 'HEALit Med Laboratories',
  labAddress: 'Thrissur, Kerala, India',
  labPhone: '+91 1234567890',
  labEmail: 'contact@healit.com',
  
  // Permissions
  allowStaffEditPrice: false,
  allowStaffEditDiscount: false,
  allowManualTests: true,
  allowPDFRegeneration: false,
  allowPartialReports: false,
  allowManualReportedTime: false,
  
  // PDF Settings
  showPartnerLogo: true,
  showPriceInResultPDF: false,
  showSignatureBlock: true,
  pdfFontSize: 12,
  pdfHeaderColor: 'blue',
  
  // Billing
  defaultDiscount: 0,
  taxName: 'GST',
  taxPercentage: 0,
  invoicePrefix: 'HEALIT-',
  autoIncrementInvoice: true,
  
  // Notifications
  enableEmailNotifications: false,
  enableWhatsAppNotifications: false,
  
  // App Behavior
  autosaveFrequency: 2,
  sessionTimeout: 60,
  lockSnapshotAfterPDF: true,
  darkMode: false,
  
  // Advanced
  dateTimeFormat: 'DD/MM/YYYY HH:mm',
  autoDeleteOldPDFs: false,
  pdfRetentionDays: 180
};

// Initialize settings
const initializeSettings = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  return JSON.parse(stored);
};

// Get all settings
export const getSettings = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return initializeSettings();
  }
  return JSON.parse(stored);
};

// Update settings
export const updateSettings = (updates) => {
  const current = getSettings();
  const updated = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

// Get specific setting
export const getSetting = (key) => {
  const settings = getSettings();
  return settings[key];
};

// Reset to defaults
export const resetSettings = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
  return DEFAULT_SETTINGS;
};

// Initialize on module load
initializeSettings();
