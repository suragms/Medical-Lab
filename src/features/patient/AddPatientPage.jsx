import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, X, Edit2, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProfiles, addPatient, createVisit, getSettings } from '../../services/firestoreService';
import { getCurrentUser } from '../../services/authService';
import { useAuthStore } from '../../store';
import Button from '../../components/ui/Button';
import './AddPatient.css';

const AddPatientPage = () => {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const currentUser = getCurrentUser();
  const [settings, setSettings] = useState({});
  
  // Patient form state
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    referredBy: ''
  });
  
  // Profile and test state
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [tests, setTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('amount');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  
  // Load profiles and settings on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [profilesData, settingsData] = await Promise.all([
          getProfiles(),
          getSettings()
        ]);
        setProfiles(profilesData);
        setSettings(settingsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load profiles');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);
  
  // Get all unique tests from all profiles for autocomplete
  const allTestsFromProfiles = profiles.reduce((acc, profile) => {
    if (profile.tests) {
      profile.tests.forEach(test => {
        // Check if test already exists by testId
        if (!acc.find(t => t.testId === test.testId)) {
          acc.push(test);
        }
      });
    }
    return acc;
  }, []);
  
  // Load tests when profile selected
  useEffect(() => {
    if (selectedProfile) {
      const profileTests = selectedProfile.tests?.map((test, idx) => ({
        ...test,
        id: test.testId || `temp_${idx}`,
        selected: true
      })) || [];
      setTests(profileTests);
    } else {
      setTests([]);
    }
  }, [selectedProfile]);
  
  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle profile selection
  const handleProfileSelect = (e) => {
    const profileId = e.target.value;
    const profile = profiles.find(p => p.profileId === profileId);
    setSelectedProfile(profile || null);
  };
  
  // Update test price
  const handlePriceChange = (testId, newPrice) => {
    setTests(prev => prev.map(t => 
      t.id === testId ? { ...t, price: parseFloat(newPrice) || 0 } : t
    ));
  };
  
  // Toggle test selection
  const handleToggleTest = (testId) => {
    setTests(prev => prev.map(t => 
      t.id === testId ? { ...t, selected: !t.selected } : t
    ));
  };
  
  // Remove test
  const handleRemoveTest = (testId) => {
    setTests(prev => prev.filter(t => t.id !== testId));
  };
  
  // Add new test
  const handleAddTest = () => {
    const newTest = {
      id: `new_${Date.now()}`,
      name: '',
      unit: '',
      price: 0,
      description: '',
      bioReference: '',
      selected: true,
      isNew: true
    };
    setTests(prev => [...prev, newTest]);
  };
  
  // Add test from suggestion
  const handleAddTestFromSuggestion = (suggestedTest) => {
    // Check if test already exists
    const exists = tests.find(t => t.testId === suggestedTest.testId);
    if (exists) {
      toast.info('Test already added');
      return;
    }
    
    const testToAdd = {
      ...suggestedTest,
      id: suggestedTest.testId || `temp_${Date.now()}`,
      selected: true
    };
    setTests(prev => [...prev, testToAdd]);
    setSearchTerm('');
    setShowSuggestions(false);
    toast.success(`Added: ${suggestedTest.name}`);
  };
  
  // Update test field
  const handleTestFieldChange = (testId, field, value) => {
    setTests(prev => prev.map(t => 
      t.id === testId ? { ...t, [field]: value } : t
    ));
  };
  
  // Calculate totals
  const selectedTests = tests.filter(t => t.selected);
  const subtotal = selectedTests.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
  const discountAmount = discountType === 'percent' 
    ? (subtotal * discount) / 100 
    : discount;
  const finalAmount = Math.max(0, subtotal - discountAmount);
  
  // Filter tests by search
  const filteredTests = tests.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get test suggestions for autocomplete
  const testSuggestions = searchTerm.length >= 2
    ? allTestsFromProfiles.filter(t => 
        (t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         t.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        !tests.find(existing => existing.testId === t.testId)
      ).slice(0, 5)
    : [];
  
  // Validation
  const validateForm = () => {
    if (!patientData.name.trim()) {
      toast.error('Patient name is required');
      return false;
    }
    if (!patientData.age || patientData.age <= 0) {
      toast.error('Valid age is required');
      return false;
    }
    if (!patientData.gender) {
      toast.error('Gender is required');
      return false;
    }
    if (!patientData.phone || !/^\d{10}$/.test(patientData.phone)) {
      toast.error('Valid 10-digit phone number is required');
      return false;
    }
    if (selectedTests.length === 0) {
      toast.error('Please select at least one test');
      return false;
    }
    return true;
  };
  
  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Check if user is authenticated
    if (!currentUser || !currentUser.userId) {
      toast.error('Please log in to register a patient');
      navigate('/login');
      return;
    }
    
    try {
      // Add patient
      const patient = await addPatient({
        ...patientData,
        age: parseInt(patientData.age),
        addedBy: currentUser.userId,
        addedByRole: role
      });
      
      // Create visit with selected tests
      const visitData = {
        patientId: patient.patientId,
        profileId: selectedProfile?.profileId || null,
        profileName: selectedProfile?.name || 'Custom',
        tests: selectedTests.map(({ selected, id, isNew, ...test }) => test),
        subtotal,
        discount: discountAmount,
        finalAmount,
        // REMOVED: status - createVisit() sets this automatically to 'tests_selected'
        addedBy: currentUser.userId,
        addedByRole: role
      };
      
      const visit = await createVisit(visitData);
      toast.success('Patient registered successfully!');
      navigate(`/sample-times/${visit.visitId}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to register patient');
    }
  };
  
  return (
    <div className="add-patient-page-fullscreen">
      {/* Header */}
      <div className="compact-header">
        <h1>Register Patient</h1>
        <div className="header-stats">
          <span>Tests: {selectedTests.length}</span>
          <span className="total">Total: ₹{finalAmount.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="content-wrapper">
        {/* LEFT: Compact Patient Form */}
        <div className="patient-form-compact">
          <h3>Patient Details</h3>
          
          <div className="form-field">
            <label>Profile</label>
            <select value={selectedProfile?.profileId || ''} onChange={handleProfileSelect}>
              <option value="">Select Profile</option>
              {profiles.filter(p => p.active).map(p => (
                <option key={p.profileId} value={p.profileId}>
                  {p.name} (₹{p.packagePrice})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-field">
            <label>Name *</label>
            <input
              type="text"
              name="name"
              value={patientData.name}
              onChange={handleInputChange}
              placeholder="Full name"
            />
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label>Age *</label>
              <input
                type="number"
                name="age"
                value={patientData.age}
                onChange={handleInputChange}
                placeholder="Age"
              />
            </div>
            <div className="form-field">
              <label>Gender *</label>
              <select name="gender" value={patientData.gender} onChange={handleInputChange}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="form-field">
            <label>Phone *</label>
            <input
              type="tel"
              name="phone"
              value={patientData.phone}
              onChange={handleInputChange}
              placeholder="10-digit number"
            />
          </div>
          
          <div className="form-field">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={patientData.address}
              onChange={handleInputChange}
              placeholder="Address"
            />
          </div>
          
          <div className="form-field">
            <label>Referred By</label>
            <input
              type="text"
              name="referredBy"
              value={patientData.referredBy}
              onChange={handleInputChange}
              placeholder="Doctor name"
            />
          </div>
          
          {/* Discount Section */}
          <div className="discount-section">
            <h4>Discount</h4>
            <div className="form-row">
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                <option value="amount">Amount</option>
                <option value="percent">Percent</option>
              </select>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            {discountAmount > 0 && <p className="discount-value">-₹{discountAmount.toFixed(2)}</p>}
          </div>
          
          {/* Summary */}
          <div className="summary-box">
            <div className="summary-row">
              <span>Subtotal:</span>
              <strong>₹{subtotal.toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Discount:</span>
              <strong>-₹{discountAmount.toFixed(2)}</strong>
            </div>
            <div className="summary-row total">
              <span>Final Amount:</span>
              <strong>₹{finalAmount.toFixed(2)}</strong>
            </div>
          </div>
          
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="submit-btn-full"
          >
            Save Patient
          </Button>
        </div>
        
        {/* RIGHT: Full-Screen Test Table */}
        <div className="test-table-fullscreen">
          <div className="table-toolbar">
            <div className="search-box-wrapper">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(e.target.value.length >= 2);
                  }}
                  onFocus={() => setShowSuggestions(searchTerm.length >= 2)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search or add tests..."
                />
              </div>
              
              {/* Autocomplete Suggestions */}
              {showSuggestions && testSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {testSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.testId}
                      className={`suggestion-item ${index === activeSuggestionIndex ? 'active' : ''}`}
                      onClick={() => handleAddTestFromSuggestion(suggestion)}
                    >
                      <div className="suggestion-main">
                        <strong>{suggestion.name}</strong>
                        <span className="suggestion-price">₹{suggestion.price}</span>
                      </div>
                      <div className="suggestion-meta">
                        {suggestion.unit && <span className="unit">{suggestion.unit}</span>}
                        {suggestion.bioReference && (
                          <span className="bio-ref">{suggestion.bioReference}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Button variant="primary" size="small" icon={Plus} onClick={handleAddTest}>
              Add Blank
            </Button>
          </div>
          
          <div className="table-container">
            <table className="tests-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>✓</th>
                  <th style={{ width: '35%' }}>Test Description</th>
                  <th style={{ width: '15%' }}>Value</th>
                  <th style={{ width: '20%' }}>Bio Reference</th>
                  <th style={{ width: '12%' }}>Unit</th>
                  <th style={{ width: '12%' }}>Price (₹)</th>
                  <th style={{ width: '60px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      {selectedProfile ? 'No tests in this profile' : 'Select a profile or add tests manually'}
                    </td>
                  </tr>
                ) : (
                  filteredTests.map((test) => (
                    <tr key={test.id} className={!test.selected ? 'deselected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={test.selected}
                          onChange={() => handleToggleTest(test.id)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={test.name || test.description || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleTestFieldChange(test.id, 'name', value);
                            if (!test.description) {
                              handleTestFieldChange(test.id, 'description', value);
                            }
                          }}
                          placeholder="Test name / description"
                          className="inline-input test-desc-input"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={test.value || ''}
                          onChange={(e) => handleTestFieldChange(test.id, 'value', e.target.value)}
                          placeholder="-"
                          className="inline-input value-input"
                          disabled={!test.selected}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={test.bioReference || ''}
                          onChange={(e) => handleTestFieldChange(test.id, 'bioReference', e.target.value)}
                          placeholder="Bio ref"
                          className="inline-input"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={test.unit || ''}
                          onChange={(e) => handleTestFieldChange(test.id, 'unit', e.target.value)}
                          placeholder="Unit"
                          className="inline-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={test.price}
                          onChange={(e) => handlePriceChange(test.id, e.target.value)}
                          className="price-input"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <button
                          className="icon-btn delete"
                          onClick={() => handleRemoveTest(test.id)}
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPatientPage;