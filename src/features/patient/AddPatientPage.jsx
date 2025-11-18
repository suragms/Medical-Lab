import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Heart, X, User, Calendar, Phone, MapPin, Stethoscope, AlertCircle, TestTube } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProfiles, addPatient, createVisit, getSettings } from '../shared/dataService';
import { getCurrentUser } from '../../services/authService';
import { useAuthStore } from '../../store';
import Button from '../../components/ui/Button';
import SearchAddTest from '../../components/tests/SearchAddTest/SearchAddTest';
import './AddPatient.css';

const AddPatientPage = () => {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const currentUser = getCurrentUser();
  
  // Patient form state
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    referredBy: ''
  });
  
  // Test selection state
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [customTests, setCustomTests] = useState([]);
  const [finalAmount, setFinalAmount] = useState('');
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  
  // Profiles
  const [profiles] = useState(getProfiles());
  const settings = getSettings();
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle profile selection
  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
    // Calculate total from profile
    setFinalAmount(profile.packagePrice || 0);
  };
  
  // Add test to custom list
  const handleAddTest = (test) => {
    // Check if test already added
    if (customTests.some(t => t.testId === test.testId)) {
      toast.error('Test already added');
      return;
    }
    
    setCustomTests(prev => [...prev, test]);
    
    // Recalculate total if no profile selected
    if (!selectedProfile) {
      const newTotal = customTests.reduce((sum, t) => sum + (t.price || 0), test.price || 0);
      setFinalAmount(newTotal);
    }
  };
  
  // Remove test from custom list
  const handleRemoveTest = (testId) => {
    setCustomTests(prev => prev.filter(t => t.testId !== testId));
    
    // Recalculate total if no profile selected
    if (!selectedProfile) {
      const newTotal = customTests.filter(t => t.testId !== testId).reduce((sum, t) => sum + (t.price || 0), 0);
      setFinalAmount(newTotal);
    }
  };
  
  // Handle create profile
  const handleCreateProfile = () => {
    // This would typically open a modal or navigate to profile creation
    toast.success('Profile creation feature coming soon!');
    setShowCreateProfile(false);
  };
  
  // Validation
  const validateForm = () => {
    if (!patientData.name.trim()) {
      toast.error('Full name is required');
      return false;
    }
    
    if (!patientData.age || patientData.age <= 0 || patientData.age > 150) {
      toast.error('Enter a valid age (1-150)');
      return false;
    }
    
    if (!patientData.gender) {
      toast.error('Gender is required');
      return false;
    }
    
    if (!patientData.phone || !/^\d{10}$/.test(patientData.phone)) {
      toast.error('Enter a valid 10-digit phone number');
      return false;
    }
    
    if (!selectedProfile && customTests.length === 0) {
      toast.error('Select a test profile or add individual tests to continue');
      return false;
    }
    
    return true;
  };
  
  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      // Add patient
      const patient = await addPatient({
        ...patientData,
        age: parseInt(patientData.age),
        addedBy: currentUser.userId,
        addedByRole: role
      });
      
      // Create visit
      const testsToSave = selectedProfile 
        ? selectedProfile.tests || [] 
        : customTests;
        
      const visitData = {
        patientId: patient.patientId,
        profileId: selectedProfile?.profileId || null,
        profileName: selectedProfile?.name || 'Custom',
        tests: testsToSave,
        finalAmount: parseFloat(finalAmount) || 0,
        status: 'registered',
        addedBy: currentUser.userId,
        addedByRole: role
      };
      
      const visit = await createVisit(visitData);
      
      toast.success('Patient registered successfully!');
      navigate(`/sample-times/${visit.visitId}`);
    } catch (error) {
      console.error('Error adding patient:', error);
      toast.error('Failed to register patient. Please try again.');
    }
  };
  
  // Calculate test count
  const testCount = selectedProfile 
    ? selectedProfile.tests?.length || 0 
    : customTests.length;
  
  return (
    <div className="add-patient-page">
      <div className="page-header">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/patients')}
          icon={ArrowLeft}
        >
          Back to Patients
        </Button>
        <div>
          <h1>Register Patient & Configure Tests</h1>
          <p className="subtitle">Enter patient details and select required tests</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="two-column-layout">
          {/* LEFT COLUMN - Patient Information */}
          <div className="left-column">
            <div className="card-modern">
              <div className="card-header-blue">
                <h3>
                  <User size={20} />
                  Patient Information
                </h3>
              </div>
              <div className="card-body-compact">
                <div className="form-row-compact">
                  <div className="form-group-compact full-width">
                    <label className="label-blue">
                      Full Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={patientData.name}
                      onChange={handleInputChange}
                      className="input-modern"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  
                  <div className="form-group-compact">
                    <label className="label-blue">
                      Age <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={patientData.age}
                      onChange={handleInputChange}
                      className="input-modern"
                      placeholder="Years"
                      min="0"
                      max="150"
                      required
                    />
                  </div>
                  
                  <div className="form-group-compact">
                    <label className="label-blue">
                      Gender <span className="required">*</span>
                    </label>
                    <select
                      name="gender"
                      value={patientData.gender}
                      onChange={handleInputChange}
                      className="input-modern"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group-compact full-width">
                    <label className="label-blue">
                      Phone Number <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={patientData.phone}
                      onChange={handleInputChange}
                      className="input-modern"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                  
                  <div className="form-group-compact full-width">
                    <label className="label-blue">
                      <MapPin size={16} />
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={patientData.address}
                      onChange={handleInputChange}
                      className="input-modern"
                      placeholder="Full address (optional)"
                    />
                  </div>
                  
                  <div className="form-group-compact full-width">
                    <label className="label-blue">
                      <Stethoscope size={16} />
                      Referred By Doctor
                    </label>
                    <input
                      type="text"
                      name="referredBy"
                      value={patientData.referredBy}
                      onChange={handleInputChange}
                      className="input-modern"
                      placeholder="Doctor name (optional)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* RIGHT COLUMN - Test Selection */}
          <div className="right-column right-column-sticky">
            <div className="card-modern">
              <div className="card-header-blue">
                <h3>
                  <TestTube size={20} />
                  Test Configuration
                </h3>
              </div>
              <div className="card-body">
                {/* Profile Selection */}
                <div className="form-group-modern">
                  <div className="label-row">
                    <label className="label-blue">
                      Select Test Profile
                    </label>
                    {settings.allowManualTests && (
                      <Button 
                        type="button"
                        variant="outline"
                        size="small"
                        onClick={() => setShowCreateProfile(true)}
                        icon={Plus}
                      >
                        Create New
                      </Button>
                    )}
                  </div>
                  
                  <div className="profile-options-grid">
                    {profiles.filter(p => p.active).map(profile => (
                      <div
                        key={profile.profileId}
                        className={`profile-option-card ${
                          selectedProfile?.profileId === profile.profileId ? 'selected' : ''
                        }`}
                        onClick={() => handleProfileSelect(profile)}
                      >
                        <div className="profile-card-header">
                          <strong>{profile.name}</strong>
                          <span className="profile-price">₹{profile.packagePrice || 0}</span>
                        </div>
                        <div className="profile-card-body">
                          <span className="test-count">
                            {profile.tests?.length || 0} tests included
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedProfile && (
                    <div className="selected-profile-badge">
                      <span>Selected:</span>
                      <strong>{selectedProfile.name}</strong>
                      <button 
                        type="button"
                        onClick={() => setSelectedProfile(null)}
                        className="clear-selection"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="divider-modern"></div>
                
                {/* Custom Test Selection */}
                <div className="form-group-modern">
                  <div className="label-row">
                    <label className="label-blue">
                      Add Individual Tests
                    </label>
                    <span className="test-count-badge">
                      {customTests.length} added
                    </span>
                  </div>
                  
                  <SearchAddTest 
                    onAddTest={handleAddTest}
                    onAddManual={settings.allowManualTests ? () => toast.success('Manual test creation coming soon!') : null}
                  />
                  
                  {/* Selected Tests List */}
                  {customTests.length > 0 && (
                    <div className="selected-tests-list">
                      {customTests.map(test => (
                        <div key={test.testId} className="selected-test-item">
                          <div className="test-info">
                            <strong>{test.name}</strong>
                            <span className="test-price">₹{test.price || 0}</span>
                          </div>
                          <button
                            type="button"
                            className="remove-test-btn"
                            onClick={() => handleRemoveTest(test.testId)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Pricing Summary */}
                <div className="pricing-summary">
                  <div className="price-row">
                    <span>Total Tests:</span>
                    <span>
                      <strong>{testCount}</strong>
                    </span>
                  </div>
                  
                  <div className="price-row final-amount">
                    <span>Final Amount:</span>
                    <span className="amount">
                      ₹
                      <input
                        type="number"
                        value={finalAmount}
                        onChange={(e) => setFinalAmount(e.target.value)}
                        className="amount-input"
                        min="0"
                        step="0.01"
                        disabled={!!selectedProfile && !['admin', 'manager'].includes(role)}
                      />
                    </span>
                  </div>
                  
                  {selectedProfile && !['admin', 'manager'].includes(role) && settings.allowStaffEditPrice && (
                    <div className="helper-text">
                      <AlertCircle size={14} />
                      Only managers can edit profile prices
                    </div>
                  )}
                </div>
                
                {/* Submit Button */}
                <div className="form-actions-compact">
                  <Button 
                    type="submit"
                    variant="primary"
                    icon={Heart}
                    className="submit-btn-full"
                  >
                    Continue to Sample Collection →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
      
      {/* Create Profile Modal */}
      {showCreateProfile && (
        <div className="modal-overlay" onClick={() => setShowCreateProfile(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Profile</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowCreateProfile(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <p>Profile creation interface would go here.</p>
              <p>In a full implementation, this would allow creating custom test profiles.</p>
            </div>
            
            <div className="modal-footer-modern">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowCreateProfile(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                variant="primary" 
                onClick={handleCreateProfile}
                icon={Heart}
              >
                Create Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPatientPage;