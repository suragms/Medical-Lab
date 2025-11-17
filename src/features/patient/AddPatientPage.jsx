/**
 * AddPatientPage.jsx - COMPACT & IMPROVED VERSION
 * 
 * ALL-IN-ONE Patient Registration & Test Selection Page
 * 
 * IMPROVEMENTS:
 * - Compact left form (380px) with smaller fields
 * - Right side shows profile + test table with descriptions
 * - Quick "+ Add Test" button with instant search modal
 * - Inline price editing for all tests (admin/staff)
 * - Easy test restoration if accidentally deleted
 * - Live price calculation with discount
 * 
 * WORKFLOW:
 * 1. Fill patient info (compact form)
 * 2. Select profile → Tests load with descriptions
 * 3. Edit prices inline
 * 4. Delete test by mistake → Click "+" → Search → Add back
 * 5. Apply discount → See total
 * 6. Continue to Sample Time
 * 
 * @version 3.0 - Compact & Efficient
 * @since 2025-11-17
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, UserCheck, Plus, X, AlertCircle, Search, Edit3, Package, ArrowLeft, ClipboardList, Wallet, Calendar } from 'lucide-react';
import { addPatient, getProfiles, addProfile, getProfileById, createVisit, getProfileWithTests, searchTests, addTestToMaster, getSettings } from '../shared/dataService';
import { useAuthStore } from '../../store';
import { getCurrentUser } from '../../services/authService';
import Button from '../../components/ui/Button';
import SearchAddTest from '../../components/tests/SearchAddTest/SearchAddTest';
import toast from 'react-hot-toast';
import './AddPatient.css';

const AddPatientPage = () => {
  const navigate = useNavigate();
  const nameInputRef = useRef(null);
  const { role, user } = useAuthStore();
  const currentUser = getCurrentUser();
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    address: '',
    referredBy: ''
  });

  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profilePrice, setProfilePrice] = useState(0);
  const [customPrice, setCustomPrice] = useState('');
  const [profiles, setProfiles] = useState([]);
  
  // Tests from selected profile
  const [tests, setTests] = useState([]);
  const [discount, setDiscount] = useState(0);
  
  // Manual Add Test Modal
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    code: '',
    unit: '',
    inputType: 'number',
    refLow: '',
    refHigh: '',
    refText: '',
    price: '',
    category: 'Custom'
  });
  
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    description: ''
  });
  
  // Quick Add Test Modal State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Form validation and submission state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Permission check
  const settings = getSettings();
  const canEditPrice = role === 'admin' || settings.allowStaffEditPrice;
  const canCreateCustom = role === 'admin' || settings.allowManualTests;
  
  // Quick add test from search
  const handleQuickAddTest = (test) => {
    // Check if test already added
    const exists = tests.find(t => t.testId === test.testId);
    if (exists) {
      toast.error(`${test.name} is already in the list`);
      return;
    }

    const newTestEntry = {
      ...test,
      id: `${test.testId}_${Date.now()}`,
      included: true,
      description: test.description || test.refText || '' // Add description
    };
    setTests([...tests, newTestEntry]);
    toast.success(`${test.name} added successfully`);
    setShowQuickAdd(false);
    setSearchQuery('');
  };

  // Auto-focus on Full Name field
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);
  
  // Load profiles
  useEffect(() => {
    setProfiles(getProfiles());
  }, []);
  
  // Search tests when search query changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const results = searchTests(searchQuery);
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);
  
  // Handle profile selection
  useEffect(() => {
    if (selectedProfileId) {
      const profile = getProfileById(selectedProfileId);
      setSelectedProfile(profile);
      setProfilePrice(profile?.packagePrice || 0);
      setCustomPrice('');
      
      // Load tests from profile with getProfileWithTests
      const profileWithTests = getProfileWithTests(selectedProfileId);
      if (profileWithTests && profileWithTests.tests) {
        const testsWithIncluded = profileWithTests.tests.map((test, idx) => ({
          ...test,
          id: `${test.testId}_${idx}`,
          included: true,
          description: test.description || test.refText || '' // Add description field
        }));
        setTests(testsWithIncluded);
      }
    } else {
      setSelectedProfile(null);
      setProfilePrice(0);
      setCustomPrice('');
      setTests([]);
    }
  }, [selectedProfileId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required field validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.age || formData.age < 0 || formData.age > 120) {
      newErrors.age = 'Age must be between 0 and 120';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    
    if (!selectedProfileId) {
      newErrors.profile = 'Select a test profile to continue';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateProfile = () => {
    if (!newProfile.name.trim()) {
      toast.error('Please enter profile name');
      return;
    }

    const profile = addProfile({
      name: newProfile.name,
      description: newProfile.description,
      testIds: [],
      packagePrice: null
    });

    setProfiles(getProfiles());
    setSelectedProfileId(profile.profileId);
    setShowCreateProfile(false);
    setNewProfile({ name: '', description: '' });
    toast.success('Profile created successfully!');
  };

  const handleToggleInclude = (id) => {
    setTests(tests.map(test =>
      test.id === id ? { ...test, included: !test.included } : test
    ));
  };
  
  const handleTestPriceChange = (id, newPrice) => {
    if (!canEditPrice) return;
    setTests(tests.map(test =>
      test.id === id ? { ...test, price: parseFloat(newPrice) || 0 } : test
    ));
  };
  
  const handleRemoveTest = (id) => {
    setTests(tests.filter(test => test.id !== id));
  };
  
  // Add test from search results
  const handleAddTestFromSearch = (test) => {
    // Check if test already added
    const exists = tests.find(t => t.testId === test.testId);
    if (exists) {
      toast.error('Test already added to the list');
      return;
    }

    const newTestEntry = {
      ...test,
      id: `${test.testId}_${Date.now()}`,
      included: true
    };
    setTests([...tests, newTestEntry]);
    toast.success(`${test.name} added successfully`);
  };
  
  // Manual add test
  const handleManualTestAdd = () => {
    if (!newTest.name.trim() || !newTest.unit.trim()) {
      toast.error('Test name and unit are required');
      return;
    }

    const customTest = {
      testId: `CUSTOM_${Date.now()}`,
      id: `CUSTOM_${Date.now()}`,
      name: newTest.name,
      code: newTest.code || '',
      unit: newTest.unit,
      inputType: newTest.inputType,
      refLow: newTest.refLow || null,
      refHigh: newTest.refHigh || null,
      refText: newTest.refText || '',
      price: parseFloat(newTest.price) || 0,
      category: newTest.category,
      active: true,
      included: true,
      isCustom: true
    };

    // If allowed, add to master test database
    if (canCreateCustom) {
      addTestToMaster(customTest);
      toast.success('Custom test added to master database');
    } else {
      toast.success('Custom test added for this patient only');
    }

    setTests([...tests, customTest]);
    setShowManualAdd(false);
    
    // Reset form
    setNewTest({
      name: '',
      code: '',
      unit: '',
      inputType: 'number',
      refLow: '',
      refHigh: '',
      refText: '',
      price: '',
      category: 'Custom'
    });
  };
  
  // Handle test field edits
  const handleTestFieldChange = (id, field, value) => {
    setTests(tests.map(test =>
      test.id === id ? { ...test, [field]: value } : test
    ));
  };
  
  const calculateSubtotal = () => {
    return tests
      .filter(t => t.included)
      .reduce((sum, test) => sum + (parseFloat(test.price) || 0), 0);
  };
  
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const includedTests = useMemo(() => tests.filter((t) => t.included), [tests]);
  const subtotalAmount = useMemo(() => calculateSubtotal(), [tests, discount]);
  const totalAmount = useMemo(() => calculateTotal(), [tests, discount]);
  const formattedCustomPrice = Number(newTest.price || 0).toFixed(2);
  const totalProfiles = profiles.length;
  const heroStats = [
    {
      label: 'Selected Tests',
      value: includedTests.length,
      sublabel: `${tests.length} total loaded`,
      icon: ClipboardList
    },
    {
      label: 'Subtotal',
      value: `₹${subtotalAmount.toFixed(2)}`,
      sublabel: `Discount ${discount}%`,
      icon: Wallet
    },
    {
      label: 'Final Amount',
      value: `₹${totalAmount.toFixed(2)}`,
      sublabel: 'After discount',
      icon: UserCheck
    },
    {
      label: 'Profiles Available',
      value: totalProfiles,
      sublabel: 'Reusable packages',
      icon: Calendar
    }
  ];

  const getFinalPrice = () => {
    if (customPrice !== '') {
      return parseFloat(customPrice) || 0;
    }
    return profilePrice;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create patient
      const patientData = {
        ...formData,
        age: parseInt(formData.age),
        profileId: selectedProfileId,
        profileName: selectedProfile?.name,
        created_by_user_id: currentUser?.userId
      };
      
      const patient = addPatient(patientData);
      
      // Create visit with test snapshots
      const includedTests = tests.filter(t => t.included);
      
      // Create complete test snapshots
      const testSnapshots = includedTests.map(test => ({
        testId: test.testId,
        name_snapshot: test.name,
        code_snapshot: test.code || '',
        unit_snapshot: test.unit || '',
        inputType_snapshot: test.inputType || 'number',
        refLow_snapshot: test.refLow || null,
        refHigh_snapshot: test.refHigh || null,
        refText_snapshot: test.refText || '',
        price_snapshot: parseFloat(test.price) || 0,
        category_snapshot: test.category || '',
        isCustom: test.isCustom || test.testId?.startsWith('CUSTOM'),
        dropdownOptions_snapshot: test.dropdownOptions || null,
        included: true
      }));
      
      const visit = createVisit({
        patientId: patient.patientId,
        profileId: selectedProfileId,
        tests: testSnapshots,
        subtotal: calculateSubtotal(),
        discount: discount,
        finalAmount: calculateTotal(),
        created_by_user_id: currentUser?.userId
      });

      toast.success('Patient registered successfully!');
      
      // Navigate to Sample Times page (skip SelectEditTests since we did it here)
      navigate(`/sample-times/${visit.visitId}`);
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error('Failed to create patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-patient-page">
      <div className="add-patient-hero">
        <div className="hero-text">
          <p className="hero-eyebrow">New Patient Journey</p>
          <h1>Register Patient & Configure Tests</h1>
          <p>Capture patient details, choose a profile, and tailor tests before collecting samples.</p>
          <div className="hero-cta">
            <button 
              type="button"
              onClick={() => navigate(-1)} 
              className="btn-back"
            >
              <ArrowLeft size={18} />
              Back to previous
            </button>
            <div className="hero-total-card">
              <span>Current Total</span>
              <strong>₹{totalAmount.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="add-patient-stats">
        {heroStats.map(({ label, value, sublabel, icon: Icon }) => (
          <div key={label} className="add-stat-card">
            <div className="stat-icon-wrap">
              <Icon size={18} />
            </div>
            <div>
              <p className="stat-label">{label}</p>
              <strong className="stat-value">{value}</strong>
              <p className="stat-sublabel">{sublabel}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="quick-actions-row">
        <div className="quick-actions-left">
          <button
            type="button"
            className="quick-action"
            onClick={() => setShowQuickAdd(true)}
          >
            <Search size={16} />
            Quick Add Test
          </button>
          <button
            type="button"
            className="quick-action"
            onClick={() => setShowManualAdd(true)}
            disabled={!canCreateCustom}
            title={!canCreateCustom ? 'Enable manual tests in settings' : ''}
          >
            <Edit3 size={16} />
            Custom Test
          </button>
          <button
            type="button"
            className="quick-action"
            onClick={() => setShowCreateProfile(true)}
          >
            <Package size={16} />
            New Profile
          </button>
        </div>
        <div className="quick-actions-right">
          <span className="active-profile-chip">
            {selectedProfile ? `${selectedProfile.name} selected` : 'No profile selected'}
          </span>
        </div>
      </div>

      {/* Two-Column Layout */}
      <form onSubmit={handleSubmit} className="two-column-layout">
        {/* LEFT COLUMN - Patient Details & Profile */}
        <div className="left-column">
          {/* Patient Details Card */}
          <div className="card-compact">
            <div className="card-header-compact">
              <User size={16} />
              <h3>Patient Info</h3>
            </div>
            
            <div className="card-body-compact">
              {/* Name */}
              <div className="form-group-compact">
                <label>Name *</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  className={`input-compact ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              {/* Age & Gender */}
              <div className="form-row-compact">
                <div className="form-group-compact">
                  <label>Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Age"
                    className={`input-compact ${errors.age ? 'input-error' : ''}`}
                  />
                  {errors.age && <span className="error-text">{errors.age}</span>}
                </div>
                <div className="form-group-compact">
                  <label>Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="input-compact"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Phone */}
              <div className="form-group-compact">
                <label>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  className={`input-compact ${errors.phone ? 'input-error' : ''}`}
                  maxLength="10"
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>

              {/* Address */}
              <div className="form-group-compact">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Address (optional)"
                  className="input-compact textarea-compact"
                  rows="2"
                />
              </div>

              {/* Referred By */}
              <div className="form-group-compact">
                <label>Referred By</label>
                <input
                  type="text"
                  name="referredBy"
                  value={formData.referredBy}
                  onChange={handleChange}
                  placeholder="Doctor name"
                  className="input-compact"
                />
              </div>
            </div>
          </div>

          {/* Profile Selection Card */}
          <div className="card-compact">
            <div className="card-header-compact">
              <Package size={16} />
              <h3>Test Profile</h3>
            </div>
            
            <div className="card-body-compact">
              <div className="form-group-compact">
                <label>Select Profile *</label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className={`input-compact ${errors.profile ? 'input-error' : ''}`}
                >
                  <option value="">Choose Profile...</option>
                  {profiles.map((profile) => (
                    <option key={profile.profileId} value={profile.profileId}>
                      {profile.name}
                    </option>
                  ))}
                </select>
                {errors.profile && <span className="error-text">{errors.profile}</span>}
              </div>

              {/* Show test count when profile selected */}
              {selectedProfile && (
                <div className="profile-info">
                  <div className="profile-badge">
                    <strong>{selectedProfile.name}</strong>
                    <span className="test-count">{tests.filter(t => t.included).length} tests</span>
                  </div>
                  {selectedProfile.description && (
                    <p className="profile-desc">{selectedProfile.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Full Width Test Table */}
        <div className="right-column">
          {tests.length > 0 ? (
            <div className="card-compact full-height">
              <div className="card-header-compact">
                <h3>Tests & Pricing ({tests.filter(t => t.included).length} selected)</h3>
              </div>
              
              <div className="tests-table-wrapper">
                <table className="tests-table-full">
                  <thead>
                    <tr>
                      <th width="40">✓</th>
                      <th width="30%">Test Name</th>
                      <th width="35%">Description</th>
                      <th width="10%">Unit</th>
                      <th width="15%">Price (₹)</th>
                      <th width="60">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.map((test) => (
                      <tr key={test.id} className={!test.included ? 'row-disabled' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={test.included}
                            onChange={() => handleToggleInclude(test.id)}
                            className="checkbox-modern"
                          />
                        </td>
                        <td>
                          <div className="test-name-cell">
                            <strong>{test.name}</strong>
                            {test.code && (
                              <span className="test-code">#{test.code}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={test.description || test.refText || ''}
                            onChange={(e) => handleTestFieldChange(test.id, 'description', e.target.value)}
                            className="cell-input"
                            placeholder="Test description"
                            disabled={!canEditPrice}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={test.unit || ''}
                            onChange={(e) => handleTestFieldChange(test.id, 'unit', e.target.value)}
                            className="cell-input"
                            placeholder="Unit"
                            disabled={!canEditPrice}
                          />
                        </td>
                        <td>
                          {canEditPrice ? (
                            <input
                              type="number"
                              value={test.price || 0}
                              onChange={(e) => handleTestPriceChange(test.id, e.target.value)}
                              className="cell-input price-input"
                              min="0"
                              step="0.01"
                            />
                          ) : (
                            <span className="price-display">₹{test.price || 0}</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleRemoveTest(test.id)}
                            className="btn-remove"
                            title="Remove test"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Price Summary */}
              <div className="price-summary-compact">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span className="summary-value">₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Discount (%):</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="discount-input"
                    min="0"
                    max="100"
                    disabled={!canEditPrice}
                  />
                </div>
                <div className="summary-row total-row">
                  <span><strong>Total:</strong></span>
                  <span className="summary-total">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Package size={48} className="empty-icon" />
              <h3>Select a Profile</h3>
              <p>Choose a test profile from the left to view and manage tests</p>
            </div>
          )}
        </div>
      </form>

      {/* Action Buttons */}
      <div className="form-actions-compact">
        <Button 
          type="button"
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="button"
          variant="primary" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Continue → Sample Time'}
        </Button>
      </div>

      {/* Create Profile Modal */}
      {showCreateProfile && (
        <div className="modal-overlay-modern" onClick={() => setShowCreateProfile(false)}>
          <div className="modal-content-modern" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
              <h3>Create New Profile</h3>
              <button 
                type="button"
                onClick={() => setShowCreateProfile(false)} 
                className="close-button-modern"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body-modern">
              <div className="form-group-modern">
                <label className="label-blue">Profile Name *</label>
                <input
                  type="text"
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
                  className="input-modern"
                  placeholder="e.g., Custom Health Package"
                  autoFocus
                />
              </div>
              <div className="form-group-modern">
                <label className="label-blue">Description</label>
                <textarea
                  value={newProfile.description}
                  onChange={(e) => setNewProfile({...newProfile, description: e.target.value})}
                  className="input-modern textarea-modern"
                  rows="3"
                  placeholder="Optional description of this profile"
                />
              </div>
              <p className="info-text-modern">
                💡 You can add tests to this profile in the next step.
              </p>
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
              >
                Create Profile
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Manual Add Test Modal */}
      {showManualAdd && (
        <div className="modal-overlay-modern" onClick={() => setShowManualAdd(false)}>
          <div className="modal-content-modern" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
              <h3>Add Custom Test</h3>
              <button 
                type="button"
                onClick={() => setShowManualAdd(false)} 
                className="close-button-modern"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body-modern">
              <div className="custom-test-intro">
                <div>
                  <p className="custom-pill">Manual Test</p>
                  <h4>Create a tailored investigation</h4>
                  <p>Document the analyte, allowable range, and billable details. The patient view will mirror this information exactly.</p>
                </div>
                <div className="custom-test-amount">
                  <span>Billable price</span>
                  <strong>₹{formattedCustomPrice}</strong>
                  <small>Update using the fields below</small>
                </div>
              </div>

              <div className="custom-test-grid">
                <div className="form-group-modern span-2">
                  <label className="label-blue">Test Name *</label>
                  <input
                    type="text"
                    value={newTest.name}
                    onChange={(e) => setNewTest({...newTest, name: e.target.value})}
                    className="input-modern"
                    placeholder="e.g., Custom Biomarker"
                    autoFocus
                  />
                </div>

                <div className="form-group-modern">
                  <label className="label-blue">Test Code</label>
                  <input
                    type="text"
                    value={newTest.code}
                    onChange={(e) => setNewTest({...newTest, code: e.target.value})}
                    className="input-modern"
                    placeholder="e.g., CBM"
                  />
                </div>
                <div className="form-group-modern">
                  <label className="label-blue">Unit *</label>
                  <input
                    type="text"
                    value={newTest.unit}
                    onChange={(e) => setNewTest({...newTest, unit: e.target.value})}
                    className="input-modern"
                    placeholder="e.g., mg/dL"
                  />
                </div>

                <div className="form-group-modern">
                  <label className="label-blue">Input Type</label>
                  <select
                    value={newTest.inputType}
                    onChange={(e) => setNewTest({...newTest, inputType: e.target.value})}
                    className="input-modern"
                  >
                    <option value="number">Number (Numeric Input)</option>
                    <option value="text">Text (Free Text)</option>
                    <option value="select">Select (Dropdown)</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label className="label-blue">Category / Department</label>
                  <input
                    type="text"
                    value={newTest.category}
                    onChange={(e) => setNewTest({...newTest, category: e.target.value})}
                    className="input-modern"
                    placeholder="e.g., Biochemistry, Hematology"
                  />
                </div>

                {newTest.inputType === 'number' && (
                  <div className="form-group-modern span-2">
                    <label className="label-blue">Reference Range</label>
                    <div className="ref-range-row">
                      <input
                        type="number"
                        step="0.01"
                        value={newTest.refLow}
                        onChange={(e) => setNewTest({...newTest, refLow: e.target.value})}
                        className="input-modern"
                        placeholder="Min value"
                      />
                      <span className="range-divider">to</span>
                      <input
                        type="number"
                        step="0.01"
                        value={newTest.refHigh}
                        onChange={(e) => setNewTest({...newTest, refHigh: e.target.value})}
                        className="input-modern"
                        placeholder="Max value"
                      />
                      <span className="unit-chip">{newTest.unit || 'unit'}</span>
                    </div>
                  </div>
                )}

                <div className="form-group-modern span-2">
                  <label className="label-blue">Reference Notes</label>
                  <textarea
                    value={newTest.refText}
                    onChange={(e) => setNewTest({...newTest, refText: e.target.value})}
                    className="input-modern textarea-modern"
                    rows="3"
                    placeholder="e.g., Include normal range narration or special handling instructions"
                  />
                </div>

                <div className="form-group-modern span-2">
                  <label className="label-blue">Price (₹)</label>
                  <div className="price-input-row">
                    <span className="currency-chip">₹</span>
                    <input
                      type="number"
                      value={newTest.price}
                      onChange={(e) => setNewTest({...newTest, price: e.target.value})}
                      className="input-modern price-large"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="custom-tags-row">
                <span className="custom-tag">{canCreateCustom ? 'Will be stored in master catalogue' : 'Single-use test for this visit'}</span>
                {selectedProfile && <span className="custom-tag">{selectedProfile.name} profile context</span>}
              </div>

              <p className="info-text-modern">
                💡 {canCreateCustom ? 'This test will be added to the master database and available for future patients.' : 'This custom test will only be available for this patient.'}
              </p>
            </div>
            <div className="modal-footer-modern">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowManualAdd(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                variant="primary" 
                onClick={handleManualTestAdd}
              >
                <Plus size={18} />
                Add Test
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Add Test Search Modal */}
      {showQuickAdd && (
        <div className="modal-overlay-modern" onClick={() => setShowQuickAdd(false)}>
          <div className="modal-content-modern quick-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
              <h3>Quick Add Test</h3>
              <button 
                type="button"
                onClick={() => setShowQuickAdd(false)} 
                className="close-button-modern"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body-modern">
              {/* Search Input */}
              <div className="search-input-container">
                <Search size={18} className="search-input-icon" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-modal"
                  placeholder="Search by test name or code..."
                  autoFocus
                />
              </div>
              
              {/* Search Results */}
              <div className="search-results">
                {searchQuery.trim().length < 2 ? (
                  <div className="search-hint">
                    💡 Type at least 2 characters to search
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="no-results">
                    No tests found for "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map((test) => (
                    <div
                      key={test.testId}
                      className="search-result-item"
                      onClick={() => handleQuickAddTest(test)}
                    >
                      <div className="search-result-info">
                        <div className="search-result-name">{test.name}</div>
                        <div className="search-result-details">
                          {test.code && <span>Code: {test.code}</span>}
                          {test.unit && <span>Unit: {test.unit}</span>}
                          {test.category && <span>{test.category}</span>}
                        </div>
                      </div>
                      <div className="search-result-price">
                        ₹{test.price || 0}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <p className="info-text-modern">
                💡 Click on any test to add it to the list
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPatientPage;
