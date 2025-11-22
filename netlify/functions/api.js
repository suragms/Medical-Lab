import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';

const app = express();
const router = express.Router();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// In-memory storage (will be replaced with proper DB)
let dataStore = {
  patients: [],
  testResults: [],
  financialRecords: { revenue: [], expenses: [] },
  activities: [],
  settings: {},
  users: []
};

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== PATIENTS =====
router.get('/patients', (req, res) => {
  res.json({ success: true, data: dataStore.patients });
});

router.post('/patients', (req, res) => {
  const patient = { ...req.body, id: req.body.id || Date.now().toString() };
  dataStore.patients.unshift(patient);
  res.json({ success: true, data: patient });
});

router.put('/patients/:id', (req, res) => {
  const { id } = req.params;
  const index = dataStore.patients.findIndex(p => p.id === id);
  if (index !== -1) {
    dataStore.patients[index] = { ...dataStore.patients[index], ...req.body };
    res.json({ success: true, data: dataStore.patients[index] });
  } else {
    res.status(404).json({ success: false, error: 'Patient not found' });
  }
});

router.delete('/patients/:id', (req, res) => {
  const { id } = req.params;
  dataStore.patients = dataStore.patients.filter(p => p.id !== id);
  res.json({ success: true });
});

// ===== TEST RESULTS =====
router.get('/results', (req, res) => {
  const { patientId } = req.query;
  let results = dataStore.testResults;
  if (patientId) {
    results = results.filter(r => r.patientId === patientId);
  }
  res.json({ success: true, data: results });
});

router.post('/results', (req, res) => {
  const result = { ...req.body, id: req.body.id || Date.now().toString() };
  dataStore.testResults.push(result);
  res.json({ success: true, data: result });
});

router.put('/results/:id', (req, res) => {
  const { id } = req.params;
  const index = dataStore.testResults.findIndex(r => r.id === id);
  if (index !== -1) {
    dataStore.testResults[index] = { ...dataStore.testResults[index], ...req.body };
    res.json({ success: true, data: dataStore.testResults[index] });
  } else {
    res.status(404).json({ success: false, error: 'Result not found' });
  }
});

// ===== FINANCIAL =====
router.get('/financial/revenue', (req, res) => {
  res.json({ success: true, data: dataStore.financialRecords.revenue });
});

router.post('/financial/revenue', (req, res) => {
  const record = { ...req.body, id: req.body.id || Date.now().toString() };
  dataStore.financialRecords.revenue.push(record);
  res.json({ success: true, data: record });
});

router.get('/financial/expenses', (req, res) => {
  res.json({ success: true, data: dataStore.financialRecords.expenses });
});

router.post('/financial/expenses', (req, res) => {
  const record = { ...req.body, id: req.body.id || Date.now().toString() };
  dataStore.financialRecords.expenses.push(record);
  res.json({ success: true, data: record });
});

router.put('/financial/expenses/:id', (req, res) => {
  const { id } = req.params;
  const index = dataStore.financialRecords.expenses.findIndex(e => e.id === id);
  if (index !== -1) {
    dataStore.financialRecords.expenses[index] = { ...dataStore.financialRecords.expenses[index], ...req.body };
    res.json({ success: true, data: dataStore.financialRecords.expenses[index] });
  } else {
    res.status(404).json({ success: false, error: 'Expense not found' });
  }
});

router.delete('/financial/expenses/:id', (req, res) => {
  const { id } = req.params;
  dataStore.financialRecords.expenses = dataStore.financialRecords.expenses.filter(e => e.id !== id);
  res.json({ success: true });
});

// ===== ACTIVITIES =====
router.get('/activities', (req, res) => {
  const { staffId, patientId } = req.query;
  let activities = dataStore.activities;
  if (staffId) {
    activities = activities.filter(a => a.staffId === staffId);
  }
  if (patientId) {
    activities = activities.filter(a => a.patientId === patientId);
  }
  res.json({ success: true, data: activities });
});

router.post('/activities', (req, res) => {
  const activity = { ...req.body, id: req.body.id || Date.now().toString() };
  dataStore.activities.push(activity);
  res.json({ success: true, data: activity });
});

// ===== SETTINGS =====
router.get('/settings', (req, res) => {
  res.json({ success: true, data: dataStore.settings });
});

router.put('/settings', (req, res) => {
  dataStore.settings = { ...dataStore.settings, ...req.body };
  res.json({ success: true, data: dataStore.settings });
});

// ===== USERS (AUTH) =====
router.get('/users', (req, res) => {
  res.json({ success: true, data: dataStore.users });
});

router.post('/users', (req, res) => {
  const user = { ...req.body, id: req.body.id || Date.now().toString() };
  dataStore.users.push(user);
  res.json({ success: true, data: user });
});

// Bulk data sync endpoint
router.post('/sync', (req, res) => {
  const { patients, testResults, financialRecords, activities, settings, users } = req.body;
  if (patients) dataStore.patients = patients;
  if (testResults) dataStore.testResults = testResults;
  if (financialRecords) dataStore.financialRecords = financialRecords;
  if (activities) dataStore.activities = activities;
  if (settings) dataStore.settings = settings;
  if (users) dataStore.users = users;
  res.json({ success: true, message: 'Data synced successfully' });
});

router.get('/sync', (req, res) => {
  res.json({ success: true, data: dataStore });
});

app.use('/api', router);

export const handler = serverless(app);
