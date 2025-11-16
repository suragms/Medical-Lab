// HEALit Med Laboratories - Complete Test Master Database
// This is the core medical test database for the lab

export const TEST_TYPES = {
  NUMBER: 'number',
  TEXT: 'text',
  DROPDOWN: 'dropdown',
  MICROSCOPY_NUMBER: 'microscopy_number',
  CALCULATED: 'calculated'
};

export const TEST_CATEGORIES = {
  KIDNEY: 'KIDNEY FUNCTION TEST',
  LIVER: 'LIVER FUNCTION TEST',
  LIPID: 'LIPID PROFILE',
  DIABETES: 'DIABETES PROFILE',
  URINE: 'URINE ROUTINE EXAMINATION',
  SUGAR: 'SUGAR PROFILE'
};

export const PROFILES = {
  KIDNEY: 'kidney',
  LIVER: 'liver',
  LIPID: 'lipid',
  DIABETES: 'diabetes',
  URINE: 'urine',
  SUGAR: 'sugar'
};

// Complete Test Master - All medical tests
export const TEST_MASTER = [
  // KIDNEY FUNCTION TESTS
  {
    id: 'KFT001',
    name: 'Creatinine',
    category: TEST_CATEGORIES.KIDNEY,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 0.6,
    refHigh: 1.2,
    referenceText: '0.6 - 1.2',
    genderSpecific: true,
    maleRange: { low: 0.7, high: 1.3, text: '0.7 - 1.3' },
    femaleRange: { low: 0.6, high: 1.1, text: '0.6 - 1.1' },
    order: 1,
    active: true
  },
  {
    id: 'KFT002',
    name: 'Urea',
    category: TEST_CATEGORIES.KIDNEY,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 10,
    refHigh: 45,
    referenceText: '10 - 45',
    order: 2,
    active: true
  },
  {
    id: 'KFT003',
    name: 'Uric Acid',
    category: TEST_CATEGORIES.KIDNEY,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 3.4,
    refHigh: 7.0,
    referenceText: '3.4 - 7.0',
    genderSpecific: true,
    maleRange: { low: 3.4, high: 7.0, text: '3.4 - 7.0' },
    femaleRange: { low: 2.4, high: 6.0, text: '2.4 - 6.0' },
    order: 3,
    active: true
  },
  {
    id: 'KFT004',
    name: 'Calcium',
    category: TEST_CATEGORIES.KIDNEY,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 8.5,
    refHigh: 10.5,
    referenceText: '8.5 - 10.5',
    order: 4,
    active: true
  },
  {
    id: 'KFT005',
    name: 'BUN (Blood Urea Nitrogen)',
    category: TEST_CATEGORIES.KIDNEY,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 7,
    refHigh: 20,
    referenceText: '7 - 20',
    order: 5,
    active: true
  },
  {
    id: 'KFT006',
    name: 'eGFR',
    category: TEST_CATEGORIES.KIDNEY,
    type: TEST_TYPES.NUMBER,
    unit: 'mL/min/1.73m²',
    refLow: 90,
    refHigh: 120,
    referenceText: '>90',
    order: 6,
    active: true
  },

  // LIVER FUNCTION TESTS
  {
    id: 'LFT001',
    name: 'SGOT (AST)',
    category: TEST_CATEGORIES.LIVER,
    type: TEST_TYPES.NUMBER,
    unit: 'U/L',
    refLow: 0,
    refHigh: 40,
    referenceText: 'Up to 40',
    order: 1,
    active: true
  },
  {
    id: 'LFT002',
    name: 'SGPT (ALT)',
    category: TEST_CATEGORIES.LIVER,
    type: TEST_TYPES.NUMBER,
    unit: 'U/L',
    refLow: 0,
    refHigh: 41,
    referenceText: 'Up to 41',
    order: 2,
    active: true
  },
  {
    id: 'LFT003',
    name: 'ALP (Alkaline Phosphatase)',
    category: TEST_CATEGORIES.LIVER,
    type: TEST_TYPES.NUMBER,
    unit: 'U/L',
    refLow: 30,
    refHigh: 120,
    referenceText: '30 - 120',
    order: 3,
    active: true
  },
  {
    id: 'LFT004',
    name: 'Total Bilirubin',
    category: TEST_CATEGORIES.LIVER,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 0.3,
    refHigh: 1.2,
    referenceText: '0.3 - 1.2',
    order: 4,
    active: true
  },
  {
    id: 'LFT005',
    name: 'Direct Bilirubin',
    category: TEST_CATEGORIES.LIVER,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 0,
    refHigh: 0.3,
    referenceText: '0 - 0.3',
    order: 5,
    active: true
  },
  {
    id: 'LFT006',
    name: 'Total Protein',
    category: TEST_CATEGORIES.LIVER,
    type: TEST_TYPES.NUMBER,
    unit: 'g/dL',
    refLow: 6.0,
    refHigh: 8.3,
    referenceText: '6.0 - 8.3',
    order: 6,
    active: true
  },
  {
    id: 'LFT007',
    name: 'Albumin',
    category: TEST_CATEGORIES.LIVER,
    type: TEST_TYPES.NUMBER,
    unit: 'g/dL',
    refLow: 3.5,
    refHigh: 5.0,
    referenceText: '3.5 - 5.0',
    order: 7,
    active: true
  },
  {
    id: 'LFT008',
    name: 'A/G Ratio',
    category: TEST_CATEGORIES.LIVER,
    type: TEST_TYPES.NUMBER,
    unit: 'ratio',
    refLow: 0.9,
    refHigh: 2.0,
    referenceText: '0.9 - 2.0',
    order: 8,
    active: true
  },

  // LIPID PROFILE
  {
    id: 'LIP001',
    name: 'Total Cholesterol',
    category: TEST_CATEGORIES.LIPID,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 0,
    refHigh: 200,
    referenceText: 'Up to 200',
    order: 1,
    active: true
  },
  {
    id: 'LIP002',
    name: 'HDL Cholesterol',
    category: TEST_CATEGORIES.LIPID,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 40,
    refHigh: 60,
    referenceText: '40 - 60',
    genderSpecific: true,
    maleRange: { low: 35, high: 55, text: '35 - 55' },
    femaleRange: { low: 45, high: 65, text: '45 - 65' },
    order: 2,
    active: true
  },
  {
    id: 'LIP003',
    name: 'LDL Cholesterol',
    category: TEST_CATEGORIES.LIPID,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 0,
    refHigh: 100,
    referenceText: 'Up to 100',
    order: 3,
    active: true
  },
  {
    id: 'LIP004',
    name: 'VLDL',
    category: TEST_CATEGORIES.LIPID,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 15,
    refHigh: 35,
    referenceText: '15 - 35',
    order: 4,
    active: true
  },
  {
    id: 'LIP005',
    name: 'Triglycerides',
    category: TEST_CATEGORIES.LIPID,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 60,
    refHigh: 150,
    referenceText: '60 - 150',
    order: 5,
    active: true
  },
  {
    id: 'LIP006',
    name: 'TC/HDL Ratio',
    category: TEST_CATEGORIES.LIPID,
    type: TEST_TYPES.CALCULATED,
    unit: 'ratio',
    refLow: 0,
    refHigh: 4.5,
    referenceText: 'Up to 4.5',
    formula: 'LIP001 / LIP002',
    order: 6,
    active: true
  },
  {
    id: 'LIP007',
    name: 'LDL/HDL Ratio',
    category: TEST_CATEGORIES.LIPID,
    type: TEST_TYPES.CALCULATED,
    unit: 'ratio',
    refLow: 0,
    refHigh: 3.0,
    referenceText: 'Up to 3.0',
    formula: 'LIP003 / LIP002',
    order: 7,
    active: true
  },
  {
    id: 'LIP008',
    name: 'Non-HDL Cholesterol',
    category: TEST_CATEGORIES.LIPID,
    type: TEST_TYPES.CALCULATED,
    unit: 'mg/dL',
    refLow: 0,
    refHigh: 130,
    referenceText: 'Up to 130',
    formula: 'LIP001 - LIP002',
    order: 8,
    active: true
  },

  // DIABETES PROFILE
  {
    id: 'DIA001',
    name: 'FBS (Fasting Blood Sugar)',
    category: TEST_CATEGORIES.DIABETES,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 70,
    refHigh: 110,
    referenceText: '70 - 110',
    order: 1,
    active: true
  },
  {
    id: 'DIA002',
    name: 'RBS (Random Blood Sugar)',
    category: TEST_CATEGORIES.DIABETES,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 70,
    refHigh: 140,
    referenceText: '70 - 140',
    order: 2,
    active: true
  },
  {
    id: 'DIA003',
    name: 'PPBS (Post Prandial Blood Sugar)',
    category: TEST_CATEGORIES.DIABETES,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 0,
    refHigh: 140,
    referenceText: 'Up to 140',
    order: 3,
    active: true
  },
  {
    id: 'DIA004',
    name: 'HbA1c',
    category: TEST_CATEGORIES.DIABETES,
    type: TEST_TYPES.NUMBER,
    unit: '%',
    refLow: 4.0,
    refHigh: 5.7,
    referenceText: '4.0 - 5.7',
    order: 4,
    active: true
  },

  // URINE ROUTINE EXAMINATION
  {
    id: 'URI001',
    name: 'Colour',
    category: TEST_CATEGORIES.URINE,
    type: TEST_TYPES.TEXT,
    unit: '',
    referenceText: 'Pale Yellow',
    order: 1,
    active: true
  },
  {
    id: 'URI002',
    name: 'Appearance',
    category: TEST_CATEGORIES.URINE,
    type: TEST_TYPES.TEXT,
    unit: '',
    referenceText: 'Clear',
    order: 2,
    active: true
  },
  {
    id: 'URI003',
    name: 'pH',
    category: TEST_CATEGORIES.URINE,
    type: TEST_TYPES.NUMBER,
    unit: '',
    refLow: 5.0,
    refHigh: 7.0,
    referenceText: '5.0 - 7.0',
    order: 3,
    active: true
  },
  {
    id: 'URI004',
    name: 'Specific Gravity',
    category: TEST_CATEGORIES.URINE,
    type: TEST_TYPES.NUMBER,
    unit: '',
    refLow: 1.010,
    refHigh: 1.025,
    referenceText: '1.010 - 1.025',
    order: 4,
    active: true
  },
  {
    id: 'URI005',
    name: 'Protein',
    category: TEST_CATEGORIES.URINE,
    type: TEST_TYPES.DROPDOWN,
    unit: '',
    referenceText: 'Negative',
    dropdownOptions: ['Negative', 'Trace', '1+', '2+', '3+', '4+'],
    order: 5,
    active: true
  },
  {
    id: 'URI006',
    name: 'Glucose',
    category: TEST_CATEGORIES.URINE,
    type: TEST_TYPES.DROPDOWN,
    unit: '',
    referenceText: 'Negative',
    dropdownOptions: ['Negative', 'Trace', '1+', '2+', '3+', '4+'],
    order: 6,
    active: true
  },
  {
    id: 'URI007',
    name: 'Ketone',
    category: TEST_CATEGORIES.URINE,
    type: TEST_TYPES.DROPDOWN,
    unit: '',
    referenceText: 'Negative',
    dropdownOptions: ['Negative', 'Trace', '1+', '2+', '3+'],
    order: 7,
    active: true
  },
  {
    id: 'URI008',
    name: 'Nitrite',
    category: TEST_CATEGORIES.URINE,
    type: TEST_TYPES.DROPDOWN,
    unit: '',
    referenceText: 'Negative',
    dropdownOptions: ['Negative', 'Positive'],
    order: 8,
    active: true
  },
  {
    id: 'URI009',
    name: 'Leukocyte Esterase',
    category: TEST_CATEGORIES.URINE,
    type: TEST_TYPES.DROPDOWN,
    unit: '',
    referenceText: 'Negative',
    dropdownOptions: ['Negative', 'Trace', '1+', '2+', '3+'],
    order: 9,
    active: true
  },
  {
    id: 'URI010',
    name: 'RBC',
    category: TEST_CATEGORIES.URINE,
    type: TEST_TYPES.MICROSCOPY_NUMBER,
    unit: '/HPF',
    refLow: 0,
    refHigh: 2,
    referenceText: '0 - 2 /HPF',
    order: 10,
    active: true
  },
  {
    id: 'URI011',
    name: 'Pus Cells',
    category: TEST_CATEGORIES.URINE,
    type: TEST_TYPES.MICROSCOPY_NUMBER,
    unit: '/HPF',
    refLow: 0,
    refHigh: 5,
    referenceText: '0 - 5 /HPF',
    order: 11,
    active: true
  },
  {
    id: 'URI012',
    name: 'Epithelial Cells',
    category: TEST_CATEGORIES.URINE,
    type: TEST_TYPES.MICROSCOPY_NUMBER,
    unit: '/HPF',
    refLow: 0,
    refHigh: 3,
    referenceText: '0 - 3 /HPF',
    order: 12,
    active: true
  },
  {
    id: 'URI013',
    name: 'Casts',
    category: TEST_CATEGORIES.URINE,
    type: TEST_TYPES.TEXT,
    unit: '',
    referenceText: 'Nil',
    order: 13,
    active: true
  },
  {
    id: 'URI014',
    name: 'Crystals',
    category: TEST_CATEGORIES.URINE,
    type: TEST_TYPES.TEXT,
    unit: '',
    referenceText: 'Nil',
    order: 14,
    active: true
  },

  // SUGAR PROFILE
  {
    id: 'SUG001',
    name: 'FBS (Fasting Blood Sugar)',
    category: TEST_CATEGORIES.SUGAR,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 70,
    refHigh: 110,
    referenceText: '70 - 110',
    order: 1,
    active: true
  },
  {
    id: 'SUG002',
    name: 'RBS (Random Blood Sugar)',
    category: TEST_CATEGORIES.SUGAR,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 70,
    refHigh: 140,
    referenceText: '70 - 140',
    order: 2,
    active: true
  },
  {
    id: 'SUG003',
    name: 'PPBS (Post Prandial Blood Sugar)',
    category: TEST_CATEGORIES.SUGAR,
    type: TEST_TYPES.NUMBER,
    unit: 'mg/dL',
    refLow: 0,
    refHigh: 140,
    referenceText: 'Up to 140',
    order: 3,
    active: true
  }
];

// Profile Definitions
export const PROFILE_DEFINITIONS = {
  kidney: {
    id: PROFILES.KIDNEY,
    name: 'Kidney Function Test',
    shortName: 'KFT',
    tests: ['KFT001', 'KFT002', 'KFT003', 'KFT004', 'KFT005', 'KFT006'],
    price: 500,
    active: true
  },
  liver: {
    id: PROFILES.LIVER,
    name: 'Liver Function Test',
    shortName: 'LFT',
    tests: ['LFT001', 'LFT002', 'LFT003', 'LFT004', 'LFT005', 'LFT006', 'LFT007', 'LFT008'],
    price: 600,
    active: true
  },
  lipid: {
    id: PROFILES.LIPID,
    name: 'Lipid Profile',
    shortName: 'LIPID',
    tests: ['LIP001', 'LIP002', 'LIP003', 'LIP004', 'LIP005', 'LIP006', 'LIP007', 'LIP008'],
    price: 450,
    active: true
  },
  diabetes: {
    id: PROFILES.DIABETES,
    name: 'Diabetes Profile',
    shortName: 'DIABETES',
    tests: ['DIA001', 'DIA002', 'DIA003', 'DIA004'],
    price: 550,
    active: true
  },
  urine: {
    id: PROFILES.URINE,
    name: 'Urine Routine Examination',
    shortName: 'URINE',
    tests: ['URI001', 'URI002', 'URI003', 'URI004', 'URI005', 'URI006', 'URI007', 'URI008', 'URI009', 'URI010', 'URI011', 'URI012', 'URI013', 'URI014'],
    price: 200,
    active: true
  },
  sugar: {
    id: PROFILES.SUGAR,
    name: 'Sugar Profile',
    shortName: 'SUGAR',
    tests: ['SUG001', 'SUG002', 'SUG003'],
    price: 150,
    active: true
  }
};

// Helper Functions
export const getTestById = (testId) => {
  return TEST_MASTER.find(test => test.id === testId);
};

export const getTestsByProfile = (profileId) => {
  const profile = PROFILE_DEFINITIONS[profileId];
  if (!profile) return [];
  
  return profile.tests
    .map(testId => getTestById(testId))
    .filter(test => test && test.active)
    .sort((a, b) => a.order - b.order);
};

export const getTestsByCategory = (category) => {
  return TEST_MASTER
    .filter(test => test.category === category && test.active)
    .sort((a, b) => a.order - b.order);
};

export const getProfileById = (profileId) => {
  return PROFILE_DEFINITIONS[profileId];
};

export const getAllProfiles = () => {
  return Object.values(PROFILE_DEFINITIONS).filter(p => p.active);
};

// Validate test value against reference range
export const validateTestValue = (test, value, gender = null) => {
  if (test.type === TEST_TYPES.TEXT || test.type === TEST_TYPES.DROPDOWN) {
    return { status: 'NORMAL', value };
  }

  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return { status: 'INVALID', value };
  }

  let refLow = test.refLow;
  let refHigh = test.refHigh;

  // Use gender-specific ranges if available
  if (test.genderSpecific && gender) {
    if (gender.toLowerCase() === 'male' && test.maleRange) {
      refLow = test.maleRange.low;
      refHigh = test.maleRange.high;
    } else if (gender.toLowerCase() === 'female' && test.femaleRange) {
      refLow = test.femaleRange.low;
      refHigh = test.femaleRange.high;
    }
  }

  if (numValue < refLow) {
    return { status: 'LOW', value: numValue, refLow, refHigh };
  } else if (numValue > refHigh) {
    return { status: 'HIGH', value: numValue, refLow, refHigh };
  } else {
    return { status: 'NORMAL', value: numValue, refLow, refHigh };
  }
};

// Get reference range text based on gender
export const getReferenceRange = (test, gender = null) => {
  if (test.genderSpecific && gender) {
    if (gender.toLowerCase() === 'male' && test.maleRange) {
      return test.maleRange.text;
    } else if (gender.toLowerCase() === 'female' && test.femaleRange) {
      return test.femaleRange.text;
    }
  }
  return test.referenceText;
};
