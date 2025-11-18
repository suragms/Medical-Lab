// Auth & User Management Service
const STORAGE_KEYS = {
  USERS: 'healit_users',
  TECHNICIANS: 'healit_technicians',
  CURRENT_USER: 'healit_current_user',
  AUTH_TOKEN: 'healit_auth_token',
  LOGIN_ATTEMPTS: 'healit_login_attempts'
};

// ========================================
// USER OPERATIONS
// ========================================

/**
 * Get all users
 */
export const getUsers = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
};

/**
 * Get user by ID
 */
export const getUserById = (userId) => {
  const users = getUsers();
  return users.find(u => u.userId === userId);
};

/**
 * Get user by email
 */
export const getUserByEmail = (email) => {
  const users = getUsers();
  return users.find(u => u.email === email.toLowerCase());
};

/**
 * Create new user (Admin only)
 */
export const createUser = (userData) => {
  const users = getUsers();
  
  // Check if email already exists
  if (getUserByEmail(userData.email)) {
    throw new Error('Email already exists');
  }
  
  const newUser = {
    userId: `USER_${Date.now()}`,
    email: userData.email.toLowerCase(),
    password: userData.password, // In production: hash with bcrypt
    fullName: userData.fullName,
    phone: userData.phone || '',
    role: userData.role || 'staff',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  
  // Don't return password
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

/**
 * Update user
 */
export const updateUser = (userId, updates) => {
  const users = getUsers();
  const index = users.findIndex(u => u.userId === userId);
  
  if (index === -1) {
    throw new Error('User not found');
  }
  
  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  
  const { password, ...userWithoutPassword } = users[index];
  return userWithoutPassword;
};

/**
 * Delete/Deactivate user
 */
export const deactivateUser = (userId) => {
  return updateUser(userId, { isActive: false });
};

/**
 * Permanently delete user (Admin only)
 */
export const deleteUser = (userId) => {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.userId !== userId);
  
  if (users.length === filteredUsers.length) {
    throw new Error('User not found');
  }
  
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
  return true;
};

/**
 * Alias for createUser (for compatibility)
 */
export const addUser = createUser;

/**
 * Rate limiting helper - checks login attempts
 * Limits to 5 attempts per minute per email
 */
const checkRateLimit = (email) => {
  const attempts = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS) || '{}');
  const now = Date.now();
  const userAttempts = attempts[email] || { count: 0, firstAttempt: now };
  
  // Reset if more than 1 minute has passed
  if (now - userAttempts.firstAttempt > 60000) {
    delete attempts[email];
    localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(attempts));
    return true;
  }
  
  // Check if exceeded 5 attempts
  if (userAttempts.count >= 5) {
    const timeLeft = Math.ceil((60000 - (now - userAttempts.firstAttempt)) / 1000);
    throw new Error(`Too many login attempts. Please try again in ${timeLeft} seconds`);
  }
  
  return true;
};

/**
 * Record login attempt
 */
const recordLoginAttempt = (email, success) => {
  const attempts = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS) || '{}');
  const now = Date.now();
  
  if (success) {
    // Clear attempts on successful login
    delete attempts[email];
  } else {
    // Increment failed attempts
    if (!attempts[email]) {
      attempts[email] = { count: 1, firstAttempt: now };
    } else {
      attempts[email].count++;
    }
  }
  
  localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(attempts));
};

/**
 * Login
 */
export const login = (email, password) => {
  // Check rate limiting (5 attempts per minute)
  checkRateLimit(email);
  
  const user = getUserByEmail(email);
  
  if (!user) {
    recordLoginAttempt(email, false);
    throw new Error('Invalid email or password');
  }
  
  // In production: use bcrypt.compare(password, user.passwordHash)
  if (user.password !== password) {
    recordLoginAttempt(email, false);
    throw new Error('Invalid email or password');
  }
  
  if (!user.isActive) {
    recordLoginAttempt(email, false);
    throw new Error('Your account has been deactivated. Please contact admin.');
  }
  
  // Generate "token" (simplified for localStorage)
  // In production: use JWT with 7-day expiry and refresh token
  const token = `${user.userId}_${Date.now()}_${Math.random().toString(36).substr(2)}`;
  
  // Store current user and token
  const { password: _, ...userWithoutPassword } = user;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userWithoutPassword));
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  
  // Clear failed attempts
  recordLoginAttempt(email, true);
  
  return {
    user: userWithoutPassword,
    token
  };
};

/**
 * Logout
 */
export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Get current logged-in user
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Check if authenticated
 */
export const isAuthenticated = () => {
  return !!getCurrentUser();
};

// ========================================
// TECHNICIAN OPERATIONS
// ========================================

/**
 * Get all technicians
 */
export const getTechnicians = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.TECHNICIANS) || '[]');
};

/**
 * Get active technicians only
 */
export const getActiveTechnicians = () => {
  return getTechnicians().filter(t => t.isActive);
};

/**
 * Get technician by ID
 */
export const getTechnicianById = (technicianId) => {
  const technicians = getTechnicians();
  return technicians.find(t => t.technicianId === technicianId);
};

/**
 * Get technician by user ID
 */
export const getTechnicianByUserId = (userId) => {
  const technicians = getTechnicians();
  return technicians.find(t => t.userId === userId && t.isActive);
};

/**
 * Create technician
 */
export const createTechnician = (technicianData) => {
  const technicians = getTechnicians();
  
  const newTechnician = {
    technicianId: `TECH_${Date.now()}`,
    userId: technicianData.userId || null,
    name: technicianData.name,
    qualification: technicianData.qualification,
    signatureUrl: technicianData.signatureUrl || null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  technicians.push(newTechnician);
  localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(technicians));
  
  return newTechnician;
};

/**
 * Update technician
 */
export const updateTechnician = (technicianId, updates) => {
  const technicians = getTechnicians();
  const index = technicians.findIndex(t => t.technicianId === technicianId);
  
  if (index === -1) {
    throw new Error('Technician not found');
  }
  
  technicians[index] = {
    ...technicians[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(technicians));
  return technicians[index];
};

/**
 * Deactivate technician
 */
export const deactivateTechnician = (technicianId) => {
  return updateTechnician(technicianId, { isActive: false });
};

/**
 * Upload signature (Base64)
 */
export const uploadSignature = (file) => {
  return new Promise((resolve, reject) => {
    // Validate file
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      reject(new Error('Only PNG and JPEG files are allowed'));
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('File size must be less than 2MB'));
      return;
    }
    
    // Convert to Base64
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize default users and technicians
 */
export const initializeAuthData = () => {
  // Create default admin if no users exist
  if (getUsers().length === 0) {
    const adminUser = {
      userId: 'USER_ADMIN_1',
      email: 'admin@thyrocare.com',
      password: 'admin123',
      fullName: 'Admin User',
      phone: '7356865161',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const staffUser = {
      userId: 'USER_STAFF_1',
      email: 'staff@thyrocare.com',
      password: 'staff123',
      fullName: 'Staff User',
      phone: '9876543210',
      role: 'staff',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([adminUser, staffUser]));
  }
  
  // Create default technician if none exist
  if (getTechnicians().length === 0) {
    const defaultTech = {
      technicianId: 'TECH_DEFAULT_1',
      userId: 'USER_STAFF_1',
      name: 'Staff User',
      qualification: 'Lab Technician',
      signatureUrl: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify([defaultTech]));
  }
};

export default {
  // Users
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  addUser,
  updateUser,
  deactivateUser,
  deleteUser,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  
  // Technicians
  getTechnicians,
  getActiveTechnicians,
  getTechnicianById,
  getTechnicianByUserId,
  createTechnician,
  updateTechnician,
  deactivateTechnician,
  uploadSignature,
  
  // Init
  initializeAuthData
};
