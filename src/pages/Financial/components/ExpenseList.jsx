import React, { useState, useMemo } from 'react';
import { useFinancialStore } from '../../../store';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import toast from 'react-hot-toast';
import './ExpenseList.css';

const ExpenseList = () => {
  const { expenses, deleteExpense, updateExpense } = useFinancialStore();
  
  const [filters, setFilters] = useState({
    category: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    searchTerm: '',
  });

  const [sortBy, setSortBy] = useState('date-desc');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }
    if (filters.paymentMethod) {
      filtered = filtered.filter(e => e.paymentMethod === filters.paymentMethod);
    }
    if (filters.startDate) {
      filtered = filtered.filter(e => e.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(e => e.date <= filters.endDate);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.category.toLowerCase().includes(term) ||
        e.paidTo?.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'amount-desc':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      default:
        break;
    }

    return filtered;
  }, [expenses, filters, sortBy]);

  const allCategories = useMemo(() => {
    return [...new Set(expenses.map(e => e.category))];
  }, [expenses]);

  const allPaymentMethods = useMemo(() => {
    return [...new Set(expenses.map(e => e.paymentMethod))];
  }, [expenses]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id);
      toast.success('Expense deleted successfully!');
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setEditForm({ ...expense });
  };

  const handleSaveEdit = () => {
    updateExpense(editingId, editForm);
    setEditingId(null);
    setEditForm({});
    toast.success('Expense updated successfully!');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const exportCSV = () => {
    const headers = ['Date', 'Category', 'Amount', 'Payment Method', 'Paid To', 'Description'];
    const rows = filteredAndSortedExpenses.map(e => [
      e.date,
      e.category,
      e.amount,
      e.paymentMethod,
      e.paidTo || '',
      e.description || ''
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported successfully!');
  };

  const totalAmount = useMemo(() => {
    return filteredAndSortedExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredAndSortedExpenses]);

  return (
    <div className="expense-list">
      <Card title="📋 All Expenses">
        {/* Filters Section */}
        <div className="filters-section">
          <div className="filters-grid">
            <input
              type="text"
              placeholder="🔍 Search by category, name, or description..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="search-input"
            />

            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">All Categories</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
            >
              <option value="">All Payment Methods</option>
              {allPaymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>

            <input
              type="date"
              placeholder="From Date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />

            <input
              type="date"
              placeholder="To Date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
            </select>
          </div>

          <div className="filter-actions">
            <Button
              variant="secondary"
              onClick={() => setFilters({
                category: '',
                paymentMethod: '',
                startDate: '',
                endDate: '',
                searchTerm: '',
              })}
            >
              🔄 Reset Filters
            </Button>
            <Button variant="primary" onClick={exportCSV}>
              📥 Export CSV
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="expense-summary-bar">
          <div className="summary-item">
            <span className="summary-label">Total Entries:</span>
            <span className="summary-value">{filteredAndSortedExpenses.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Amount:</span>
            <span className="summary-value total-amount">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Expense Table */}
        {filteredAndSortedExpenses.length === 0 ? (
          <div className="no-data">
            <p>📭 No expenses found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Paid To</th>
                  <th>Description</th>
                  <th>Attachment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedExpenses.map((expense) => (
                  <tr key={expense.id}>
                    {editingId === expense.id ? (
                      <>
                        <td>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </td>
                        <td>{editForm.category}</td>
                        <td>
                          <input
                            type="number"
                            value={editForm.amount}
                            onChange={(e) => setEditForm(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                          />
                        </td>
                        <td>{editForm.paymentMethod}</td>
                        <td>
                          <input
                            type="text"
                            value={editForm.paidTo}
                            onChange={(e) => setEditForm(prev => ({ ...prev, paidTo: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </td>
                        <td>-</td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={handleSaveEdit} className="btn-save">💾</button>
                            <button onClick={handleCancelEdit} className="btn-cancel">❌</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{new Date(expense.date).toLocaleDateString()}</td>
                        <td><span className="category-badge">{expense.category}</span></td>
                        <td className="amount-cell">₹{expense.amount.toFixed(2)}</td>
                        <td>{expense.paymentMethod}</td>
                        <td>{expense.paidTo || '-'}</td>
                        <td>{expense.description || '-'}</td>
                        <td>
                          {expense.attachment ? (
                            <a href={expense.attachment} target="_blank" rel="noopener noreferrer" className="attachment-link">
                              📎 View
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => handleEdit(expense)} className="btn-edit">✏️</button>
                            <button onClick={() => handleDelete(expense.id)} className="btn-delete">🗑️</button>
                          </div>
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

export default ExpenseList;
