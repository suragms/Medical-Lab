import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Power, Search, Filter, DollarSign, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../../store';
import { TEST_MASTER, TEST_TYPES, TEST_CATEGORIES } from '../../data/testMaster';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './TestMaster.css';

const TestMaster = () => {
  const { testMaster, setTestMaster, updateTest } = useSettingsStore();
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [newTest, setNewTest] = useState({
    id: '',
    name: '',
    description: '',
    category: TEST_CATEGORIES.KIDNEY,
    type: TEST_TYPES.NUMBER,
    unit: '',
    refLow: '',
    refHigh: '',
    referenceText: '',
    price: '',
    notes: '',
    genderSpecific: false,
    maleRange: { low: '', high: '', text: '' },
    femaleRange: { low: '', high: '', text: '' },
    dropdownOptions: [],
    order: 1,
    active: true
  });

  useEffect(() => {
    // Load from store or use default TEST_MASTER
    if (testMaster && testMaster.length > 0) {
      setTests(testMaster);
      setFilteredTests(testMaster);
    } else {
      setTests(TEST_MASTER);
      setFilteredTests(TEST_MASTER);
      setTestMaster(TEST_MASTER);
    }
  }, [testMaster, setTestMaster]);

  // Apply filters
  useEffect(() => {
    let result = [...tests];

    // Search filter
    if (searchQuery) {
      result = result.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      result = result.filter(t => t.category === categoryFilter);
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      result = result.filter(t => t.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      const isActive = statusFilter === 'ACTIVE';
      result = result.filter(t => t.active === isActive);
    }

    setFilteredTests(result);
  }, [searchQuery, categoryFilter, typeFilter, statusFilter, tests]);

  const handleEdit = (test) => {
    setEditingId(test.id);
    setEditForm({ ...test });
  };

  const handleSaveEdit = () => {
    const updatedTests = tests.map(t => t.id === editingId ? editForm : t);
    setTests(updatedTests);
    setTestMaster(updatedTests);
    updateTest(editingId, editForm);
    setEditingId(null);
    toast.success('Test updated successfully!');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleToggleActive = (testId) => {
    const test = tests.find(t => t.id === testId);
    const updatedTests = tests.map(t => 
      t.id === testId ? { ...t, active: !t.active } : t
    );
    setTests(updatedTests);
    setTestMaster(updatedTests);
    updateTest(testId, { active: !test.active });
    toast.success(test.active ? 'Test deactivated' : 'Test activated');
  };

  const handleAddTest = () => {
    if (!newTest.id || !newTest.name) {
      toast.error('Test ID and Name are required');
      return;
    }

    const testExists = tests.find(t => t.id === newTest.id);
    if (testExists) {
      toast.error('Test ID already exists');
      return;
    }

    const testToAdd = {
      ...newTest,
      refLow: parseFloat(newTest.refLow) || 0,
      refHigh: parseFloat(newTest.refHigh) || 0,
      price: parseFloat(newTest.price) || 0,
      order: tests.filter(t => t.category === newTest.category).length + 1
    };

    const updatedTests = [...tests, testToAdd];
    setTests(updatedTests);
    setTestMaster(updatedTests);
    setIsAdding(false);
    setNewTest({
      id: '',
      name: '',
      description: '',
      category: TEST_CATEGORIES.KIDNEY,
      type: TEST_TYPES.NUMBER,
      unit: '',
      refLow: '',
      refHigh: '',
      referenceText: '',
      price: '',
      notes: '',
      genderSpecific: false,
      maleRange: { low: '', high: '', text: '' },
      femaleRange: { low: '', high: '', text: '' },
      dropdownOptions: [],
      order: 1,
      active: true
    });
    toast.success('Test added successfully!');
  };

  const handleDeleteTest = (testId) => {
    if (!window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    const updatedTests = tests.filter(t => t.id !== testId);
    setTests(updatedTests);
    setTestMaster(updatedTests);
    toast.success('Test deleted successfully!');
  };

  const categories = Object.values(TEST_CATEGORIES);

  return (
    <div className="test-master-page">
      <div className="page-header">
        <div>
          <h1>Test Master Management</h1>
          <p>Complete control over all medical tests - Add, Edit, Set Prices, Manage Profiles</p>
        </div>
        <Button onClick={() => setIsAdding(true)} icon={Plus} size="large">
          Add New Test
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="filters-card">
        <div className="filters-container">
          {/* Search */}
          <div className="filter-item search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by test name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="filter-item">
            <Filter size={18} />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="ALL">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="filter-item">
            <Filter size={18} />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="ALL">All Types</option>
              {Object.values(TEST_TYPES).map(type => (
                <option key={type} value={type}>{type.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-item">
            <Power size={18} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {/* Results count */}
          <div className="results-count">
            Showing {filteredTests.length} of {tests.length} tests
          </div>
        </div>
      </Card>

      {/* Add New Test Form */}
      {isAdding && (
        <Card title="Add New Test" className="add-test-card">
          <div className="test-form">
            <div className="form-row">
              <div className="form-group">
                <label>Test ID* <span className="field-info">(Unique identifier)</span></label>
                <input
                  type="text"
                  placeholder="e.g., CREAT001"
                  value={newTest.id}
                  onChange={(e) => setNewTest({ ...newTest, id: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="form-group">
                <label>Test Name*</label>
                <input
                  type="text"
                  placeholder="e.g., Creatinine"
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description <span className="field-info">(Optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g., Serum Creatinine"
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category*</label>
                <select
                  value={newTest.category}
                  onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Input Type*</label>
                <select
                  value={newTest.type}
                  onChange={(e) => setNewTest({ ...newTest, type: e.target.value })}
                >
                  {Object.values(TEST_TYPES).map(type => (
                    <option key={type} value={type}>{type.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Unit</label>
                <input
                  type="text"
                  placeholder="e.g., mg/dL"
                  value={newTest.unit}
                  onChange={(e) => setNewTest({ ...newTest, unit: e.target.value })}
                />
              </div>
            </div>

            {newTest.type === TEST_TYPES.NUMBER && (
              <div className="form-row">
                <div className="form-group">
                  <label>Reference Low</label>
                  <input
                    type="number"
                    step="any"
                    value={newTest.refLow}
                    onChange={(e) => setNewTest({ ...newTest, refLow: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Reference High</label>
                  <input
                    type="number"
                    step="any"
                    value={newTest.refHigh}
                    onChange={(e) => setNewTest({ ...newTest, refHigh: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Reference Text</label>
                  <input
                    type="text"
                    placeholder="e.g., 0.6 - 1.2"
                    value={newTest.referenceText}
                    onChange={(e) => setNewTest({ ...newTest, referenceText: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>
                  <DollarSign size={16} style={{ display: 'inline', marginRight: '4px' }} />
                  Price (₹) <span className="field-info">(For revenue calculation only, NOT printed on PDF)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 150"
                  value={newTest.price}
                  onChange={(e) => setNewTest({ ...newTest, price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Notes <span className="field-info">(Optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g., Fasting recommended"
                  value={newTest.notes}
                  onChange={(e) => setNewTest({ ...newTest, notes: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="newTestActive"
                    checked={newTest.active}
                    onChange={(e) => setNewTest({ ...newTest, active: e.target.checked })}
                  />
                  <label htmlFor="newTestActive">
                    {newTest.active ? 'Active' : 'Inactive'}
                  </label>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <Button onClick={handleAddTest} variant="primary" icon={Save}>
                Add Test
              </Button>
              <Button onClick={() => setIsAdding(false)} variant="secondary" icon={X}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tests by Category */}
      {categories.map(category => {
        const categoryTests = filteredTests.filter(t => t.category === category);
        if (categoryTests.length === 0) return null;

        return (
          <Card key={category} title={`${category} (${categoryTests.length} tests)`} className="category-card">
            <div className="tests-table">
              <table>
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Unit</th>
                    <th>Reference Range</th>
                    <th>Price (₹)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryTests.map(test => (
                    editingId === test.id ? (
                      <tr key={test.id} className="editing-row">
                        <td>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </td>
                        <td>{test.type}</td>
                        <td>
                          <input
                            type="text"
                            value={editForm.unit}
                            onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                          />
                        </td>
                        <td>
                          {test.type === TEST_TYPES.NUMBER && (
                            <div className="ref-inputs">
                              <input
                                type="number"
                                step="any"
                                value={editForm.refLow}
                                onChange={(e) => setEditForm({ ...editForm, refLow: parseFloat(e.target.value) })}
                                placeholder="Low"
                              />
                              <span>-</span>
                              <input
                                type="number"
                                step="any"
                                value={editForm.refHigh}
                                onChange={(e) => setEditForm({ ...editForm, refHigh: parseFloat(e.target.value) })}
                                placeholder="High"
                              />
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${test.active ? 'active' : 'inactive'}`}>
                            {test.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-icon success" onClick={handleSaveEdit}>
                              <Save size={16} />
                            </button>
                            <button className="btn-icon secondary" onClick={handleCancelEdit}>
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={test.id} className={!test.active ? 'inactive-row' : ''}>
                        <td><strong>{test.name}</strong></td>
                        <td><span className="test-description">{test.description || '-'}</span></td>
                        <td><span className="type-badge">{test.type}</span></td>
                        <td>{test.unit}</td>
                        <td>{test.referenceText || '-'}</td>
                        <td>
                          <span className="price-badge">
                            {test.price ? `₹${test.price}` : '-'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${test.active ? 'active' : 'inactive'}`}>
                            {test.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-icon" onClick={() => handleEdit(test)}>
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className={`btn-icon ${test.active ? 'warning' : 'success'}`}
                              onClick={() => handleToggleActive(test.id)}
                            >
                              <Power size={16} />
                            </button>
                            <button className="btn-icon danger" onClick={() => handleDeleteTest(test.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default TestMaster;
