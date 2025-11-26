/**
 * Form Validation Utilities for HEALit Medical Lab
 * Comprehensive validation rules with user-friendly error messages
 */

// Validation Rules
export const validators = {
  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value, min, fieldName = 'This field') => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value, max, fieldName = 'This field') => {
    if (value && value.length > max) {
      return `${fieldName} must be less than ${max} characters`;
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(value.replace(/\s+/g, ''))) {
      return 'Please enter a valid 10-digit mobile number';
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  age: (value) => {
    if (!value) return null;
    const age = parseInt(value);
    if (isNaN(age) || age < 0 || age > 150) {
      return 'Please enter a valid age (0-150)';
    }
    return null;
  },

  number: (value, fieldName = 'This field') => {
    if (value === '' || value === null || value === undefined) return null;
    if (isNaN(value)) {
      return `${fieldName} must be a valid number`;
    }
    return null;
  },

  positiveNumber: (value, fieldName = 'This field') => {
    if (value === '' || value === null || value === undefined) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return `${fieldName} must be a positive number`;
    }
    return null;
  },

  price: (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const price = parseFloat(value);
    if (isNaN(price) || price < 0) {
      return 'Please enter a valid price (₹0 or more)';
    }
    return null;
  },

  date: (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date';
    }
    return null;
  },

  futureDate: (value) => {
    if (!value) return null;
    const date = new Date(value);
    const now = new Date();
    if (date > now) {
      return 'Date cannot be in the future';
    }
    return null;
  }
};

// Patient Form Validation
export const validatePatientForm = (formData) => {
  const errors = {};

  // Name validation
  const nameError = validators.required(formData.name, 'Patient name') ||
                    validators.minLength(formData.name, 2, 'Patient name');
  if (nameError) errors.name = nameError;

  // Age validation
  const ageError = validators.required(formData.age, 'Age') ||
                   validators.age(formData.age);
  if (ageError) errors.age = ageError;

  // Gender validation
  if (!formData.gender) {
    errors.gender = 'Please select gender';
  }

  // Phone validation
  const phoneError = validators.required(formData.phone, 'Phone number') ||
                     validators.phone(formData.phone);
  if (phoneError) errors.phone = phoneError;

  // Email validation (optional but must be valid if provided)
  if (formData.email) {
    const emailError = validators.email(formData.email);
    if (emailError) errors.email = emailError;
  }

  return errors;
};

// Test Result Validation
export const validateTestResult = (test, value) => {
  const errors = [];

  if (!value && test.inputType === 'number') {
    return ['Result value is required'];
  }

  if (test.inputType === 'number') {
    const numError = validators.number(value, 'Result value');
    if (numError) errors.push(numError);

    // Check if value is within reasonable range
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      if (numValue < 0) {
        errors.push('Result value cannot be negative');
      }
      if (numValue > 100000) {
        errors.push('Result value seems unusually high. Please verify.');
      }
    }
  }

  return errors;
};

// Price Validation
export const validatePrice = (price) => {
  return validators.required(price, 'Price') || 
         validators.price(price);
};

// Test Profile Validation
export const validateProfileForm = (formData) => {
  const errors = {};

  // Profile name
  const nameError = validators.required(formData.name, 'Profile name') ||
                    validators.minLength(formData.name, 3, 'Profile name');
  if (nameError) errors.name = nameError;

  // Tests
  if (!formData.tests || formData.tests.length === 0) {
    errors.tests = 'Please add at least one test to the profile';
  }

  // Package price
  if (formData.packagePrice) {
    const priceError = validators.price(formData.packagePrice);
    if (priceError) errors.packagePrice = priceError;
  }

  return errors;
};

// Sample Time Validation
export const validateSampleTimes = (collectedAt, receivedAt) => {
  const errors = {};

  if (!collectedAt) {
    errors.collectedAt = 'Sample collection time is required';
  }

  if (!receivedAt) {
    errors.receivedAt = 'Sample received time is required';
  }

  if (collectedAt && receivedAt) {
    const collected = new Date(collectedAt);
    const received = new Date(receivedAt);

    if (received < collected) {
      errors.receivedAt = 'Received time cannot be before collection time';
    }

    // Check if times are in the future
    const now = new Date();
    if (collected > now) {
      errors.collectedAt = 'Collection time cannot be in the future';
    }
    if (received > now) {
      errors.receivedAt = 'Received time cannot be in the future';
    }
  }

  return errors;
};

// Financial Expense Validation
export const validateExpense = (formData) => {
  const errors = {};

  // Category
  if (!formData.category) {
    errors.category = 'Please select an expense category';
  }

  // Amount
  const amountError = validators.required(formData.amount, 'Amount') ||
                      validators.positiveNumber(formData.amount, 'Amount');
  if (amountError) errors.amount = amountError;

  // Description
  const descError = validators.required(formData.description, 'Description') ||
                    validators.minLength(formData.description, 5, 'Description');
  if (descError) errors.description = descError;

  // Date
  if (!formData.date) {
    errors.date = 'Please select a date';
  }

  return errors;
};

// Generic form validator
export const validateForm = (formData, rules) => {
  const errors = {};

  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = formData[field];

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  });

  return errors;
};

// Helper to check if form has errors
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

// Helper to display error messages
export const getErrorMessage = (errors, field) => {
  return errors[field] || null;
};

export default {
  validators,
  validatePatientForm,
  validateTestResult,
  validatePrice,
  validateProfileForm,
  validateSampleTimes,
  validateExpense,
  validateForm,
  hasErrors,
  getErrorMessage
};
