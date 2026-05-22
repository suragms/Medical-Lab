/**
 * Sample test data for PDF generation testing
 * Contains 10 diverse patient scenarios with different test result patterns
 */

export const samplePatients = [
  {
    id: 1,
    patient: {
      name: "Rajesh Kumar",
      age: 45,
      gender: "Male",
      phone: "9876543210",
      address: "123 Main Street, Thrissur, Kerala",
      referredBy: "Dr. Sharma"
    },
    profile: {
      name: "Complete Blood Count"
    },
    collectedAt: "2025-11-20T10:30:00Z",
    receivedAt: "2025-11-20T11:15:00Z",
    reportedAt: "2025-11-20T14:20:00Z",
    tests: [
      {
        testId: "TEST_BUN_1",
        name_snapshot: "Blood Urea Nitrogen (BUN)",
        value: "25.5",
        unit_snapshot: "mg/dL",
        refLow_snapshot: "7.94",
        refHigh_snapshot: "20.07",
        inputType_snapshot: "number",
        bioReference_snapshot: "7.94 - 20.07"
      },
      {
        testId: "TEST_CREAT_1",
        name_snapshot: "Creatinine",
        value: "1.2",
        unit_snapshot: "mg/dL",
        refLow_snapshot: "0.72",
        refHigh_snapshot: "1.18",
        inputType_snapshot: "number",
        bioReference_snapshot: "0.72 - 1.18"
      },
      {
        testId: "TEST_HGB_1",
        name_snapshot: "Hemoglobin",
        value: "14.5",
        unit_snapshot: "g/dL",
        refLow_snapshot: "13.0",
        refHigh_snapshot: "17.0",
        inputType_snapshot: "number",
        bioReference_snapshot: "13.0 - 17.0"
      },
      {
        testId: "TEST_CHOL_1",
        name_snapshot: "Total Cholesterol",
        value: "180",
        unit_snapshot: "mg/dL",
        refLow_snapshot: null,
        refHigh_snapshot: "200",
        inputType_snapshot: "number",
        bioReference_snapshot: "< 200"
      }
    ]
  },
  {
    id: 2,
    patient: {
      name: "Priya Menon",
      age: 32,
      gender: "Female",
      phone: "9123456789",
      address: "456 Park Avenue, Kochi, Kerala",
      referredBy: "Self"
    },
    profile: {
      name: "Thyroid Function"
    },
    collectedAt: "2025-11-20T09:15:00Z",
    receivedAt: "2025-11-20T10:00:00Z",
    reportedAt: "2025-11-20T13:45:00Z",
    tests: [
      {
        testId: "TEST_HGB_2",
        name_snapshot: "Hemoglobin",
        value: "11.8",
        unit_snapshot: "g/dL",
        refLow_snapshot: "12.0",
        refHigh_snapshot: "15.0",
        inputType_snapshot: "number",
        bioReference_snapshot: "12.0 - 15.0"
      },
      {
        testId: "TEST_FBS_1",
        name_snapshot: "Blood Sugar Fasting",
        value: "70",
        unit_snapshot: "mg/dL",
        refLow_snapshot: "70",
        refHigh_snapshot: "100",
        inputType_snapshot: "number",
        bioReference_snapshot: "70 - 100"
      },
      {
        testId: "TEST_TSH_1",
        name_snapshot: "TSH",
        value: "2.5",
        unit_snapshot: "µIU/mL",
        refLow_snapshot: "0.4",
        refHigh_snapshot: "4.0",
        inputType_snapshot: "number",
        bioReference_snapshot: "0.4 - 4.0"
      },
      {
        testId: "TEST_VITD_1",
        name_snapshot: "Vitamin D",
        value: "15",
        unit_snapshot: "ng/mL",
        refLow_snapshot: "30",
        refHigh_snapshot: "100",
        inputType_snapshot: "number",
        bioReference_snapshot: "30 - 100"
      }
    ]
  },
  {
    id: 3,
    patient: {
      name: "Ahmed Ali",
      age: 58,
      gender: "Male",
      phone: "9988776655",
      address: "789 Beach Road, Kozhikode, Kerala",
      referredBy: "Dr. Nair"
    },
    profile: {
      name: "Liver Function"
    },
    collectedAt: "2025-11-20T08:00:00Z",
    receivedAt: "2025-11-20T08:45:00Z",
    reportedAt: "2025-11-20T12:30:00Z",
    tests: [
      {
        testId: "TEST_SGPT_1",
        name_snapshot: "SGPT (ALT)",
        value: "125",
        unit_snapshot: "U/L",
        refLow_snapshot: null,
        refHigh_snapshot: "40",
        inputType_snapshot: "number",
        bioReference_snapshot: "< 40"
      },
      {
        testId: "TEST_SGOT_1",
        name_snapshot: "SGOT (AST)",
        value: "95",
        unit_snapshot: "U/L",
        refLow_snapshot: null,
        refHigh_snapshot: "35",
        inputType_snapshot: "number",
        bioReference_snapshot: "< 35"
      },
      {
        testId: "TEST_HBA1C_1",
        name_snapshot: "HbA1c",
        value: "7.8",
        unit_snapshot: "%",
        refLow_snapshot: null,
        refHigh_snapshot: "5.7",
        inputType_snapshot: "number",
        bioReference_snapshot: "< 5.7"
      },
      {
        testId: "TEST_TG_1",
        name_snapshot: "Triglycerides",
        value: "220",
        unit_snapshot: "mg/dL",
        refLow_snapshot: null,
        refHigh_snapshot: "150",
        inputType_snapshot: "number",
        bioReference_snapshot: "< 150"
      }
    ]
  },
  {
    id: 4,
    patient: {
      name: "Lakshmi Iyer",
      age: 28,
      gender: "Female",
      phone: "9876501234",
      address: "321 Temple Street, Palakkad, Kerala",
      referredBy: "Dr. Reddy"
    },
    profile: {
      name: "Complete Hemogram"
    },
    collectedAt: "2025-11-20T11:00:00Z",
    receivedAt: "2025-11-20T11:45:00Z",
    reportedAt: "2025-11-20T15:15:00Z",
    tests: [
      {
        testId: "TEST_WBC_1",
        name_snapshot: "WBC Count",
        value: "9000",
        unit_snapshot: "cells/µL",
        refLow_snapshot: "4000",
        refHigh_snapshot: "11000",
        inputType_snapshot: "number",
        bioReference_snapshot: "4000 - 11000"
      },
      {
        testId: "TEST_PLT_1",
        name_snapshot: "Platelet Count",
        value: "150000",
        unit_snapshot: "/µL",
        refLow_snapshot: "150000",
        refHigh_snapshot: "400000",
        inputType_snapshot: "number",
        bioReference_snapshot: "150000 - 400000"
      },
      {
        testId: "TEST_RBC_1",
        name_snapshot: "RBC Count",
        value: "4.8",
        unit_snapshot: "M/µL",
        refLow_snapshot: "4.2",
        refHigh_snapshot: "5.4",
        inputType_snapshot: "number",
        bioReference_snapshot: "4.2 - 5.4"
      },
      {
        testId: "TEST_ESR_1",
        name_snapshot: "ESR",
        value: "12",
        unit_snapshot: "mm/hr",
        refLow_snapshot: "0",
        refHigh_snapshot: "20",
        inputType_snapshot: "number",
        bioReference_snapshot: "0 - 20"
      }
    ]
  },
  {
    id: 5,
    patient: {
      name: "Suresh Nair",
      age: 65,
      gender: "Male",
      phone: "9123498765",
      address: "654 Hill View, Kannur, Kerala",
      referredBy: "Dr. Joseph"
    },
    profile: {
      name: "Electrolytes Panel"
    },
    collectedAt: "2025-11-20T07:30:00Z",
    receivedAt: "2025-11-20T08:15:00Z",
    reportedAt: "2025-11-20T11:45:00Z",
    tests: [
      {
        testId: "TEST_NA_1",
        name_snapshot: "Sodium",
        value: "128",
        unit_snapshot: "mmol/L",
        refLow_snapshot: "135",
        refHigh_snapshot: "145",
        inputType_snapshot: "number",
        bioReference_snapshot: "135 - 145"
      },
      {
        testId: "TEST_K_1",
        name_snapshot: "Potassium",
        value: "5.8",
        unit_snapshot: "mmol/L",
        refLow_snapshot: "3.5",
        refHigh_snapshot: "5.0",
        inputType_snapshot: "number",
        bioReference_snapshot: "3.5 - 5.0"
      },
      {
        testId: "TEST_CA_1",
        name_snapshot: "Calcium",
        value: "8.9",
        unit_snapshot: "mg/dL",
        refLow_snapshot: "8.5",
        refHigh_snapshot: "10.5",
        inputType_snapshot: "number",
        bioReference_snapshot: "8.5 - 10.5"
      },
      {
        testId: "TEST_URIC_1",
        name_snapshot: "Uric Acid",
        value: "8.5",
        unit_snapshot: "mg/dL",
        refLow_snapshot: "3.5",
        refHigh_snapshot: "7.2",
        inputType_snapshot: "number",
        bioReference_snapshot: "3.5 - 7.2"
      }
    ]
  },
  {
    id: 6,
    patient: {
      name: "Meera Pillai",
      age: 40,
      gender: "Female",
      phone: "9988112233",
      address: "987 River Side, Alappuzha, Kerala",
      referredBy: "Self"
    },
    profile: {
      name: "Liver Function Test"
    },
    collectedAt: "2025-11-20T12:15:00Z",
    receivedAt: "2025-11-20T13:00:00Z",
    reportedAt: "2025-11-20T16:30:00Z",
    tests: [
      {
        testId: "TEST_TBIL_1",
        name_snapshot: "Total Bilirubin",
        value: "1.8",
        unit_snapshot: "mg/dL",
        refLow_snapshot: "0.3",
        refHigh_snapshot: "1.2",
        inputType_snapshot: "number",
        bioReference_snapshot: "0.3 - 1.2"
      },
      {
        testId: "TEST_DBIL_1",
        name_snapshot: "Direct Bilirubin",
        value: "0.5",
        unit_snapshot: "mg/dL",
        refLow_snapshot: null,
        refHigh_snapshot: "0.3",
        inputType_snapshot: "number",
        bioReference_snapshot: "< 0.3"
      },
      {
        testId: "TEST_ALB_1",
        name_snapshot: "Albumin",
        value: "3.8",
        unit_snapshot: "g/dL",
        refLow_snapshot: "3.5",
        refHigh_snapshot: "5.0",
        inputType_snapshot: "number",
        bioReference_snapshot: "3.5 - 5.0"
      },
      {
        testId: "TEST_GLOB_1",
        name_snapshot: "Globulin",
        value: "2.8",
        unit_snapshot: "g/dL",
        refLow_snapshot: "2.0",
        refHigh_snapshot: "3.5",
        inputType_snapshot: "number",
        bioReference_snapshot: "2.0 - 3.5"
      }
    ]
  },
  {
    id: 7,
    patient: {
      name: "Vinod Thomas",
      age: 50,
      gender: "Male",
      phone: "9876509876",
      address: "135 Church Road, Kollam, Kerala",
      referredBy: "Dr. Kumar"
    },
    profile: {
      name: "Urine Analysis"
    },
    collectedAt: "2025-11-20T13:30:00Z",
    receivedAt: "2025-11-20T14:15:00Z",
    reportedAt: "2025-11-20T17:45:00Z",
    tests: [
      {
        testId: "TEST_UPROT_1",
        name_snapshot: "Urine Protein",
        value: "Trace",
        unit_snapshot: "",
        refLow_snapshot: null,
        refHigh_snapshot: null,
        inputType_snapshot: "text",
        bioReference_snapshot: "Negative"
      },
      {
        testId: "TEST_UGLU_1",
        name_snapshot: "Urine Glucose",
        value: "Negative",
        unit_snapshot: "",
        refLow_snapshot: null,
        refHigh_snapshot: null,
        inputType_snapshot: "text",
        bioReference_snapshot: "Negative"
      },
      {
        testId: "TEST_UPH_1",
        name_snapshot: "Urine pH",
        value: "6.2",
        unit_snapshot: "",
        refLow_snapshot: "5.0",
        refHigh_snapshot: "8.0",
        inputType_snapshot: "number",
        bioReference_snapshot: "5.0 - 8.0"
      },
      {
        testId: "TEST_USG_1",
        name_snapshot: "Specific Gravity",
        value: "1.025",
        unit_snapshot: "",
        refLow_snapshot: "1.005",
        refHigh_snapshot: "1.030",
        inputType_snapshot: "number",
        bioReference_snapshot: "1.005 - 1.030"
      }
    ]
  },
  {
    id: 8,
    patient: {
      name: "Anjali Menon",
      age: 35,
      gender: "Female",
      phone: "9123487654",
      address: "246 Market Street, Wayanad, Kerala - Long address to test multi-line wrapping and display formatting in PDF reports",
      referredBy: "Dr. Sebastian"
    },
    profile: {
      name: "Thyroid Profile"
    },
    collectedAt: "2025-11-20T14:45:00Z",
    receivedAt: "2025-11-20T15:30:00Z",
    reportedAt: "2025-11-20T19:00:00Z",
    tests: [
      {
        testId: "TEST_T3_1",
        name_snapshot: "T3 Total",
        value: "1.8",
        unit_snapshot: "nmol/L",
        refLow_snapshot: "1.2",
        refHigh_snapshot: "2.8",
        inputType_snapshot: "number",
        bioReference_snapshot: "Adult: 1.2 - 2.8 nmol/L\nChildren: 1.5 - 3.2 nmol/L\nElderly: 0.8 - 2.0 nmol/L"
      },
      {
        testId: "TEST_T4_1",
        name_snapshot: "T4 Total",
        value: "145",
        unit_snapshot: "nmol/L",
        refLow_snapshot: "66",
        refHigh_snapshot: "181",
        inputType_snapshot: "number",
        bioReference_snapshot: "Adult: 66 - 181 nmol/L\nPregnant: 90 - 200 nmol/L"
      },
      {
        testId: "TEST_FT3_1",
        name_snapshot: "Free T3",
        value: "3.2",
        unit_snapshot: "pmol/L",
        refLow_snapshot: "2.3",
        refHigh_snapshot: "4.2",
        inputType_snapshot: "number",
        bioReference_snapshot: "2.3 - 4.2"
      },
      {
        testId: "TEST_FT4_1",
        name_snapshot: "Free T4",
        value: "18",
        unit_snapshot: "pmol/L",
        refLow_snapshot: "10",
        refHigh_snapshot: "23",
        inputType_snapshot: "number",
        bioReference_snapshot: "10 - 23"
      }
    ]
  },
  {
    id: 9,
    patient: {
      name: "Ravi Krishnan",
      age: 72,
      gender: "Male",
      phone: "9988334455",
      address: "753 Station Road, Thiruvananthapuram, Kerala",
      referredBy: "Dr. Menon"
    },
    profile: {
      name: "Prostate Health"
    },
    collectedAt: "2025-11-20T15:00:00Z",
    receivedAt: "2025-11-20T15:45:00Z",
    reportedAt: "2025-11-20T19:30:00Z",
    tests: [
      {
        testId: "TEST_PSA_1",
        name_snapshot: "PSA Total",
        value: "12.5",
        unit_snapshot: "ng/mL",
        refLow_snapshot: null,
        refHigh_snapshot: "4.0",
        inputType_snapshot: "number",
        bioReference_snapshot: "< 4.0"
      },
      {
        testId: "TEST_B12_1",
        name_snapshot: "Vitamin B12",
        value: "185",
        unit_snapshot: "pg/mL",
        refLow_snapshot: "200",
        refHigh_snapshot: "900",
        inputType_snapshot: "number",
        bioReference_snapshot: "200 - 900"
      },
      {
        testId: "TEST_FOLATE_1",
        name_snapshot: "Folate",
        value: "3.2",
        unit_snapshot: "ng/mL",
        refLow_snapshot: "3.0",
        refHigh_snapshot: null,
        inputType_snapshot: "number",
        bioReference_snapshot: "> 3.0"
      },
      {
        testId: "TEST_FERRITIN_1",
        name_snapshot: "Ferritin",
        value: "450",
        unit_snapshot: "ng/mL",
        refLow_snapshot: "20",
        refHigh_snapshot: "250",
        inputType_snapshot: "number",
        bioReference_snapshot: "20 - 250"
      }
    ]
  },
  {
    id: 10,
    patient: {
      name: "Divya Nambiar",
      age: 25,
      gender: "Female",
      phone: "9876598765",
      address: "852 College Avenue, Malappuram, Kerala",
      referredBy: "Self"
    },
    profile: {
      name: "Complete Blood Count"
    },
    collectedAt: "2025-11-20T16:15:00Z",
    receivedAt: "2025-11-20T17:00:00Z",
    reportedAt: "2025-11-20T20:45:00Z",
    tests: [
      {
        testId: "TEST_HGB_3",
        name_snapshot: "Hemoglobin",
        value: "12.0",
        unit_snapshot: "g/dL",
        refLow_snapshot: "12.0",
        refHigh_snapshot: "15.0",
        inputType_snapshot: "number",
        bioReference_snapshot: "Male: 13.0 - 17.0 g/dL\nFemale: 12.0 - 15.0 g/dL\nPregnant: 11.0 - 14.0 g/dL"
      },
      {
        testId: "TEST_MCV_1",
        name_snapshot: "MCV",
        value: "92",
        unit_snapshot: "fL",
        refLow_snapshot: "80",
        refHigh_snapshot: "100",
        inputType_snapshot: "number",
        bioReference_snapshot: "80 - 100"
      },
      {
        testId: "TEST_MCH_1",
        name_snapshot: "MCH",
        value: "28",
        unit_snapshot: "pg",
        refLow_snapshot: "27",
        refHigh_snapshot: "32",
        inputType_snapshot: "number",
        bioReference_snapshot: "27 - 32"
      },
      {
        testId: "TEST_MCHC_1",
        name_snapshot: "MCHC",
        value: "34",
        unit_snapshot: "g/dL",
        refLow_snapshot: "32",
        refHigh_snapshot: "36",
        inputType_snapshot: "number",
        bioReference_snapshot: "32 - 36"
      },
      {
        testId: "TEST_RDW_1",
        name_snapshot: "RDW",
        value: "14.2",
        unit_snapshot: "%",
        refLow_snapshot: "11.5",
        refHigh_snapshot: "14.5",
        inputType_snapshot: "number",
        bioReference_snapshot: "11.5 - 14.5"
      },
      {
        testId: "TEST_NEUT_1",
        name_snapshot: "Neutrophils",
        value: "68",
        unit_snapshot: "%",
        refLow_snapshot: "40",
        refHigh_snapshot: "70",
        inputType_snapshot: "number",
        bioReference_snapshot: "40 - 70"
      },
      {
        testId: "TEST_LYMPH_1",
        name_snapshot: "Lymphocytes",
        value: "25",
        unit_snapshot: "%",
        refLow_snapshot: "20",
        refHigh_snapshot: "40",
        inputType_snapshot: "number",
        bioReference_snapshot: "20 - 40"
      },
      {
        testId: "TEST_MONO_1",
        name_snapshot: "Monocytes",
        value: "5",
        unit_snapshot: "%",
        refLow_snapshot: "2",
        refHigh_snapshot: "8",
        inputType_snapshot: "number",
        bioReference_snapshot: "2 - 8"
      },
      {
        testId: "TEST_EOS_1",
        name_snapshot: "Eosinophils",
        value: "1.5",
        unit_snapshot: "%",
        refLow_snapshot: "1",
        refHigh_snapshot: "4",
        inputType_snapshot: "number",
        bioReference_snapshot: "1 - 4"
      },
      {
        testId: "TEST_BASO_1",
        name_snapshot: "Basophils",
        value: "0.5",
        unit_snapshot: "%",
        refLow_snapshot: "0.5",
        refHigh_snapshot: "1.0",
        inputType_snapshot: "number",
        bioReference_snapshot: "0.5 - 1.0"
      },
      {
        testId: "TEST_ANEUT_1",
        name_snapshot: "Absolute Neutrophils",
        value: "6100",
        unit_snapshot: "cells/µL",
        refLow_snapshot: "2000",
        refHigh_snapshot: "7500",
        inputType_snapshot: "number",
        bioReference_snapshot: "2000 - 7500"
      },
      {
        testId: "TEST_ALYMPH_1",
        name_snapshot: "Absolute Lymphocytes",
        value: "2250",
        unit_snapshot: "cells/µL",
        refLow_snapshot: "1000",
        refHigh_snapshot: "4800",
        inputType_snapshot: "number",
        bioReference_snapshot: "1000 - 4800"
      },
      {
        testId: "TEST_AMONO_1",
        name_snapshot: "Absolute Monocytes",
        value: "450",
        unit_snapshot: "cells/µL",
        refLow_snapshot: "200",
        refHigh_snapshot: "1000",
        inputType_snapshot: "number",
        bioReference_snapshot: "200 - 1000"
      },
      {
        testId: "TEST_AEOS_1",
        name_snapshot: "Absolute Eosinophils",
        value: "135",
        unit_snapshot: "cells/µL",
        refLow_snapshot: "20",
        refHigh_snapshot: "500",
        inputType_snapshot: "number",
        bioReference_snapshot: "20 - 500"
      },
      {
        testId: "TEST_ABASO_1",
        name_snapshot: "Absolute Basophils",
        value: "45",
        unit_snapshot: "cells/µL",
        refLow_snapshot: "20",
        refHigh_snapshot: "100",
        inputType_snapshot: "number",
        bioReference_snapshot: "20 - 100"
      },
      {
        testId: "TEST_IGRAN_1",
        name_snapshot: "Immature Granulocytes",
        value: "0.2",
        unit_snapshot: "%",
        refLow_snapshot: null,
        refHigh_snapshot: "1.0",
        inputType_snapshot: "number",
        bioReference_snapshot: "< 1.0"
      },
      {
        testId: "TEST_PPB_1",
        name_snapshot: "Blood Sugar (PP)",
        value: "155",
        unit_snapshot: "mg/dL",
        refLow_snapshot: null,
        refHigh_snapshot: "140",
        inputType_snapshot: "number",
        bioReference_snapshot: "< 140"
      },
      {
        testId: "TEST_HDL_1",
        name_snapshot: "Cholesterol HDL",
        value: "55",
        unit_snapshot: "mg/dL",
        refLow_snapshot: "40",
        refHigh_snapshot: null,
        inputType_snapshot: "number",
        bioReference_snapshot: "> 40"
      },
      {
        testId: "TEST_LDL_1",
        name_snapshot: "Cholesterol LDL",
        value: "125",
        unit_snapshot: "mg/dL",
        refLow_snapshot: null,
        refHigh_snapshot: "130",
        inputType_snapshot: "number",
        bioReference_snapshot: "< 130"
      },
      {
        testId: "TEST_VLDL_1",
        name_snapshot: "VLDL",
        value: "28",
        unit_snapshot: "mg/dL",
        refLow_snapshot: null,
        refHigh_snapshot: "30",
        inputType_snapshot: "number",
        bioReference_snapshot: "< 30"
      }
    ]
  }
];

export default samplePatients;