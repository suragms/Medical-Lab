import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, AlertCircle, Save, X, Package } from 'lucide-react';
import { useAuthStore } from '../../store';
import { getProfiles, addProfile } from '../../features/shared/dataService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';
import './ProfileManager.css';

const ProfileManager = () => {
  const { role } = useAuthStore();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    packagePrice: '',
    tests: [] // Array of test objects with full data
  });

  const [newTest, setNewTest] = useState({
    name: '',
    code: '',
    category: 'General',
    unit: '',
    refLow: '',
    refHigh: '',
    refLowFemale: '',
    refHighFemale: '',
    price: '',
    inputType: 'number'
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProfiles(getProfiles());
  };

  // Permission check
  if (role !== 'admin') {
    return (
      <div className="unauthorized-container">
        <AlertCircle size={64} color="#DC2626" />
        <h2>Access Denied</h2>
        <p>Admin access only. You do not have permission to view this page.</p>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add test to profile
  const handleAddTest = () => {
    if (!newTest.name || !newTest.price) {
      toast.error('Test name and price are required');
      return;
    }

    const test = {
      ...newTest,
      testId: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      price: parseFloat(newTest.price) || 0,
      refLow: newTest.refLow ? parseFloat(newTest.refLow) : null,
      refHigh: newTest.refHigh ? parseFloat(newTest.refHigh) : null,
      refLowFemale: newTest.refLowFemale ? parseFloat(newTest.refLowFemale) : null,
      refHighFemale: newTest.refHighFemale ? parseFloat(newTest.refHighFemale) : null,
    };

    setFormData({
      ...formData,
      tests: [...formData.tests, test]
    });

    // Reset test form
    setNewTest({
      name: '',
      code: '',
      category: 'General',
      unit: '',
      refLow: '',
      refHigh: '',
      refLowFemale: '',
      refHighFemale: '',
      price: '',
      inputType: 'number'
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
        testIds: formData.tests.map(t => t.testId), // Store test IDs
        tests: formData.tests // Store full test objects
      };

      if (editingProfile) {
        // Update existing profile
        const allProfiles = JSON.parse(localStorage.getItem('healit_profiles') || '[]');
        const index = allProfiles.findIndex(p => p.profileId === editingProfile.profileId);
        if (index !== -1) {
          allProfiles[index] = { ...allProfiles[index], ...profileData };
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
    if (!confirm('Are you sure you want to deactivate this profile?')) return;

    try {
      const allProfiles = JSON.parse(localStorage.getItem('healit_profiles') || '[]');
      const index = allProfiles.findIndex(p => p.profileId === profileId);
      if (index !== -1) {
        allProfiles[index].active = false;
        localStorage.setItem('healit_profiles', JSON.stringify(allProfiles));
        toast.success('Profile deactivated successfully');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to deactivate profile');
    }
  };

  const removeTestFromProfile = (testId) => {
    setFormData({
      ...formData,
      tests: formData.tests.filter(t => t.testId !== testId)
    });
  };

  const updateTestInProfile = (testId, field, value) => {
    setFormData({
      ...formData,
      tests: formData.tests.map(t => 
        t.testId === testId ? { ...t, [field]: value } : t
      )
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      packagePrice: '',
      tests: []
    });
    setNewTest({
      name: '',
      code: '',
      category: 'General',
      unit: '',
      refLow: '',
      refHigh: '',
      refLowFemale: '',
      refHighFemale: '',
      price: '',
      inputType: 'number'
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
      </Card>

      {/* Profiles Grid */}
      <div className="profiles-grid">
        {filteredProfiles.map(profile => (
          <Card key={profile.profileId} className="profile-card">
            <div className="profile-card-header">
              <div className="profile-icon">
                <Package size={24} />
              </div>
              <div className="profile-info">
                <h3>{profile.name}</h3>
                {profile.description && <p className="profile-desc">{profile.description}</p>}
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
                Deactivate
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
                          <th>Test Name</th>
                          <th>Code</th>
                          <th>Category</th>
                          <th>Unit</th>
                          <th>Ref Low (M)</th>
                          <th>Ref High (M)</th>
                          <th>Ref Low (F)</th>
                          <th>Ref High (F)</th>
                          <th>Price (₹)</th>
                          <th>Type</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.tests.map(test => (
                          <tr key={test.testId}>
                            <td>
                              <input
                                type="text"
                                value={test.name}
                                onChange={(e) => updateTestInProfile(test.testId, 'name', e.target.value)}
                                className="table-input"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={test.code || ''}
                                onChange={(e) => updateTestInProfile(test.testId, 'code', e.target.value)}
                                className="table-input small"
                              />
                            </td>
                            <td>
                              <select
                                value={test.category}
                                onChange={(e) => updateTestInProfile(test.testId, 'category', e.target.value)}
                                className="table-input"
                              >
                                <option value="General">General</option>
                                <option value="Hematology">Hematology</option>
                                <option value="Biochemistry">Biochemistry</option>
                                <option value="Serology">Serology</option>
                                <option value="Urine">Urine</option>
                                <option value="Stool">Stool</option>
                                <option value="Microbiology">Microbiology</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                value={test.unit || ''}
                                onChange={(e) => updateTestInProfile(test.testId, 'unit', e.target.value)}
                                className="table-input small"
                                placeholder="g/dL"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                value={test.refLow || ''}
                                onChange={(e) => updateTestInProfile(test.testId, 'refLow', e.target.value)}
                                className="table-input small"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                value={test.refHigh || ''}
                                onChange={(e) => updateTestInProfile(test.testId, 'refHigh', e.target.value)}
                                className="table-input small"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                value={test.refLowFemale || ''}
                                onChange={(e) => updateTestInProfile(test.testId, 'refLowFemale', e.target.value)}
                                className="table-input small"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                value={test.refHighFemale || ''}
                                onChange={(e) => updateTestInProfile(test.testId, 'refHighFemale', e.target.value)}
                                className="table-input small"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={test.price || ''}
                                onChange={(e) => updateTestInProfile(test.testId, 'price', e.target.value)}
                                className="table-input small"
                              />
                            </td>
                            <td>
                              <select
                                value={test.inputType}
                                onChange={(e) => updateTestInProfile(test.testId, 'inputType', e.target.value)}
                                className="table-input small"
                              >
                                <option value="number">Number</option>
                                <option value="text">Text</option>
                                <option value="dropdown">Dropdown</option>
                              </select>
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
                <h3>Create New Test</h3>
                <div className="test-form-grid">
                  <div className="form-group">
                    <label>Test Name *</label>
                    <input
                      type="text"
                      value={newTest.name}
                      onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                      placeholder="e.g., Hemoglobin"
                    />
                  </div>

                  <div className="form-group">
                    <label>Test Code</label>
                    <input
                      type="text"
                      value={newTest.code}
                      onChange={(e) => setNewTest({ ...newTest, code: e.target.value })}
                      placeholder="e.g., HB"
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newTest.category}
                      onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
                    >
                      <option value="General">General</option>
                      <option value="Hematology">Hematology</option>
                      <option value="Biochemistry">Biochemistry</option>
                      <option value="Serology">Serology</option>
                      <option value="Urine">Urine</option>
                      <option value="Stool">Stool</option>
                      <option value="Microbiology">Microbiology</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Unit</label>
                    <input
                      type="text"
                      value={newTest.unit}
                      onChange={(e) => setNewTest({ ...newTest, unit: e.target.value })}
                      placeholder="e.g., g/dL"
                    />
                  </div>

                  <div className="form-group">
                    <label>Ref Low (Male)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTest.refLow}
                      onChange={(e) => setNewTest({ ...newTest, refLow: e.target.value })}
                      placeholder="Min value"
                    />
                  </div>

                  <div className="form-group">
                    <label>Ref High (Male)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTest.refHigh}
                      onChange={(e) => setNewTest({ ...newTest, refHigh: e.target.value })}
                      placeholder="Max value"
                    />
                  </div>

                  <div className="form-group">
                    <label>Ref Low (Female)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTest.refLowFemale}
                      onChange={(e) => setNewTest({ ...newTest, refLowFemale: e.target.value })}
                      placeholder="Min value"
                    />
                  </div>

                  <div className="form-group">
                    <label>Ref High (Female)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTest.refHighFemale}
                      onChange={(e) => setNewTest({ ...newTest, refHighFemale: e.target.value })}
                      placeholder="Max value"
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
                    />
                  </div>

                  <div className="form-group">
                    <label>Input Type</label>
                    <select
                      value={newTest.inputType}
                      onChange={(e) => setNewTest({ ...newTest, inputType: e.target.value })}
                    >
                      <option value="number">Number</option>
                      <option value="text">Text</option>
                      <option value="dropdown">Dropdown</option>
                    </select>
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
