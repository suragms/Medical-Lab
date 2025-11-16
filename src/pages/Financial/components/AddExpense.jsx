import React, { useState } from 'react';
import { useFinancialStore } from '../../../store';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../../data/expenseCategories';
import toast from 'react-hot-toast';
import './AddExpense.css';

const AddExpense = () => {
  const { addExpense } = useFinancialStore();
  
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: '',
    paidTo: '',
    attachment: null,
  });

  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        attachment: file
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.category && !customCategory) {
      toast.error('Please select a category');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    const expense = {
      id: Date.now().toString(),
      category: customCategory || formData.category,
      amount: parseFloat(formData.amount),
      date: formData.date,
      description: formData.description,
      paymentMethod: formData.paymentMethod,
      paidTo: formData.paidTo,
      attachment: formData.attachment ? URL.createObjectURL(formData.attachment) : null,
      attachmentName: formData.attachment?.name || null,
      createdAt: new Date().toISOString(),
    };

    addExpense(expense);
    toast.success('Expense added successfully! 💰');
    
    // Reset form
    setFormData({
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      paymentMethod: '',
      paidTo: '',
      attachment: null,
    });
    setCustomCategory('');
    setShowCustomCategory(false);
  };

  const handleReset = () => {
    setFormData({
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      paymentMethod: '',
      paidTo: '',
      attachment: null,
    });
    setCustomCategory('');
    setShowCustomCategory(false);
  };

  return (
    <div className="add-expense">
      <Card title="➕ Add New Expense">
        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setShowCustomCategory(true);
                    setFormData(prev => ({ ...prev, category: '' }));
                  } else {
                    setShowCustomCategory(false);
                    handleChange(e);
                  }
                }}
                required={!customCategory}
              >
                <option value="">Select Category</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
                <option value="custom">➕ Add Custom Category</option>
              </select>
            </div>

            {showCustomCategory && (
              <div className="form-group">
                <label>Custom Category Name *</label>
                <input
                  type="text"
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Amount (₹) *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Payment Method *</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
              >
                <option value="">Select Payment Method</option>
                {PAYMENT_METHODS.map(method => (
                  <option key={method.id} value={method.name}>
                    {method.icon} {method.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Paid To</label>
              <input
                type="text"
                name="paidTo"
                value={formData.paidTo}
                onChange={handleChange}
                placeholder="Supplier/Staff name"
              />
            </div>

            <div className="form-group full-width">
              <label>Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add notes or details about this expense"
                rows="3"
              />
            </div>

            <div className="form-group full-width">
              <label>Upload Bill/Receipt (Optional)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="file-input"
              />
              {formData.attachment && (
                <div className="file-preview">
                  📎 {formData.attachment.name}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, attachment: null }))}
                    className="remove-file"
                  >
                    ❌
                  </button>
                </div>
              )}
              <small>Max file size: 5MB (Images or PDF)</small>
            </div>
          </div>

          <div className="form-actions">
            <Button type="submit" variant="primary">
              💾 Save Expense
            </Button>
            <Button type="button" variant="secondary" onClick={handleReset}>
              🔄 Reset
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddExpense;
