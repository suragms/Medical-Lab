import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, FileText, Receipt, Check, Loader, Download, Printer, Share2, Mail, AlertCircle, TrendingUp, TrendingDown, MessageCircle, TestTube2, Plus, Search, X, Home, Activity, CheckCircle } from 'lucide-react';
import { getVisitById, updateVisit, getPatientById, getProfileById, getTestsMaster, getProfiles } from '../../features/shared/dataService';
import { getSettings } from '../../services/settingsService';
import { useAuthStore } from '../../store';
import { getCurrentUser, getUsers } from '../../services/authService';
import { downloadReportPDF, printReportPDF, shareViaWhatsApp, shareViaEmail } from '../../utils/pdfGenerator';
import { generateCombinedInvoice, generateProfileReports, generateCombinedReportAndInvoice, generateCombinedLabReports } from '../../utils/profilePdfHelper';
import { parseRange, checkRangeStatus } from '../../utils/rangeParser';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import './ResultEntry.css';

const ResultEntryPage = () => {
  const navigate = useNavigate();
  const { visitId } = useParams();
  const { role } = useAuthStore();
  const currentUser = getCurrentUser();
  const settings = getSettings();

  const [visit, setVisit] = useState(null);
  const [patient, setPatient] = useState(null);
  const [profile, setProfile] = useState(null);
  const [results, setResults] = useState({});
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [useMySignatureDefault, setUseMySignatureDefault] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPdfActionsModal, setShowPdfActionsModal] = useState(false); // NEW: PDF modal
  const [generatedPdfResults, setGeneratedPdfResults] = useState([]); // NEW: PDF results
  const [pdfCompletionStatus, setPdfCompletionStatus] = useState({}); // NEW: Track completion
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedTestsToAdd, setSelectedTestsToAdd] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false); // NEW: Review before PDF
  const [reviewType, setReviewType] = useState(''); // 'reports' or 'invoice'
  const saveTimeoutRef = useRef(null);

  const canEditReportedTime = role === 'admin' && settings.allowManualReportedTime;
  const canEditDiscount = role === 'admin' || settings.allowStaffEditDiscount;

  // Load available tests when modal opens or search query changes
  useEffect(() => {
    if (!showAddTestModal) return;

    const loadTests = () => {
      setLoadingTests(true);
      try {
        const tests = getTestsMaster(testSearchQuery);
        setAvailableTests(tests);
      } catch (error) {
        console.error('Error loading tests:', error);
        toast.error('Failed to load tests');
        setAvailableTests([]);
      } finally {
        setLoadingTests(false);
      }
    };

    loadTests();
  }, [showAddTestModal, testSearchQuery]);

  // Get all active technicians (users with role staff/admin)
  const allUsers = getUsers();
  const technicians = allUsers.filter(u => u.isActive && (u.role === 'staff' || u.role === 'admin'));

  // Get selected technician
  const selectedTechnician = selectedTechnicianId
    ? technicians.find(t => t.userId === selectedTechnicianId)
    : null;

  // Load visit data
  useEffect(() => {
    console.log('🔍 LOAD VISIT - visitId:', visitId);
    const visitData = getVisitById(visitId);
    console.log('🔍 LOAD VISIT - visitData:', visitData);
    console.log('🔍 LOAD VISIT - visitData.tests:', visitData?.tests);
    console.log('🔍 LOAD VISIT - Test values:', visitData?.tests?.map(t => ({ testId: t.testId, name: t.name, value: t.value })));
    
    if (!visitData) {
      toast.error('Visit not found');
      navigate('/patients');
      return;
    }

    // CRITICAL RESTRICTION: Can't enter results if sample times not set
    if (!visitData.collectedAt || !visitData.receivedAt || visitData.status === 'tests_selected') {
      toast.error('❌ Cannot enter results: Sample times must be set first!', { duration: 5000 });
      navigate(`/sample-times/${visitId}`);
      return;
    }

    setVisit(visitData);

    // Load patient and profile
    const patientData = getPatientById(visitData.patientId);
    setPatient(patientData);

    if (visitData.profileId) {
      const profileData = getProfileById(visitData.profileId);
      setProfile(profileData);
    }

    // Initialize results from visit with RE-CALCULATED status
    const initialResults = {};
    if (visitData.tests && visitData.tests.length > 0) {
      visitData.tests.forEach(test => {
        const value = test.value || '';
        console.log(`📝 Test ${test.name}: value = "${value}"`);
        let status = test.status || 'normal';

        // Re-calculate status if value exists (fix for existing incorrect statuses)
        if (value !== '' && test.inputType_snapshot === 'number') {
          const numValue = parseFloat(value);

          if (!isNaN(numValue)) {
            // Priority 1: Use refLow_snapshot and refHigh_snapshot if available
            let refHigh = parseFloat(test.refHigh_snapshot);
            let refLow = parseFloat(test.refLow_snapshot);

            // Priority 2: Parse bioReference_snapshot if refLow/refHigh not available
            if ((isNaN(refLow) || isNaN(refHigh)) && (test.bioReference_snapshot || test.bioReference)) {
              const rangeStr = test.bioReference_snapshot || test.bioReference;
              const parsedRange = parseRange(rangeStr);

              if (parsedRange) {
                if (parsedRange.type === 'range') {
                  refLow = parsedRange.min;
                  refHigh = parsedRange.max;
                } else if (parsedRange.type === 'lt' || parsedRange.type === 'lte') {
                  refHigh = parsedRange.value;
                } else if (parsedRange.type === 'gt' || parsedRange.type === 'gte') {
                  refLow = parsedRange.value;
                }
              }
            }

            // Determine status
            if (!isNaN(refHigh) && numValue > refHigh) {
              status = 'high';
            } else if (!isNaN(refLow) && numValue < refLow) {
              status = 'low';
            } else if (!isNaN(refLow) && !isNaN(refHigh) && numValue >= refLow && numValue <= refHigh) {
              status = 'normal';
            }
          }
        }

        initialResults[test.testId] = {
          value: value,
          status: status
        };
        console.log(`✅ Loaded result for ${test.name}: value="${value}", status=${status}`);
      });
    }
    console.log('📊 Final initialResults:', initialResults);
    console.log('📊 initialResults count:', Object.keys(initialResults).length);
    setResults(initialResults);

    // Set discount from visit
    setDiscount(visitData.discount || 0);

    // Auto-select signing technician
    // Default to current user if they're a technician
    const currentUserRole = currentUser?.role;
    const currentUserId = currentUser?.userId;

    if (currentUserRole === 'staff' || currentUserRole === 'admin') {
      setSelectedTechnicianId(currentUserId);
    } else if (visitData.signing_technician_id) {
      setSelectedTechnicianId(visitData.signing_technician_id);
    } else if (technicians.length > 0) {
      // Fallback to first active technician
      setSelectedTechnicianId(technicians[0].userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId, navigate]);

  // DEBUG: Test function to check localStorage
  const debugCheckLocalStorage = () => {
    const allVisits = JSON.parse(localStorage.getItem('healit_visits') || '[]');
    const currentVisit = allVisits.find(v => v.visitId === visitId);
    
    console.log('=== DEBUG LOCALSTORAGE ===');
    console.log('All visits count:', allVisits.length);
    console.log('Current visitId:', visitId);
    console.log('Current visit from localStorage:', currentVisit);
    console.log('Tests in localStorage:', currentVisit?.tests?.map(t => ({
      testId: t.testId,
      name: t.name,
      value: t.value,
      status: t.status
    })));
    console.log('Tests with values:', currentVisit?.tests?.filter(t => t.value).length);
    console.log('===========================');
    
    alert(`Visit ${visitId}\nTests: ${currentVisit?.tests?.length}\nWith values: ${currentVisit?.tests?.filter(t => t.value).length}`);
  };

  // Save results (defined before useEffect that uses it)
  const handleSave = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    
    if (!visit) {
      console.error('❌ handleSave: No visit data!');
      return;
    }
    
    if (!visit.tests || visit.tests.length === 0) {
      console.error('❌ handleSave: No tests in visit!');
      return;
    }

    setSaveStatus('saving');

    try {
      // Update visit with results - including ALL test data (prices, removed tests, etc.)
      const updatedTests = visit.tests.map(test => {
        const testResult = results[test.testId];
        const newValue = testResult?.value || '';
        const newStatus = testResult?.status || 'normal';
        
        console.log(`💾 Mapping test ${test.testId} (${test.name}): oldValue="${test.value}" -> newValue="${newValue}"`);
        
        return {
          ...test,
          value: newValue,
          status: newStatus
        };
      });

      console.log('💾 SAVING RESULTS - Total tests:', updatedTests.length);
      console.log('💾 SAVING RESULTS - Tests with values:', updatedTests.filter(t => t.value).length);
      console.log('💾 SAVING RESULTS - updatedTests:', updatedTests.map(t => ({ testId: t.testId, name: t.name, value: t.value })));

      // CRITICAL FIX: Use updateVisit to save the ENTIRE tests array with values
      const savedVisit = updateVisit(visitId, {
        tests: updatedTests,
        discount: discount
      });
      
      if (!savedVisit) {
        console.error('❌ updateVisit returned null!');
        
        // 🚀 RETRY LOGIC: Try again if save failed
        if (retryCount < MAX_RETRIES) {
          console.warn(`🔄 Retry attempt ${retryCount + 1}/${MAX_RETRIES}...`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
          return handleSave(retryCount + 1); // Recursive retry
        }
        
        setSaveStatus('error');
        toast.error('❌ Failed to save results after 3 attempts. Please try again.');
        return;
      }
      
      console.log('✅ SAVED to localStorage - visitId:', visitId);
      console.log('💾 savedVisit returned - tests count:', savedVisit.tests?.length);
      console.log('💾 savedVisit - tests with values:', savedVisit.tests?.filter(t => t.value).length);
      
      // CRITICAL: Update local state with saved data
      setVisit(savedVisit);
      
      // CRITICAL FIX: Also update results state from saved visit
      const refreshedResults = {};
      savedVisit.tests.forEach(test => {
        refreshedResults[test.testId] = {
          value: test.value || '',
          status: test.status || 'normal'
        };
      });
      setResults(refreshedResults);
      console.log('🔄 REFRESHED results state - count:', Object.keys(refreshedResults).length);
      console.log('🔄 REFRESHED results state - with values:', Object.values(refreshedResults).filter(r => r.value).length);
      
      // 🚀 CRITICAL: Verify save by reloading from localStorage
      const verifyVisit = getVisitById(visitId);
      if (!verifyVisit || !verifyVisit.tests) {
        console.error('❌ VERIFICATION FAILED - Data not found in localStorage!');
        
        // Retry save if verification fails
        if (retryCount < MAX_RETRIES) {
          console.warn(`🔄 Verification failed - Retry ${retryCount + 1}/${MAX_RETRIES}...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          return handleSave(retryCount + 1);
        }
        
        toast.error('⚠️ Save verification failed. Please check data and try again.');
        setSaveStatus('error');
        return;
      }
      
      const verifiedCount = verifyVisit.tests.filter(t => t.value).length;
      const expectedCount = updatedTests.filter(t => t.value).length;
      
      if (verifiedCount !== expectedCount) {
        console.error(`❌ VERIFICATION MISMATCH - Expected ${expectedCount} values, found ${verifiedCount}`);
        
        // Retry if counts don't match
        if (retryCount < MAX_RETRIES) {
          console.warn(`🔄 Count mismatch - Retry ${retryCount + 1}/${MAX_RETRIES}...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          return handleSave(retryCount + 1);
        }
        
        toast.error('⚠️ Data verification failed. Some values may not be saved.');
      } else {
        console.log('✅ VERIFICATION PASSED - All values saved correctly!');
      }
      
      console.log('🔍 VERIFY SAVE - tests count:', verifyVisit?.tests?.length);
      console.log('🔍 VERIFY SAVE - tests with values:', verifyVisit?.tests?.filter(t => t.value).length);
      console.log('🔍 VERIFY SAVE - reloaded tests:', verifyVisit?.tests?.map(t => ({ name: t.name, value: t.value })));

      // Audit log
      console.log('AUDIT: SAVE_RESULTS', {
        userId: currentUser?.userId,
        visitId,
        action: 'SAVE_RESULTS',
        timestamp: new Date().toISOString(),
        verifiedCount,
        expectedCount,
        retryCount
      });

      setSaveStatus('saved');
      
      // Show success message only on first attempt (not retries)
      if (retryCount === 0) {
        // REMOVED: toast.success('✅ Results saved!'); - To prevent message flood
      }

      // Reset to saved after 2 seconds
      setTimeout(() => {
        setSaveStatus('');
      }, 2000);
    } catch (error) {
      console.error('❌ Save error:', error);
      
      // 🚀 RETRY LOGIC: Try again on error
      if (retryCount < MAX_RETRIES) {
        console.warn(`🔄 Error occurred - Retry ${retryCount + 1}/${MAX_RETRIES}...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return handleSave(retryCount + 1);
      }
      
      setSaveStatus('error');
      toast.error(`❌ Failed to save results: ${error.message}\n\nPlease try again or contact support.`);
    }
  }, [visit, visitId, currentUser, results, discount]);

  // Auto-save functionality (only for result changes)
  useEffect(() => {
    if (!visit || Object.keys(results).length === 0) return;

    // Skip auto-save on initial load
    const hasAnyValue = Object.values(results).some(r => r.value !== '');
    if (!hasAnyValue) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // INSTANT SAVE: Reduced delay from 2000ms to 500ms for faster feedback
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  // Handle result input change with validation
  const handleResultChange = (testId, value) => {
    console.log(`🔴 INPUT CHANGE - testId: ${testId}, value: "${value}"`);
    
    const test = visit.tests.find(t => t.testId === testId);
    if (!test) {
      console.error('❌ Test not found:', testId);
      return;
    }
    
    console.log(`📝 Test found:`, test.name, 'inputType:', test.inputType_snapshot);
    
    let status = 'normal';

    // Only validate and calculate status for numeric input types
    if (test.inputType_snapshot === 'number') {
      // Allow empty string or valid numeric values (int/float)
      if (value !== '') {
        // Strict validation: only allow numbers, decimals, and one decimal point
        const numericPattern = /^-?\d*\.?\d*$/;
        if (!numericPattern.test(value)) {
          toast.error('⚠️ Please enter a valid number (integers or decimals only)');
          return;
        }

        const numValue = parseFloat(value);

        // Strict validation: must be a valid number (int or float)
        if (isNaN(numValue) || !isFinite(numValue)) {
          toast.error('⚠️ Please enter a valid number (integers or decimals only)');
          return;
        }

        // Check for negative values
        if (numValue < 0) {
          toast.error('⚠️ Value cannot be negative');
          return;
        }

        // Maximum value check (reasonable medical range)
        if (numValue > 999999) {
          toast.error('⚠️ Value too large (max: 999,999)');
          return;
        }

        // Calculate status based on reference ranges
        // Priority 1: Use refLow_snapshot and refHigh_snapshot if available
        let refHigh = parseFloat(test.refHigh_snapshot);
        let refLow = parseFloat(test.refLow_snapshot);

        // Priority 2: Parse bioReference_snapshot if refLow/refHigh not available
        if ((isNaN(refLow) || isNaN(refHigh)) && (test.bioReference_snapshot || test.bioReference)) {
          const rangeStr = test.bioReference_snapshot || test.bioReference;
          const parsedRange = parseRange(rangeStr);

          if (parsedRange) {
            if (parsedRange.type === 'range') {
              refLow = parsedRange.min;
              refHigh = parsedRange.max;
            } else if (parsedRange.type === 'lt' || parsedRange.type === 'lte') {
              refHigh = parsedRange.value;
            } else if (parsedRange.type === 'gt' || parsedRange.type === 'gte') {
              refLow = parsedRange.value;
            }
          }
        }

        // Determine status: high, low, or normal
        if (!isNaN(refHigh) && numValue > refHigh) {
          status = 'high';
        } else if (!isNaN(refLow) && numValue < refLow) {
          status = 'low';
        } else if (!isNaN(refLow) && !isNaN(refHigh) && numValue >= refLow && numValue <= refHigh) {
          status = 'normal';
        } else {
          // If reference ranges are not properly set, default to normal
          status = 'normal';
        }
      }
    } else if (test.inputType_snapshot === 'text') {
      // Text input: no status calculation, always normal
      status = 'normal';

      // Validate text length
      if (value.length > 200) {
        toast.error('⚠️ Text value too long (max 200 characters)');
        return;
      }
    } else if (test.inputType_snapshot === 'select') {
      // Dropdown/select: no status calculation, always normal
      status = 'normal';
    } else {
      // Default: normal for any other type
      status = 'normal';
    }

    // Update results with value and calculated status
    setResults(prev => {
      const updated = {
        ...prev,
        [testId]: { value, status }
      };
      
      const withValues = Object.values(updated).filter(r => r.value !== '').length;
      console.log(`✅ UPDATED results state for ${testId}:`, { value, status });
      console.log(`📊 Results state now has ${Object.keys(updated).length} tests, ${withValues} with values`);
      
      return updated;
    });
  };

  // Handle price change with validation
  const handlePriceChange = (testIndex, newPrice) => {
    const priceValue = parseFloat(newPrice);

    // Validate price
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error('Please enter a valid price (must be 0 or greater)');
      return;
    }

    if (priceValue > 100000) {
      toast.error('Price too high (max ₹100,000)');
      return;
    }

    setVisit(prev => {
      const updatedTests = [...prev.tests];
      updatedTests[testIndex] = {
        ...updatedTests[testIndex],
        price_snapshot: priceValue,
        price: priceValue // Update both for consistency
      };
      return { ...prev, tests: updatedTests };
    });

    // Trigger auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 2000);
  };

  // Handle remove test
  const handleRemoveTest = (testIndex) => {
    if (!canEditResults) {
      toast.error('Cannot remove tests - results are locked');
      return;
    }

    const test = visit.tests[testIndex];
    const confirmed = window.confirm(`Remove "${test.name || test.name_snapshot}" from this visit?`);

    if (!confirmed) return;

    setVisit(prev => {
      const updatedTests = prev.tests.filter((_, idx) => idx !== testIndex);
      return { ...prev, tests: updatedTests };
    });

    // Remove from results state as well
    setResults(prev => {
      const updated = { ...prev };
      delete updated[test.testId];
      return updated;
    });

    toast.success('Test removed successfully');

    // Trigger auto-save immediately
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 500);
  };

  // Toggle test selection for multi-select
  const handleToggleTestSelection = (test) => {
    setSelectedTestsToAdd(prev => {
      const exists = prev.find(t => t.testId === test.testId);
      if (exists) {
        return prev.filter(t => t.testId !== test.testId);
      } else {
        return [...prev, test];
      }
    });
  };

  // Add multiple tests
  const handleAddMultipleTests = () => {
    if (selectedTestsToAdd.length === 0) {
      toast.error('Please select at least one test');
      return;
    }

    let addedCount = 0;
    selectedTestsToAdd.forEach(test => {
      // Check if test already exists
      const exists = visit.tests.some(t => t.testId === test.testId);
      if (!exists) {
        setVisit(prev => {
          const newTest = {
            testId: test.testId,
            name: test.name,
            name_snapshot: test.name,
            code_snapshot: test.code,
            inputType_snapshot: test.inputType,
            unit_snapshot: test.unit,
            refLow_snapshot: test.refLow,
            refHigh_snapshot: test.refHigh,
            refText_snapshot: test.refText,
            dropdownOptions_snapshot: test.dropdownOptions,
            price_snapshot: test.price,
            value: '',
            status: 'normal'
          };

          return { ...prev, tests: [...prev.tests, newTest] };
        });

        // Initialize result for new test
        setResults(prev => ({
          ...prev,
          [test.testId]: { value: '', status: 'normal' }
        }));

        addedCount++;
      }
    });

    toast.success(`Added ${addedCount} test(s)`);
    setShowAddTestModal(false);
    setTestSearchQuery('');
    setMultiSelectMode(false);
    setSelectedTestsToAdd([]);
  };

  // Handle add test (single or multi-select mode)
  const handleAddTest = (test) => {
    if (multiSelectMode) {
      handleToggleTestSelection(test);
      return;
    }

    if (!canEditResults) {
      toast.error('Cannot add tests - results are locked');
      return;
    }

    // Check if test already exists
    const exists = visit.tests.some(t => t.testId === test.testId);
    if (exists) {
      toast.error('Test already added to this visit');
      return;
    }

    setVisit(prev => {
      const newTest = {
        testId: test.testId,
        name: test.name,
        name_snapshot: test.name,
        code_snapshot: test.code,
        inputType_snapshot: test.inputType,
        unit_snapshot: test.unit,
        refLow_snapshot: test.refLow,
        refHigh_snapshot: test.refHigh,
        refText_snapshot: test.refText,
        dropdownOptions_snapshot: test.dropdownOptions,
        price_snapshot: test.price,
        value: '',
        status: 'NORMAL'
      };

      return { ...prev, tests: [...prev.tests, newTest] };
    });

    // Initialize result for new test
    setResults(prev => ({
      ...prev,
      [test.testId]: { value: '', status: 'NORMAL' }
    }));

    toast.success(`${test.name} added successfully`);
    setShowAddTestModal(false);
    setTestSearchQuery('');
  };

  // Handle discount change with validation
  const handleDiscountChange = (newDiscount) => {
    const discountValue = parseFloat(newDiscount);

    // Validate discount
    if (isNaN(discountValue)) {
      toast.error('Please enter a valid discount percentage');
      return;
    }

    if (discountValue < 0 || discountValue > 100) {
      toast.error('Discount must be between 0-100%');
      return;
    }

    setDiscount(discountValue);

    // Trigger auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 2000);
  };

  // Validate before generating report
  const validateBeforeGenerate = () => {
    const errors = [];

    if (!visit.collectedAt) {
      errors.push('Sample collection time not recorded');
    }

    if (!visit.receivedAt) {
      errors.push('Sample received time not recorded');
    }

    if (!selectedTechnicianId) {
      errors.push('Please select a signing technician');
    }

    // ENHANCED: Check each profile separately
    const profileGroups = {};
    visit.tests.forEach(test => {
      const profileId = test.profileId || test.profile || 'UNKNOWN';
      if (!profileGroups[profileId]) {
        profileGroups[profileId] = {
          tests: [],
          profileName: test.profileName || 'Unknown Profile'
        };
      }
      profileGroups[profileId].tests.push(test);
    });
    
    // Validate each profile
    Object.entries(profileGroups).forEach(([profileId, group]) => {
      const testsWithValues = group.tests.filter(t => {
        const value = results[t.testId]?.value;
        return value !== undefined && value !== null && value !== '';
      });
      
      const totalTests = group.tests.length;
      const filledTests = testsWithValues.length;
      const emptyTests = totalTests - filledTests;
      
      if (emptyTests > 0) {
        errors.push(`⚠️ ${group.profileName}: ${emptyTests}/${totalTests} tests empty`);
      }
    });

    return errors;
  };
  
  // Get profile-grouped tests for review
  const getProfileGroupedTests = () => {
    if (!visit || !visit.tests) return [];
    
    const profileGroups = {};
    visit.tests.forEach(test => {
      const profileId = test.profileId || test.profile || 'UNKNOWN';
      if (!profileGroups[profileId]) {
        profileGroups[profileId] = {
          profileId,
          profileName: test.profileName || 'Unknown Profile',
          tests: []
        };
      }
      
      profileGroups[profileId].tests.push({
        testId: test.testId,
        name: test.name || test.description,
        value: results[test.testId]?.value || '',
        status: results[test.testId]?.status || 'normal',
        unit: test.unit || test.unit_snapshot || '',
        bioReference: test.bioReference || test.bioReference_snapshot || ''
      });
    });
    
    return Object.values(profileGroups);
  };

  // Generate Invoice PDF with auto-redirect
  const handleGenerateInvoice = async () => {
    try {
      // Save first
      await handleSave();

      // Update payment status to paid
      const updatedVisit = updateVisit(visitId, {
        paymentStatus: 'paid',
        paidAt: new Date().toISOString(),
        discount
      });

      // Get all profiles
      const allProfiles = getProfiles();

      // Build visit data with profile info
      const visitData = {
        ...updatedVisit,
        patient,
        tests: updatedVisit.tests,
        collectedAt: updatedVisit.collectedAt,
        receivedAt: updatedVisit.receivedAt,
        reportedAt: updatedVisit.reportedAt,
        paymentStatus: 'paid',
        paymentMethod: updatedVisit.paymentMethod || 'Cash',
        created_by_name: currentUser?.fullName || currentUser?.username
      };

      // Generate combined invoice with all profiles
      const result = await generateCombinedInvoice(visitData, allProfiles, { download: true, print: false });

      if (result.success) {
        toast.success(`✅ Invoice generated with ${result.profileCount} profile(s)!`);
      } else {
        toast.error(`⚠️ Failed to generate invoice: ${result.error}`);
      }

      // Update local state
      setVisit(updatedVisit);

      // Trigger all data update events
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('dataUpdated'));
      window.dispatchEvent(new CustomEvent('healit-data-update', {
        detail: { type: 'invoice_generated', visitId }
      }));

      // Log audit
      console.log('AUDIT: GENERATE_INVOICE', {
        userId: currentUser?.userId,
        visitId,
        action: 'GENERATE_INVOICE',
        timestamp: new Date().toISOString(),
        amount: billing.finalAmount
      });

      // Auto-redirect to dashboard after 2 seconds
      setTimeout(() => {
        toast.success('Redirecting to dashboard...');
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Invoice generation error:', error);
      toast.error('Failed to generate invoice: ' + error.message);
    }
  };

  // Print Report
  const handlePrintReport = () => {
    if (!visit.reportedAt) {
      toast.error('Please generate report first');
      return;
    }

    const visitData = {
      ...visit,
      patient,
      profile
    };

    printReportPDF(visitData);
    toast.success('Opening print dialog...');
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    if (!visit.reportedAt) {
      toast.error('Please generate report first');
      return;
    }

    const visitData = {
      ...visit,
      patient,
      profile
    };

    shareViaWhatsApp(visitData, patient.phone);
  };

  // Share via Email
  const handleShareEmail = async () => {
    if (!visit.reportedAt) {
      toast.error('Please generate report first');
      return;
    }

    let signingTechnician = null;
    if (visit.signing_technician_id) {
      // Use getUsers() which is already imported
      const users = getUsers();
      signingTechnician = users.find(u => u.userId === visit.signing_technician_id);
    }

    const visitData = {
      ...visit,
      patient,
      profile,
      signingTechnician
    };

    const email = prompt('Enter email address:', patient.email || '');
    if (email) {
      try {
        const result = await shareViaEmail(visitData, email);
        if (result.success) {
          toast.success(result.message || 'Email opened with PDF ready to share!');
        } else {
          toast.error('Failed to share via email: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Email share error:', error);
        toast.error('Failed to share via email');
      }
    }
  };

  // NEW: Mark PDF action as complete
  const markPdfActionComplete = (profileId, action) => {
    setPdfCompletionStatus(prev => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        [action]: true
      }
    }));
  };

  // NEW: Check if all PDFs are completed
  const allPdfsCompleted = () => {
    return Object.values(pdfCompletionStatus).every(status =>
      status.printed || status.downloaded || status.shared
    );
  };

  // NEW: Complete and mark paid
  const handleCompleteAndMarkPaid = async () => {
    try {
      // Update visit status
      const updatedVisit = updateVisit(visitId, {
        visitStatus: 'completed',
        paymentStatus: 'paid',
        paidAt: new Date().toISOString()
      });

      // Close modal
      setShowPdfActionsModal(false);

      // Trigger all data update events
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('dataUpdated'));
      window.dispatchEvent(new CustomEvent('healit-data-update', {
        detail: { type: 'visit_completed', visitId }
      }));

      toast.success('✅ Visit completed and marked as paid!');

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Complete error:', error);
      toast.error('Failed to complete visit');
    }
  };

  // ========== KEYBOARD SHORTCUTS ==========
  // Handle Enter key to move to next input
  const handleKeyDown = (e, testId) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission

      // Find current input's index
      const allTests = visit.tests || [];
      const currentIndex = allTests.findIndex(t => t.testId === testId);

      // Move to next test input
      if (currentIndex < allTests.length - 1) {
        const nextTest = allTests[currentIndex + 1];
        const nextInput = document.querySelector(`input[data-test-id="${nextTest.testId}"], select[data-test-id="${nextTest.testId}"]`);
        if (nextInput) {
          nextInput.focus();
          if (nextInput.select) nextInput.select(); // Select all text for easy overwrite
        }
      } else {
        // Last field - focus on Save button or Generate Report
        const saveButton = document.querySelector('.action-bar-glass button[title*="Save"]');
        if (saveButton) saveButton.focus();
      }
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyboard = (e) => {
      // Ctrl+S to save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
        toast.success('✨ Saved! (Ctrl+S)');
      }

      // Ctrl+Enter to generate report
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        // Check if any results entered
        const hasAnyResults = Object.values(results).some(r => r.value !== '');
        if (hasAnyResults) {
          handleGenerateReport();
        } else {
          toast.error('Please enter test results first');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyboard);
    return () => window.removeEventListener('keydown', handleGlobalKeyboard);
  }, [results, handleSave]); // eslint-disable-line

  // Render result input based on type
  const renderResultInput = (test) => {
    const testId = test.testId;
    const inputType = test.inputType_snapshot;
    const currentValue = results[testId]?.value || '';
    const status = results[testId]?.status || 'normal';
    const isAbnormal = status === 'high' || status === 'low';

    const inputClass = `result-input ${inputType === 'number' ? 'numeric' : ''} ${isAbnormal ? 'abnormal-result ' + status : ''}`;

    switch (inputType) {
      case 'number':
        return (
          <input
            type="text"
            inputMode="decimal"
            value={currentValue}
            onChange={(e) => handleResultChange(testId, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, testId)}
            data-test-id={testId}
            className={inputClass}
            placeholder="Enter value (numbers only)"
            title="Press Enter to move to next field. Only integers and decimals allowed."
          />
        );

      case 'text':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleResultChange(testId, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, testId)}
            data-test-id={testId}
            className="result-input text"
            placeholder="Enter text"
            title="Press Enter to move to next field"
          />
        );

      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleResultChange(testId, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, testId)}
            data-test-id={testId}
            className="result-input select"
            title="Press Enter to move to next field"
          >
            <option value="">Select...</option>
            {test.dropdownOptions_snapshot?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleResultChange(testId, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, testId)}
            data-test-id={testId}
            className="result-input"
            placeholder="Enter result"
            title="Press Enter to move to next field"
          />
        );
    }
  };

  // Render status badge
  const renderStatusBadge = (testId) => {
    const status = results[testId]?.status || 'normal';

    if (!results[testId]?.value) return null;

    return (
      <span className={`status-badge ${status.toLowerCase()}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  // Format reference range
  const formatReference = (test) => {
    const parts = [];

    if (test.inputType_snapshot === 'number' && test.refLow_snapshot && test.refHigh_snapshot) {
      parts.push(`${test.refLow_snapshot}–${test.refHigh_snapshot} ${test.unit_snapshot}`);
    }

    if (test.refText_snapshot) {
      parts.push(test.refText_snapshot);
    }

    return parts.length > 0 ? parts.join('\n') : '—';
  };

  // Calculate billing summary
  const calculateBilling = () => {
    if (!visit || !visit.tests) return { testCount: 0, subtotal: 0, discountAmount: 0, finalAmount: 0 };

    const subtotal = visit.tests.reduce((sum, test) => sum + (test.price_snapshot || test.price || 0), 0);
    const discountAmount = (subtotal * discount) / 100;
    const finalAmount = subtotal - discountAmount;

    return {
      testCount: visit.tests.length,
      subtotal,
      discountAmount,
      finalAmount
    };
  };

  const billing = calculateBilling();

  // Check if any results have been entered
  const hasResults = Object.values(results).some(r => r.value !== '');

  // Check if can edit (allow both admin AND staff to edit even after report generation)
  const canEditResults = !visit?.reportedAt || role === 'admin' || role === 'staff';

  if (!visit || !patient) {
    return (
      <div className="loading-container">
        <Loader className="spinner" size={32} />
        <p>Loading visit data...</p>
      </div>
    );
  }

  return (
    <div className="result-entry-premium">
      {/* Premium Glass Header */}
      <div className="premium-header-result">
        <div className="header-left-result">
          <Button variant="ghost" size="small" onClick={() => navigate(`/sample-times/${visitId}`)} icon={ArrowLeft}>
            Back
          </Button>
          <div className="visit-info-compact">
            <h1>Test Results Entry</h1>
            <div className="meta-tags">
              <span className="tag-patient">{patient.name}</span>
              <span className="tag-age">{patient.age}Y/{patient.gender}</span>
              {profile && <span className="tag-profile">{profile.name}</span>}
            </div>
          </div>
        </div>

        {/* Quick Action Icons */}
        <div className="header-actions-result">
          <Button variant="ghost" size="small" onClick={() => navigate('/dashboard')} icon={Home}>
            Home
          </Button>
          <button className="icon-btn-glass" onClick={handleShareWhatsApp} title="Share via WhatsApp">
            <MessageCircle size={20} />
          </button>
          <button className="icon-btn-glass" onClick={handlePrintReport} title="Print">
            <Printer size={20} />
          </button>
          <button className="icon-btn-glass" onClick={handleShareEmail} title="Email">
            <Mail size={20} />
          </button>
        </div>
      </div>

      {/* Locked Message */}
      {!canEditResults && (
        <div className="locked-message-glass">
          <AlertCircle size={18} />
          <strong>Results Locked:</strong> Report generated. Contact admin to unlock.
        </div>
      )}

      {/* Full-Width Results Table */}
      <div className="results-container-premium">
        <div className="glass-card-results">
          <div className="card-header-glass">
            <div className="header-left">
              <TestTube2 size={20} />
              <h3>Test Results</h3>
              <span className="test-count">{visit.tests?.length || 0} tests</span>
              <Button
                variant="outline"
                size="small"
                onClick={() => setShowAddTestModal(true)}
                icon={Plus}
                disabled={!canEditResults}
              >
                Add Test
              </Button>
            </div>
            <div className="save-indicator-glass">
              {saveStatus === 'saving' && (
                <>
                  <Loader size={16} className="spinning" />
                  <span>Auto-saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check size={16} className="check-icon" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <span className="error-text">Save failed</span>
              )}
            </div>
          </div>

          <div className="results-table-wrapper-premium">
            <table className="results-table-premium">
              <thead>
                <tr>
                  <th className="col-num">#</th>
                  <th className="col-test-desc">Test Description</th>
                  <th className="col-result">Value</th>
                  <th className="col-reference">Bio Ref. Internal</th>
                  <th className="col-unit">Unit</th>
                  <th className="col-status">Status</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {visit.tests && visit.tests.length > 0 ? (
                  visit.tests.map((test, index) => (
                    <tr key={test.testId || index}>
                      <td className="col-num">{index + 1}</td>
                      <td className="col-test-desc">
                        <strong>{test.name || test.name_snapshot || test.description || 'Test ' + (index + 1)}</strong>
                      </td>
                      <td className="col-result">
                        {renderResultInput(test)}
                      </td>
                      <td className="col-reference">
                        <div className="reference-display">
                          {test.bioReference_snapshot || test.bioReference ? (
                            <span className="ref-text" style={{ whiteSpace: 'pre-wrap' }}>
                              {test.bioReference_snapshot || test.bioReference}
                            </span>
                          ) : test.refLow_snapshot && test.refHigh_snapshot ? (
                            <span className="ref-range">
                              {test.refLow_snapshot} – {test.refHigh_snapshot}
                            </span>
                          ) : (
                            <span className="ref-text">{test.refText_snapshot || '—'}</span>
                          )}
                        </div>
                      </td>
                      <td className="col-unit">
                        <span className="unit-value">{test.unit || test.unit_snapshot || '—'}</span>
                      </td>
                      <td className="col-status">
                        {renderStatusBadge(test.testId)}
                      </td>
                      <td className="col-action">
                        <button
                          className="btn-remove"
                          onClick={() => handleRemoveTest(index)}
                          disabled={!canEditResults}
                          title="Remove test"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-tests">No tests selected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Progress & Action Footer */}
        <div className="technician-info-glass">
          {/* Billing Summary */}
          <div className="billing-summary">
            <div className="billing-row">
              <span className="billing-label">Subtotal ({visit.tests?.length || 0} tests):</span>
              <span className="billing-value">₹{calculateBilling().subtotal.toFixed(2)}</span>
            </div>
            <div className="billing-row">
              <span className="billing-label">Discount:</span>
              <div className="discount-input-group">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="discount-input"
                  disabled={!canEditDiscount}
                  min="0"
                  max="100"
                  step="1"
                />
                <span className="discount-symbol">%</span>
                <span className="discount-amount">(-₹{calculateBilling().discountAmount.toFixed(2)})</span>
              </div>
            </div>
            <div className="billing-row billing-total">
              <span className="billing-label">Total Amount:</span>
              <span className="billing-value total">₹{calculateBilling().finalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-info">
              <span className="progress-label">Results Entered:</span>
              <span className="progress-value">
                {Object.values(results).filter(r => r.value).length} / {visit.tests?.length || 0}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(Object.values(results).filter(r => r.value).length / (visit.tests?.length || 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="action-buttons">
            <div className="save-indicator">
              {saveStatus === 'saving' && (
                <><Loader size={14} className="spinning" /> Auto-saving...</>
              )}
              {saveStatus === 'saved' && (
                <><Check size={14} className="check-icon" /> All saved</>
              )}
              {saveStatus === 'error' && (
                <><AlertCircle size={14} /> Save failed</>
              )}
            </div>

            <div className="actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* SAVE BUTTON - Manual save with confirmation */}
              <Button
                variant="success"
                onClick={async () => {
                  // Show confirmation before saving
                  const filledTests = Object.values(results).filter(r => r.value && r.value.trim() !== '').length;
                  const totalTests = visit.tests?.length || 0;
                  
                  const confirmMessage = `💾 SAVE ALL CHANGES\n\n` +
                    `⚠️ You are about to save:\n` +
                    `• Patient: ${patient.name}\n` +
                    `• Tests filled: ${filledTests}/${totalTests}\n\n` +
                    `🔍 Please verify all entered values are correct!\n\n` +
                    `✅ Confirm to save changes?`;
                  
                  const confirmed = window.confirm(confirmMessage);
                  if (!confirmed) {
                    toast.info('❌ Save cancelled');
                    return;
                  }
                  
                  // Force immediate save
                  if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                  }
                  
                  setSaveStatus('saving');
                  await handleSave();
                  
                  // Show success with detailed info
                  toast.success(
                    `✅ SAVED SUCCESSFULLY!\n\nSaved ${filledTests} test results.`,
                    { duration: 3000 }
                  );
                }}
                icon={Save}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? '🔄 Saving...' : '💾 SAVE Changes'}
              </Button>

              {/* Button 1: Generate Lab Reports Only */}
              <Button
                variant="secondary"
                onClick={async () => {
                  // STEP 1: Validate before proceeding
                  const errors = validateBeforeGenerate();
                  if (errors.length > 0) {
                    toast.error(
                      <div>
                        <strong>⚠️ Cannot generate PDF - Please fix these issues:</strong>
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                          {errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                      </div>,
                      { duration: 6000 }
                    );
                    return;
                  }
                  
                  // STEP 2: Get profile summary for confirmation
                  const profileGroups = getProfileGroupedTests();
                  const totalTests = visit.tests.length;
                  const filledTests = Object.values(results).filter(r => r.value !== '').length;
                  const profileCount = profileGroups.length;
                  
                  // STEP 3: Show detailed confirmation
                  const confirmMessage = `📄 GENERATE LAB REPORTS\n\n` +
                    `📈 Summary:\n` +
                    `• Patient: ${patient.name}\n` +
                    `• Profiles: ${profileCount}\n` +
                    `• Tests completed: ${filledTests}/${totalTests}\n` +
                    `• Technician: ${selectedTechnician?.fullName || 'Not selected'}\n\n` +
                    `🚨 WARNING: Once generated, report will be locked!\n\n` +
                    `✅ Confirm to generate PDF reports?`;
                  
                  const confirmed = window.confirm(confirmMessage);
                  if (!confirmed) {
                    toast.info('❌ PDF generation cancelled');
                    return;
                  }
                  
                  // STEP 4: Final validation before generation
                  toast.loading('🔄 Validating data...', { duration: 1000 });
                  
                  setIsGeneratingPDF(true);
                  try {
                    // STEP 5: Force immediate save
                    if (saveTimeoutRef.current) {
                      clearTimeout(saveTimeoutRef.current);
                    }
                    await handleSave();
                    
                    // Wait for save to complete
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // STEP 6: Update visit status
                    const now = new Date().toISOString();
                    const updatedVisit = {
                      ...visit,
                      reportedAt: now,
                      status: 'report_generated',
                      pdfGenerated: true,
                      signing_technician_id: selectedTechnicianId
                    };
                    
                    updateVisit(visitId, updatedVisit);
                    setVisit(updatedVisit);
                    
                    // Wait for update
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // STEP 7: Reload fresh data from localStorage
                    const latestVisit = getVisitById(visitId);
                    if (!latestVisit) {
                      throw new Error('Failed to reload visit data');
                    }
                    
                    // Verify data integrity
                    const verifyFilledTests = latestVisit.tests.filter(t => t.value).length;
                    console.log('🔍 PRE-PDF Verification - Tests with values:', verifyFilledTests, '/', latestVisit.tests.length);
                    
                    if (verifyFilledTests === 0) {
                      throw new Error('No test values found in saved data!');
                    }
                    
                    toast.loading('📝 Generating PDF...', { duration: 2000 });
                    
                    // STEP 8: Generate PDF with fresh data
                    const result = await generateCombinedLabReports(
                      { ...latestVisit, patient, signingTechnician: selectedTechnician },
                      getProfiles(),
                      { download: true, print: false }
                    );
                    
                    // STEP 9: Handle result
                    if (result && result.success) {
                      toast.success(
                        `✅ SUCCESS! Generated lab reports with ${result.profileCount} profile(s)!`,
                        { duration: 4000 }
                      );
                      
                      // Trigger data updates
                      window.dispatchEvent(new Event('storage'));
                      window.dispatchEvent(new Event('dataUpdated'));
                      window.dispatchEvent(new CustomEvent('healit-data-update', {
                        detail: { type: 'report_generated', visitId }
                      }));
                    } else {
                      throw new Error(result?.error || 'PDF generation failed');
                    }
                  } catch (error) {
                    console.error('❌ PDF generation error:', error);
                    toast.error(
                      `❌ Failed to generate PDF: ${error.message}\n\nPlease check console for details.`,
                      { duration: 5000 }
                    );
                  } finally {
                    setIsGeneratingPDF(false);
                  }
                }}
                icon={FileText}
                disabled={isGeneratingPDF || Object.values(results).filter(r => r.value).length === 0}
              >
                {isGeneratingPDF ? '🔄 Generating...' : '📄 Generate Lab Reports'}
              </Button>

              {/* Button 2: Generate Invoice Bill */}
              <Button
                variant="primary"
                onClick={async () => {
                  const errors = validateBeforeGenerate();
                  if (errors.length > 0) {
                    toast.error(
                      <div>
                        <strong>Cannot generate invoice:</strong>
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                          {errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                      </div>,
                      { duration: 5000 }
                    );
                    return;
                  }
                  
                  const confirmed = window.confirm(
                    '🧾 Generate Invoice Bill?\n\nThis will:\n• Generate INVOICE PDF\n• Mark visit as PAID\n• Mark visit as COMPLETED\n\nContinue?'
                  );
                  if (!confirmed) return;
                  
                  setIsGeneratingPDF(true);
                  try {
                    // CRITICAL: Force immediate save before invoice generation
                    if (saveTimeoutRef.current) {
                      clearTimeout(saveTimeoutRef.current);
                    }
                    await handleSave();
                    
                    // Wait 100ms to ensure save completes
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    const now = new Date().toISOString();
                    const updatedVisit = {
                      ...visit,
                      reportedAt: now,
                      status: 'completed',
                      pdfGenerated: true,
                      invoiceGenerated: true,
                      paymentStatus: 'paid',
                      paymentMethod: 'Cash',
                      signing_technician_id: selectedTechnicianId
                    };
                    
                    updateVisit(visitId, updatedVisit);
                    setVisit(updatedVisit);
                    
                    // Wait another 100ms for updateVisit to complete
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // CRITICAL FIX: Reload visit from localStorage to get latest values
                    const latestVisit = getVisitById(visitId);
                    if (!latestVisit) {
                      toast.error('❌ Visit not found!');
                      setIsGeneratingPDF(false);
                      return;
                    }
                    
                    console.log('🔍 Generate Invoice - Latest visit test values:', latestVisit.tests?.map(t => ({ name: t.name, value: t.value })));
                    
                    // Generate ONLY invoice
                    const result = await generateCombinedInvoice(
                      { ...latestVisit, patient, signingTechnician: selectedTechnician },
                      getProfiles(),
                      { download: true, print: false }
                    );
                    
                    if (result.success) {
                      toast.success('✅ Invoice Bill Generated! Visit marked as PAID & COMPLETED');
                      
                      window.dispatchEvent(new Event('storage'));
                      window.dispatchEvent(new Event('dataUpdated'));
                      window.dispatchEvent(new CustomEvent('healit-data-update', {
                        detail: {
                          type: 'visit_completed',
                          visitId,
                          status: 'completed',
                          paymentStatus: 'paid'
                        }
                      }));
                      
                      setTimeout(() => {
                        toast.success('Redirecting to dashboard...');
                        navigate('/dashboard');
                      }, 2000);
                    } else {
                      toast.error('Failed to generate invoice');
                    }
                  } catch (error) {
                    console.error('Invoice generation error:', error);
                    toast.error('Failed to generate invoice: ' + error.message);
                  } finally {
                    setIsGeneratingPDF(false);
                  }
                }}
                icon={FileText}
                disabled={isGeneratingPDF || Object.values(results).filter(r => r.value).length === 0}
              >
                {isGeneratingPDF ? 'Generating...' : '🧾 Generate Invoice Bill'}
              </Button>
            </div>

            <div className="helper-note">
              <AlertCircle size={14} />
              <span>Signed by: {currentUser?.fullName} ({currentUser?.qualification || 'Lab Technician'})</span>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="keyboard-shortcuts-hint">
              <Activity size={14} />
              <span>⚡ <strong>Shortcuts:</strong> ENTER = Next field | TAB = Navigate | Ctrl+S = Save | Ctrl+Enter = Generate Report</span>
            </div>
          </div>
        </div>
      </div>

      {/* Share Options Modal */}
      {showShareOptions && (
        <div className="share-modal-overlay" onClick={() => setShowShareOptions(false)}>
          <div className="share-modal-premium" onClick={(e) => e.stopPropagation()}>
            <h3>Share Report</h3>
            <p className="help-text">Choose how to share the medical report</p>
            <div className="share-options-grid">
              <Button variant="primary" onClick={() => downloadReportPDF({ ...visit, patient, profile, signingTechnician: selectedTechnician })} icon={Download} fullWidth>
                Download PDF
              </Button>
              <Button variant="outline" onClick={handlePrintReport} icon={Printer} fullWidth>
                Print Report
              </Button>
              <Button variant="outline" onClick={handleShareWhatsApp} icon={MessageCircle} fullWidth>
                Share via WhatsApp
              </Button>
              <Button variant="outline" onClick={handleShareEmail} icon={Mail} fullWidth>
                Share via Email
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setShowShareOptions(false)} fullWidth>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* PDF Actions Modal - Checklist */}
      {showPdfActionsModal && (
        <div className="modal-overlay" onClick={() => setShowPdfActionsModal(false)}>
          <div className="modal-content pdf-actions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 Generated Reports - Complete Actions</h3>
              <button className="close-btn" onClick={() => setShowPdfActionsModal(false)}>×</button>
            </div>

            <div className="pdf-actions-list">
              {generatedPdfResults.map((pdfResult, index) => {
                const status = pdfCompletionStatus[pdfResult.profileId] || {};
                const isCompleted = status.printed || status.downloaded || status.shared;

                return (
                  <div key={pdfResult.profileId} className={`pdf-action-item ${isCompleted ? 'completed' : ''}`}>
                    <div className="pdf-info">
                      <div className="pdf-checkbox">
                        {isCompleted ? (
                          <span className="checkmark">✓</span>
                        ) : (
                          <span className="pdf-number">{index + 1}</span>
                        )}
                      </div>
                      <div className="pdf-details">
                        <h4>{pdfResult.profileName}</h4>
                        <p className="pdf-filename">{pdfResult.fileName}</p>
                        {isCompleted && <p className="completion-status">✓ Handled</p>}
                      </div>
                    </div>

                    <div className="pdf-actions">
                      {/* Print */}
                      <button
                        className="action-btn print-btn"
                        onClick={async () => {
                          if (pdfResult.isInvoice) {
                            await generateCombinedInvoice(
                              { ...visit, patient, signingTechnician: selectedTechnician },
                              getProfiles(),
                              { download: false, print: true }
                            );
                            // Mark all as complete for Invoice when printed, as requested
                            markPdfActionComplete(pdfResult.profileId, 'printed');
                            markPdfActionComplete(pdfResult.profileId, 'downloaded');
                            markPdfActionComplete(pdfResult.profileId, 'shared');
                            toast.success(`🖨️ Print dialog opened for Invoice`);
                          } else {
                            await generateProfileReports(
                              { ...visit, patient, signingTechnician: selectedTechnician },
                              getProfiles(),
                              { download: false, print: true, profileFilter: pdfResult.profileId }
                            );
                            markPdfActionComplete(pdfResult.profileId, 'printed');
                            toast.success(`🖨️ Print dialog opened for ${pdfResult.profileName}`);
                          }
                        }}
                      >
                        <Printer size={18} />
                        Print
                      </button>

                      {/* Download */}
                      <button
                        className="action-btn download-btn"
                        onClick={async () => {
                          if (pdfResult.isInvoice) {
                            await generateCombinedInvoice(
                              { ...visit, patient, signingTechnician: selectedTechnician },
                              getProfiles(),
                              { download: true, print: false }
                            );
                            markPdfActionComplete(pdfResult.profileId, 'downloaded');
                            toast.success(`⬇️ Downloaded: ${pdfResult.fileName}`);
                          } else {
                            await generateProfileReports(
                              { ...visit, patient, signingTechnician: selectedTechnician },
                              getProfiles(),
                              { download: true, print: false, profileFilter: pdfResult.profileId }
                            );
                            markPdfActionComplete(pdfResult.profileId, 'downloaded');
                            toast.success(`⬇️ Downloaded: ${pdfResult.fileName}`);
                          }
                        }}
                      >
                        <Download size={18} />
                        Download
                      </button>

                      {/* WhatsApp */}
                      <button
                        className="action-btn whatsapp-btn"
                        onClick={() => {
                          const phone = patient.phone || '1234567890';
                          const reportType = pdfResult.isInvoice ? 'Invoice' : pdfResult.profileName;
                          const message = `Hi ${patient.name}, your ${pdfResult.isInvoice ? 'invoice' : 'lab report'} for ${reportType} is ready. Please contact us to collect it. - ${currentUser?.fullName || 'Lab'}`;
                          const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                          window.open(whatsappUrl, '_blank');
                          markPdfActionComplete(pdfResult.profileId, 'shared');
                          toast.success(`📱 WhatsApp opened for ${reportType}`);
                        }}
                      >
                        <MessageCircle size={18} />
                        WhatsApp
                      </button>

                      {/* Email */}
                      <button
                        className="action-btn email-btn"
                        onClick={() => {
                          const email = patient.email || '';
                          const reportType = pdfResult.isInvoice ? 'Invoice' : pdfResult.profileName;
                          const subject = `Lab ${pdfResult.isInvoice ? 'Invoice' : 'Report'} - ${reportType} - ${patient.name}`;
                          const body = `Dear ${patient.name},

Your ${pdfResult.isInvoice ? 'invoice' : 'lab report'} for ${reportType} is ready.

Please contact us to collect it.

Thank you,
${currentUser?.fullName || 'Lab Team'}`;
                          const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                          window.open(mailtoUrl, '_blank');
                          markPdfActionComplete(pdfResult.profileId, 'shared');
                          toast.success(`📧 Email opened for ${reportType}`);
                        }}
                      >
                        <Mail size={18} />
                        Email
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="modal-footer">
              {allPdfsCompleted() ? (
                <>
                  <div className="completion-message">
                    <CheckCircle size={20} color="#10B981" />
                    <span>All reports handled! Ready to complete.</span>
                  </div>
                  <Button
                    variant="success"
                    onClick={handleCompleteAndMarkPaid}
                    icon={CheckCircle}
                  >
                    Complete & Mark Paid
                  </Button>
                </>
              ) : (
                <>
                  <div className="completion-message warning">
                    <Activity size={20} color="#F59E0B" />
                    <span>
                      {Object.values(pdfCompletionStatus).filter(s => s.printed || s.downloaded || s.shared).length} / {generatedPdfResults.length} completed
                    </span>
                  </div>
                  <Button variant="ghost" onClick={() => setShowPdfActionsModal(false)}>
                    Close
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Test Modal */}
      {showAddTestModal && (
        <div className="share-modal-overlay" onClick={() => {
          setShowAddTestModal(false);
          setMultiSelectMode(false);
          setSelectedTestsToAdd([]);
        }}>
          <div className="add-test-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Test(s)</h3>
              <button className="close-btn" onClick={() => {
                setShowAddTestModal(false);
                setMultiSelectMode(false);
                setSelectedTestsToAdd([]);
              }}>
                <X size={20} />
              </button>
            </div>

            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                value={testSearchQuery}
                onChange={(e) => setTestSearchQuery(e.target.value)}
                placeholder="Search tests by name or code..."
                autoFocus
              />
            </div>

            {/* Multi-select toggle */}
            <div className="modal-toolbar">
              <button
                className={`multi-select-toggle ${multiSelectMode ? 'active' : ''}`}
                onClick={() => {
                  setMultiSelectMode(!multiSelectMode);
                  setSelectedTestsToAdd([]);
                }}
                type="button"
              >
                {multiSelectMode ? '✓ Multi-Select ON' : 'Multi-Select OFF'}
              </button>
              {multiSelectMode && selectedTestsToAdd.length > 0 && (
                <button
                  className="add-selected-btn"
                  onClick={handleAddMultipleTests}
                  type="button"
                >
                  Add {selectedTestsToAdd.length} Test(s)
                </button>
              )}
            </div>

            <div className="test-list">
              {loadingTests ? (
                <div className="loading-state">
                  <Loader size={24} className="spinning" />
                  <p>Loading tests...</p>
                </div>
              ) : availableTests.length === 0 ? (
                <div className="empty-state">
                  <p>No tests available. Please add at least one test.</p>
                </div>
              ) : (
                availableTests.map(test => {
                  const isSelected = selectedTestsToAdd.find(t => t.testId === test.testId);
                  return (
                    <div
                      key={test.testId}
                      className={`test-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleAddTest(test)}
                    >
                      {multiSelectMode && (
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleTestSelection(test);
                          }}
                          className="test-checkbox"
                        />
                      )}
                      <div className="test-info">
                        <strong>{test.name}</strong>
                        <span className="test-code">{test.code}</span>
                      </div>
                      <div className="test-price">₹{test.price}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultEntryPage;
