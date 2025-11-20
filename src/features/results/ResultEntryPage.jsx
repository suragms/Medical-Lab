import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, FileText, Receipt, Check, Loader, Download, Printer, Share2, Mail, AlertCircle, TrendingUp, TrendingDown, MessageCircle, TestTube2, Plus, Search, X, Home } from 'lucide-react';
import { getVisitById, updateVisitResults, getSettings, updateVisit, getPatientById, getProfileById, getTestsMaster } from '../../services/firestoreService';
import { useAuthStore } from '../../store';
import { getCurrentUser, getUsers } from '../../services/authService';
import { downloadReportPDF, printReportPDF, shareViaWhatsApp, shareViaEmail } from '../../utils/pdfGenerator';
import { downloadInvoice, printInvoice } from '../../utils/invoicePdfGenerator';
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
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const saveTimeoutRef = useRef(null);
  
  const canEditReportedTime = role === 'admin' && settings.allowManualReportedTime;
  const canEditDiscount = role === 'admin' || settings.allowStaffEditDiscount;
  
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
    
    // Initialize results from visit
    const initialResults = {};
    if (visitData.tests && visitData.tests.length > 0) {
      visitData.tests.forEach(test => {
        initialResults[test.testId] = {
          value: test.value || '',
          status: test.status || 'NORMAL'
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
  const handleSave = useCallback(async () => {
    if (!visit) return;
    
    setSaveStatus('saving');
    
    try {
      // Update visit with results - including ALL test data (prices, removed tests, etc.)
      const updatedTests = visit.tests.map(test => ({
        ...test,
        value: results[test.testId]?.value || '',
        status: results[test.testId]?.status || 'NORMAL'
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
    let status = 'NORMAL';
    
    // Only validate and calculate status for numeric input types
    if (test.inputType_snapshot === 'number') {
      // Allow empty string or valid numeric values (int/float)
      if (value !== '') {
        const numValue = parseFloat(value);
        
        // Strict validation: must be a valid number (int or float)
        if (isNaN(numValue) || !isFinite(numValue)) {
          toast.error('Please enter a valid number (integers or decimals only)');
          return;
        }
        
        // Check for negative values
        if (numValue < 0) {
          toast.error('Value cannot be negative');
          return;
        }
        
        // Maximum value check (reasonable medical range)
        if (numValue > 999999) {
          toast.error('Value too large (max: 999,999)');
          return;
        }
        
        // Calculate status based on reference ranges
        const refHigh = parseFloat(test.refHigh_snapshot);
        const refLow = parseFloat(test.refLow_snapshot);
        
        // Determine status: HIGH, LOW, or NORMAL
        if (!isNaN(refHigh) && numValue > refHigh) {
          status = 'HIGH';
        } else if (!isNaN(refLow) && numValue < refLow) {
          status = 'LOW';
        } else {
          status = 'NORMAL';
        }
      }
    } else if (test.inputType_snapshot === 'text') {
      // Text input: no status calculation, always NORMAL
      status = 'NORMAL';
      
      // Validate text length
      if (value.length > 200) {
        toast.error('Text value too long (max 200 characters)');
        return;
      }
    } else if (test.inputType_snapshot === 'select') {
      // Dropdown/select: no status calculation, always NORMAL
      status = 'NORMAL';
    } else {
      // Default: NORMAL for any other type
      status = 'NORMAL';
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

  // Handle add test
  const handleAddTest = (test) => {
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

  // Generate BOTH PDF Report AND Invoice together
  const handleGenerateReport = async () => {
    const errors = validateBeforeGenerate();
    
    if (errors.length > 0) {
      toast.error(
        <div>
          <strong>Cannot generate report:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>,
        { duration: 5000 }
      );
      return;
    }
    
    // Confirm action
    const confirmed = window.confirm(
      'Generate PDF Report + Invoice — This will mark as PAID and complete the visit. Continue?'
    );
    
    if (!confirmed) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Save current results first
      await handleSave();
      
      // Set reportedAt and paidAt to current timestamp
      const now = new Date().toISOString();
      
      // Update visit with reportedAt, results, and signing technician
      const updatedTests = visit.tests.map(test => ({
        ...test,
        value: results[test.testId]?.value || '',
        status: results[test.testId]?.status || 'NORMAL'
      }));
      
      const updatedVisit = updateVisit(visitId, {
        reportedAt: now,
        tests: updatedTests,
        signing_technician_id: selectedTechnicianId,
        discount,
        status: 'completed',
        paymentStatus: 'paid',
        paidAt: now,
        pdfGenerated: true,
        invoiceGenerated: true,
        finalAmount: billing.finalAmount,
        subtotal: billing.subtotal,
        discountAmount: billing.discountAmount
      });
      
      // Force data update event to refresh ALL pages
      window.dispatchEvent(new CustomEvent('healit-data-update', { 
        detail: { 
          type: 'visit_completed', 
          visitId,
          status: 'completed',
          paymentStatus: 'paid'
        } 
      }));
      
      // Audit log
      console.log('AUDIT: GENERATE_BOTH', {
        userId: currentUser?.userId,
        visitId,
        action: 'GENERATE_REPORT_AND_INVOICE',
        timestamp: now,
        details: {
          testsCount: visit.tests.length,
          resultsEntered: Object.values(results).filter(r => r.value !== '').length,
          totalAmount: billing.finalAmount
        }
      });
      
      // Generate PDF Report - Open in new tab for printing
      const visitData = {
        ...updatedVisit,
        patient,
        profile,
        signingTechnician: selectedTechnician
      };
      
      printReportPDF(visitData);
      toast.success('✅ PDF Report opened for printing!');
      
      // Wait 1 second then generate invoice
      setTimeout(() => {
        // Prepare invoice data
        const invoiceData = {
          patient: {
            name: patient.name,
            phone: patient.phone,
            age: patient.age,
            gender: patient.gender,
            visitId: visit.visitId,
            date: visit.createdAt,
            paymentStatus: 'Paid'
          },
          invoice: {
            invoiceNumber: `INV-${visit.visitId}`,
            generatedOn: now,
            staffName: currentUser?.fullName || currentUser?.username,
            method: visit.paymentMethod || 'Cash'
          },
          times: {
            collected: visit.collectedAt,
            received: visit.receivedAt,
            reported: visit.reportedAt
          },
          items: visit.tests.map(test => ({
            name: test.name_snapshot || test.name || 'Test',
            price: test.price_snapshot || test.price || 0,
            qty: 1
          })),
          discount: billing.discountAmount,
          subtotal: billing.subtotal,
          finalTotal: billing.finalAmount,
          amountPaid: billing.finalAmount
        };
        
        printInvoice(invoiceData);
        toast.success('✅ Invoice opened for printing!');
        
        // Update local state
        setVisit(updatedVisit);
        
        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
          toast.success('Redirecting to dashboard...');
          navigate('/dashboard');
        }, 3000);
      }, 1000);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate documents: ' + error.message);
    } finally {
      setTimeout(() => {
        setIsGeneratingPDF(false);
      }, 3000);
    }
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
      
      // Prepare invoice data
      const invoiceData = {
        patient: {
          name: patient.name,
          phone: patient.phone,
          age: patient.age,
          gender: patient.gender,
          visitId: visit.visitId,
          date: visit.createdAt,
          paymentStatus: 'Paid'
        },
        invoice: {
          invoiceNumber: `INV-${visit.visitId}`,
          generatedOn: new Date().toISOString(),
          staffName: currentUser?.fullName || currentUser?.username,
          method: visit.paymentMethod || 'Cash'
        },
        times: {
          collected: visit.collectedAt,
          received: visit.receivedAt,
          reported: visit.reportedAt
        },
        items: visit.tests.map(test => ({
          name: test.name_snapshot || test.name || 'Test',
          price: test.price_snapshot || test.price || 0,
          qty: 1
        })),
        discount: billing.discountAmount,
        subtotal: billing.subtotal,
        finalTotal: billing.finalAmount,
        amountPaid: billing.finalAmount
      };
      
      // Generate and download invoice PDF
      downloadInvoice(invoiceData, `Invoice-${patient.name}-${visit.visitId}.pdf`);
      
      toast.success('Invoice PDF generated successfully!');
      
      // Update local state
      setVisit(updatedVisit);
      
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
  const handleShareEmail = () => {
    if (!visit.reportedAt) {
      toast.error('Please generate report first');
      return;
    }
    
    const visitData = {
      ...visit,
      patient,
      profile
    };
    
    const email = prompt('Enter email address:', patient.email || '');
    if (email) {
      shareViaEmail(visitData, email);
    }
  };

  // Render result input based on type
  const renderResultInput = (test) => {
    const testId = test.testId;
    const inputType = test.inputType_snapshot;
    const currentValue = results[testId]?.value || '';
    
    switch (inputType) {
      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleResultChange(testId, e.target.value)}
            className="result-input numeric"
            placeholder="Enter value"
            step="0.01"
          />
        );
      
      case 'text':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleResultChange(testId, e.target.value)}
            className="result-input text"
            placeholder="Enter text"
          />
        );
      
      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleResultChange(testId, e.target.value)}
            className="result-input select"
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
            className="result-input"
            placeholder="Enter result"
          />
        );
    }
  };

  // Render status badge
  const renderStatusBadge = (testId) => {
    const status = results[testId]?.status || 'NORMAL';
    
    if (!results[testId]?.value) return null;
    
    return (
      <span className={`status-badge ${status.toLowerCase()}`}>
        {status}
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
                  <th className="col-price">Price (₹)</th>
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
                          {test.bioReference || test.refLow_snapshot && test.refHigh_snapshot ? (
                            <span className="ref-range">
                              {test.refLow_snapshot || test.bioReference?.split('-')[0]?.trim() || '—'} – {test.refHigh_snapshot || test.bioReference?.split('-')[1]?.trim() || '—'}
                            </span>
                          ) : (
                            <span className="ref-text">{test.refText_snapshot || test.bioReference || '—'}</span>
                          )}
                        </div>
                      </td>
                      <td className="col-unit">
                        <span className="unit-value">{test.unit || test.unit_snapshot || '—'}</span>
                      </td>
                      <td className="col-price">
                        <input
                          type="number"
                          value={test.price_snapshot || test.price || 0}
                          onChange={(e) => handlePriceChange(index, e.target.value)}
                          className="price-input"
                          disabled={!canEditResults}
                          step="0.01"
                          min="0"
                        />
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
                    <td colSpan="8" className="no-tests">No tests selected</td>
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
              onClick={handleGenerateReport}
              icon={FileText}
              disabled={isGeneratingPDF || Object.values(results).filter(r => r.value).length === 0}
            >
              {isGeneratingPDF ? 'Generating...' : 'Generate PDF Report + Invoice'}
            </Button>
          </div>
          
          <div className="helper-note">
            <AlertCircle size={14} />  
            <span>Signed by: {currentUser?.fullName} ({currentUser?.qualification || 'Lab Technician'})</span>
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
              <Button variant="primary" onClick={() => downloadReportPDF({...visit, patient, profile, signingTechnician: selectedTechnician})} icon={Download} fullWidth>
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
      
      {/* Add Test Modal */}
      {showAddTestModal && (
        <div className="share-modal-overlay" onClick={() => setShowAddTestModal(false)}>
          <div className="add-test-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Test</h3>
              <button className="close-btn" onClick={() => setShowAddTestModal(false)}>
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
            
            <div className="test-list">
              {getTestsMaster(testSearchQuery).map(test => (
                <div
                  key={test.testId}
                  className="test-item"
                  onClick={() => handleAddTest(test)}
                >
                  <div className="test-info">
                    <strong>{test.name}</strong>
                    <span className="test-code">{test.code}</span>
                  </div>
                  <div className="test-price">₹{test.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultEntryPage;
