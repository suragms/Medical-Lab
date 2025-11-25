import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, FileText, Receipt, Check, Loader, Download, Printer, Share2, Mail, AlertCircle, TrendingUp, TrendingDown, MessageCircle, TestTube2, Plus, Search, X, Home, Activity, CheckCircle } from 'lucide-react';
import { getVisitById, updateVisit, getPatientById, getProfileById, getTestsMaster, getProfiles } from '../../features/shared/dataService';
import { getSettings } from '../../services/settingsService';
import { useAuthStore } from '../../store';
import { getCurrentUser, getUsers } from '../../services/authService';
import { downloadReportPDF, printReportPDF, shareViaWhatsApp, shareViaEmail } from '../../utils/pdfGenerator';
import { generateCombinedInvoice, generateProfileReports, generateCombinedReportAndInvoice } from '../../utils/profilePdfHelper';
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
    const visitData = getVisitById(visitId);
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
      });
    }
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
  }, [visitId]);

  // Save results (defined before useEffect that uses it)
  const handleSave = useCallback(() => {
    if (!visit) return;

    setSaveStatus('saving');

    try {
      // Update visit with results - including ALL test data (prices, removed tests, etc.)
      const updatedTests = visit.tests.map(test => ({
        ...test,
        value: results[test.testId]?.value || '',
        status: results[test.testId]?.status || 'normal'
      }));

      // Use updateVisit to save ALL changes (tests array, discount, etc.)
      updateVisit(visitId, {
        tests: updatedTests,
        discount: discount
      });

      // Audit log
      console.log('AUDIT: SAVE_RESULTS', {
        userId: currentUser?.userId,
        visitId,
        action: 'SAVE_RESULTS',
        timestamp: new Date().toISOString()
      });

      setSaveStatus('saved');

      // Reset to saved after 2 seconds
      setTimeout(() => {
        setSaveStatus('');
      }, 2000);
    } catch (error) {
      setSaveStatus('error');
      toast.error('Failed to save results');
      console.error('Save error:', error);
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

    // Set new timeout for autosave (2 seconds after input stops)
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  // Handle result input change with validation
  const handleResultChange = (testId, value) => {
    const test = visit.tests.find(t => t.testId === testId);
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
    setResults(prev => ({
      ...prev,
      [testId]: { value, status }
    }));
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

    // Check if at least one result entered (if configured)
    const hasResults = Object.values(results).some(r => r.value !== '');
    if (!hasResults && !settings.allowPartialReports) {
      errors.push('Please enter at least one test result');
    }

    return errors;
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

  // Check if can edit (not locked after report generation, unless admin)
  const canEditResults = !visit?.reportedAt || role === 'admin';

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
          <strong>Results Locked:</strong> Report generated. Only admins can edit.
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

            <Button
              variant="primary"
              onClick={async () => {
                const errors = validateBeforeGenerate();
                if (errors.length > 0) {
                  toast.error(
                    <div>
                      <strong>Cannot generate PDF:</strong>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                        {errors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>,
                    { duration: 5000 }
                  );
                  return;
                }
                
                const confirmed = window.confirm(
                  '📄 Generate Complete PDF (Invoice + All Reports)?\n\nThis will:\n• Generate ONE single PDF with invoice + all reports\n• Mark visit as PAID\n• Mark visit as COMPLETED\n\nContinue?'
                );
                if (!confirmed) return;
                
                setIsGeneratingPDF(true);
                try {
                  // Save current results first
                  await handleSave();
                  
                  // Mark as reported
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
                  
                  // Generate combined PDF (1 single file)
                  const result = await generateCombinedReportAndInvoice(
                    { ...updatedVisit, patient, signingTechnician: selectedTechnician },
                    getProfiles(),
                    { download: true, print: false }
                  );
                  
                  if (result.success) {
                    toast.success('✅ Single PDF Generated! Visit marked as PAID & COMPLETED');
                    
                    // Trigger ALL data sync events
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
                    
                    // Redirect after 2 seconds
                    setTimeout(() => {
                      toast.success('Redirecting to dashboard...');
                      navigate('/dashboard');
                    }, 2000);
                  } else {
                    toast.error('Failed to generate PDF');
                  }
                } catch (error) {
                  console.error('PDF generation error:', error);
                  toast.error('Failed to generate PDF: ' + error.message);
                } finally {
                  setIsGeneratingPDF(false);
                }
              }}
              icon={FileText}
              disabled={isGeneratingPDF || Object.values(results).filter(r => r.value).length === 0}
            >
              {isGeneratingPDF ? 'Generating...' : '📄 Generate Complete PDF (1 File - Invoice + Reports)'}
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
