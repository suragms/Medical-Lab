// Profile Templates - Real Lab Test Data from PDFs
export const PROFILES = [
  {
    profileId: 'PROF001',
    name: 'Kidney Function Test (KFT)',
    description: 'Complete kidney health assessment',
    packagePrice: 500,
    active: true,
    tests: [
      {
        testId: 'KFT001',
        name: 'BLOOD UREA NITROGEN (BUN)',
        description: 'Kidney function marker',
        unit: 'mg/dL',
        bioReference: '7.94 - 20.07',
        price: 120
      },
      {
        testId: 'KFT002',
        name: 'CREATININE - SERUM',
        description: 'Kidney filtration marker',
        unit: 'mg/dL',
        bioReference: '0.72-1.18',
        price: 130
      },
      {
        testId: 'KFT003',
        name: 'UREA (CALCULATED)',
        description: 'Waste product in blood',
        unit: 'mg/dL',
        bioReference: 'Adult: 17-43',
        price: 100
      },
      {
        testId: 'KFT004',
        name: 'CALCIUM',
        description: 'Blood calcium level',
        unit: 'mg/dL',
        bioReference: '8.8-10.6',
        price: 150
      }
    ]
  },
  {
    profileId: 'PROF002',
    name: 'Liver Function Test (LFT)',
    description: 'Complete liver health assessment',
    packagePrice: 700,
    active: true,
    tests: [
      {
        testId: 'LFT001',
        name: 'ALKALINE PHOSPHATASE',
        description: 'Liver enzyme',
        unit: 'U/L',
        bioReference: '45-129',
        price: 90
      },
      {
        testId: 'LFT002',
        name: 'BILIRUBIN - TOTAL',
        description: 'Liver function & bile flow',
        unit: 'mg/dL',
        bioReference: '0.3-1.2',
        price: 85
      },
      {
        testId: 'LFT003',
        name: 'BILIRUBIN - DIRECT',
        description: 'Direct bilirubin',
        unit: 'mg/dL',
        bioReference: '< 0.3',
        price: 80
      },
      {
        testId: 'LFT004',
        name: 'SGOT (AST)',
        description: 'Liver enzyme',
        unit: 'U/L',
        bioReference: '< 35',
        price: 90
      },
      {
        testId: 'LFT005',
        name: 'SGPT (ALT)',
        description: 'Liver enzyme',
        unit: 'U/L',
        bioReference: '< 45',
        price: 90
      },
      {
        testId: 'LFT006',
        name: 'PROTEIN - TOTAL',
        description: 'Total protein in blood',
        unit: 'gm/dL',
        bioReference: '5.7-8.2',
        price: 85
      },
      {
        testId: 'LFT007',
        name: 'ALBUMIN - SERUM',
        description: 'Main protein in blood',
        unit: 'gm/dL',
        bioReference: '3.2-4.8',
        price: 90
      },
      {
        testId: 'LFT008',
        name: 'GGT',
        description: 'Gamma Glutamyl Transferase',
        unit: 'U/L',
        bioReference: '< 55',
        price: 100
      }
    ]
  },
  {
    profileId: 'PROF003',
    name: 'Lipid Profile',
    description: 'Cholesterol and heart health assessment',
    packagePrice: 600,
    active: true,
    tests: [
      {
        testId: 'LIP001',
        name: 'TOTAL CHOLESTEROL',
        description: 'Total cholesterol in blood',
        unit: 'mg/dL',
        bioReference: '< 200 Desirable, 200-239 Borderline High, >240 High',
        price: 120
      },
      {
        testId: 'LIP002',
        name: 'HDL CHOLESTEROL - DIRECT',
        description: 'Good cholesterol',
        unit: 'mg/dL',
        bioReference: '40-60 (>60 High, <40 Low)',
        price: 130
      },
      {
        testId: 'LIP003',
        name: 'LDL CHOLESTEROL - DIRECT',
        description: 'Bad cholesterol',
        unit: 'mg/dL',
        bioReference: '<100 Optimal, 100-129 Near Optimal, 130-159 Borderline High',
        price: 140
      },
      {
        testId: 'LIP004',
        name: 'TRIGLYCERIDES',
        description: 'Fat in blood',
        unit: 'mg/dL',
        bioReference: '<150 Normal, 150-199 Borderline High, 200-499 High',
        price: 125
      },
      {
        testId: 'LIP005',
        name: 'VLDL CHOLESTEROL',
        description: 'Very low density lipoprotein',
        unit: 'mg/dL',
        bioReference: '5 - 40',
        price: 85
      }
    ]
  },
  {
    profileId: 'PROF004',
    name: 'Diabetes Panel',
    description: 'Blood sugar monitoring and diabetes screening',
    packagePrice: 550,
    active: true,
    tests: [
      {
        testId: 'DIA001',
        name: 'FBS (Fasting Blood Sugar)',
        description: 'Fasting glucose level',
        unit: 'mg/dL',
        bioReference: 'Normal: <100, Pre-diabetic: 100-125, Diabetic: >126',
        price: 120
      },
      {
        testId: 'DIA002',
        name: 'PPBS (Postprandial Blood Sugar)',
        description: '2-hour post meal glucose',
        unit: 'mg/dL',
        bioReference: 'Normal: <140, Pre-diabetic: 140-199, Diabetic: >200',
        price: 120
      },
      {
        testId: 'DIA003',
        name: 'HbA1c',
        description: 'Average blood glucose (3 months)',
        unit: '%',
        bioReference: 'Normal: <5.7%, Pre-diabetic: 5.7-6.4%, Diabetic: >=6.5%',
        price: 310
      }
    ]
  },
  {
    profileId: 'PROF005',
    name: 'Thyroid Profile',
    description: 'Complete thyroid function assessment',
    packagePrice: 1200,
    active: true,
    tests: [
      {
        testId: 'THY001',
        name: 'T3 (Total Triiodothyronine)',
        description: 'Thyroid hormone T3',
        unit: 'ng/dL',
        bioReference: '60-200',
        price: 280
      },
      {
        testId: 'THY002',
        name: 'T4 (Total Thyroxine)',
        description: 'Thyroid hormone T4',
        unit: 'µg/dL',
        bioReference: '4.5-12',
        price: 280
      },
      {
        testId: 'THY003',
        name: 'TSH (Ultrasensitive)',
        description: 'Thyroid stimulating hormone',
        unit: 'µIU/mL',
        bioReference: '0.55-4.78',
        price: 350
      },
      {
        testId: 'THY004',
        name: 'FT3 (Free T3)',
        description: 'Free triiodothyronine',
        unit: 'pg/mL',
        bioReference: '2.0-4.4',
        price: 290
      },
      {
        testId: 'THY005',
        name: 'FT4 (Free T4)',
        description: 'Free thyroxine',
        unit: 'ng/dL',
        bioReference: '0.93-1.7',
        price: 290
      }
    ]
  },
  {
    profileId: 'PROF006',
    name: 'Complete Blood Count (CBC)',
    description: 'Full blood cell analysis',
    packagePrice: 400,
    active: true,
    tests: [
      { testId: 'CBC001', name: 'HEMOGLOBIN', description: 'Red blood cell protein', unit: 'g/dL', bioReference: '13.0-17.0', price: 50 },
      { testId: 'CBC002', name: 'Total RBC', description: 'Red blood cell count', unit: 'X10^6/µL', bioReference: '4.5-5.5', price: 50 },
      { testId: 'CBC003', name: 'WBC (Total Leucocyte Count)', description: 'White blood cell count', unit: 'X10³/µL', bioReference: '4.0-10.0', price: 50 },
      { testId: 'CBC004', name: 'PLATELET COUNT', description: 'Blood clotting cells', unit: 'X10³/µL', bioReference: '150-410', price: 50 },
      { testId: 'CBC005', name: 'MCV', description: 'Mean corpuscular volume', unit: 'fL', bioReference: '83.0-101.0', price: 40 },
      { testId: 'CBC006', name: 'MCH', description: 'Mean corpuscular hemoglobin', unit: 'pq', bioReference: '27.0-32.0', price: 40 },
      { testId: 'CBC007', name: 'Neutrophils', description: 'Infection fighting cells', unit: '%', bioReference: '40-80', price: 40 },
      { testId: 'CBC008', name: 'Lymphocytes', description: 'Immune system cells', unit: '%', bioReference: '20-40', price: 40 }
    ]
  },
  {
    profileId: 'PROF007',
    name: 'Urine Routine',
    description: 'Complete urine analysis',
    packagePrice: 300,
    active: true,
    tests: [
      { testId: 'UR001', name: 'COLOUR', description: 'Urine color', unit: '', bioReference: 'Pale Yellow', price: 35 },
      { testId: 'UR002', name: 'APPEARANCE', description: 'Clarity of urine', unit: '', bioReference: 'Clear', price: 35 },
      { testId: 'UR003', name: 'SPECIFIC GRAVITY', description: 'Urine concentration', unit: '', bioReference: '1.003-1.030', price: 40 },
      { testId: 'UR004', name: 'PH', description: 'Urine acidity', unit: '', bioReference: '5-8', price: 40 },
      { testId: 'UR005', name: 'URINARY PROTEIN', description: 'Protein in urine', unit: '', bioReference: 'Absent', price: 45 },
      { testId: 'UR006', name: 'URINARY GLUCOSE', description: 'Sugar in urine', unit: '', bioReference: 'Absent', price: 45 },
      { testId: 'UR007', name: 'RED BLOOD CELLS', description: 'RBC in urine', unit: 'cells/HPF', bioReference: '0-5', price: 30 },
      { testId: 'UR008', name: 'URINARY LEUCOCYTES', description: 'WBC in urine', unit: 'cells/HPF', bioReference: '0-5', price: 30 }
    ]
  },
  {
    profileId: 'PROF008',
    name: 'Vitamin Panel',
    description: 'Essential vitamin deficiency screening',
    packagePrice: 1800,
    active: true,
    tests: [
      { testId: 'VIT001', name: 'Vitamin D', description: 'Bone health vitamin', unit: 'ng/mL', bioReference: '30-100', price: 650 },
      { testId: 'VIT002', name: 'Vitamin B12', description: 'Energy & nerve function', unit: 'pg/mL', bioReference: '200-900', price: 600 },
      { testId: 'VIT003', name: 'Folate (Vitamin B9)', description: 'Cell growth vitamin', unit: 'ng/mL', bioReference: '2.7-17.0', price: 550 }
    ]
  },
  {
    profileId: 'PROF009',
    name: 'Electrolyte Panel',
    description: 'Complete electrolyte balance assessment',
    packagePrice: 650,
    active: true,
    tests: [
      { testId: 'ELEC001', name: 'Sodium', description: 'Na+ electrolyte', unit: 'mmol/L', bioReference: '136-145', price: 110 },
      { testId: 'ELEC002', name: 'Potassium', description: 'K+ electrolyte', unit: 'mmol/L', bioReference: '3.5-5.1', price: 110 },
      { testId: 'ELEC003', name: 'Chloride', description: 'Cl- electrolyte', unit: 'mmol/L', bioReference: '98-107', price: 110 },
      { testId: 'ELEC004', name: 'Bicarbonate', description: 'HCO3- buffer', unit: 'mmol/L', bioReference: '23-29', price: 100 },
      { testId: 'ELEC005', name: 'Magnesium', description: 'Mg electrolyte', unit: 'mg/dL', bioReference: '1.7-2.2', price: 110 },
      { testId: 'ELEC006', name: 'Phosphorus', description: 'P electrolyte', unit: 'mg/dL', bioReference: '2.5-4.5', price: 110 }
    ]
  },
  {
    profileId: 'PROF010',
    name: 'Cardiac Risk Assessment',
    description: 'Heart health and damage markers',
    packagePrice: 2000,
    active: true,
    tests: [
      { testId: 'CARD001', name: 'Troponin I', description: 'Heart muscle damage marker', unit: 'ng/mL', bioReference: '<0.04', price: 650 },
      { testId: 'CARD002', name: 'CK-MB', description: 'Creatine kinase heart enzyme', unit: 'U/L', bioReference: '<24', price: 450 },
      { testId: 'CARD003', name: 'LDH', description: 'Lactate dehydrogenase', unit: 'U/L', bioReference: '140-280', price: 300 },
      { testId: 'LIP001', name: 'TOTAL CHOLESTEROL', description: 'Total cholesterol', unit: 'mg/dL', bioReference: '<200', price: 120 },
      { testId: 'LIP002', name: 'HDL CHOLESTEROL', description: 'Good cholesterol', unit: 'mg/dL', bioReference: '40-60', price: 130 },
      { testId: 'LIP003', name: 'LDL CHOLESTEROL', description: 'Bad cholesterol', unit: 'mg/dL', bioReference: '<100', price: 140 },
      { testId: 'LIP004', name: 'TRIGLYCERIDES', description: 'Fat in blood', unit: 'mg/dL', bioReference: '<150', price: 125 }
    ]
  },
  {
    profileId: 'PROF011',
    name: 'Comprehensive Health Checkup',
    description: 'Full body health screening',
    packagePrice: 2500,
    active: true,
    tests: [
      { testId: 'CBC001', name: 'HEMOGLOBIN', description: 'Red blood cell protein', unit: 'g/dL', bioReference: '13.0-17.0', price: 50 },
      { testId: 'CBC002', name: 'Total RBC', description: 'Red blood cell count', unit: 'X10^6/µL', bioReference: '4.5-5.5', price: 50 },
      { testId: 'LFT001', name: 'SGOT', description: 'Liver enzyme', unit: 'U/L', bioReference: '<35', price: 90 },
      { testId: 'LFT002', name: 'SGPT', description: 'Liver enzyme', unit: 'U/L', bioReference: '<45', price: 90 },
      { testId: 'KFT001', name: 'BUN', description: 'Kidney function', unit: 'mg/dL', bioReference: '7.94-20.07', price: 120 },
      { testId: 'KFT002', name: 'CREATININE', description: 'Kidney filtration', unit: 'mg/dL', bioReference: '0.72-1.18', price: 130 },
      { testId: 'LIP001', name: 'TOTAL CHOLESTEROL', description: 'Total cholesterol', unit: 'mg/dL', bioReference: '<200', price: 120 },
      { testId: 'DIA001', name: 'FBS', description: 'Fasting glucose', unit: 'mg/dL', bioReference: '<100', price: 120 },
      { testId: 'THY001', name: 'TSH', description: 'Thyroid function', unit: 'µIU/mL', bioReference: '0.55-4.78', price: 350 }
    ]
  },
  {
    profileId: 'PROF_CUSTOM',
    name: 'Custom Test Selection',
    description: 'Choose individual tests',
    packagePrice: null,
    active: true,
    tests: []
  }
];

export default PROFILES;
