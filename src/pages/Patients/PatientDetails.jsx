import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Share2, Printer, Mail, User, Phone, MapPin, Calendar, Stethoscope, Edit, X, Save, Activity, DollarSign, CheckCircle, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProfileTemplate } from '../../features/profile-manager/profileTemplates';
import { downloadReportPDF, printReportPDF, shareViaWhatsApp, shareViaEmail } from '../../utils/pdfGenerator';
import { getVisitById, getPatientById, getProfileById, getProfiles, updatePatient, updateVisit, markPDFGenerated, markInvoiceGenerated } from '../../features/shared/dataService';
import { getTechnicians } from '../../services/authService';
import { groupTestsByProfile, generateProfileReports, generateCombinedInvoice, generateCombinedReportAndInvoice } from '../../utils/profilePdfHelper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './PatientDetails.css';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState(null);
  const [patient, setPatient] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileGroups, setProfileGroups] = useState({}); // NEW: Grouped tests by profile
  const [allProfiles, setAllProfiles] = useState([]); // NEW: All available profiles
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPdfActionsModal, setShowPdfActionsModal] = useState(false); // NEW: PDF actions modal
  const [generatedPdfResults, setGeneratedPdfResults] = useState([]); // NEW: Store PDF results
  const [pdfCompletionStatus, setPdfCompletionStatus] = useState({}); // NEW: Track completion per PDF
  const [showInvoiceModal, setShowInvoiceModal] = useState(false); // NEW: Invoice modal
  const [invoiceResult, setInvoiceResult] = useState(null); // NEW: Store invoice result
  const [invoiceActionDone, setInvoiceActionDone] = useState(false); // NEW: Track if invoice action done
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    referredBy: ''
  });
  
  // Load visit data from new data service
  useEffect(() => {
    loadVisitData();
    
    // Listen for ALL real-time data updates
    const handleDataUpdate = () => {
      console.log('🔄 PatientDetails: Data update event received');
      loadVisitData();
    };
    
    const handleStorageChange = () => {
      console.log('🔄 PatientDetails: Storage change event received');
      loadVisitData();
    };
    
    // Listen to multiple event types for comprehensive updates
    window.addEventListener('healit-data-update', handleDataUpdate);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('healit-data-update', handleDataUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, [id]);

  const loadVisitData = () => {
    console.log('🔍 PatientDetails: Loading visit data for ID:', id);
    try {
      const visitData = getVisitById(id);
      if (!visitData) {
        console.warn('⚠️ Visit not found:', id);
        setLoading(false);
        return;
      }
      
      console.log('✅ Visit data loaded:', visitData);
      console.log('Tests in visit:', visitData.tests);
      console.log('Sample tests with profileId:', visitData.tests?.slice(0, 2));
      
      const patientData = getPatientById(visitData.patientId);
      const profileData = getProfileById(visitData.profileId);
      
      // Load all profiles for reference
      const profiles = getProfiles();
      setAllProfiles(profiles);
      
      // Group tests by profile
      if (visitData.tests && visitData.tests.length > 0) {
        const grouped = groupTestsByProfile(visitData.tests);
        setProfileGroups(grouped);
        console.log('📦 Grouped tests by profile:', grouped);
        console.log('Profile IDs found:', Object.keys(grouped));
      }
      
      setVisit(visitData);
      setPatient(patientData);
      setProfile(profileData);
    } catch (error) {
      console.error('❌ Error loading visit data:', error);
      toast.error('Failed to load visit details');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts for PDF modal
  useEffect(() => {
    if (!showPdfActionsModal) return; // Only active when modal is open
    
    const handleKeyPress = (e) => {
      // ESC to close modal
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowPdfActionsModal(false);
        toast.info('❌ Modal closed (ESC)');
        return;
      }
      
      // Ctrl+Enter to Complete & Mark Paid (if all PDFs done)
      if (e.ctrlKey && e.key === 'Enter' && allPdfsCompleted()) {
        e.preventDefault();
        handleCompleteAndMarkPaid();
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showPdfActionsModal, pdfCompletionStatus]);

  // NEW: Generate PDFs for all profiles separately and show action modal
  const handleGenerateAllProfilePDFs = async () => {
    if (!hasResults || !visit.tests || visit.tests.length === 0) {
      toast.error('❌ Cannot generate PDFs: Test results must be entered first!');
      return;
    }

    if (visit.pdfGenerated) {
      const confirmReprint = window.confirm('ℹ️ PDFs already generated!\n\nDo you want to RE-GENERATE all profile reports?');
      if (!confirmReprint) return;
    }

    setIsGenerating(true);
    try {
      const visitData = {
        ...visit,
        visitId: id, // ADDED: Ensure visitId is set
        patient,
        tests: visit.tests,
        collectedAt: visit.collectedAt,
        receivedAt: visit.receivedAt,
        reportedAt: visit.reportedAt
      };
      
      console.log('🚀 Starting PDF generation with visit data:', {
        visitId: visitData.visitId,
        testsCount: visitData.tests?.length,
        profileCount: Object.keys(groupTestsByProfile(visitData.tests || [])).length
      });

      // Generate PDFs but DON'T auto-download
      const results = await generateProfileReports(visitData, allProfiles, { download: false, print: false });
      
      const successCount = results.filter(r => r.success).length;

      if (successCount > 0) {
        // ALSO generate invoice and add to results
        console.log('🧾 Generating invoice for checklist...');
        console.log('🔍 Visit data for invoice:', {
          visitId: visitData.visitId,
          testsCount: visitData.tests?.length,
          hasPatient: !!visitData.patient
        });
        
        let invoiceResult = null;
        try {
          invoiceResult = await generateCombinedInvoice(visitData, allProfiles, { download: false, print: false });
          console.log('🧾 Invoice result:', invoiceResult);
          console.log('🧾 Invoice success?', invoiceResult?.success);
          console.log('🧾 Invoice error?', invoiceResult?.error);
        } catch (invoiceError) {
          console.error('❌ Invoice generation EXCEPTION:', invoiceError);
          console.error('❌ Stack trace:', invoiceError.stack);
          invoiceResult = { success: false, error: invoiceError.message };
        }
        
        console.log('📦 Profile PDFs count:', results.filter(r => r.success).length);
        console.log('📦 Invoice will be added?', invoiceResult && invoiceResult.success);
        
        // CRITICAL FIX: ALWAYS add invoice to list, even if generation failed
        // This ensures users see invoice option and know to generate it
        const invoiceEntry = invoiceResult && invoiceResult.success ? {
          ...invoiceResult,
          profileId: 'invoice',
          profileName: `💰 Invoice (${invoiceResult.profileCount} Profiles)`,
          isInvoice: true,
          fileName: invoiceResult.fileName || `Invoice-${visitData.visitId}.pdf`
        } : {
          // FALLBACK: Create invoice entry even if generation failed
          success: false, // Mark as not generated yet
          profileId: 'invoice',
          profileName: `💰 Invoice (${successCount} Profiles)`,
          isInvoice: true,
          fileName: `Invoice-${visitData.visitId}.pdf`,
          needsGeneration: true, // Flag to regenerate on action
          error: invoiceResult?.error || 'Not generated'
        };
        
        // Combine profile PDFs + invoice into one checklist
        const allResults = [
          ...results.filter(r => r.success),
          invoiceEntry // ALWAYS include invoice
        ];
        
        console.log('📋 Total checklist items (PDFs + Invoice):', allResults.length);
        console.log('📋 Checklist items:', allResults.map(r => ({ name: r.profileName, isInvoice: r.isInvoice || false, needsGen: r.needsGeneration })));
        
        if (invoiceResult && !invoiceResult.success) {
          console.warn('⚠️ Invoice generation failed, will regenerate on user action');
          console.warn('⚠️ Invoice error details:', invoiceResult.error);
          toast.success(`✅ Generated ${successCount} PDF(s)! Invoice will be generated when you click Print/Download.`);
        } else if (invoiceResult && invoiceResult.success) {
          console.log('✅ Invoice successfully added to checklist!');
          toast.success(`✅ Generated ${successCount} PDF(s) + 1 Invoice!`);
        } else {
          console.warn('⚠️ Invoice not pre-generated, will create on demand');
          toast.success(`✅ Generated ${successCount} PDF(s)! Invoice ready to generate.`);
        }
        
        // Store combined results
        setGeneratedPdfResults(allResults);
        
        // Initialize completion tracking for each PDF + invoice
        const initialStatus = {};
        allResults.forEach(result => {
          initialStatus[result.profileId] = {
            printed: false,
            downloaded: false,
            shared: false
          };
        });
        setPdfCompletionStatus(initialStatus);
        
        setShowPdfActionsModal(true);
        
        if (!visit.pdfGenerated) {
          markPDFGenerated(id);
        }
        
        // Dispatch ALL update events
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('dataUpdated'));
        window.dispatchEvent(new CustomEvent('healit-data-update', { 
          detail: { type: 'pdf_generated', visitId: id } 
        }));
        
        loadVisitData();
      } else {
        toast.error('⚠️ Failed to generate reports');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDFs: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // NEW: Mark PDF action as complete
  const markPdfActionComplete = (profileId, actionType) => {
    setPdfCompletionStatus(prev => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        [actionType]: true
      }
    }));
  };

  // NEW: Check if all PDFs are handled
  const allPdfsCompleted = () => {
    return Object.values(pdfCompletionStatus).every(status => 
      status.printed || status.downloaded || status.shared
    );
  };

  // NEW: Complete and mark as paid
  const handleCompleteAndMarkPaid = async () => {
    const confirm = window.confirm(
      '✅ COMPLETE & MARK AS PAID?\n\n' +
      'This will:\n' +
      '• Mark visit as COMPLETED\n' +
      '• Mark payment as PAID\n' +
      '• Update all related pages\n\n' +
      'Continue?'
    );
    
    if (!confirm) return;

    try {
      // Update visit status and payment
      const updatedVisit = updateVisit(id, {
        status: 'completed',
        paymentStatus: 'paid',
        paidAt: new Date().toISOString(),
        pdfGenerated: true,
        invoiceGenerated: true
      });

      // Close modal
      setShowPdfActionsModal(false);
      
      // Dispatch events
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('dataUpdated'));
      window.dispatchEvent(new CustomEvent('healit-data-update', { 
        detail: { type: 'visit_completed', visitId: id, status: 'completed', paymentStatus: 'paid' } 
      }));
      
      // Reload data
      loadVisitData();
      
      toast.success('✅ Visit completed and marked as paid!');
      
      // Redirect to patients page after 2 seconds
      setTimeout(() => {
        navigate('/patients');
      }, 2000);
    } catch (error) {
      console.error('Error completing visit:', error);
      toast.error('Failed to complete visit');
    }
  };

  // NEW: Complete invoice action and mark paid
  const handleInvoiceCompleteAndPaid = async () => {
    const confirm = window.confirm(
      '✅ MARK AS PAID?\n\n' +
      'This will:\n' +
      '• Mark payment as PAID\n' +
      '• Mark visit as COMPLETED\n' +
      '• Update all related pages\n\n' +
      'Continue?'
    );
    
    if (!confirm) return;
    
    try {
      // Update visit
      const updatedVisit = updateVisit(id, {
        visitStatus: 'completed',
        paymentStatus: 'paid',
        paidAt: new Date().toISOString()
      });
      
      // Close modal
      setShowInvoiceModal(false);
      
      // Dispatch ALL update events
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('dataUpdated'));
      window.dispatchEvent(new CustomEvent('healit-data-update', { 
        detail: { type: 'visit_completed', visitId: id } 
      }));
      
      toast.success('✅ Visit completed and marked as PAID!');
      loadVisitData();
    } catch (error) {
      console.error('Complete error:', error);
      toast.error('Failed to mark as paid');
    }
  };

  // NEW: Generate ONE combined invoice with all profiles
  const handleGenerateAllProfileInvoices = async () => {
    if (!hasResults || !visit.tests || visit.tests.length === 0) {
      toast.error('❌ Cannot generate invoice: Test results must be entered first!');
      return;
    }

    if (visit.invoiceGenerated && visit.paymentStatus === 'paid') {
      const confirmReInvoice = window.confirm('⚠️ INVOICE ALREADY GENERATED & PAID!\n\nAre you sure you want to RE-GENERATE?\n\n(This will NOT change payment status)');
      if (!confirmReInvoice) return;
    }

    setIsGenerating(true);
    try {
      const visitData = {
        ...visit,
        patient,
        tests: visit.tests,
        collectedAt: visit.collectedAt,
        receivedAt: visit.receivedAt,
        reportedAt: visit.reportedAt,
        paymentStatus: visit.paymentStatus,
        paymentMethod: visit.paymentMethod || 'Cash'
      };

      const result = await generateCombinedInvoice(visitData, allProfiles, { download: false, print: false });

      if (result.success) {
        // Store result and show modal
        setInvoiceResult(result);
        setInvoiceActionDone(false);
        setShowInvoiceModal(true);
        
        toast.success(`✅ Invoice generated with ${result.profileCount} profile(s) - Choose action!`);
        
        if (!visit.invoiceGenerated) {
          markInvoiceGenerated(id);
        }
        
        // Dispatch ALL update events
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('dataUpdated'));
        window.dispatchEvent(new CustomEvent('healit-data-update', { 
          detail: { type: 'invoice_generated', visitId: id } 
        }));
        
        loadVisitData();
      } else {
        toast.error(`⚠️ Failed to generate invoice: ${result.error}`);
      }
    } catch (error) {
      console.error('Invoice generation error:', error);
      toast.error('Failed to generate invoice: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const visitStatus = visit?.status || 'tests_selected';
  
  // CRITICAL FIX: hasResults must check BOTH status AND actual test values
  // Tests store values directly as test.value (not test.result.value)
  const hasResults = (
    (visitStatus === 'report_generated' || visitStatus === 'completed') && 
    visit?.reportedAt && 
    visit?.tests && 
    visit.tests.length > 0 &&
    visit.tests.some(t => t.value || t.result?.value) // Check both formats for compatibility
  );
  // FIXED WORKFLOW STEPS: Include completed status
  // ACTUAL STATUS FLOW: tests_selected → sample_times_set → report_generated → completed
  const workflowSteps = [
    {
      id: 'tests_selected',
      label: 'Registration',
      description: 'Patient details & tests captured'
    },
    {
      id: 'sample_times_set',
      label: 'Sample Collection',
      description: 'Sample collected & timings recorded'
    },
    {
      id: 'report_generated',
      label: 'Report Ready',
      description: 'Results entered & report generated'
    },
    {
      id: 'completed',
      label: 'Completed & Paid',
      description: 'PDF & Invoice generated, payment received'
    }
  ];
  const currentStepIndex = Math.max(
    0,
    workflowSteps.findIndex((step) => step.id === visitStatus)
  );
  const canEditSampleTime = true; // Staff can always edit sample times
  // Can enter results if sample times are set (sample_times_set) or report already generated
  const canEnterResults = ['sample_times_set', 'report_generated', 'completed'].includes(visitStatus);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading visit details...</p>
      </div>
    );
  }

  if (!visit || !patient) {
    return (
      <div className="not-found-container">
        <h2>Visit not found</h2>
        <Button variant="primary" onClick={() => navigate('/patients')}>
          Back to Patients
        </Button>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    if (!hasResults) {
      toast.error('No test results available');
      return;
    }

    setIsGenerating(true);
    try {
      // Get signing technician if available
      let signingTechnician = null;
      if (visit.signing_technician_id) {
        const technicians = getTechnicians();
        signingTechnician = technicians.find(t => t.technicianId === visit.signing_technician_id);
      }
      
      // Build visit data for PDF generator
      const visitData = {
        ...visit,
        patient,
        profile,
        signingTechnician
      };
      
      downloadReportPDF(visitData);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!hasResults) {
      toast.error('No test results available');
      return;
    }

    setIsGenerating(true);
    try {
      // Get signing technician if available
      let signingTechnician = null;
      if (visit.signing_technician_id) {
        const technicians = getTechnicians();
        signingTechnician = technicians.find(t => t.technicianId === visit.signing_technician_id);
      }
      
      // Build visit data for PDF generator
      const visitData = {
        ...visit,
        patient,
        profile,
        signingTechnician
      };
      
      printReportPDF(visitData);
      toast.success('Opening print dialog...');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!hasResults) {
      toast.error('No test results available');
      return;
    }

    setIsGenerating(true);
    try {
      // Get signing technician if available
      let signingTechnician = null;
      if (visit.signing_technician_id) {
        const technicians = getTechnicians();
        signingTechnician = technicians.find(t => t.technicianId === visit.signing_technician_id);
      }
      
      // Build visit data for PDF generator
      const visitData = {
        ...visit,
        patient,
        profile,
        signingTechnician
      };
      
      shareViaWhatsApp(visitData, patient.phone);
      toast.success('Opening WhatsApp...');
    } catch (error) {
      console.error('WhatsApp share error:', error);
      toast.error('Failed to share via WhatsApp: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenEditModal = () => {
    setEditData({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email || '', // Added email
      address: patient.address || '',
      referredBy: patient.referredBy || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editData.name.trim() || !editData.phone.trim() || !editData.age) {
      toast.error('Name, phone, and age are required');
      return;
    }

    try {
      // Update patient in database
      const updatedPatient = updatePatient(patient.patientId, {
        name: editData.name,
        age: parseInt(editData.age),
        gender: editData.gender,
        phone: editData.phone,
        email: editData.email, // Added email
        address: editData.address,
        referredBy: editData.referredBy
      });

      setPatient(updatedPatient);
      toast.success('Patient details updated successfully!');
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Failed to update patient details');
    }
  };

  return (
    <div className="patient-details-container">
      <div className="page-header">
        <Button variant="ghost" onClick={() => navigate('/patients')} icon={ArrowLeft}>
          Back to Patients
        </Button>
        
        {/* Quick Action Icons - Top Right */}
        {hasResults && (
          <div className="header-quick-actions">
            <button 
              className="icon-action-btn" 
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              title="Download PDF"
            >
              <Download size={20} />
            </button>
            <button 
              className="icon-action-btn" 
              onClick={handlePrint}
              disabled={isGenerating}
              title="Print Report"
            >
              <Printer size={20} />
            </button>
            <button 
              className="icon-action-btn success" 
              onClick={handleWhatsAppShare}
              disabled={isGenerating}
              title="Share via WhatsApp"
            >
              <Share2 size={20} />
            </button>
            <button 
              className="icon-action-btn" 
              onClick={async () => {
                setIsGenerating(true);
                try {
                  const signingTechnician = visit.signing_technician_id ? 
                    getTechnicians().find(t => t.technicianId === visit.signing_technician_id) : null;
                  
                  const result = await shareViaEmail({
                    ...visit,
                    patient,
                    profile,
                    signingTechnician
                  }, patient.email || '');
                  
                  if (result.success) {
                    toast.success(result.message || 'Email opened with PDF ready to share!');
                  } else {
                    toast.error('Failed to share via email: ' + (result.error || 'Unknown error'));
                  }
                } catch (error) {
                  console.error('Email share error:', error);
                  toast.error('Failed to share via email');
                } finally {
                  setIsGenerating(false);
                }
              }}
              disabled={isGenerating}
              title="Share via Email"
            >
              <Mail size={20} />
            </button>
          </div>
        )}
      </div>

      <div className="patient-details-grid">
        {/* Patient Info Card */}
        <Card 
          title="Patient Information" 
          className="patient-info-card"
          actions={
            <Button 
              variant="outline" 
              icon={Edit} 
              size="small"
              onClick={handleOpenEditModal}
            >
              Edit Details
            </Button>
          }
        >
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">
                <User size={20} />
              </div>
              <div className="info-content">
                <span className="info-label">Full Name</span>
                <span className="info-value">{patient.name}</span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <Calendar size={20} />
              </div>
              <div className="info-content">
                <span className="info-label">Age</span>
                <span className="info-value">{patient.age} years</span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <User size={20} />
              </div>
              <div className="info-content">
                <span className="info-label">Gender</span>
                <span className="info-value">{patient.gender}</span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <Phone size={20} />
              </div>
              <div className="info-content">
                <span className="info-label">Phone Number</span>
                <span className="info-value">{patient.phone}</span>
              </div>
            </div>

            {patient.address && (
              <div className="info-item full-width">
                <div className="info-icon">
                  <MapPin size={20} />
                </div>
                <div className="info-content">
                  <span className="info-label">Address</span>
                  <span className="info-value">{patient.address}</span>
                </div>
              </div>
            )}

            <div className="info-item">
              <div className="info-icon">
                <Stethoscope size={20} />
              </div>
              <div className="info-content">
                <span className="info-label">Test Profile</span>
                <span className="info-value profile-name">{profile?.name || 'N/A'}</span>
              </div>
            </div>

            {patient.referredBy && (
              <div className="info-item">
                <div className="info-icon">
                  <Stethoscope size={20} />
                </div>
                <div className="info-content">
                  <span className="info-label">Referred By</span>
                  <span className="info-value">{patient.referredBy}</span>
                </div>
              </div>
            )}

            <div className="info-item">
              <div className="info-icon">
                <Calendar size={20} />
              </div>
              <div className="info-content">
                <span className="info-label">Visit Date</span>
                <span className="info-value">
                  {new Date(visit.createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <FileText size={20} />
              </div>
              <div className="info-content">
                <span className="info-label">Status</span>
                <span className={`status-badge status-${visitStatus}`}>
                  {visitStatus.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="patient-side-column">
          <Card title="Workflow Progress" className="workflow-card">
            <div className="workflow-card-heading">
              <Activity size={18} />
              <span>Live status of this visit</span>
            </div>
            <div className="workflow-steps">
              {workflowSteps.map((step, index) => {
                const completed = index <= currentStepIndex || visitStatus === 'report_generated';
                const active = index === currentStepIndex || (visitStatus === 'report_generated' && index === workflowSteps.length - 1);
                return (
                  <div
                    key={step.id}
                    className={`workflow-step ${completed ? 'completed' : ''} ${active ? 'active' : ''}`}
                  >
                    <div className="step-marker">{index + 1}</div>
                    <div className="step-content">
                      <span className="step-label">{step.label}</span>
                      <p>{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="quick-action-buttons">
              <Button
                variant="secondary"
                fullWidth
                icon={Calendar}
                disabled={!canEditSampleTime}
                onClick={() => navigate(`/sample-times/${visit.visitId}`)}
              >
                Update Sample Details
              </Button>
              <Button
                variant="primary"
                fullWidth
                icon={FileText}
                disabled={!canEnterResults}
                onClick={() => navigate(`/results/${visit.visitId}`)}
              >
                Enter / Review Results
              </Button>
              
              <div className="divider" style={{margin: '12px 0', borderTop: '1px solid #E5E5E5'}}></div>
              
              {/* Show profile count if multiple profiles detected */}
              {Object.keys(profileGroups).length > 1 && (
                <div style={{padding: '8px', background: '#EFF6FF', borderRadius: '8px', textAlign: 'center', marginBottom: '8px'}}>
                  <span style={{color: '#1E3A8A', fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'}}>
                    <Layers size={14} />
                    {Object.keys(profileGroups).length} Profiles Detected
                  </span>
                </div>
              )}
              
              <Button
                variant={(visit.pdfGenerated && visit.invoiceGenerated) ? "outline" : "primary"}
                fullWidth
                icon={(visit.pdfGenerated && visit.invoiceGenerated) ? CheckCircle : FileText}
                onClick={async () => {
                  if (!hasResults || isGenerating) return;
                  
                  setIsGenerating(true);
                  try {
                    const allProfiles = getProfiles();
                    const visitData = {
                      ...visit,
                      patient,
                      signingTechnician: visit.signing_technician_id ? 
                        getTechnicians().find(t => t.technicianId === visit.signing_technician_id) : null
                    };
                    
                    const result = await generateCombinedReportAndInvoice(visitData, allProfiles, { 
                      download: true, 
                      print: false 
                    });
                    
                    if (result.success) {
                      toast.success(`✅ Combined PDF generated with ${result.profileCount} profile(s)!`);
                      
                      // Mark as generated
                      const updatedVisit = updateVisit(id, {
                        pdfGenerated: true,
                        invoiceGenerated: true
                      });
                      
                      // Dispatch ALL update events
                      window.dispatchEvent(new Event('storage'));
                      window.dispatchEvent(new Event('dataUpdated'));
                      window.dispatchEvent(new CustomEvent('healit-data-update', { 
                        detail: { 
                          type: 'combined_pdf_generated', 
                          visitId: id,
                          pdfGenerated: true,
                          invoiceGenerated: true
                        } 
                      }));
                      
                      loadVisitData();
                    } else {
                      toast.error('Failed to generate combined PDF');
                    }
                  } catch (error) {
                    console.error('Combined PDF error:', error);
                    toast.error('Failed to generate PDF: ' + error.message);
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={!hasResults || isGenerating}
              >
                {(visit.pdfGenerated && visit.invoiceGenerated) ? '🖨️ Re-Print Combined PDF' : (hasResults ? '📄 Generate Combined PDF (Invoice + Reports)' : '⚠️ No Results Yet')}
              </Button>
              
              <div style={{padding: '6px 8px', background: '#F9FAFB', borderRadius: '6px', marginTop: '8px'}}>
                <p style={{fontSize: '0.7rem', color: '#6B7280', textAlign: 'center', margin: 0}}>
                  ℹ️ One PDF file with invoice + all test reports on separate pages
                </p>
              </div>
              
              {visit.paymentStatus === 'paid' && (
                <div className="payment-status-indicator" style={{padding: '8px', background: '#D1FAE5', borderRadius: '8px', textAlign: 'center', marginTop: '8px'}}>
                  <span style={{color: '#065F46', fontWeight: 600, fontSize: '0.875rem'}}>✓ Payment Received</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Patient Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Patient Details</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">
                  <User size={16} />
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar size={16} />
                  Age <span className="required">*</span>
                </label>
                <input
                  type="number"
                  value={editData.age}
                  onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                  className="form-input"
                  min="0"
                  max="150"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <User size={16} />
                  Gender <span className="required">*</span>
                </label>
                <select
                  value={editData.gender}
                  onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                  className="form-input"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone size={16} />
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={16} />
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="form-input"
                  placeholder="patient@example.com"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  <MapPin size={16} />
                  Address
                </label>
                <input
                  type="text"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className="form-input"
                  placeholder="Optional"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  <Stethoscope size={16} />
                  Referred By Doctor
                </label>
                <input
                  type="text"
                  value={editData.referredBy}
                  onChange={(e) => setEditData({ ...editData, referredBy: e.target.value })}
                  className="form-input"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button icon={Save} onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Actions Modal */}
      {showPdfActionsModal && (
        <div className="modal-overlay" onClick={() => setShowPdfActionsModal(false)}>
          <div className="modal-content pdf-actions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FileText size={24} /> Generated Reports - Complete Actions</h3>
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
                        {isCompleted && (
                          <p className="completion-status">
                            {status.printed && '🖨️ Printed'}
                            {status.downloaded && ' ⬇️ Downloaded'}
                            {status.shared && ' 📤 Shared'}
                          </p>
                        )}
                      </div>
                    </div>
                  
                  <div className="pdf-actions">
                    <button 
                      className="action-btn print-btn"
                      onClick={async () => {
                        // Show loading toast immediately
                        const loadingToast = toast.loading(pdfResult.isInvoice ? '🖨️ Preparing invoice for print...' : `🖨️ Preparing ${pdfResult.profileName} for print...`);
                        
                        try {
                          // Get signing technician
                          const signingTechnician = visit.signing_technician_id ? 
                            getTechnicians().find(t => t.technicianId === visit.signing_technician_id) : null;
                          
                          const visitData = {
                            ...visit,
                            patient,
                            tests: visit.tests,
                            collectedAt: visit.collectedAt,
                            receivedAt: visit.receivedAt,
                            reportedAt: visit.reportedAt,
                            paymentStatus: visit.paymentStatus,
                            paymentMethod: visit.paymentMethod || 'Cash',
                            signingTechnician // ADDED: Include signing technician
                          };
                          
                          // Check if this is invoice or profile PDF
                          if (pdfResult.isInvoice) {
                            // Print invoice
                            await generateCombinedInvoice(visitData, allProfiles, { 
                              download: false, 
                              print: true
                            });
                            toast.success('🖨️ Invoice print dialog opened', { id: loadingToast });
                          } else {
                            // Print profile PDF
                            await generateProfileReports(visitData, allProfiles, { 
                              download: false, 
                              print: true,
                              profileFilter: pdfResult.profileId 
                            });
                            toast.success(`🖨️ Print dialog opened for ${pdfResult.profileName}`, { id: loadingToast });
                          }
                          
                          markPdfActionComplete(pdfResult.profileId, 'printed');
                        } catch (error) {
                          console.error('Print error:', error);
                          toast.error('❌ Failed to print: ' + (error.message || 'Unknown error'), { id: loadingToast });
                        }
                      }}
                      title="Print"
                    >
                      <Printer size={18} />
                      Print
                    </button>
                    
                    <button 
                      className="action-btn download-btn"
                      onClick={async () => {
                        // Show loading toast immediately
                        const loadingToast = toast.loading(pdfResult.isInvoice ? '⬇️ Generating invoice PDF...' : `⬇️ Generating ${pdfResult.profileName}...`);
                        
                        try {
                          // Get signing technician
                          const signingTechnician = visit.signing_technician_id ? 
                            getTechnicians().find(t => t.technicianId === visit.signing_technician_id) : null;
                          
                          const visitData = {
                            ...visit,
                            patient,
                            tests: visit.tests,
                            collectedAt: visit.collectedAt,
                            receivedAt: visit.receivedAt,
                            reportedAt: visit.reportedAt,
                            paymentStatus: visit.paymentStatus,
                            paymentMethod: visit.paymentMethod || 'Cash',
                            signingTechnician // ADDED: Include signing technician
                          };
                          
                          // Check if this is invoice or profile PDF
                          if (pdfResult.isInvoice) {
                            // Download invoice
                            await generateCombinedInvoice(visitData, allProfiles, { 
                              download: true, 
                              print: false
                            });
                            toast.success('✅ Invoice downloaded successfully!', { id: loadingToast });
                          } else {
                            // Download profile PDF
                            await generateProfileReports(visitData, allProfiles, { 
                              download: true, 
                              print: false,
                              profileFilter: pdfResult.profileId 
                            });
                            toast.success(`✅ Downloaded ${pdfResult.profileName} successfully!`, { id: loadingToast });
                          }
                          
                          markPdfActionComplete(pdfResult.profileId, 'downloaded');
                        } catch (error) {
                          console.error('Download error:', error);
                          toast.error('❌ Failed to download: ' + (error.message || 'Unknown error'), { id: loadingToast });
                        }
                      }}
                      title="Download"
                    >
                      <Download size={18} />
                      Download
                    </button>
                    
                    <button 
                      className="action-btn whatsapp-btn"
                      onClick={() => {
                        const phone = patient.phone || '';
                        if (!phone) {
                          toast.error('No phone number available');
                          return;
                        }
                        markPdfActionComplete(pdfResult.profileId, 'shared');
                        toast.info(`📱 Opening WhatsApp for ${pdfResult.profileName}`);
                        const message = `Hi ${patient.name}, your ${pdfResult.profileName} report is ready. Visit ID: ${visit.visitId}`;
                        window.open(`https://wa.me/${phone.replace(/^0/, '91')}?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      title="Share via WhatsApp"
                    >
                      <Share2 size={18} />
                      WhatsApp
                    </button>
                    
                    <button 
                      className="action-btn email-btn"
                      onClick={() => {
                        const email = patient.email || '';
                        if (!email) {
                          toast.error('No email address available');
                          return;
                        }
                        markPdfActionComplete(pdfResult.profileId, 'shared');
                        toast.info(`📧 Opening email for ${pdfResult.profileName}`);
                        const subject = `Lab Report - ${pdfResult.profileName} - ${patient.name}`;
                        const body = `Dear ${patient.name},

Your ${pdfResult.profileName} report is attached.

Visit ID: ${visit.visitId}

Thank you,
HEALit Med Laboratories`;
                        window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                      }}
                      title="Share via Email"
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', fontStyle: 'italic' }}>
                      🚀 Press <kbd style={{ padding: '2px 6px', background: '#E5E7EB', borderRadius: '4px', fontFamily: 'monospace' }}>Ctrl+Enter</kbd> to complete
                    </div>
                    <Button 
                      variant="success" 
                      onClick={handleCompleteAndMarkPaid}
                      icon={CheckCircle}
                    >
                      Complete & Mark Paid
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{
                          width: `${(Object.values(pdfCompletionStatus).filter(s => s.printed || s.downloaded || s.shared).length / generatedPdfResults.length) * 100}%`
                        }}
                      />
                    </div>
                    <div className="progress-text">
                      {Object.values(pdfCompletionStatus).filter(s => s.printed || s.downloaded || s.shared).length} / {generatedPdfResults.length} completed
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', fontStyle: 'italic' }}>
                      ⏱️ Tip: Press <kbd style={{ padding: '2px 6px', background: '#E5E7EB', borderRadius: '4px', fontFamily: 'monospace' }}>ESC</kbd> to close
                    </div>
                    <Button variant="ghost" onClick={() => setShowPdfActionsModal(false)}>
                      Close
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && invoiceResult && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal-content pdf-actions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><DollarSign size={24} /> Invoice Generated - Complete Action</h3>
              <button className="close-btn" onClick={() => setShowInvoiceModal(false)}>×</button>
            </div>

            <div className="pdf-actions-list">
              <div className={`pdf-action-item ${invoiceActionDone ? 'completed' : ''}`}>
                <div className="pdf-info">
                  <div className="pdf-checkbox">
                    {invoiceActionDone ? (
                      <span className="checkmark">✓</span>
                    ) : (
                      <span className="pdf-number">💵</span>
                    )}
                  </div>
                  <div className="pdf-details">
                    <h4>Combined Invoice - {invoiceResult.profileCount} Profile(s)</h4>
                    <p className="pdf-filename">{invoiceResult.fileName}</p>
                    {invoiceActionDone && <p className="completion-status">✓ Action completed</p>}
                  </div>
                </div>
                
                <div className="pdf-actions">
                  {/* Print */}
                  <button
                    className="action-btn print-btn"
                    onClick={async () => {
                      const visitData = {
                        ...visit,
                        patient,
                        tests: visit.tests,
                        collectedAt: visit.collectedAt,
                        receivedAt: visit.receivedAt,
                        reportedAt: visit.reportedAt,
                        paymentStatus: visit.paymentStatus,
                        paymentMethod: visit.paymentMethod || 'Cash'
                      };
                      await generateCombinedInvoice(visitData, allProfiles, { download: false, print: true });
                      setInvoiceActionDone(true);
                      toast.success('🖨️ Invoice print dialog opened');
                    }}
                  >
                    <Printer size={18} />
                    Print
                  </button>
                  
                  {/* Download */}
                  <button
                    className="action-btn download-btn"
                    onClick={async () => {
                      const visitData = {
                        ...visit,
                        patient,
                        tests: visit.tests,
                        collectedAt: visit.collectedAt,
                        receivedAt: visit.receivedAt,
                        reportedAt: visit.reportedAt,
                        paymentStatus: visit.paymentStatus,
                        paymentMethod: visit.paymentMethod || 'Cash'
                      };
                      await generateCombinedInvoice(visitData, allProfiles, { download: true, print: false });
                      setInvoiceActionDone(true);
                      toast.success('⬇️ Invoice downloaded');
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
                      const message = `Hi ${patient.name}, your invoice for visit ${visit.visitNumber} is ready. Total amount: ₹${visit.totalAmount || 0}. Please contact us for payment. - Lab`;
                      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                      setInvoiceActionDone(true);
                      toast.success('📱 WhatsApp opened with invoice details');
                    }}
                  >
                    <Share2 size={18} />
                    WhatsApp
                  </button>
                  
                  {/* Email */}
                  <button
                    className="action-btn email-btn"
                    onClick={() => {
                      const email = patient.email || '';
                      const subject = `Invoice - Visit ${visit.visitNumber} - ${patient.name}`;
                      const body = `Dear ${patient.name},

Your invoice for visit ${visit.visitNumber} is ready.

Total Amount: ₹${visit.totalAmount || 0}

Please contact us for payment details.

Thank you,
Lab Team`;
                      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      window.open(mailtoUrl, '_blank');
                      setInvoiceActionDone(true);
                      toast.success('📧 Email opened with invoice details');
                    }}
                  >
                    <Mail size={18} />
                    Email
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {invoiceActionDone ? (
                <>
                  <div className="completion-message">
                    <CheckCircle size={20} color="#10B981" />
                    <span>Invoice action completed! Mark as paid?</span>
                  </div>
                  <Button 
                    variant="success" 
                    onClick={handleInvoiceCompleteAndPaid}
                    icon={CheckCircle}
                  >
                    Mark as Paid & Complete
                  </Button>
                </>
              ) : (
                <>
                  <div className="completion-message warning">
                    <Activity size={20} color="#F59E0B" />
                    <span>Complete an action to proceed</span>
                  </div>
                  <Button variant="ghost" onClick={() => setShowInvoiceModal(false)}>
                    Close
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientDetails;
