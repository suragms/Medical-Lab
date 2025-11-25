/**
 * HEALit Laboratory Management System
 * Complete Data Models & JSON Structure
 * 
 * This file defines the canonical structure for all data entities
 * stored in localStorage (simulating a backend database)
 */

// ============= STORAGE KEYS =============
export const STORAGE_KEYS = {
  PATIENTS: 'lab_patients',
  VISITS: 'lab_visits',
  TESTS_MASTER: 'lab_tests_master',
  PROFILES: 'lab_profiles',
  PROFILE_TESTS: 'lab_profile_tests',
  TEST_SNAPSHOTS: 'lab_test_snapshots',
  RESULTS: 'lab_results',
  INVOICES: 'lab_invoices',
  TECHNICIANS: 'lab_technicians',
  USERS: 'lab_users',
  SETTINGS: 'lab_settings',
  EXPENSES: 'lab_expenses',
  EXPENSE_CATEGORIES: 'lab_expense_categories',
  REMINDERS: 'lab_finance_reminders',
  AUDIT_LOG: 'lab_audit_log',
  CURRENT_USER: 'lab_current_user',
  AUTH_TOKEN: 'lab_auth_token',
  LOGIN_ATTEMPTS: 'lab_login_attempts'
};

// ============= PATIENT MODEL =============
export class Patient {
  constructor(data = {}) {
    this.patientId = data.patientId || `PAT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = data.name || '';
    this.age = data.age || 0;
    this.gender = data.gender || '';
    this.phone = data.phone || '';
    this.email = data.email || '';
    this.address = data.address || '';
    this.referredBy = data.referredBy || '';
    this.created_by_user_id = data.created_by_user_id || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.visits = data.visits || []; // Array of visit IDs
  }
}

// ============= VISIT MODEL =============
export class Visit {
  constructor(data = {}) {
    this.visitId = data.visitId || `VIS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.patientId = data.patientId || null;
    this.profileId = data.profileId || null;
    this.profileName = data.profileName || '';
    
    // Test snapshots (immutable after PDF generation)
    this.tests = data.tests || []; // Array of TestSnapshot objects
    
    // Timestamps
    this.collectedAt = data.collectedAt || null;
    this.receivedAt = data.receivedAt || null;
    this.reportedAt = data.reportedAt || null;
    
    // Staff tracking
    this.created_by_user_id = data.created_by_user_id || null;
    this.result_entered_by_user_id = data.result_entered_by_user_id || null;
    this.signing_technician_id = data.signing_technician_id || null;
    
    // Sample details
    this.sampleType = data.sampleType || 'Venous Blood';
    this.collectedBy = data.collectedBy || '';
    this.notes = data.notes || '';
    
    // Billing
    this.subtotal = data.subtotal || 0;
    this.discount = data.discount || 0;
    this.finalAmount = data.finalAmount || 0;
    
    // Status: registered, samples_recorded, results_entered, report_generated
    this.status = data.status || 'registered';
    
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
}

// ============= TEST MASTER MODEL =============
export class TestMaster {
  constructor(data = {}) {
    this.testId = data.testId || `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = data.name || '';
    this.shortName = data.shortName || '';
    this.category = data.category || 'General';
    this.unit = data.unit || '';
    this.refLow = data.refLow || null;
    this.refHigh = data.refHigh || null;
    this.refText = data.refText || '';
    this.bioReference = data.bioReference || ''; // Multi-line bio reference range
    this.inputType = data.inputType || 'number'; // number, text, select
    this.dropdownOptions = data.dropdownOptions || [];
    this.price = data.price || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.synonyms = data.synonyms || []; // For search
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
}

// ============= TEST SNAPSHOT MODEL =============
// Immutable snapshot of test details at time of visit creation
export class TestSnapshot {
  constructor(data = {}) {
    this.snapshotId = data.snapshotId || `SNAP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.testId = data.testId || null; // Original test ID (null if custom)
    this.name_snapshot = data.name_snapshot || data.name || '';
    this.unit_snapshot = data.unit_snapshot || data.unit || '';
    this.refLow_snapshot = data.refLow_snapshot !== undefined ? data.refLow_snapshot : data.refLow;
    this.refHigh_snapshot = data.refHigh_snapshot !== undefined ? data.refHigh_snapshot : data.refHigh;
    this.refText_snapshot = data.refText_snapshot || data.refText || '';
    this.bioReference_snapshot = data.bioReference_snapshot || data.bioReference || ''; // Multi-line bio reference
    this.inputType_snapshot = data.inputType_snapshot || data.inputType || 'number';
    this.dropdownOptions_snapshot = data.dropdownOptions_snapshot || data.dropdownOptions || [];
    this.price_snapshot = data.price_snapshot !== undefined ? data.price_snapshot : data.price || 0;
    this.isCustom = data.isCustom || false;
    this.included = data.included !== undefined ? data.included : true;
    
    // Result fields (filled during result entry)
    this.value = data.value || '';
    this.status = data.status || 'NORMAL'; // NORMAL, HIGH, LOW
    
    this.versionSnapshot = data.versionSnapshot || new Date().toISOString();
  }
}

// ============= PROFILE MODEL =============
export class Profile {
  constructor(data = {}) {
    this.profileId = data.profileId || `PROF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = data.name || '';
    this.description = data.description || '';
    this.category = data.category || 'General';
    this.basePrice = data.basePrice || 0;
    this.tests = data.tests || []; // Array of test IDs
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
}

// ============= RESULT MODEL =============
export class Result {
  constructor(data = {}) {
    this.resultId = data.resultId || `RES_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.visitId = data.visitId || null;
    this.snapshotId = data.snapshotId || null;
    this.value = data.value || '';
    this.flag = data.flag || 'NORMAL'; // NORMAL, HIGH, LOW
    this.enteredBy = data.enteredBy || null;
    this.enteredAt = data.enteredAt || new Date().toISOString();
  }
}

// ============= INVOICE MODEL =============
export class Invoice {
  constructor(data = {}) {
    this.invoiceId = data.invoiceId || `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.invoiceNumber = data.invoiceNumber || '';
    this.visitId = data.visitId || null;
    this.patientId = data.patientId || null;
    
    // Line items
    this.items = data.items || []; // [{ name, price, qty }]
    
    // Amounts
    this.subtotal = data.subtotal || 0;
    this.discount = data.discount || 0;
    this.discountAmount = data.discountAmount || 0;
    this.tax = data.tax || 0;
    this.taxAmount = data.taxAmount || 0;
    this.total = data.total || 0;
    
    // Payment
    this.paid = data.paid || 0;
    this.balance = data.balance || 0;
    this.paymentMethod = data.paymentMethod || 'Cash';
    this.paymentStatus = data.paymentStatus || 'pending'; // pending, partial, paid
    
    this.generatedAt = data.generatedAt || new Date().toISOString();
  }
}

// ============= TECHNICIAN MODEL =============
export class Technician {
  constructor(data = {}) {
    this.technicianId = data.technicianId || `TECH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.userId = data.userId || null; // Linked staff user
    this.name = data.name || '';
    this.qualification = data.qualification || '';
    this.signatureUrl = data.signatureUrl || null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
}

// ============= USER/STAFF MODEL =============
export class User {
  constructor(data = {}) {
    this.userId = data.userId || `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.fullName = data.fullName || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.password = data.password || ''; // Should be hashed in production
    this.role = data.role || 'staff'; // admin, staff
    this.qualification = data.qualification || '';
    this.signatureUrl = data.signatureUrl || null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastLogin = data.lastLogin || null;
  }
}

// ============= EXPENSE MODEL =============
export class Expense {
  constructor(data = {}) {
    this.expenseId = data.expenseId || `EXP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.date = data.date || new Date().toISOString();
    this.categoryId = data.categoryId || null;
    this.amount = data.amount || 0;
    this.description = data.description || '';
    this.paidTo = data.paidTo || '';
    this.staffId = data.staffId || null;
    this.attachmentUrl = data.attachmentUrl || null;
    this.paymentMethod = data.paymentMethod || 'Cash';
    this.createdByAdminId = data.createdByAdminId || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
}

// ============= REMINDER MODEL =============
export class Reminder {
  constructor(data = {}) {
    this.reminderId = data.reminderId || `REM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.title = data.title || '';
    this.date = data.date || '';
    this.repeat = data.repeat || 'One-time'; // One-time, Monthly, Weekly, Yearly
    this.notes = data.notes || '';
    this.viaEmail = data.viaEmail || false;
    this.viaWhatsApp = data.viaWhatsApp || false;
    this.createdBy = data.createdBy || null;
    this.createdAt = data.createdAt || new Date().toISOString();
  }
}

// ============= AUDIT LOG MODEL =============
export class AuditLog {
  constructor(data = {}) {
    this.logId = data.logId || `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.userId = data.userId || null;
    this.userName = data.userName || '';
    this.role = data.role || '';
    this.action = data.action || ''; // ADD_PATIENT, EDIT_TEST, GENERATE_PDF, etc.
    this.entity = data.entity || ''; // patient, visit, test, etc.
    this.entityId = data.entityId || null;
    this.before = data.before || null; // Previous state (JSON)
    this.after = data.after || null; // New state (JSON)
    this.ipAddress = data.ipAddress || '';
    this.userAgent = data.userAgent || '';
    this.timestamp = data.timestamp || new Date().toISOString();
  }
}

// ============= SETTINGS MODEL =============
export class Settings {
  constructor(data = {}) {
    // Lab Information
    this.labName = data.labName || 'HEALit Med Laboratories';
    this.labAddress = data.labAddress || 'Thrissur, Kerala, India';
    this.labPhone = data.labPhone || '+91 1234567890';
    this.labEmail = data.labEmail || 'contact@healit.com';
    this.labLogoUrl = data.labLogoUrl || null;
    this.partnerLogoUrl = data.partnerLogoUrl || null;
    
    // Permissions
    this.allowStaffEditPrice = data.allowStaffEditPrice || false;
    this.allowStaffEditDiscount = data.allowStaffEditDiscount || false;
    this.allowManualTests = data.allowManualTests !== undefined ? data.allowManualTests : true;
    this.allowPDFRegeneration = data.allowPDFRegeneration || false;
    this.allowPartialReports = data.allowPartialReports || false;
    this.allowManualReportedTime = data.allowManualReportedTime || false;
    
    // PDF Settings
    this.showPartnerLogo = data.showPartnerLogo !== undefined ? data.showPartnerLogo : true;
    this.showPriceInResultPDF = data.showPriceInResultPDF || false;
    this.showSignatureBlock = data.showSignatureBlock !== undefined ? data.showSignatureBlock : true;
    this.pdfFontSize = data.pdfFontSize || 12;
    this.pdfHeaderColor = data.pdfHeaderColor || 'blue';
    this.pdfFooterText = data.pdfFooterText || '© HEALit Med Laboratories';
    
    // Billing
    this.defaultDiscount = data.defaultDiscount || 0;
    this.taxName = data.taxName || 'GST';
    this.taxPercentage = data.taxPercentage || 0;
    this.invoicePrefix = data.invoicePrefix || 'HEALIT-';
    this.autoIncrementInvoice = data.autoIncrementInvoice !== undefined ? data.autoIncrementInvoice : true;
    
    // Notifications
    this.enableEmailNotifications = data.enableEmailNotifications || false;
    this.enableWhatsAppNotifications = data.enableWhatsAppNotifications || false;
    
    // App Behavior
    this.autosaveFrequency = data.autosaveFrequency || 2;
    this.sessionTimeout = data.sessionTimeout || 60;
    this.lockSnapshotAfterPDF = data.lockSnapshotAfterPDF !== undefined ? data.lockSnapshotAfterPDF : true;
    this.darkMode = data.darkMode || false;
    
    // Advanced
    this.dateTimeFormat = data.dateTimeFormat || 'DD/MM/YYYY HH:mm';
    this.autoDeleteOldPDFs = data.autoDeleteOldPDFs || false;
    this.pdfRetentionDays = data.pdfRetentionDays || 180;
    
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
}

// ============= VALIDATION HELPERS =============
export const ValidationRules = {
  patient: {
    name: { required: true, minLength: 2, maxLength: 100 },
    age: { required: true, min: 0, max: 120 },
    gender: { required: true, enum: ['Male', 'Female', 'Other'] },
    phone: { required: true, pattern: /^[0-9]{10}$/ },
    email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
  },
  
  test: {
    name: { required: true, minLength: 2, maxLength: 200 },
    price: { required: true, min: 0 },
    unit: { maxLength: 50 }
  },
  
  visit: {
    patientId: { required: true },
    tests: { required: true, minLength: 1 }
  },
  
  user: {
    fullName: { required: true, minLength: 2, maxLength: 100 },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { required: true, minLength: 6 },
    role: { required: true, enum: ['admin', 'staff'] }
  }
};

// ============= ERROR CODES =============
export const ErrorCodes = {
  // Client Errors (400-499)
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  
  // Server Errors (500-599)
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// ============= ERROR MESSAGES =============
export const ErrorMessages = {
  400: 'Invalid input. Please check your data and try again.',
  401: 'Session expired. Please login again.',
  403: 'Permission denied. You do not have access to this resource.',
  404: 'Resource not found.',
  409: 'Conflict detected. Another user may have modified this data.',
  500: 'Internal error. Please try again.',
  503: 'Service temporarily unavailable. Please try again later.'
};
