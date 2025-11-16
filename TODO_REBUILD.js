// HEALIT MED LABORATORIES - REBUILD TO-DO LIST
// Critical 25 Tasks for Complete Medical Lab System

export const TODO_LIST = [
  {
    id: 1,
    title: 'Fix AddPatient.jsx - Update to use new profile system',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    description: 'Replace TEST_PACKAGES with getAllProfiles(), add address field, use testProfile instead of testPackage'
  },
  {
    id: 2,
    title: 'Create Result Entry Page - PDF-Style Live UI',
    priority: 'CRITICAL',
    status: 'PENDING',
    description: 'Build table UI with test name, value input, unit, reference range. Auto-detect HIGH/LOW values with color coding'
  },
  {
    id: 3,
    title: 'Implement Result Snapshot System',
    priority: 'CRITICAL',
    status: 'PENDING',
    description: 'When saving results, create snapshot of test data + reference values so old reports stay accurate when admin changes references'
  },
  {
    id: 4,
    title: 'Add Timestamp Management',
    priority: 'CRITICAL',
    status: 'PENDING',
    description: 'Add collectedAt, receivedAt, reportedAt timestamps. Auto-generate, admin can edit'
  },
  {
    id: 5,
    title: 'Build PDF Generation with HEALit + Thyrocare Logos',
    priority: 'CRITICAL',
    status: 'PENDING',
    description: 'Professional PDF template with both logos, patient info, test results table, timestamps, color-coded values'
  },
  {
    id: 6,
    title: 'Create Test Master Management Page (Admin Only)',
    priority: 'HIGH',
    status: 'PENDING',
    description: 'Admin page to view all tests, add new tests, edit units/references, activate/deactivate tests'
  },
  {
    id: 7,
    title: 'Build Profile Manager (Admin Only)',
    priority: 'HIGH',
    status: 'PENDING',
    description: 'Admin can add/remove tests from profiles, drag-drop reorder, save profile changes'
  },
  {
    id: 8,
    title: 'Implement Auto High/Low Detection',
    priority: 'HIGH',
    status: 'PENDING',
    description: 'Compare test values against reference ranges, return HIGH (red), LOW (blue), or NORMAL (black)'
  },
  {
    id: 9,
    title: 'Add Dropdown/Text Input Support',
    priority: 'HIGH',
    status: 'PENDING',
    description: 'For urine tests: dropdowns for Protein, Glucose, Ketone. Text inputs for Colour, Appearance, Casts, Crystals'
  },
  {
    id: 10,
    title: 'Build Staff Dashboard',
    priority: 'HIGH',
    status: 'PENDING',
    description: 'Show Add Patient, Pending Patients, Completed Reports, Today Count. Simple, fast, staff-friendly'
  },
  {
    id: 11,
    title: 'Build Admin Dashboard',
    priority: 'HIGH',
    status: 'PENDING',
    description: 'Total patients, revenue, expenses, profit/loss, most used profile, staff activity. Full analytics'
  },
  {
    id: 12,
    title: 'Create Expense Manager (Admin Only)',
    priority: 'MEDIUM',
    status: 'PENDING',
    description: 'Add expense with category, amount, date, notes. Monthly summary, charts, profit calculation'
  },
  {
    id: 13,
    title: 'Implement User Management (Admin Only)',
    priority: 'MEDIUM',
    status: 'PENDING',
    description: 'Add staff users, assign roles, password reset, deactivate users'
  },
  {
    id: 14,
    title: 'Add Gender-Specific Reference Ranges',
    priority: 'MEDIUM',
    status: 'COMPLETE',
    description: 'Test master supports male/female ranges. Use correct range based on patient gender in validation'
  },
  {
    id: 15,
    title: 'Build Patient Management with Search/Filter',
    priority: 'MEDIUM',
    status: 'PENDING',
    description: 'View all patients, search by name/phone, filter by date, edit patient details, regenerate PDF'
  },
  {
    id: 16,
    title: 'Create Settings Page',
    priority: 'MEDIUM',
    status: 'PENDING',
    description: 'Lab details, logos upload, PDF header setup, address/contact, report footer text'
  },
  {
    id: 17,
    title: 'Implement Calculated Tests (TC/HDL, LDL/HDL)',
    priority: 'MEDIUM',
    status: 'PENDING',
    description: 'Auto-calculate ratio tests based on formula. Display in results, save in snapshot'
  },
  {
    id: 18,
    title: 'Add WhatsApp Share Functionality',
    priority: 'MEDIUM',
    status: 'PENDING',
    description: 'Use Web Share API to share PDF via WhatsApp. Free, no API needed'
  },
  {
    id: 19,
    title: 'Add Email Share via SMTP',
    priority: 'MEDIUM',
    status: 'PENDING',
    description: 'Send PDF report via email using Nodemailer + Gmail SMTP'
  },
  {
    id: 20,
    title: 'Build Print Functionality',
    priority: 'MEDIUM',
    status: 'PENDING',
    description: 'Print-optimized CSS, proper page breaks, professional layout'
  },
  {
    id: 21,
    title: 'Create Audit Log System',
    priority: 'LOW',
    status: 'PENDING',
    description: 'Log all admin actions: test edits, profile changes, user management, expense edits'
  },
  {
    id: 22,
    title: 'Add Revenue Tracking & Charts',
    priority: 'LOW',
    status: 'PENDING',
    description: 'Auto-capture revenue from test profiles, show daily/weekly/monthly charts using Recharts'
  },
  {
    id: 23,
    title: 'Implement Backup & Restore',
    priority: 'LOW',
    status: 'PENDING',
    description: 'Download complete database backup, restore from backup file'
  },
  {
    id: 24,
    title: 'Add Export to Excel/CSV',
    priority: 'LOW',
    status: 'PENDING',
    description: 'Export patient list, test results, financial data with date range filter'
  },
  {
    id: 25,
    title: 'Upload and Configure Lab Logos',
    priority: 'HIGH',
    status: 'PENDING',
    description: 'Upload HEALit logo (left), Thyrocare logo (right) for PDF header. Store in images folder, use in PDF template'
  }
];

// Implementation Priority Order
export const IMPLEMENTATION_PHASES = {
  PHASE_1_CRITICAL: [1, 2, 3, 4, 5],  // Core workflow - Results entry & PDF
  PHASE_2_HIGH: [6, 7, 8, 9, 10, 11, 25],  // Admin features & dashboards
  PHASE_3_MEDIUM: [12, 13, 15, 16, 17, 18, 19, 20],  // Additional features
  PHASE_4_LOW: [21, 22, 23, 24]  // Nice-to-have features
};

// File Status
export const REBUILD_STATUS = {
  COMPLETED: [
    'src/data/testMaster.js - Complete medical test database with 6 profiles',
    'Test validation functions - HIGH/LOW detection ready',
    'Gender-specific reference ranges - Built into test master'
  ],
  IN_PROGRESS: [
    'src/pages/Patients/AddPatient.jsx - Needs fixing for new profile system'
  ],
  PENDING: [
    'src/pages/Results/EnterResults.jsx - Build from scratch',
    'src/pages/Dashboard/StaffDashboard.jsx - New file needed',
    'src/pages/Dashboard/AdminDashboard.jsx - Rebuild existing',
    'src/pages/Admin/TestMaster.jsx - New file needed',
    'src/pages/Admin/ProfileManager.jsx - New file needed',
    'src/pages/Admin/ExpenseManager.jsx - New file needed',
    'src/pages/Admin/UserManager.jsx - New file needed',
    'src/utils/pdfGenerator.js - New file needed',
    'src/utils/shareUtils.js - New file needed'
  ]
};
