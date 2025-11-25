/**
 * Global Error Handling Utility
 * Provides consistent error handling, retry logic, and user-friendly messages
 */

import toast from 'react-hot-toast';
import { ErrorCodes, ErrorMessages } from '../models/dataModels';
import { createAuditLog, AUDIT_ACTIONS } from '../services/auditService';

// ============= ERROR CLASSES =============
export class AppError extends Error {
  constructor(message, code = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, ErrorCodes.VALIDATION_ERROR, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = ErrorMessages[401]) {
    super(message, ErrorCodes.UNAUTHORIZED);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = ErrorMessages[403]) {
    super(message, ErrorCodes.FORBIDDEN);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = ErrorMessages[404]) {
    super(message, ErrorCodes.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = ErrorMessages[409]) {
    super(message, ErrorCodes.CONFLICT);
    this.name = 'ConflictError';
  }
}

// ============= ERROR HANDLER =============
export const handleError = (error, context = '') => {
  console.error(`[ERROR] ${context}:`, error);
  
  // Log error to audit
  try {
    createAuditLog(
      'ERROR',
      'system',
      null,
      null,
      {
        error: error.message,
        context,
        code: error.code || 500,
        stack: error.stack
      }
    );
  } catch (auditError) {
    console.error('Failed to log error to audit:', auditError);
  }
  
  // Handle specific error types
  if (error instanceof ValidationError) {
    toast.error(error.message, { duration: 4000 });
    return;
  }
  
  if (error instanceof UnauthorizedError) {
    toast.error(error.message, { duration: 3000 });
    // Redirect to login
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
    return;
  }
  
  if (error instanceof ForbiddenError) {
    toast.error(error.message, { duration: 4000 });
    return;
  }
  
  if (error instanceof NotFoundError) {
    toast.error(error.message, { duration: 3000 });
    return;
  }
  
  if (error instanceof ConflictError) {
    toast.error(error.message, { duration: 4000 });
    return;
  }
  
  // Generic error
  const message = error.message || ErrorMessages[500];
  toast.error(message, { duration: 4000 });
};

// ============= RETRY LOGIC =============
export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};

// ============= ASYNC ERROR WRAPPER =============
export const asyncHandler = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, fn.name || 'Anonymous function');
      throw error;
    }
  };
};

// ============= VALIDATION HELPERS =============
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new ValidationError(`${fieldName} is required`);
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone)) {
    throw new ValidationError('Phone must be 10 digits');
  }
};

export const validateMinLength = (value, minLength, fieldName) => {
  if (value.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters`);
  }
};

export const validateMaxLength = (value, maxLength, fieldName) => {
  if (value.length > maxLength) {
    throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`);
  }
};

export const validateRange = (value, min, max, fieldName) => {
  if (value < min || value > max) {
    throw new ValidationError(`${fieldName} must be between ${min} and ${max}`);
  }
};

export const validateEnum = (value, allowedValues, fieldName) => {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
};

// ============= FORM VALIDATION =============
export const validatePatientData = (data) => {
  const errors = {};
  
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Name is required';
  } else if (data.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  if (!data.age || data.age < 0 || data.age > 120) {
    errors.age = 'Age must be between 0 and 120';
  }
  
  if (!data.gender) {
    errors.gender = 'Gender is required';
  }
  
  if (!data.phone) {
    errors.phone = 'Phone is required';
  } else if (!/^[0-9]{10}$/.test(data.phone)) {
    errors.phone = 'Phone must be 10 digits';
  }
  
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateTestData = (data) => {
  const errors = {};
  
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Test name is required';
  }
  
  if (data.price === undefined || data.price < 0) {
    errors.price = 'Price must be 0 or greater';
  }
  
  if (data.inputType && !['number', 'text', 'select'].includes(data.inputType)) {
    errors.inputType = 'Invalid input type';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateUserData = (data) => {
  const errors = {};
  
  if (!data.fullName || data.fullName.trim() === '') {
    errors.fullName = 'Full name is required';
  }
  
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  if (!data.role || !['admin', 'staff'].includes(data.role)) {
    errors.role = 'Invalid role';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// ============= FILE UPLOAD VALIDATION =============
export const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'],
    allowedExtensions = ['.png', '.jpg', '.jpeg']
  } = options;
  
  // Check file size
  if (file.size > maxSize) {
    throw new ValidationError(`File size must not exceed ${maxSize / (1024 * 1024)}MB`);
  }
  
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    throw new ValidationError(`File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
  }
  
  return true;
};

// ============= SAFE PARSE JSON =============
export const safeParseJSON = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
};

// ============= SAFE LOCALSTORAGE ACCESS =============
export const safeGetLocalStorage = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`LocalStorage get error for key "${key}":`, error);
    return fallback;
  }
};

export const safeSetLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`LocalStorage set error for key "${key}":`, error);
    handleError(new AppError('Failed to save data. Storage may be full.', 500));
    return false;
  }
};

// ============= NETWORK ERROR HANDLING =============
export const handleNetworkError = (error) => {
  if (!navigator.onLine) {
    toast.error('No internet connection. Please check your network.', { duration: 5000 });
    return;
  }
  
  if (error.message.includes('timeout')) {
    toast.error('Request timeout. Please try again.', { duration: 4000 });
    return;
  }
  
  handleError(error, 'Network Request');
};

// ============= ERROR BOUNDARY FALLBACK =============
export const getErrorBoundaryFallback = (error, errorInfo) => {
  return {
    title: 'Something went wrong',
    message: 'We encountered an unexpected error. Please refresh the page and try again.',
    details: process.env.NODE_ENV === 'development' ? error.message : null,
    showReload: true
  };
};

export default {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  handleError,
  withRetry,
  asyncHandler,
  validateRequired,
  validateEmail,
  validatePhone,
  validateMinLength,
  validateMaxLength,
  validateRange,
  validateEnum,
  validatePatientData,
  validateTestData,
  validateUserData,
  validateFileUpload,
  safeParseJSON,
  safeGetLocalStorage,
  safeSetLocalStorage,
  handleNetworkError,
  getErrorBoundaryFallback
};
