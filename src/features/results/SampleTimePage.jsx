import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Check, AlertCircle, Copy, Edit } from 'lucide-react';
import { getVisitById, updateVisit, getPatientById, getProfileById } from '../shared/dataService';
import { getCurrentUser } from '../../services/authService';
import { useAuthStore } from '../../store';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import './SampleTime.css';

const SampleTimePage = () => {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const currentUser = getCurrentUser();
  const saveTimeoutRef = useRef(null);

  const [visit, setVisit] = useState(null);
  const [patient, setPatient] = useState(null);
  const [profile, setProfile] = useState(null);
  
  // Time fields
  const [collectedAt, setCollectedAt] = useState('');
  const [receivedAt, setReceivedAt] = useState('');
  const [sampleType, setSampleType] = useState('Venous Blood');
  const [collectedBy, setCollectedBy] = useState('');
  const [notes, setNotes] = useState('');
  
  // UI state
  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved'
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Permission check
  const canEdit = role === 'admin' || !visit?.reportedAt;

  // Load data
  useEffect(() => {
    const visitData = getVisitById(visitId);
    if (!visitData) {
      toast.error('Visit not found');
      navigate('/patients');
      return;
    }
    setVisit(visitData);

    const patientData = getPatientById(visitData.patientId);
    setPatient(patientData);
    
    if (visitData.profileId) {
      const profileData = getProfileById(visitData.profileId);
      setProfile(profileData);
    }

    // Load existing times or set defaults
    if (visitData.collectedAt) {
      setCollectedAt(new Date(visitData.collectedAt).toISOString().slice(0, 16));
    } else {
      // Default to now
      const now = new Date();
      setCollectedAt(now.toISOString().slice(0, 16));
    }
    
    if (visitData.receivedAt) {
      setReceivedAt(new Date(visitData.receivedAt).toISOString().slice(0, 16));
    } else {
      // Default to now
      const now = new Date();
      setReceivedAt(now.toISOString().slice(0, 16));
    }
    
    setSampleType(visitData.sampleType || 'Venous Blood');
    setCollectedBy(visitData.collectedBy || '');
    setNotes(visitData.notes || '');
  }, [visitId, navigate]);

  // Autosave functionality
  useEffect(() => {
    if (!visit || !collectedAt || !receivedAt) return;
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for autosave
    saveTimeoutRef.current = setTimeout(() => {
      handleAutoSave();
    }, 2000); // 2 seconds debounce
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [collectedAt, receivedAt, sampleType, collectedBy, notes]);

  const handleAutoSave = () => {
    if (!validate(true)) return; // Skip autosave if invalid
    
    setSaveStatus('saving');
    
    try {
      updateVisit(visitId, {
        collectedAt: new Date(collectedAt).toISOString(),
        receivedAt: new Date(receivedAt).toISOString(),
        sampleType,
        collectedBy,
        notes
      });
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Autosave error:', error);
      setSaveStatus('');
    }
  };

  // Use Now button
  const handleUseNow = (field) => {
    const now = new Date().toISOString().slice(0, 16);
    if (field === 'collected') {
      setCollectedAt(now);
      setErrors({ ...errors, collectedAt: '' });
    } else if (field === 'received') {
      setReceivedAt(now);
      setErrors({ ...errors, receivedAt: '' });
    }
  };

  // Copy from Collected
  const handleCopyFromCollected = () => {
    setReceivedAt(collectedAt);
    setErrors({ ...errors, receivedAt: '' });
    toast.success('Copied from collected time');
  };

  // Validation
  const validate = (silent = false) => {
    const newErrors = {};
    
    if (!collectedAt) {
      newErrors.collectedAt = 'Required field';
    }
    
    if (!receivedAt) {
      newErrors.receivedAt = 'Required field';
    }
    
    if (collectedAt && receivedAt) {
      const collected = new Date(collectedAt);
      const received = new Date(receivedAt);
      
      if (received < collected) {
        newErrors.receivedAt = 'Received time must be same or later than Collected time';
      }
    }
    
    if (!visit?.tests || visit.tests.length === 0) {
      newErrors.general = 'No tests available. Please add at least one test.';
    }
    
    if (!silent) {
      setErrors(newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  // Handle Continue to Results
  const handleContinue = () => {
    if (!validate()) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save times to visit
      updateVisit(visitId, {
        collectedAt: new Date(collectedAt).toISOString(),
        receivedAt: new Date(receivedAt).toISOString(),
        sampleType,
        collectedBy,
        notes
      });

      toast.success('Times saved successfully!');
      // Navigate to Result Entry page
      navigate(`/results/${visitId}`);
    } catch (error) {
      console.error('Error saving times:', error);
      toast.error('Failed to save times');
      setIsSubmitting(false);
    }
  };

  if (!visit || !patient) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="sample-time-page">
      {/* Page Header */}
      <div className="page-header-modern">
        <div className="header-left">
          <Button variant="outline" onClick={() => navigate(`/tests/${patient.patientId}`)}>
            <ArrowLeft size={18} />
            Back to Test Selection
          </Button>
        </div>
        <div className="header-center">
          <h1>Sample & Processing Times</h1>
        </div>
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="error-banner">
          <AlertCircle size={18} />
          {errors.general}
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="two-column-layout">
        {/* LEFT COLUMN - Time Inputs */}
        <div className="left-column-times">
          <div className="card-modern time-inputs-card">
            <div className="card-header-blue">
              <Clock size={20} />
              <h3>Sample & Processing Times</h3>
            </div>
            
            <div className="card-body">
              {/* Autosave Status */}
              {saveStatus && (
                <div className={`save-status ${saveStatus}`}>
                  {saveStatus === 'saving' && '💾 Saving...'}
                  {saveStatus === 'saved' && '✓ Saved'}
                </div>
              )}

              {/* Sample Collected On */}
              <div className="form-group-modern">
                <div className="label-row">
                  <label className="label-blue">Sample Collected On *</label>
                  <button
                    type="button"
                    className="btn-use-now"
                    onClick={() => handleUseNow('collected')}
                    disabled={!canEdit}
                  >
                    Use Now
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={collectedAt}
                  onChange={(e) => {
                    setCollectedAt(e.target.value);
                    setErrors({ ...errors, collectedAt: '' });
                  }}
                  className={`input-modern datetime-input ${errors.collectedAt ? 'input-error' : ''}`}
                  disabled={!canEdit}
                />
                <span className="helper-text">Collected from patient</span>
                {errors.collectedAt && (
                  <span className="error-message">
                    <AlertCircle size={14} />
                    {errors.collectedAt}
                  </span>
                )}
              </div>

              {/* Sample Received On */}
              <div className="form-group-modern">
                <div className="label-row">
                  <label className="label-blue">Sample Received On *</label>
                  <div className="button-group-inline">
                    <button
                      type="button"
                      className="btn-use-now"
                      onClick={() => handleUseNow('received')}
                      disabled={!canEdit}
                    >
                      Use Now
                    </button>
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={handleCopyFromCollected}
                      disabled={!canEdit || !collectedAt}
                      title="Copy from Collected"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={receivedAt}
                  onChange={(e) => {
                    setReceivedAt(e.target.value);
                    setErrors({ ...errors, receivedAt: '' });
                  }}
                  className={`input-modern datetime-input ${errors.receivedAt ? 'input-error' : ''}`}
                  disabled={!canEdit}
                />
                <span className="helper-text">Received at HEALit Lab</span>
                {errors.receivedAt && (
                  <span className="error-message">
                    <AlertCircle size={14} />
                    {errors.receivedAt}
                  </span>
                )}
              </div>

              {/* Reported On (readonly) */}
              <div className="form-group-modern">
                <label className="label-blue">Reported On</label>
                <input
                  type="text"
                  value={visit.reportedAt ? new Date(visit.reportedAt).toLocaleString() : 'Not yet generated'}
                  className="input-modern"
                  disabled
                />
                <span className="helper-text">Auto-filled when generating the result PDF</span>
              </div>

              {/* Divider */}
              <div className="divider-modern"></div>

              {/* Optional Fields */}
              <h4 className="section-title-small">Optional Information</h4>

              {/* Sample Type */}
              <div className="form-group-modern">
                <label className="label-blue">Sample Type</label>
                <select
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  className="input-modern"
                  disabled={!canEdit}
                >
                  <option value="Venous Blood">Venous Blood</option>
                  <option value="Finger Prick">Finger Prick</option>
                  <option value="Urine">Urine</option>
                  <option value="Stool">Stool</option>
                  <option value="Saliva">Saliva</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Collected By */}
              <div className="form-group-modern">
                <label className="label-blue">Collected By</label>
                <input
                  type="text"
                  value={collectedBy}
                  onChange={(e) => setCollectedBy(e.target.value)}
                  className="input-modern"
                  placeholder="Technician name (optional)"
                  disabled={!canEdit}
                />
              </div>

              {/* Notes */}
              <div className="form-group-modern">
                <label className="label-blue">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-modern textarea-modern"
                  rows="3"
                  placeholder="Fasting status, sample condition, etc."
                  disabled={!canEdit}
                />
              </div>

              {!canEdit && (
                <div className="locked-message">
                  <AlertCircle size={16} />
                  Times are locked after report generation. Contact admin to edit.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Visit Summary */}
        <div className="right-column-summary">
          <div className="card-modern visit-summary-card">
            <div className="card-header-blue">
              <h3>Visit Summary</h3>
            </div>
            
            <div className="card-body">
              <div className="summary-item">
                <span className="label-summary">Patient Name</span>
                <span className="value-summary">{patient.name}</span>
              </div>
              
              <div className="summary-item">
                <span className="label-summary">Age / Gender</span>
                <span className="value-summary">{patient.age}Y / {patient.gender}</span>
              </div>
              
              <div className="summary-item">
                <span className="label-summary">Phone</span>
                <span className="value-summary">{patient.phone}</span>
              </div>
              
              <div className="summary-item">
                <span className="label-summary">Selected Profile</span>
                <span className="profile-badge-summary">{profile?.name || 'Custom'}</span>
              </div>
              
              <div className="summary-item">
                <span className="label-summary">Number of Tests</span>
                <span className="value-summary-highlight">{visit.tests?.length || 0} tests</span>
              </div>
              
              <div className="summary-item price-row">
                <span className="label-summary">Total Estimated Price</span>
                <span className="value-price">₹{visit.finalAmount?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fixed Action Bar */}
      <div className="action-bar-fixed">
        <Button 
          variant="outline" 
          onClick={() => navigate('/patients')}
          disabled={isSubmitting}
        >
          Back to Patients
        </Button>
        <Button 
          variant="primary" 
          onClick={handleContinue}
          disabled={isSubmitting || !canEdit}
        >
          {isSubmitting ? 'Saving...' : 'Save & Continue → Enter Results'}
        </Button>
      </div>
    </div>
  );
};

export default SampleTimePage;
