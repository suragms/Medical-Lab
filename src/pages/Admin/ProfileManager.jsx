import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, AlertCircle, Save, X, Package } from 'lucide-react';
import { useAuthStore } from '../../store';
import { getCurrentUser } from '../../services/authService';
import { getProfiles, addProfile } from '../../features/shared/dataService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';
import './ProfileManager.css';

const ProfileManager = () => {
  const { role } = useAuthStore();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    packagePrice: '',
    tests: [] // Array of test objects with full data
  });

  const [newTest, setNewTest] = useState({
    description: '',
    unit: '',
    bioReference: '',
    price: ''
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProfiles(getProfiles());
  };

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add test to profile
  const handleAddTest = () => {
    if (!newTest.description || !newTest.price) {
      toast.error('Test description and price are required');
      return;
    }

    const test = {
      ...newTest,
      testId: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      price: parseFloat(newTest.price) || 0,
      name: newTest.description // For compatibility
    };

    setFormData({
      ...formData,
      tests: [...formData.tests, test]
    });

    // Reset test form
    setNewTest({
      description: '',
      unit: '',
      bioReference: '',
      price: ''
    });

    toast.success('Test added to profile');
  };

  const handleAddProfile = () => {
    if (!formData.name || formData.tests.length === 0) {
      toast.error('Profile name and at least one test are required');
      return;
    }

    try {
      const profileData = {
        name: formData.name,
        description: formData.description,
        packagePrice: parseFloat(formData.packagePrice) || 0,
        testIds: formData.tests.map(t => t.testId),
        tests: formData.tests,
        createdBy: currentUser?.userId || 'unknown',
        createdByName: currentUser?.fullName || 'Unknown User',
        createdByRole: role
      };

      if (editingProfile) {
        // Update existing profile
        const allProfiles = JSON.parse(localStorage.getItem('healit_profiles') || '[]');
        const index = allProfiles.findIndex(p => p.profileId === editingProfile.profileId);
        if (index !== -1) {
          allProfiles[index] = { 
            ...allProfiles[index], 
            ...profileData,
            updatedBy: currentUser?.userId || 'unknown',
            updatedByName: currentUser?.fullName || 'Unknown User',
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('healit_profiles', JSON.stringify(allProfiles));
          toast.success('Profile updated successfully');
        }
      } else {
        // Add new profile
        addProfile(profileData);
        toast.success('Profile added successfully');
      }

      resetForm();
      loadData();
      setShowAddModal(false);
    } catch (error) {
      toast.error('Failed to save profile');
      console.error(error);
    }
  };

  const handleEditProfile = (profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      description: profile.description || '',
      packagePrice: profile.packagePrice || '',
      tests: profile.tests || [] // Load existing tests
    });
    setShowAddModal(true);
  };

  const handleDeleteProfile = (profileId) => {
    if (!confirm('Are you sure you want to DELETE this profile permanently? This cannot be undone.')) return;

    try {
      const allProfiles = JSON.parse(localStorage.getItem('healit_profiles') || '[]');
      const updatedProfiles = allProfiles.filter(p => p.profileId !== profileId);
      localStorage.setItem('healit_profiles', JSON.stringify(updatedProfiles));
      toast.success('Profile deleted successfully');
      loadData();
      setSelectedProfiles([]);
    } catch (error) {
      toast.error('Failed to delete profile');
    }
  };

  const handleDeleteSelected = () => {
    if (selectedProfiles.length === 0) {
      toast.error('No profiles selected');
      return;
    }

    if (!confirm(`Delete ${selectedProfiles.length} selected profile(s)? This cannot be undone.`)) return;

    try {
      const allProfiles = JSON.parse(localStorage.getItem('healit_profiles') || '[]');
      const updatedProfiles = allProfiles.filter(p => !selectedProfiles.includes(p.profileId));
      localStorage.setItem('healit_profiles', JSON.stringify(updatedProfiles));
      toast.success(`${selectedProfiles.length} profile(s) deleted successfully`);
      setSelectedProfiles([]);
      loadData();
    } catch (error) {
      toast.error('Failed to delete profiles');
    }
  };

  const toggleSelectProfile = (profileId) => {
    setSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProfiles.length === filteredProfiles.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(filteredProfiles.map(p => p.profileId));
    }
  };

  const removeTestFromProfile = (testId) => {
    setFormData({
      ...formData,
      tests: formData.tests.filter(t => t.testId !== testId)
    });
  };

  const updateTestInProfile = (testId, field, value) => {
    console.log('Updating test', testId, field, '=', value); // DEBUG
    setFormData(prev => ({
      ...prev,
      tests: prev.tests.map(t => {
        if (t.testId === testId) {
          const updated = { ...t, [field]: value };
          // CRITICAL: If updating description, also update name for consistency
          if (field === 'description') {
            updated.name = value;
          }
          console.log('Updated test:', updated); // DEBUG
          return updated;
        }
        return t;
      })
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      packagePrice: '',
      tests: []
    });
    setNewTest({
      description: '',
      unit: '',
      bioReference: '',
      price: ''
    });
    setEditingProfile(null);
  };

  const calculateTotalPrice = () => {
    return formData.tests.reduce((sum, test) => sum + (test.price || 0), 0);
  };

  return (
    <div className="profile-manager-page">
      <div className="page-header">
        <div>
          <h1>Profile Manager</h1>
          <p className="subtitle">Create and manage test profile packages</p>
        </div>
        <Button icon={Plus} onClick={() => { resetForm(); setShowAddModal(true); }}>
          Add New Profile
        </Button>
      </div>

      {/* Search */}
      <Card className="filters-card">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bulk-actions">
          {filteredProfiles.length > 0 && (
            <>
              <Button
                variant="outline"
                size="small"
                onClick={toggleSelectAll}
              >
                {selectedProfiles.length === filteredProfiles.length ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedProfiles.length > 0 && (
                <Button
                  variant="danger"
                  size="small"
                  icon={Trash2}
                  onClick={handleDeleteSelected}
                >
                  Delete Selected ({selectedProfiles.length})
                </Button>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Profiles Grid */}
      <div className="profiles-grid">
        {filteredProfiles.map(profile => (
          <Card 
            key={profile.profileId} 
            className={`profile-card ${selectedProfiles.includes(profile.profileId) ? 'selected' : ''}`}
          >
            <div className="profile-card-header">
              <input
                type="checkbox"
                checked={selectedProfiles.includes(profile.profileId)}
                onChange={() => toggleSelectProfile(profile.profileId)}
                className="profile-checkbox"
              />
              <div className="profile-icon">
                <Package size={24} />
              </div>
              <div className="profile-info">
                <h3>{profile.name}</h3>
                {profile.description && <p className="profile-desc">{profile.description}</p>}
                {profile.createdByName && (
                  <p className="profile-creator">
                    Created by {profile.createdByName} ({profile.createdByRole || 'admin'})
                  </p>
                )}
              </div>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">Tests</span>
                <span className="stat-value">{profile.tests?.length || profile.testIds?.length || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Package Price</span>
                <span className="stat-value">₹{profile.packagePrice || 0}</span>
              </div>
            </div>

            <div className="profile-actions">
              <Button
                variant="outline"
                size="small"
                icon={Edit2}
                onClick={() => handleEditProfile(profile)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="small"
                icon={Trash2}
                onClick={() => handleDeleteProfile(profile.profileId)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProfile ? 'Edit Profile' : 'Add New Profile'}</h2>
              <button className="close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <h3>Profile Details</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Profile Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Complete Blood Count (CBC)"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this profile"
                      rows="2"
                    />
                  </div>

                  <div className="form-group">
                    <label>Package Price (₹)</label>
                    <input
                      type="number"
                      value={formData.packagePrice}
                      onChange={(e) => setFormData({ ...formData, packagePrice: e.target.value })}
                      placeholder="Total package price"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Individual Tests Total</label>
                    <input
                      type="text"
                      value={`₹${calculateTotalPrice()}`}
                      disabled
                      className="readonly-input"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Tests in Profile ({formData.tests.length})</h3>
                
                {formData.tests.length > 0 ? (
                  <div className="tests-table-wrapper">
                    <table className="tests-edit-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40%' }}>Test Description</th>
                          <th style={{ width: '15%' }}>Units</th>
                          <th style={{ width: '25%' }}>Bio.Ref.Internal</th>
                          <th style={{ width: '15%' }}>Price (₹)</th>
                          <th style={{ width: '5%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.tests.map(test => (
                          <tr key={test.testId}>
                            <td>
                              <input
                                type="text"
                                value={test.description || test.name || ''}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  updateTestInProfile(test.testId, 'description', newValue);
                                  // Name is automatically updated in updateTestInProfile function
                                }}
                                className="table-input"
                                placeholder="e.g., Hemoglobin"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={test.unit || ''}
                                onChange={(e) => updateTestInProfile(test.testId, 'unit', e.target.value)}
                                className="table-input"
                                placeholder="g/dL, mg/dL"
                              />
                            </td>
                            <td>
                              <textarea
                                value={test.bioReference || ''}
                                onChange={(e) => updateTestInProfile(test.testId, 'bioReference', e.target.value)}
                                className="table-textarea"
                                placeholder="13-17 g/dL (M), 12-15 g/dL (F)&#10;Add multiple lines for complex ranges...&#10;e.g., Adult Male: 13-17&#10;Adult Female: 12-15&#10;Pediatric: 11-16"
                                rows="4"
                                style={{ minHeight: '100px', resize: 'vertical', whiteSpace: 'pre-wrap', wordWrap: 'break-word', lineHeight: '1.5' }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={test.price || ''}
                                onChange={(e) => updateTestInProfile(test.testId, 'price', parseFloat(e.target.value) || 0)}
                                className="table-input"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td>
                              <button
                                className="remove-test-btn-icon"
                                onClick={() => removeTestFromProfile(test.testId)}
                                title="Remove test"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="empty-state">No tests added yet. Create tests using the form below.</p>
                )}
              </div>

              <div className="form-section add-test-section">
                <h3>Add New Test</h3>
                <div className="test-form-grid-simple">
                  <div className="form-group">
                    <label>Test Description *</label>
                    <input
                      type="text"
                      value={newTest.description}
                      onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                      placeholder="e.g., Hemoglobin, Blood Sugar Fasting"
                    />
                  </div>

                  <div className="form-group">
                    <label>Units</label>
                    <input
                      type="text"
                      value={newTest.unit}
                      onChange={(e) => setNewTest({ ...newTest, unit: e.target.value })}
                      placeholder="e.g., g/dL, mg/dL, %"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Bio.Ref.Internal (Reference Range)</label>
                    <textarea
                      value={newTest.bioReference}
                      onChange={(e) => setNewTest({ ...newTest, bioReference: e.target.value })}
                      placeholder="e.g., Adult: 13-17 g/dL (Male), 12-15 g/dL (Female)&#10;Normal: 70-100 mg/dL&#10;Pre-diabetic: 100-125 mg/dL&#10;&#10;You can add multiple lines and detailed conditions here."
                      rows="5"
                      style={{ minHeight: '120px', resize: 'vertical', whiteSpace: 'pre-wrap', wordWrap: 'break-word', lineHeight: '1.6' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      value={newTest.price}
                      onChange={(e) => setNewTest({ ...newTest, price: e.target.value })}
                      placeholder="Test price"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="add-test-btn-container">
                  <Button icon={Plus} onClick={handleAddTest}>
                    Add Test to Profile
                  </Button>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <Button variant="ghost" onClick={() => { setShowAddModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button icon={Save} onClick={handleAddProfile}>
                {editingProfile ? 'Update Profile' : 'Create Profile'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManager;
