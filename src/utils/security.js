/**
 * Security Utilities
 * Handles authentication security, rate limiting, password hashing, and session management
 */

import { STORAGE_KEYS } from '../models/dataModels';
import { createAuditLog, AUDIT_ACTIONS } from '../services/auditService';
import { UnauthorizedError } from './errorHandler';

// ============= PASSWORD HASHING (Simulated) =============
// In production, use bcrypt on the backend
export const hashPassword = (password) => {
  // Simple hash simulation using btoa (Base64)
  // In production, use bcrypt with salt on backend
  const salt = 'healit_lab_salt_2024';
  const combined = password + salt;
  return btoa(combined);
};

export const verifyPassword = (password, hashedPassword) => {
  const salt = 'healit_lab_salt_2024';
  const combined = password + salt;
  const hashed = btoa(combined);
  return hashed === hashedPassword;
};

// ============= JWT TOKEN SIMULATION =============
export const generateToken = (userId, role) => {
  const payload = {
    userId,
    role,
    iat: Date.now(),
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  };
  
  // Simulated JWT (in production, use proper JWT library)
  return btoa(JSON.stringify(payload));
};

export const verifyToken = (token) => {
  try {
    const payload = JSON.parse(atob(token));
    
    // Check expiration
    if (Date.now() > payload.exp) {
      throw new UnauthorizedError('Token expired. Please login again.');
    }
    
    return payload;
  } catch (error) {
    throw new UnauthorizedError('Invalid token. Please login again.');
  }
};

export const refreshToken = (oldToken) => {
  try {
    const payload = verifyToken(oldToken);
    return generateToken(payload.userId, payload.role);
  } catch (error) {
    throw new UnauthorizedError('Cannot refresh token. Please login again.');
  }
};

// ============= RATE LIMITING =============
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const getLoginAttempts = () => {
  try {
    const attempts = localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
    return attempts ? JSON.parse(attempts) : {};
  } catch (error) {
    return {};
  }
};

export const saveLoginAttempts = (attempts) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(attempts));
  } catch (error) {
    console.error('Failed to save login attempts:', error);
  }
};

export const checkRateLimit = (identifier) => {
  const attempts = getLoginAttempts();
  const userAttempts = attempts[identifier];
  
  if (!userAttempts) {
    return { allowed: true, remainingAttempts: LOGIN_ATTEMPT_LIMIT };
  }
  
  const { count, lastAttempt } = userAttempts;
  const timeSinceLastAttempt = Date.now() - lastAttempt;
  
  // Reset if lockout period has passed
  if (timeSinceLastAttempt > LOGIN_LOCKOUT_DURATION) {
    delete attempts[identifier];
    saveLoginAttempts(attempts);
    return { allowed: true, remainingAttempts: LOGIN_ATTEMPT_LIMIT };
  }
  
  // Check if locked out
  if (count >= LOGIN_ATTEMPT_LIMIT) {
    const remainingTime = Math.ceil((LOGIN_LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutMinutes: remainingTime
    };
  }
  
  return {
    allowed: true,
    remainingAttempts: LOGIN_ATTEMPT_LIMIT - count
  };
};

export const recordLoginAttempt = (identifier, success = false) => {
  const attempts = getLoginAttempts();
  
  if (success) {
    // Clear attempts on successful login
    delete attempts[identifier];
    saveLoginAttempts(attempts);
    return;
  }
  
  // Record failed attempt
  const userAttempts = attempts[identifier] || { count: 0, lastAttempt: 0 };
  userAttempts.count += 1;
  userAttempts.lastAttempt = Date.now();
  attempts[identifier] = userAttempts;
  
  saveLoginAttempts(attempts);
  
  // Log failed login attempt
  createAuditLog(AUDIT_ACTIONS.LOGIN_FAILED, 'auth', null, null, { identifier });
};

// ============= SESSION MANAGEMENT =============
let sessionTimeoutId = null;
const DEFAULT_SESSION_TIMEOUT = 60 * 60 * 1000; // 60 minutes

export const startSessionTimer = (timeoutMinutes = 60) => {
  clearSessionTimer();
  
  const timeoutMs = timeoutMinutes * 60 * 1000;
  
  sessionTimeoutId = setTimeout(() => {
    // Auto logout on idle
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    
    createAuditLog(AUDIT_ACTIONS.LOGOUT, 'auth', null, null, { reason: 'session_timeout' });
    
    window.location.href = '/login?reason=timeout';
  }, timeoutMs);
};

export const clearSessionTimer = () => {
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
    sessionTimeoutId = null;
  }
};

export const resetSessionTimer = (timeoutMinutes = 60) => {
  startSessionTimer(timeoutMinutes);
};

// ============= ACTIVITY TRACKING =============
export const setupActivityTracking = () => {
  // Reset session timer on user activity
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  
  events.forEach(event => {
    document.addEventListener(event, () => {
      resetSessionTimer();
    }, { passive: true });
  });
};

// ============= PERMISSION CHECKS =============
export const checkPermission = (requiredRole, userRole) => {
  const roleHierarchy = {
    admin: 2,
    staff: 1
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const requireAdmin = (userRole) => {
  if (userRole !== 'admin') {
    throw new Error('Admin access required');
  }
};

export const requireAuth = () => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  
  if (!token) {
    throw new UnauthorizedError('Please login to continue');
  }
  
  return verifyToken(token);
};

// ============= SANITIZATION =============
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potential XSS vectors
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
};

export const sanitizeHTML = (html) => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

// ============= SQL INJECTION PREVENTION =============
// Since we're using localStorage (no SQL), this is for documentation
export const escapeSQL = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
};

// ============= FILE UPLOAD SECURITY =============
export const validateFileType = (file) => {
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  const allowedExtensions = ['.png', '.jpg', '.jpeg'];
  
  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only PNG/JPG allowed.' };
  }
  
  // Check extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return { valid: false, error: 'Invalid file extension.' };
  }
  
  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must not exceed 5MB.' };
  }
  
  return { valid: true };
};

// ============= GENERATE SECURE RANDOM STRING =============
export const generateSecureId = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// ============= VALIDATE EMAIL =============
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ============= VALIDATE PHONE =============
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// ============= CSRF TOKEN (Simulation) =============
let csrfToken = null;

export const generateCSRFToken = () => {
  csrfToken = generateSecureId(32);
  return csrfToken;
};

export const validateCSRFToken = (token) => {
  return token === csrfToken;
};

// ============= IP ADDRESS TRACKING (Browser limitation) =============
export const getClientIP = () => {
  // In browser, we can't get real IP without backend
  // This is a placeholder for audit logging
  return 'localhost';
};

// ============= SECURITY HEADERS (Documentation) =============
export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// ============= SECURE SESSION STORAGE =============
export const setSecureSession = (key, value) => {
  try {
    const encrypted = btoa(JSON.stringify(value));
    sessionStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Failed to set secure session:', error);
  }
};

export const getSecureSession = (key) => {
  try {
    const encrypted = sessionStorage.getItem(key);
    if (!encrypted) return null;
    return JSON.parse(atob(encrypted));
  } catch (error) {
    console.error('Failed to get secure session:', error);
    return null;
  }
};

export const clearSecureSession = (key) => {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear secure session:', error);
  }
};

export default {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  refreshToken,
  checkRateLimit,
  recordLoginAttempt,
  startSessionTimer,
  clearSessionTimer,
  resetSessionTimer,
  setupActivityTracking,
  checkPermission,
  requireAdmin,
  requireAuth,
  sanitizeInput,
  sanitizeHTML,
  escapeSQL,
  validateFileType,
  generateSecureId,
  isValidEmail,
  isValidPhone,
  generateCSRFToken,
  validateCSRFToken,
  getClientIP,
  setSecureSession,
  getSecureSession,
  clearSecureSession
};
