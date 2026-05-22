// Backend API Server for Medical Lab App
// This connects to MongoDB and provides REST API for all 3 devices

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-lab';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ========================================
// MONGOOSE SCHEMAS
// ========================================

// Patient Schema
const patientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  address: String,
  referredBy: String,
  createdAt: { type: Date, default: Date.now },
  created_by_user_id: String,
}, { timestamps: true });

// Visit Schema
const visitSchema = new mongoose.Schema({
  visitId: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  profileId: String,
  tests: [mongoose.Schema.Types.Mixed],
  status: { type: String, default: 'tests_selected' },
  collectedAt: Date,
  receivedAt: Date,
  reportedAt: Date,
  sampleType: String,
  collectedBy: String,
  notes: String,
  totalAmount: Number,
  finalAmount: Number,
  discount: Number,
  paymentStatus: { type: String, default: 'unpaid' },
  paymentMethod: String,
  paidAt: Date,
  pdfGenerated: { type: Boolean, default: false },
  invoiceGenerated: { type: Boolean, default: false },
  signing_technician_id: String,
  result_entered_by_user_id: String,
  created_by_user_id: String,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Profile Schema (Test Packages)
const profileSchema = new mongoose.Schema({
  profileId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  tests: [mongoose.Schema.Types.Mixed],
  packagePrice: Number,
  price: Number,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// User Schema
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  email: String,
  phone: String,
  role: { type: String, default: 'staff' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Expense Schema
const expenseSchema = new mongoose.Schema({
  expenseId: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: String,
  date: { type: Date, default: Date.now },
  created_by_user_id: String,
}, { timestamps: true });

// Settings Schema
const settingsSchema = new mongoose.Schema({
  settingKey: { type: String, required: true, unique: true },
  settingValue: mongoose.Schema.Types.Mixed,
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Models
const Patient = mongoose.model('Patient', patientSchema);
const Visit = mongoose.model('Visit', visitSchema);
const Profile = mongoose.model('Profile', profileSchema);
const User = mongoose.model('User', userSchema);
const Expense = mongoose.model('Expense', expenseSchema);
const Settings = mongoose.model('Settings', settingsSchema);

// ========================================
// API ROUTES
// ========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Medical Lab API is running', timestamp: new Date() });
});

// ========================================
// PATIENTS API
// ========================================

// Get all patients
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient by ID
app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.id });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create patient
app.post('/api/patients', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update patient
app.put('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { patientId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete patient
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ patientId: req.params.id });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    
    // Also delete all visits for this patient
    await Visit.deleteMany({ patientId: req.params.id });
    
    res.json({ message: 'Patient and related visits deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// VISITS API
// ========================================

// Get all visits
app.get('/api/visits', async (req, res) => {
  try {
    const visits = await Visit.find().sort({ createdAt: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get visit by ID
app.get('/api/visits/:id', async (req, res) => {
  try {
    const visit = await Visit.findOne({ visitId: req.params.id });
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    res.json(visit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create visit
app.post('/api/visits', async (req, res) => {
  try {
    const visit = new Visit(req.body);
    await visit.save();
    res.status(201).json(visit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update visit
app.put('/api/visits/:id', async (req, res) => {
  try {
    const visit = await Visit.findOneAndUpdate(
      { visitId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    res.json(visit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ========================================
// PROFILES API
// ========================================

// Get all profiles
app.get('/api/profiles', async (req, res) => {
  try {
    const profiles = await Profile.find().sort({ name: 1 });
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get profile by ID
app.get('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ profileId: req.params.id });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create profile
app.post('/api/profiles', async (req, res) => {
  try {
    const profile = new Profile(req.body);
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update profile
app.put('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { profileId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete profile
app.delete('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findOneAndDelete({ profileId: req.params.id });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({ message: 'Profile deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// USERS API
// ========================================

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { userId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reset password
app.post('/api/users/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findOneAndUpdate(
      { userId: req.params.id },
      { password: newPassword },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ userId: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// EXPENSES API
// ========================================

// Get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create expense
app.post('/api/expenses', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { expenseId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ expenseId: req.params.id });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// SETTINGS API
// ========================================

// Get all settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.find();
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.settingKey] = s.settingValue;
    });
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
app.put('/api/settings', async (req, res) => {
  try {
    const updates = req.body;
    const results = [];
    
    for (const [key, value] of Object.entries(updates)) {
      const setting = await Settings.findOneAndUpdate(
        { settingKey: key },
        { settingValue: value, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      results.push(setting);
    }
    
    res.json({ message: 'Settings updated', count: results.length });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ========================================
// INITIALIZE DEFAULT DATA
// ========================================

// Create default admin user if no users exist
async function initializeDefaultData() {
  try {
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      console.log('📝 Creating default admin user...');
      const defaultAdmin = new User({
        userId: 'admin-001',
        username: 'admin',
        password: 'admin123',
        fullName: 'System Administrator',
        email: 'admin@medicallab.com',
        role: 'admin',
        isActive: true
      });
      await defaultAdmin.save();
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    }
  } catch (error) {
    console.error('❌ Error initializing default data:', error);
  }
}

// ========================================
// START SERVER
// ========================================

app.listen(PORT, async () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at: http://localhost:${PORT}/api`);
  console.log(`🏥 Medical Lab Backend Ready!`);
  
  // Initialize default data
  await initializeDefaultData();
});
