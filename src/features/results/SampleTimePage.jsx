import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Check, AlertCircle, Copy, TestTube2, Timer, Droplet, User, FileText } from 'lucide-react';
import { getVisitById, updateVisit, getPatientById, getProfileById } from '../../features/shared/dataService';
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
  const canEdit = role === 'admin' || role === 'staff' || !visit?.reportedAt;
  
  // Get current local time for datetime-local input
  const getCurrentISTTime = () => {
    const now = new Date();
    // Format for datetime-local: YYYY-MM-DDTHH:mm
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  const [currentISTTime, setCurrentISTTime] = useState(getCurrentISTTime());
  
  // Update IST time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentISTTime(getCurrentISTTime());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  // Calculate waiting time since sample collected
  const getWaitingTime = () => {
    if (!collectedAt) return null;
    
    const collected = new Date(collectedAt);
    const now = new Date();
    
    // Simple difference calculation
    const diffMs = now - collected;
    
    // If negative (future time), return null
    if (diffMs < 0) return null;
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours: diffHours, minutes: diffMins, totalMs: diffMs };
  };
  
  const waitingTime = getWaitingTime();
  
  // Alert if waiting time exceeds threshold (e.g., 24 hours)
  useEffect(() => {
    if (waitingTime && waitingTime.hours >= 24 && !visit?.reportedAt) {
      toast.error(`⚠️ Patient waiting ${waitingTime.hours}h - Results pending!`, {
        duration: 5000,
        id: `waiting-alert-${visitId}`
      });
    }
  }, [waitingTime?.hours, visit?.reportedAt, visitId]);

  // Load data
  useEffect(() => {
    console.log('=== SAMPLE TIME PAGE - Loading visit:', visitId);
    const visitData = getVisitById(visitId);
    console.log('Visit data loaded:', visitData);
    console.log('Visit tests:', visitData?.tests);
    console.log('Visit tests count:', visitData?.tests?.length || 0);
    
    if (!visitData) {
      toast.error('Visit not found');
      navigate('/patients');
      return;
    }
    setVisit(visitData);

    const patientData = getPatientById(visitData.patientId);
    console.log('Patient data:', patientData);
    setPatient(patientData);
    
    if (visitData.profileId) {
      const profileData = getProfileById(visitData.profileId);
      console.log('Profile data:', profileData);
      setProfile(profileData);
    }

    // Load existing times or set defaults to current time
    if (visitData.collectedAt) {
      const date = new Date(visitData.collectedAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setCollectedAt(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      // Default to current time
      setCollectedAt(getCurrentISTTime());
    }
    
    if (visitData.receivedAt) {
      const date = new Date(visitData.receivedAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setReceivedAt(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      // Default to current time
      setReceivedAt(getCurrentISTTime());
    }
    
    setSampleType(visitData.sampleType || 'Venous Blood');
    // Auto-fill collected by with current user's name or existing value
    setCollectedBy(visitData.collectedBy || currentUser?.fullName || currentUser?.username || '');
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
      // CRITICAL: Auto-save must also update status when both times are set
      const updates = {
        collectedAt: new Date(collectedAt).toISOString(),
        receivedAt: new Date(receivedAt).toISOString(),
        sampleType,
        collectedBy,
        notes
      };
      
      // If both times are valid, update status too
      if (collectedAt && receivedAt) {
        updates.status = 'sample_times_set';
      }
      
      updateVisit(visitId, updates);
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Autosave error:', error);
      setSaveStatus('');
    }
  };

  // Use Now button with toast acknowledgment
  const handleUseNow = (field) => {
    const now = getCurrentISTTime();
    if (field === 'collected') {
      setCollectedAt(now);
      setErrors({ ...errors, collectedAt: '' });
      toast.success('✓ Collection time set to IST', {
        icon: '🩺',
        duration: 2000
      });
    } else if (field === 'received') {
      setReceivedAt(now);
      setErrors({ ...errors, receivedAt: '' });
      toast.success('✓ Lab receipt time set to IST', {
        icon: '✅',
        duration: 2000
      });
    }
  };

  // Copy from Collected
  const handleCopyFromCollected = () => {
    setReceivedAt(collectedAt);
    setErrors({ ...errors, receivedAt: '' });
    toast.success('✓ Time copied successfully', {
      icon: '📋',
      duration: 2000
    });
  };

  // Validation with advanced error handling
  const validate = (silent = false) => {
    const newErrors = {};
    
    if (!collectedAt) {
      newErrors.collectedAt = 'Collection time is required';
    } else {
      const collectedDate = new Date(collectedAt);
      const now = new Date();
      if (collectedDate > now) {
        newErrors.collectedAt = 'Collection time cannot be in the future';
      }
    }
    
    if (!receivedAt) {
      newErrors.receivedAt = 'Receipt time is required';
    } else {
      const receivedDate = new Date(receivedAt);
      const now = new Date();
      if (receivedDate > now) {
        newErrors.receivedAt = 'Receipt time cannot be in the future';
      }
    }
    
    if (collectedAt && receivedAt) {
      const collected = new Date(collectedAt);
      const received = new Date(receivedAt);
      
      if (received < collected) {
        newErrors.receivedAt = 'Receipt time must be same or after collection time';
      }
      
      // Check if time difference is too large (> 7 days)
      const diffDays = (received - collected) / (1000 * 60 * 60 * 24);
      if (diffDays > 7) {
        newErrors.receivedAt = 'Time difference is too large (> 7 days). Please verify.';
      }
    }
    
    if (!visit?.tests || visit.tests.length === 0) {
      newErrors.general = 'No tests available. Please add at least one test.';
    }
    
    if (!silent) {
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        const firstError = Object.values(newErrors)[0];
        toast.error(firstError, { duration: 3000 });
      }
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
      // CRITICAL FIX: Save times AND update status to sample_times_set
      updateVisit(visitId, {
        collectedAt: new Date(collectedAt).toISOString(),
        receivedAt: new Date(receivedAt).toISOString(),
        sampleType,
        collectedBy,
        notes,
        status: 'sample_times_set' // THIS WAS MISSING!
      });

      toast.success('✅ Sample times saved successfully!');
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
    <div className="sample-time-premium">
      {/* Compact Header */}
      <div className="premium-header-sample">
        <button className="back-btn-compact" onClick={() => navigate('/patients')}>
          <ArrowLeft size={18} />
        </button>
        <div className="header-info-inline">
          <h1>Sample Times</h1>
          <span className="patient-name-inline">{patient.name}</span>
          {waitingTime && waitingTime.hours >= 0 && (
            <div className={`waiting-badge-inline ${
              waitingTime.hours >= 24 ? 'urgent' : waitingTime.hours >= 12 ? 'warning' : 'normal'
            }`}>
              <Timer size={14} />
              {waitingTime.hours}h {waitingTime.minutes}m waiting
            </div>
          )}
        </div>
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="error-alert-premium">
          <AlertCircle size={18} />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Main Content - Compact Grid */}
      <div className="sample-content-compact">
        
        {/* Info Bar */}
        <div className="info-bar-compact">
          <div className="info-item">
            <span className="label">Patient:</span>
            <span className="value">{patient.name}, {patient.age}Y/{patient.gender}</span>
          </div>
          <div className="info-item" title={visit.tests?.map(t => t.name || t.name_snapshot).join(', ')}>
            <TestTube2 size={16} className="icon-tests" />
            <span className="label">Tests:</span>
            <span className="value tests-hover">{visit.tests?.length || 0} • {visit.profileNames || 'Custom'}</span>
          </div>
          <div className="info-item">
            <span className="label">Amount:</span>
            <span className="value amount">₹{visit.finalAmount?.toLocaleString() || 0}</span>
          </div>
          <div className="info-item ist-time">
            <Clock size={14} className="icon-time" />
            <span className="value time-display">
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} IST
            </span>
          </div>
          {currentUser && (
            <div className="info-item staff-info" title={`User: ${currentUser.fullName || currentUser.username} (${currentUser.userId})`}>
              <User size={14} className="icon-staff" />
              <span className="value staff-name">{currentUser.fullName || currentUser.username}</span>
            </div>
          )}
        </div>

        {/* Time Grid - Compact */}
        <div className="time-grid-compact">
          
          {/* Sample Collected */}
          <div className="time-field-compact">
            <div className="field-header">
              <Clock size={18} className="icon-blue" />
              <label>Sample Collected</label>
              <button
                type="button"
                className="btn-now-compact"
                onClick={() => handleUseNow('collected')}
                disabled={!canEdit}
                title="Set to current IST time"
              >
                <Clock size={14} />
                Now
              </button>
            </div>
            <input
              type="datetime-local"
              value={collectedAt}
              onChange={(e) => {
                setCollectedAt(e.target.value);
                setErrors({ ...errors, collectedAt: '' });
                toast.success('✓ Collected time set', { duration: 1500 });
              }}
              className={`time-input-compact ${errors.collectedAt ? 'error' : ''}`}
              disabled={!canEdit}
              placeholder="Select collection time"
            />
            {collectedAt && !errors.collectedAt && (
              <div className="time-display-12h">
                {new Date(collectedAt).toLocaleString('en-IN', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short',
                  hour12: true 
                })}
              </div>
            )}
            {errors.collectedAt && (
              <span className="error-msg"><AlertCircle size={12} /> {errors.collectedAt}</span>
            )}
          </div>

          {/* Sample Received */}
          <div className="time-field-compact">
            <div className="field-header">
              <Check size={18} className="icon-green" />
              <label>Received at Lab</label>
              <div className="btn-group-compact">
                <button
                  type="button"
                  className="btn-now-compact"
                  onClick={() => handleUseNow('received')}
                  disabled={!canEdit}
                  title="Set to current IST time"
                >
                  <Clock size={14} />
                  Now
                </button>
                <button
                  type="button"
                  className="btn-icon-compact"
                  onClick={handleCopyFromCollected}
                  disabled={!canEdit || !collectedAt}
                  title="Copy from collected"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <input
              type="datetime-local"
              value={receivedAt}
              onChange={(e) => {
                setReceivedAt(e.target.value);
                setErrors({ ...errors, receivedAt: '' });
                toast.success('✓ Received time set', { duration: 1500 });
              }}
              className={`time-input-compact ${errors.receivedAt ? 'error' : ''}`}
              disabled={!canEdit}
              placeholder="Select receipt time"
            />
            {receivedAt && !errors.receivedAt && (
              <div className="time-display-12h">
                {new Date(receivedAt).toLocaleString('en-IN', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short',
                  hour12: true 
                })}
              </div>
            )}
            {errors.receivedAt && (
              <span className="error-msg"><AlertCircle size={12} /> {errors.receivedAt}</span>
            )}
          </div>
        </div>

        {/* Optional Fields - Inline */}
        <div className="optional-fields-compact">
          <div className="field-inline">
            <Droplet size={16} className="field-icon" />
            <label>Sample Type:</label>
            <select
              value={sampleType}
              onChange={(e) => setSampleType(e.target.value)}
              disabled={!canEdit}
            >
              <option value="Venous Blood">Venous Blood</option>
              <option value="Finger Prick">Finger Prick</option>
              <option value="Urine">Urine</option>
              <option value="Stool">Stool</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="field-inline">
            <User size={16} className="field-icon" />
            <label>Collected By:</label>
            <input
              type="text"
              value={collectedBy}
              onChange={(e) => setCollectedBy(e.target.value)}
              placeholder="Technician name"
              disabled={!canEdit}
            />
          </div>
          
          <div className="field-inline full">
            <FileText size={16} className="field-icon" />
            <label>Notes:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fasting status, sample condition, etc."
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="footer-compact">
          {saveStatus && (
            <div className="save-status">
              {saveStatus === 'saving' && (
                <><div className="spinner-mini"></div>Saving...</>
              )}
              {saveStatus === 'saved' && (
                <><Check size={14} />Saved</>
              )}
            </div>
          )}
          <div className="button-group-footer">
            <Button
              variant="outline"
              onClick={() => {
                handleAutoSave();
                toast.success('✓ Times saved!', { duration: 2000 });
              }}
              disabled={!canEdit}
              icon={Check}
            >
              Save Times
            </Button>
            <Button
              variant="primary"
              onClick={handleContinue}
              disabled={isSubmitting || !canEdit}
              icon={isSubmitting ? null : ArrowLeft}
            >
              {isSubmitting ? 'Saving...' : 'Continue to Results →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleTimePage;
