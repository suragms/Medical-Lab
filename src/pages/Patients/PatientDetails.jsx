import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Share2, Printer, Mail, User, Phone, MapPin, Calendar, Stethoscope, Edit, X, Save, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProfileTemplate } from '../../features/profile-manager/profileTemplates';
import { downloadReportPDF, printReportPDF, shareViaWhatsApp, shareViaEmail } from '../../utils/pdfGenerator';
import { getVisitById, getPatientById, getProfileById, updatePatient } from '../../features/shared/dataService';
import { getTechnicians } from '../../services/authService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './PatientDetails.css';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState(null);
  const [patient, setPatient] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    referredBy: ''
  });
  
  // Load visit data from new data service
  useEffect(() => {
    const loadVisitData = () => {
      try {
        const visitData = getVisitById(id);
        if (!visitData) {
          setLoading(false);
          return;
        }
        
        const patientData = getPatientById(visitData.patientId);
        const profileData = getProfileById(visitData.profileId);
        
        setVisit(visitData);
        setPatient(patientData);
        setProfile(profileData);
      } catch (error) {
        console.error('Error loading visit data:', error);
        toast.error('Failed to load visit details');
      } finally {
        setLoading(false);
      }
    };
    
    loadVisitData();
  }, [id]);

  const visitStatus = visit?.status || 'tests_selected';
  const hasResults = visitStatus === 'report_generated' && visit?.tests && visit.tests.length > 0 && visit.reportedAt;
  const workflowSteps = [
    {
      id: 'tests_selected',
      label: 'Registration',
      description: 'Patient details & tests captured'
    },
    {
      id: 'sample_times_set',
      label: 'Sample Details',
      description: 'Collection timings recorded'
    },
    {
      id: 'results_entered',
      label: 'Results Entry',
      description: 'All test results entered'
    },
    {
      id: 'report_generated',
      label: 'Report Ready',
      description: 'Report generated & shared'
    }
  ];
  const currentStepIndex = Math.max(
    0,
    workflowSteps.findIndex((step) => step.id === visitStatus)
  );
  const canEditSampleTime = visitStatus !== 'report_generated';
  const canEnterResults = ['sample_times_set', 'results_entered', 'report_generated'].includes(visitStatus);

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
            </div>
          </Card>

          {hasResults && (
            <Card title="Report Actions" className="actions-card">
              <div className="action-grid">
                <Button 
                  onClick={handleDownloadPDF}
                  icon={Download}
                  variant="primary"
                  loading={isGenerating}
                >
                  Download PDF
                </Button>
                <Button 
                  onClick={handlePrint}
                  icon={Printer}
                  variant="secondary"
                  loading={isGenerating}
                >
                  Print Report
                </Button>
                <Button 
                  onClick={handleWhatsAppShare}
                  icon={Share2}
                  variant="success"
                  loading={isGenerating}
                >
                  Share via WhatsApp
                </Button>
                <Button 
                  onClick={() => shareViaEmail({
                    ...visit,
                    patient,
                    profile,
                    signingTechnician: visit.signing_technician_id ? 
                      getTechnicians().find(t => t.technicianId === visit.signing_technician_id) : null
                  }, patient.email || '')}
                  icon={Mail}
                  variant="secondary"
                  loading={isGenerating}
                >
                  Share via Email
                </Button>
              </div>
            </Card>
          )}
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

    </div>
  );
};

export default PatientDetails;
