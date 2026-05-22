import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import { connectDB } from './lib/db';
import {
  Patient, Visit, Result, Invoice, Settings, AuditLog, Profile, TestMaster,
  FinancialExpense, FinancialCategory, FinancialReminder
} from './lib/models';

const app = express();
const router = express.Router();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Connect to DB for every request (serverless)
app.use(async (req, res, next) => {
  req.dbConnected = await connectDB();
  next();
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: req.dbConnected ? 'connected' : 'not configured'
  });
});

// ===== SYNC (Load all data) =====
router.get('/sync', async (req, res) => {
  try {
    // If DB not connected, return empty data
    if (!req.dbConnected) {
      return res.json({
        success: true,
        data: {
          patients: [],
          visits: [],
          results: [],
          invoices: [],
          settings: {},
          auditLogs: [],
          profiles: [],
          testsMaster: []
        },
        message: 'Database not configured - using local storage only'
      });
    }

    const [patients, visits, results, invoices, settings, auditLogs, profiles, testsMaster, financialExpenses, financialCategories, financialReminders] = await Promise.all([
      Patient.find({}),
      Visit.find({}),
      Result.find({}),
      Invoice.find({}),
      Settings.findOne({}),
      AuditLog.find({}),
      Profile.find({}),
      TestMaster.find({}),
      FinancialExpense.find({}),
      FinancialCategory.find({}),
      FinancialReminder.find({})
    ]);

    res.json({
      success: true,
      data: {
        patients,
        visits,
        results,
        invoices,
        settings: settings || {},
        auditLogs,
        profiles,
        testsMaster,
        financialExpenses,
        financialCategories,
        financialReminders
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /sync - Bulk upload data from client
router.post('/sync', async (req, res) => {
  try {
    if (!req.dbConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        code: 'DB_OFFLINE'
      });
    }

    const { patients, visits, results, invoices, settings, profiles, testsMaster, auditLogs, financialExpenses, financialCategories, financialReminders } = req.body;

    // Bulk insert/update data
    if (patients && patients.length > 0) {
      await Promise.all(patients.map(p =>
        Patient.findOneAndUpdate({ patientId: p.patientId }, p, { upsert: true, new: true })
      ));
    }

    if (visits && visits.length > 0) {
      await Promise.all(visits.map(v =>
        Visit.findOneAndUpdate({ visitId: v.visitId }, v, { upsert: true, new: true })
      ));
    }

    if (results && results.length > 0) {
      await Promise.all(results.map(r =>
        Result.findOneAndUpdate({ visitId: r.visitId }, r, { upsert: true, new: true })
      ));
    }

    if (invoices && invoices.length > 0) {
      await Promise.all(invoices.map(i =>
        Invoice.findOneAndUpdate({ invoiceId: i.invoiceId }, i, { upsert: true, new: true })
      ));
    }

    if (profiles && profiles.length > 0) {
      await Promise.all(profiles.map(p =>
        Profile.findOneAndUpdate({ profileId: p.profileId }, p, { upsert: true, new: true })
      ));
    }

    if (testsMaster && testsMaster.length > 0) {
      await Promise.all(testsMaster.map(t =>
        TestMaster.findOneAndUpdate({ testId: t.testId }, t, { upsert: true, new: true })
      ));
    }

    if (settings) {
      await Settings.findOneAndUpdate({}, settings, { upsert: true, new: true });
    }

    if (auditLogs && auditLogs.length > 0) {
      await Promise.all(auditLogs.map(log =>
        AuditLog.findOneAndUpdate({ logId: log.logId }, log, { upsert: true, new: true })
      ));
    }

    if (financialExpenses && financialExpenses.length > 0) {
      await Promise.all(financialExpenses.map(expense =>
        FinancialExpense.findOneAndUpdate({ expenseId: expense.expenseId }, expense, { upsert: true, new: true })
      ));
    }

    if (financialCategories && financialCategories.length > 0) {
      await Promise.all(financialCategories.map(category =>
        FinancialCategory.findOneAndUpdate({ categoryId: category.categoryId }, category, { upsert: true, new: true })
      ));
    }

    if (financialReminders && financialReminders.length > 0) {
      await Promise.all(financialReminders.map(reminder =>
        FinancialReminder.findOneAndUpdate({ reminderId: reminder.reminderId }, reminder, { upsert: true, new: true })
      ));
    }

    res.json({ success: true, message: 'Data synced successfully' });
  } catch (error) {
    console.error('Bulk sync error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== PATIENTS =====
router.get('/patients', async (req, res) => {
  try {
    const patients = await Patient.find({});
    res.json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/patients', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findOneAndUpdate({ patientId: id }, req.body, { new: true });
    if (patient) {
      res.json({ success: true, data: patient });
    } else {
      res.status(404).json({ success: false, error: 'Patient not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find all visits for this patient
    const patientVisits = await Visit.find({ patientId: id });
    const visitIds = patientVisits.map(v => v.visitId);

    // Delete patient
    await Patient.findOneAndDelete({ patientId: id });

    // Delete all associated visits
    await Visit.deleteMany({ patientId: id });

    // Delete all results for these visits
    await Result.deleteMany({ visitId: { $in: visitIds } });

    // Delete all invoices for these visits
    await Invoice.deleteMany({ visitId: { $in: visitIds } });

    res.json({ success: true, message: 'Patient and all associated data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== VISITS =====
router.get('/visits', async (req, res) => {
  try {
    const visits = await Visit.find({});
    res.json({ success: true, data: visits });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/visits', async (req, res) => {
  try {
    const visit = new Visit(req.body);
    await visit.save();
    res.json({ success: true, data: visit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/visits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await Visit.findOneAndUpdate({ visitId: id }, req.body, { new: true });
    res.json({ success: true, data: visit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== RESULTS =====
router.post('/results', async (req, res) => {
  try {
    // Check if result exists for this visit
    const existing = await Result.findOne({ visitId: req.body.visitId });
    if (existing) {
      const updated = await Result.findOneAndUpdate({ visitId: req.body.visitId }, req.body, { new: true });
      res.json({ success: true, data: updated });
    } else {
      const result = new Result(req.body);
      await result.save();
      res.json({ success: true, data: result });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== INVOICES =====
router.post('/invoices', async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== SETTINGS =====
router.put('/settings', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== PROFILES & TESTS =====
router.post('/profiles', async (req, res) => {
  try {
    const profile = new Profile(req.body);
    await profile.save();
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tests', async (req, res) => {
  try {
    const test = new TestMaster(req.body);
    await test.save();
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mount router on multiple paths to handle different Netlify routing scenarios
app.use('/', router);
app.use('/api', router);
app.use('/.netlify/functions/api', router);

export const handler = serverless(app);
