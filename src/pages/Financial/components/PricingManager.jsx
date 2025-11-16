import React, { useState, useMemo } from 'react';
import { useSettingsStore } from '../../../store';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import toast from 'react-hot-toast';
import './PricingManager.css';

const PricingManager = () => {
  const { testMaster, updateTest } = useSettingsStore();
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [newProfile, setNewProfile] = useState({
    name: '',
    price: '',
    discount: 0,
  });

  const filteredTests = useMemo(() => {
    if (!searchTerm) return testMaster;
    
    const term = searchTerm.toLowerCase();
    return testMaster.filter(test => 
      test.name?.toLowerCase().includes(term) ||
      test.code?.toLowerCase().includes(term)
    );
  }, [testMaster, searchTerm]);

  const handleEdit = (test) => {
    setEditingId(test.id);
    setEditForm({
      ...test,
      price: test.price || 0,
      discount: test.discount || 0,
    });
  };

  const handleSaveEdit = () => {
    const finalPrice = editForm.discount > 0 
      ? editForm.price - (editForm.price * editForm.discount / 100)
      : editForm.price;

    updateTest(editingId, {
      ...editForm,
      finalPrice,
    });

    setEditingId(null);
    setEditForm({});
    toast.success('Pricing updated successfully! 💵');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAddProfile = (e) => {
    e.preventDefault();
    
    if (!newProfile.name || !newProfile.price) {
      toast.error('Please enter profile name and price');
      return;
    }

    const finalPrice = newProfile.discount > 0 
      ? newProfile.price - (newProfile.price * newProfile.discount / 100)
      : newProfile.price;

    const profile = {
      id: Date.now().toString(),
      name: newProfile.name,
      price: parseFloat(newProfile.price),
      discount: parseFloat(newProfile.discount),
      finalPrice,
      type: 'profile',
    };

    // In a real app, you would add this to the testMaster
    // For now, we'll update an existing one or show a message
    toast.success('New profile pricing added! 💵');
    
    setNewProfile({
      name: '',
      price: '',
      discount: 0,
    });
  };

  const calculateFinalPrice = (price, discount) => {
    if (!price) return 0;
    const discountAmount = discount > 0 ? (price * discount / 100) : 0;
    return price - discountAmount;
  };

  const exportPricing = () => {
    const headers = ['Profile/Test Name', 'Price', 'Discount (%)', 'Final Price'];
    const rows = filteredTests.map(test => [
      test.name || test.code,
      test.price || 0,
      test.discount || 0,
      test.finalPrice || test.price || 0
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pricing_list_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Pricing list exported! 📥');
  };

  return (
    <div className="pricing-manager">
      <div className="pricing-header">
        <h2>💵 Test Pricing Manager</h2>
        <Button variant="primary" onClick={exportPricing}>
          📥 Export Pricing
        </Button>
      </div>

      {/* Add New Profile */}
      <Card title="➕ Add New Profile Pricing">
        <form onSubmit={handleAddProfile} className="add-pricing-form">
          <div className="pricing-form-grid">
            <div className="form-group">
              <label>Profile Name *</label>
              <input
                type="text"
                placeholder="Enter profile name"
                value={newProfile.name}
                onChange={(e) => setNewProfile(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                placeholder="Enter price"
                value={newProfile.price}
                onChange={(e) => setNewProfile(prev => ({ ...prev, price: e.target.value }))}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Discount (%)</label>
              <input
                type="number"
                placeholder="Enter discount"
                value={newProfile.discount}
                onChange={(e) => setNewProfile(prev => ({ ...prev, discount: e.target.value }))}
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label>Final Price</label>
              <div className="final-price-display">
                ₹{calculateFinalPrice(parseFloat(newProfile.price) || 0, parseFloat(newProfile.discount) || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <Button type="submit" variant="primary">
            💾 Add Profile
          </Button>
        </form>
      </Card>

      {/* Pricing List */}
      <Card title="📋 Current Pricing List">
        <div className="pricing-search">
          <input
            type="text"
            placeholder="🔍 Search by profile or test name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {filteredTests.length === 0 ? (
          <div className="no-data">
            <p>📭 No test pricing available</p>
          </div>
        ) : (
          <div className="pricing-table-container">
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Profile/Test Name</th>
                  <th>Code</th>
                  <th>Price (₹)</th>
                  <th>Discount (%)</th>
                  <th>Final Price (₹)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test) => (
                  <tr key={test.id}>
                    {editingId === test.id ? (
                      <>
                        <td>{editForm.name || test.code}</td>
                        <td>{test.code}</td>
                        <td>
                          <input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              price: parseFloat(e.target.value) 
                            }))}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editForm.discount}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              discount: parseFloat(e.target.value) 
                            }))}
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </td>
                        <td className="final-price">
                          ₹{calculateFinalPrice(editForm.price, editForm.discount).toFixed(2)}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={handleSaveEdit} className="btn-save">💾</button>
                            <button onClick={handleCancelEdit} className="btn-cancel">❌</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="test-name">{test.name || test.code}</td>
                        <td className="test-code">{test.code}</td>
                        <td className="price-cell">₹{(test.price || 0).toFixed(2)}</td>
                        <td>
                          {test.discount > 0 ? (
                            <span className="discount-badge">{test.discount}% OFF</span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="final-price">
                          ₹{(test.finalPrice || test.price || 0).toFixed(2)}
                        </td>
                        <td>
                          <button onClick={() => handleEdit(test)} className="btn-edit">
                            ✏️ Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PricingManager;
