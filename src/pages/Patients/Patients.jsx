import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Eye,
  Calendar,
  Phone,
  User,
  Users,
  Activity,
  ShieldCheck,
  Layers,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getVisits, getPatients, getProfileById, markPDFGenerated, markInvoiceGenerated, getVisitById, deletePatient } from '../../features/shared/dataService';
import { downloadReportPDF, printReportPDF } from '../../utils/pdfGenerator';
import { getTechnicians } from '../../services/authService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Patients.css';

const Patients = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const statusCounts = useMemo(() => {
    return visits.reduce(
      (acc, visit) => {
        if (visit.status === 'report_generated' || visit.status === 'completed') {
          acc.completed += 1;
        } else if (visit.status === 'sample_times_set') {
          // Count as 'sample' (waiting for results/report)
          acc.sample += 1;
        } else {
          acc.registered += 1;
        }
        return acc;
      },
      { registered: 0, sample: 0, results: 0, completed: 0 }
    );
  }, [visits]);

  const totalPatients = patients.length;
  const totalVisits = visits.length;
  const activeVisits = totalVisits - statusCounts.completed;
  const profileCount = useMemo(() => {
    const ids = new Set(
      visits
        .map((visit) => visit.profileId)
        .filter((profileId) => typeof profileId !== 'undefined' && profileId !== null)
    );
    return ids.size;
  }, [visits]);

  const summaryCards = [
    {
      label: 'Total Patients',
      value: totalPatients,
      sublabel: `${statusCounts.registered} in registration`,
      icon: Users
    },
    {
      label: 'Active Visits',
      value: activeVisits,
      sublabel: `${statusCounts.sample + statusCounts.results} awaiting results`,
      icon: Activity
    },
    {
      label: 'Completed Reports',
      value: statusCounts.completed,
      sublabel: `${statusCounts.results} ready to finalize`,
      icon: ShieldCheck
    },
    {
      label: 'Profiles in Use',
      value: profileCount,
      sublabel: `${totalVisits} total visits logged`,
      icon: Layers
    }
  ];

  // Load visits and patients from localStorage
  useEffect(() => {
    loadData();
    
    // Listen for data updates from other tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === 'medlab_visits' || e.key === 'medlab_patients') {
        loadData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from same tab
    const handleDataUpdate = () => {
      loadData();
    };
    
    window.addEventListener('dataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, []);

  const loadData = () => {
    const allVisits = getVisits();
    const allPatients = getPatients();
    console.log('Loaded patients:', allPatients.length);
    console.log('Loaded visits:', allVisits.length);
    setVisits(allVisits);
    setPatients(allPatients);
  };

  const handleGeneratePDF = async (visitId) => {
    const visit = visits.find(v => v.visitId === visitId);
    if (!visit) return;
    
    const patient = getPatientForVisit(visit);
    const profile = getProfileById(visit.profileId);
    
    // CRITICAL: Check if results entered AND report generated (accepts both 'report_generated' and 'completed')
    const hasResults = (
      (visit.status === 'report_generated' || visit.status === 'completed') && 
      visit.reportedAt && 
      visit.tests && 
      visit.tests.length > 0
    );
    
    if (!hasResults) {
      toast.error('❌ Cannot generate PDF: Test results must be entered and report generated first!');
      return;
    }
    
    // Check if tests have actual result values
    // Tests store values directly as test.value (not test.result.value)
    const hasResultValues = visit.tests.some(t => t.value || t.result?.value);
    if (!hasResultValues) {
      toast.error('❌ Cannot generate PDF: No test result values found!');
      return;
    }
    
    // WARNING: If already generated, ask for confirmation to re-print
    if (visit.pdfGenerated) {
      const confirmReprint = window.confirm('ℹ️ PDF already generated!\n\nDo you want to RE-PRINT this report?');
      if (!confirmReprint) return;
    }
    
    try {
      // Use ADVANCED PDF template
      let signingTechnician = null;
      if (visit.signing_technician_id) {
        const technicians = getTechnicians();
        signingTechnician = technicians.find(t => t.technicianId === visit.signing_technician_id);
      }
      
      const visitData = {
        ...visit,
        patient,
        profile,
        signingTechnician
      };
      
      // Download the PDF report
      await downloadReportPDF(visitData);
      
      // Also open in new tab for viewing/printing (slight delay to ensure download starts)
      setTimeout(() => {
        printReportPDF(visitData);
      }, 500);
      
      if (!visit.pdfGenerated) {
        markPDFGenerated(visitId);
        toast.success('✅ PDF downloaded & opened in new tab!');
        
        // Trigger data updates
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('dataUpdated'));
      } else {
        toast.success('🖨️ PDF re-downloaded & re-opened successfully!');
      }
      
      loadData();
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };

  const handleGenerateInvoice = async (visitId) => {
    const visit = visits.find(v => v.visitId === visitId);
    if (!visit) return;
    
    const patient = getPatientForVisit(visit);
    const profile = getProfileById(visit.profileId);
    
    // CRITICAL: Check if results entered AND report generated (accepts both 'report_generated' and 'completed')
    const hasResults = (
      (visit.status === 'report_generated' || visit.status === 'completed') && 
      visit.reportedAt && 
      visit.tests && 
      visit.tests.length > 0
    );
    
    if (!hasResults) {
      toast.error('❌ Cannot generate invoice: Test results must be entered and report generated first!');
      return;
    }
    
    // Check if tests have actual result values
    // Tests store values directly as test.value (not test.result.value)
    const hasResultValues = visit.tests.some(t => t.value || t.result?.value);
    if (!hasResultValues) {
      toast.error('❌ Cannot generate invoice: No test result values found!');
      return;
    }
    
    // CRITICAL WARNING: If already generated and paid, strong confirmation
    if (visit.invoiceGenerated && visit.paymentStatus === 'paid') {
      const confirmReInvoice = window.confirm('⚠️ INVOICE ALREADY GENERATED & PAID!\n\nPatient: ' + patient.name + '\nPaid Amount: ₹' + (profile?.price || profile?.packagePrice || 0) + '\n\nAre you sure you want to RE-PRINT this invoice?\n\n(This will NOT change payment status)');
      if (!confirmReInvoice) return;
    }
    
    try {
      // Use ADVANCED Invoice template (from utils if exists, or create proper one)
      const printWindow = window.open('', '', 'width=800,height=600');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${visit.visitId}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Arial', sans-serif; padding: 40px; background: #fff; }
              .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 30px; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #000; padding-bottom: 20px; }
              .header h1 { font-size: 28px; color: #000; margin-bottom: 5px; }
              .header p { font-size: 16px; color: #666; }
              .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
              .detail-section h3 { font-size: 14px; color: #000; margin-bottom: 10px; text-transform: uppercase; }
              .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #ddd; }
              .detail-row strong { color: #000; }
              .detail-row span { color: #666; }
              .items-table { width: 100%; margin: 30px 0; border-collapse: collapse; }
              .items-table th { background: #000; color: #fff; padding: 12px; text-align: left; }
              .items-table td { padding: 12px; border-bottom: 1px solid #ddd; }
              .total-section { text-align: right; margin-top: 30px; padding-top: 20px; border-top: 3px solid #000; }
              .total-section h2 { font-size: 24px; color: #000; }
              .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
              @media print { body { padding: 0; } .invoice-container { border: none; } }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="header">
                <h1>HEALit Med Laboratories</h1>
                <p>Kunnathpeedika Centre | Phone: 7356865161 | Email: info@healitlab.com</p>
              </div>
              
              <div class="invoice-details">
                <div class="detail-section">
                  <h3>Bill To:</h3>
                  <div class="detail-row"><strong>Name:</strong> <span>${patient.name}</span></div>
                  <div class="detail-row"><strong>Age/Gender:</strong> <span>${patient.age} years / ${patient.gender}</span></div>
                  <div class="detail-row"><strong>Phone:</strong> <span>${patient.phone}</span></div>
                  ${patient.address ? `<div class="detail-row"><strong>Address:</strong> <span>${patient.address}</span></div>` : ''}
                </div>
                <div class="detail-section">
                  <h3>Invoice Details:</h3>
                  <div class="detail-row"><strong>Invoice No:</strong> <span>${visit.visitId}</span></div>
                  <div class="detail-row"><strong>Date:</strong> <span>${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                  <div class="detail-row"><strong>Collected On:</strong> <span>${visit.collectedAt ? new Date(visit.collectedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</span></div>
                  <div class="detail-row"><strong>Received On:</strong> <span>${visit.receivedAt ? new Date(visit.receivedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</span></div>
                  <div class="detail-row"><strong>Reported On:</strong> <span>${visit.reportedAt ? new Date(visit.reportedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</span></div>
                </div>
              </div>
              
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th style="text-align: right;">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${visit.tests.map(test => `
                    <tr>
                      <td>${test.name || test.name_snapshot}</td>
                      <td style="text-align: right;">₹${test.price || 0}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr style="border-top: 2px solid #000; font-weight: bold;">
                    <td style="text-align: right; padding-top: 10px;">Total:</td>
                    <td style="text-align: right; padding-top: 10px;">₹${visit.finalAmount || 0}</td>
                  </tr>
                </tfoot>
              </table>
              
              <div class="footer">
                <p>Thank you for choosing HEALit Med Laboratories</p>
                <p style="font-size: 12px; margin-top: 5px;">This is a computer-generated invoice</p>
              </div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Mark invoice as generated and paid ONLY if first time
      if (!visit.invoiceGenerated) {
        markInvoiceGenerated(visitId);
        toast.success('✅ Invoice generated & marked as PAID!');
        
        // Trigger data updates
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('dataUpdated'));
      } else {
        toast.success('🖨️ Invoice re-printed!');
      }
      
      loadData();
    } catch (error) {
      console.error('Invoice generation error:', error);
      toast.error('Failed to generate invoice: ' + error.message);
    }
  };

  // Get patient info for a visit
  const getPatientForVisit = (visit) => {
    return patients.find(p => p.patientId === visit.patientId);
  };
  
  // Delete patient handler
  const handleDeletePatient = (visit) => {
    const patient = getPatientForVisit(visit);
    if (!patient) return;
    
    const confirmed = window.confirm(
      `⚠️ DELETE PATIENT & ALL DATA\n\n` +
      `Patient: ${patient.name}\n` +
      `Age: ${patient.age}Y / ${patient.gender}\n` +
      `Phone: ${patient.phone}\n\n` +
      `This will permanently delete:\n` +
      `• Patient record\n` +
      `• All visits\n` +
      `• All test results\n` +
      `• All invoices\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Are you sure you want to delete this patient?`
    );
    
    if (!confirmed) return;
    
    try {
      deletePatient(patient.patientId);
      toast.success(`✅ Patient "${patient.name}" deleted successfully`);
      loadData();
    } catch (error) {
      toast.error('Failed to delete patient: ' + error.message);
    }
  };

  const filteredVisits = visits.filter(visit => {
    const patient = getPatientForVisit(visit);
    if (!patient) return false;
    
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           patient.phone.includes(searchTerm);
    
    // FIXED FILTER LOGIC:
    // "Waiting" = Sample collected but results NOT entered (sample_times_set)
    // "Completed" = Results entered and report generated (report_generated OR completed)
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'waiting' && visit.status === 'sample_times_set') ||
                         (statusFilter === 'completed' && (visit.status === 'report_generated' || visit.status === 'completed'));
    
    // Payment filter with safety check
    const matchesPayment = paymentFilter === 'all' ||
                          (paymentFilter === 'paid' && visit.paymentStatus === 'paid') ||
                          (paymentFilter === 'unpaid' && (!visit.paymentStatus || visit.paymentStatus === 'unpaid'));
    
    // Date range filter
    let matchesDate = true;
    if (fromDate || toDate) {
      const visitDate = new Date(visit.registeredAt || visit.createdAt);
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && visitDate >= from;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && visitDate <= to;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  return (
    <div className="patients-page">
      <Card title="All Patients" className="patients-card">
        <div className="patients-hero">
          <div className="hero-text">
            <p className="eyebrow">Patient Management</p>
            <h1>Patient Directory</h1>
            <p>Monitor registrations, samples, and completed reports in one place.</p>
          </div>
          <div className="hero-actions">
            <div className="hero-stat">
              <span>Total Visits</span>
              <strong>{totalVisits}</strong>
            </div>
            <Button onClick={() => navigate('/patients/add-patient')} icon={Plus}>
              Add New Patient
            </Button>
          </div>
        </div>

        <div className="patients-stats-grid">
          {summaryCards.map(({ label, value, sublabel, icon: Icon }) => (
            <div key={label} className="stat-card">
              <div className="stat-icon">
                <Icon size={18} />
              </div>
              <div>
                <p className="stat-label">{label}</p>
                <div className="stat-value-row">
                  <strong>{value}</strong>
                </div>
                <p className="stat-sublabel">{sublabel}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="filters-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          {/* Date Range Filters */}
          <div className="date-filters">
            <div className="date-input-group">
              <label>From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="date-input"
              />
            </div>
            {(fromDate || toDate) && (
              <button 
                className="clear-dates-btn"
                onClick={() => { setFromDate(''); setToDate(''); }}
                title="Clear dates"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="status-legend">
            <button 
              className={`status-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Patients
            </button>
            <button 
              className={`status-pill status-registered ${statusFilter === 'waiting' ? 'active' : ''}`}
              onClick={() => setStatusFilter('waiting')}
            >
              <Clock size={14} /> Waiting
            </button>
            <button 
              className={`status-pill status-completed ${statusFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('completed')}
            >
              <CheckCircle size={14} /> Completed
            </button>
            <button 
              className={`status-pill ${paymentFilter === 'paid' ? 'active payment-paid' : ''}`}
              onClick={() => setPaymentFilter(paymentFilter === 'paid' ? 'all' : 'paid')}
            >
              <CheckCircle size={14} /> Paid
            </button>
            <button 
              className={`status-pill ${paymentFilter === 'unpaid' ? 'active payment-unpaid' : ''}`}
              onClick={() => setPaymentFilter(paymentFilter === 'unpaid' ? 'all' : 'unpaid')}
            >
              <XCircle size={14} /> Unpaid
            </button>
          </div>
        </div>

        {filteredVisits.length === 0 ? (
          <div className="empty-state">
            <User size={64} className="empty-icon" />
            <h3>No visits found</h3>
            <p>Add your first patient to get started</p>
            <Button onClick={() => navigate('/patients/add-patient')} icon={Plus} variant="primary">
              Add Patient
            </Button>
          </div>
        ) : (
          <div className="patients-table">
            <table>
              <thead>
                <tr>
                  <th><User size={14} /> Name</th>
                  <th>Age/Sex</th>
                  <th><Phone size={14} /> Phone</th>
                  <th>Profile</th>
                  <th>Current Step</th>
                  <th className="text-center">PDF</th>
                  <th className="text-center">Invoice</th>
                  <th className="text-center">Payment</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map((visit) => {
                  const patient = getPatientForVisit(visit);
                  if (!patient) return null;
                  
                  const profile = visit.profileId ? getProfileById(visit.profileId) : null;
                  
                  // Determine CURRENT STEP and next action based on visit status
                  let currentStep = '';
                  let nextAction = '';
                  let editLink = '';
                  
                  if (visit.status === 'tests_selected') {
                    currentStep = 'Registered';
                    nextAction = 'Set Sample Times';
                    editLink = `/sample-times/${visit.visitId}`;
                  } else if (visit.status === 'sample_times_set') {
                    // Check if results are entered
                    const hasResults = visit.reportedAt || (visit.tests && visit.tests.some(t => t.result?.value));
                    
                    if (hasResults) {
                      currentStep = 'Results Entered';
                      nextAction = 'Generate Report';
                      editLink = `/results/${visit.visitId}`;
                    } else {
                      currentStep = 'Pending';
                      nextAction = 'Enter Results';
                      editLink = `/results/${visit.visitId}`;
                    }
                  } else if (visit.status === 'report_generated' || visit.status === 'completed') {
                    currentStep = 'Completed';
                    nextAction = visit.pdfGenerated ? 'View Report' : 'Generate PDF';
                    editLink = `/patients/${visit.visitId}`;
                  } else {
                    currentStep = 'Unknown';
                    nextAction = 'Check Status';
                    editLink = `/patients/${visit.visitId}`;
                  }
                  
                  return (
                    <tr key={visit.visitId}>
                      <td className="patient-name">
                        <div className="name-cell">
                          <div className="avatar">{patient.name.charAt(0).toUpperCase()}</div>
                          <span>{patient.name}</span>
                        </div>
                      </td>
                      <td>{patient.age}Y/{patient.gender.charAt(0)}</td>
                      <td className="phone-cell">{patient.phone}</td>
                      <td className="profile-cell">
                        <span className="profile-tag">{profile?.name || 'N/A'}</span>
                      </td>
                      <td>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <span className={`step-badge step-${currentStep.toLowerCase()}`}>{currentStep}</span>
                          <span style={{fontSize: '0.7rem', color: '#666'}}>{nextAction}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        {visit.pdfGenerated ? (
                          <button className="icon-btn-success" onClick={() => handleGeneratePDF(visit.visitId)} title="Re-Print PDF">
                            <FileText size={14} /> <span style={{fontSize: '0.65rem', marginLeft: '2px'}}>Re-Print</span>
                          </button>
                        ) : (
                          <button className="icon-btn" onClick={() => handleGeneratePDF(visit.visitId)} title="Generate PDF">
                            <FileText size={14} />
                          </button>
                        )}
                      </td>
                      <td className="text-center">
                        {visit.invoiceGenerated ? (
                          <button className="icon-btn-success" onClick={() => handleGenerateInvoice(visit.visitId)} title="Re-Print Invoice">
                            <DollarSign size={14} /> <span style={{fontSize: '0.65rem', marginLeft: '2px'}}>Re-Print</span>
                          </button>
                        ) : (
                          <button className="icon-btn" onClick={() => handleGenerateInvoice(visit.visitId)} title="Generate Invoice">
                            <DollarSign size={14} />
                          </button>
                        )}
                      </td>
                      <td className="text-center">
                        {visit.paymentStatus === 'paid' ? (
                          <span className="payment-badge paid">Paid</span>
                        ) : (
                          <span className="payment-badge unpaid">Unpaid</span>
                        )}
                      </td>
                      <td className="text-center">
                        <div style={{display: 'flex', gap: '4px', justifyContent: 'center'}}>
                          <button 
                            className="icon-btn-edit" 
                            onClick={() => navigate(editLink)}
                            title={nextAction}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="icon-btn-view" 
                            onClick={() => navigate(`/patients/${visit.visitId}`)}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="icon-btn-delete" 
                            onClick={() => handleDeletePatient(visit)}
                            title="Delete Patient"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Patients;
