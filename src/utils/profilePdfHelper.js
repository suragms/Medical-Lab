/**
 * Profile-Based PDF Generation Helper
 * Handles generating separate PDFs and invoices for each test profile
 */

import { downloadLabReport, printLabReport, generateLabReportPDF } from './labReportPdfGenerator';
import { downloadInvoice, printInvoice } from './invoicePdfGenerator';
import { generateCombinedPDF, generateLabReportsOnly, shareCombinedPDFViaWhatsApp, shareCombinedPDFViaEmail } from './combinedPdfGenerator';

/**
 * Group tests by profile ID
 * @param {Array} tests - Array of test objects
 * @returns {Object} - Object with profileId as key and tests array as value
 */
export const groupTestsByProfile = (tests) => {
  if (!tests || !Array.isArray(tests)) {
    console.warn('⚠️ No tests provided to groupTestsByProfile');
    return {};
  }

  console.log('📊 Grouping tests by profile. Total tests:', tests.length);
  console.log('🔍 Sample test structure:', tests[0]);

  const grouped = {};

  tests.forEach(test => {
    const profileId = test.profileId || test.profile || 'UNKNOWN';
    console.log(`Test "${test.name}" -> Profile ID: ${profileId}`);

    if (!grouped[profileId]) {
      grouped[profileId] = [];
    }
    grouped[profileId].push(test);
  });

  console.log('✅ Grouped tests:', Object.keys(grouped).map(k => `${k}: ${grouped[k].length} tests`));
  return grouped;
};

/**
 * Get profile information for a test group
 * @param {Array} tests - Tests belonging to a profile
 * @param {Object} allProfiles - All available profiles
 * @returns {Object} - Profile information
 */
export const getProfileInfo = (tests, allProfiles = []) => {
  if (!tests || tests.length === 0) return null;

  const firstTest = tests[0];
  let profileId = firstTest.profileId || firstTest.profile;

  // FALLBACK: If no profileId, try to match by test names to find the profile
  if (!profileId || profileId === 'UNKNOWN') {
    console.warn('⚠️ No profileId found, attempting to match by test names...');

    // Try to find profile that contains these tests
    for (const profile of allProfiles) {
      if (!profile.tests || !Array.isArray(profile.tests)) continue;

      const profileTestIds = profile.tests.map(t => t.testId);
      const matchCount = tests.filter(t => profileTestIds.includes(t.testId)).length;

      // If more than 50% tests match, assume this is the profile
      if (matchCount > 0 && matchCount / tests.length >= 0.5) {
        console.log(`✅ Matched ${matchCount}/${tests.length} tests to profile: ${profile.name}`);
        profileId = profile.profileId;
        break;
      }
    }
  }

  // Find profile in allProfiles
  const profile = allProfiles.find(p => p.profileId === profileId);

  if (profile) {
    return {
      profileId: profile.profileId,
      name: profile.name,
      price: profile.packagePrice || profile.price || 0
    };
  }

  // LAST FALLBACK: Use test data or create custom profile
  const totalPrice = tests.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);

  return {
    profileId: profileId || 'CUSTOM',
    name: firstTest.profileName || 'Custom Test Package',
    price: totalPrice
  };
};

/**
 * Generate separate lab reports for each profile
 * @param {Object} visitData - Complete visit data
 * @param {Array} profiles - Available profiles
 * @param {Object} options - Generation options
 * @returns {Array} - Array of generated report info
 */
export const generateProfileReports = async (visitData, profiles = [], options = {}) => {
  const { download = true, print = false, profileFilter = null } = options;
  
  // CRITICAL DEBUG: Log incoming visit data
  console.log('🔍🔍🔍 generateProfileReports - INCOMING visitData:', visitData);
  console.log('🔍🔍🔍 generateProfileReports - visitData.tests:', visitData.tests);
  console.log('🔍🔍🔍 generateProfileReports - Test values:', visitData.tests?.map(t => ({ 
    name: t.name || t.description, 
    value: t.value,
    testId: t.testId 
  })));
  
  const groupedTests = groupTestsByProfile(visitData.tests);
  const results = [];

  // If profileFilter specified, only generate for that profile
  const profilesToGenerate = profileFilter
    ? [[profileFilter, groupedTests[profileFilter]]]
    : Object.entries(groupedTests);

  for (const [profileId, tests] of profilesToGenerate) {
    if (!tests || tests.length === 0) {
      console.warn(`⚠️ No tests for profile ${profileId}`);
      continue;
    }

    console.log(`✅ Processing profile ${profileId} with ${tests.length} tests`);
    console.log(`🔍 Tests for this profile:`, tests);

    const profileInfo = getProfileInfo(tests, profiles);

    // Build report data for this profile
    const reportData = {
      patient: {
        ...visitData.patient,
        testProfile: profileInfo.name, // ADDED: Add profile name for PDF header
        visitId: visitData.visitId || visitData.patient?.visitId
      },
      times: {
        collected: visitData.collectedAt,
        received: visitData.receivedAt,
        reported: visitData.reportedAt
      },
      signingTechnician: visitData.signingTechnician, // ADDED: Pass signing technician
      testGroups: [{
        name: profileInfo.name,
        tests: tests
      }]
    };
    
    console.log('🔍 reportData being sent to PDF:', reportData);
    console.log('🔍 reportData.testGroups:', reportData.testGroups);

    const fileName = `Report-${visitData.visitId}-${profileInfo.name.replace(/\s+/g, '_')}.pdf`;

    try {
      if (download) {
        await downloadLabReport(reportData, fileName, { profileFilter: profileId });
      }
      if (print) {
        await printLabReport(reportData, { profileFilter: profileId });
      }

      results.push({
        success: true,
        profileId,
        profileName: profileInfo.name,
        fileName
      });
    } catch (error) {
      results.push({
        success: false,
        profileId,
        profileName: profileInfo.name,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Generate ONE combined invoice with all profiles
 * @param {Object} visitData - Complete visit data
 * @param {Array} profiles - Available profiles
 * @param {Object} options - Generation options
 * @returns {Object} - Invoice generation result
 */
export const generateCombinedInvoice = async (visitData, profiles = [], options = {}) => {
  const { download = true, print = false } = options;
  const groupedTests = groupTestsByProfile(visitData.tests);

  console.log('💵 Generating SINGLE combined invoice for all profiles');
  console.log('Total profile groups:', Object.keys(groupedTests).length);

  // Build items array with ALL profiles
  const items = [];
  let totalAmount = 0;

  for (const [profileId, tests] of Object.entries(groupedTests)) {
    const profileInfo = getProfileInfo(tests, profiles);

    console.log(`🏷️ Adding to invoice: ${profileInfo.name} - Rs. ${profileInfo.price}`);

    items.push({
      name: profileInfo.name,  // PROFILE NAME ONLY
      price: profileInfo.price // PROFILE PRICE ONLY
    });

    totalAmount += profileInfo.price;
  }

  // Build ONE invoice data with ALL profiles
  const invoiceData = {
    patient: {
      name: visitData.patient?.name || '',
      age: visitData.patient?.age || '',
      gender: visitData.patient?.gender || '',
      phone: visitData.patient?.phone || '',
      email: visitData.patient?.email || '',
      address: visitData.patient?.address || '',
      visitId: visitData.visitId,
      date: visitData.createdAt,
      paymentStatus: visitData.paymentStatus || 'unpaid'
    },
    invoice: {
      invoiceNumber: visitData.visitId,
      generatedOn: new Date().toISOString(),
      staffName: visitData.created_by_name || 'Staff',
      method: visitData.paymentMethod || 'Cash'
    },
    items: items, // ALL PROFILES IN ONE INVOICE
    times: {
      collected: visitData.collectedAt,
      received: visitData.receivedAt,
      reported: visitData.reportedAt
    },
    discount: 0,
    subtotal: totalAmount,
    finalTotal: totalAmount,
    amountPaid: visitData.paymentStatus === 'paid' ? totalAmount : 0
  };

  console.log('📦 Combined invoice data:', {
    profileCount: items.length,
    items: items,
    total: invoiceData.finalTotal
  });

  const fileName = `Invoice-${visitData.visitId}.pdf`;

  try {
    if (download) {
      console.log(`⬇️ Downloading combined invoice: ${fileName}`);
      await downloadInvoice(invoiceData, fileName);
    }
    if (print) {
      console.log(`🖨️ Printing combined invoice: ${fileName}`);
      await printInvoice(invoiceData);
    }

    console.log(`✅ Combined invoice generated successfully`);
    return {
      success: true,
      fileName,
      profileCount: items.length,
      totalAmount
    };
  } catch (error) {
    console.error(`❌ Failed to generate combined invoice:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate both reports and invoices for all profiles
 * @param {Object} visitData - Complete visit data
 * @param {Array} profiles - Available profiles
 * @param {Object} options - Generation options
 * @returns {Object} - Results for both reports and invoices
 */
export const generateAllProfileDocuments = async (visitData, profiles = [], options = {}) => {
  const reportResults = await generateProfileReports(visitData, profiles, options);
  const invoiceResults = await generateProfileInvoices(visitData, profiles, options);

  return {
    reports: reportResults,
    invoices: invoiceResults,
    totalProfiles: Object.keys(groupTestsByProfile(visitData.tests)).length
  };
};

/**
 * Generate COMBINED PDF with ALL Profile Reports (NO Invoice) in ONE PDF
 * Uses the lab reports only generator (excludes invoice page)
 * @param {Object} visitData - Complete visit data
 * @param {Array} profiles - Available profiles  
 * @param {Object} options - Generation options
 * @returns {Object} - Combined PDF generation result
 */
export const generateCombinedLabReports = async (visitData, profiles = [], options = {}) => {
  console.log('📄 Generating COMBINED Lab Reports (NO Invoice)');
  // Use the new generateLabReportsOnly function that excludes invoice
  return await generateLabReportsOnly(visitData, profiles, options);
};

/**
 * Generate COMBINED PDF with Invoice + All Profile Reports in ONE PDF
 * @param {Object} visitData - Complete visit data
 * @param {Array} profiles - Available profiles
 * @param {Object} options - Generation options
 * @returns {Object} - Combined PDF generation result
 */
export const generateCombinedReportAndInvoice = async (visitData, profiles = [], options = {}) => {
  console.log('📄 Generating COMBINED PDF: Invoice + All Reports in ONE document');
  return await generateCombinedPDF(visitData, profiles, options);
};

// Re-export share functions from combinedPdfGenerator as named exports
export { shareCombinedPDFViaWhatsApp, shareCombinedPDFViaEmail };

export default {
  groupTestsByProfile,
  getProfileInfo,
  generateProfileReports,
  generateCombinedInvoice, // UPDATED: Single invoice for all profiles
  generateCombinedReportAndInvoice, // NEW: Single PDF with invoice + all reports
  shareCombinedPDFViaWhatsApp, // NEW: Share combined PDF via WhatsApp
  shareCombinedPDFViaEmail // NEW: Share combined PDF via Email
};
