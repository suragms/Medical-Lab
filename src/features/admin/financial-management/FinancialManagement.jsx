import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard, PiggyBank, AlertCircle,
  Plus, Edit, Trash2, FileText, Calendar, Filter, Search, X,
  FileSpreadsheet, Bell
} from 'lucide-react';
import { useAuthStore } from '../../../store';
import { getCurrentUser, getUsers } from '../../../services/authService';
import {
  getFinancialSummary, getExpenses, addExpense, updateExpense, deleteExpense,
  getCategories, addCategory, updateCategory, deleteCategory,
  getReminders, addReminder, deleteReminder,
  getAnalyticsData, getStaffExpensesSummary, filterExpenses
} from './financeService';
import Button from '../../../components/ui/Button';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './FinancialManagement.css';

const FinancialManagement = () => {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const currentUser = getCurrentUser();
  const users = getUsers();
  
  // State (MUST be before conditional return - React Hooks Rules)
  const [activeTab, setActiveTab] = useState('expenses');
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [staffExpenses, setStaffExpenses] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    categoryId: '',
    staffId: '',
    search: '',
    minAmount: '',
    maxAmount: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Form states
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    amount: '',
    description: '',
    paidTo: '',
    staffId: '',
    paymentMethod: 'Cash',
    attachmentUrl: ''
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: ''
  });
  
  const [reminderForm, setReminderForm] = useState({
    title: '',
    date: '',
    repeat: 'One-time',
    notes: '',
    viaEmail: false,
    viaWhatsApp: false
  });
  
  const [analyticsRange, setAnalyticsRange] = useState('month');
  const [summaryRange, setSummaryRange] = useState('month');
  
  // Helper functions wrapped in useCallback to avoid dependency warnings
  const loadData = useCallback(() => {
    setSummary(getFinancialSummary(summaryRange));
    setExpenses(getExpenses());
    setCategories(getCategories());
    setReminders(getReminders());
    setStaffExpenses(getStaffExpensesSummary());
  }, [summaryRange]);
  
  const loadAnalytics = useCallback(() => {
    const data = getAnalyticsData(analyticsRange);
    setAnalyticsData(data);
  }, [analyticsRange]);
  
  const applyFilters = useCallback(() => {
    // Only apply filters if any filter is set
    const hasFilters = filters.startDate || filters.endDate || filters.categoryId || 
                       filters.staffId || filters.search || filters.minAmount || filters.maxAmount;
    
    if (hasFilters) {
      const filtered = filterExpenses(filters);
      setExpenses(filtered);
    } else {
      // No filters, load all expenses
      setExpenses(getExpenses());
    }
  }, [filters]);
  
  // Load data
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab, loadAnalytics]);
  
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);
  
  // Permission check (AFTER all hooks - React Hooks Rules)
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
  
  // Remaining helper functions
  
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      categoryId: '',
      staffId: '',
      search: '',
      minAmount: '',
      maxAmount: ''
    });
    setExpenses(getExpenses());
  };
  
  // Expense handlers
  const handleAddExpense = () => {
    if (!expenseForm.categoryId || !expenseForm.amount) {
      toast.error('Category and amount are required');
      return;
    }
    
    if (parseFloat(expenseForm.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    
    try {
      if (editingExpense) {
        updateExpense(editingExpense.id, {
          ...expenseForm,
          amount: parseFloat(expenseForm.amount)
        });
        toast.success('Expense updated successfully');
      } else {
        addExpense({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount),
          createdByAdminId: currentUser?.userId
        });
        toast.success('Expense added successfully');
      }
      
      setShowExpenseModal(false);
      setEditingExpense(null);
      resetExpenseForm();
      
      // Reload summary and expenses
      setSummary(getFinancialSummary('month'));
      setExpenses(getExpenses());
      setStaffExpenses(getStaffExpensesSummary());
    } catch (error) {
      toast.error('Failed to save expense');
    }
  };
  
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      date: expense.date.split('T')[0],
      categoryId: expense.categoryId,
      amount: expense.amount.toString(),
      description: expense.description,
      paidTo: expense.paidTo,
      staffId: expense.staffId || '',
      paymentMethod: expense.paymentMethod,
      attachmentUrl: expense.attachmentUrl || ''
    });
    setShowExpenseModal(true);
  };
  
  const handleDeleteExpense = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id);
      toast.success('Expense deleted');
      
      // Reload summary and expenses
      setSummary(getFinancialSummary('month'));
      setExpenses(getExpenses());
      setStaffExpenses(getStaffExpensesSummary());
    }
  };
  
  const resetExpenseForm = () => {
    setExpenseForm({
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
      amount: '',
      description: '',
      paidTo: '',
      staffId: '',
      paymentMethod: 'Cash',
      attachmentUrl: ''
    });
  };
  
  // Category handlers
  const handleAddCategory = () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    try {
      if (editingCategory) {
        updateCategory(editingCategory.id, { name: categoryForm.name });
        toast.success('Category updated');
      } else {
        addCategory({ name: categoryForm.name });
        toast.success('Category added');
      }
      
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to save category');
    }
  };
  
  const handleDeleteCategory = (id) => {
    try {
      deleteCategory(id);
      toast.success('Category deleted');
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  // Reminder handlers
  const handleAddReminder = () => {
    if (!reminderForm.title || !reminderForm.date) {
      toast.error('Title and date are required');
      return;
    }
    
    try {
      addReminder({
        ...reminderForm,
        createdBy: currentUser?.userId
      });
      toast.success('Reminder created');
      setShowReminderModal(false);
      setReminderForm({
        title: '',
        date: '',
        repeat: 'One-time',
        notes: '',
        viaEmail: false,
        viaWhatsApp: false
      });
      loadData();
    } catch (error) {
      toast.error('Failed to create reminder');
    }
  };
  
  const handleDeleteReminder = (id) => {
    if (window.confirm('Delete this reminder?')) {
      deleteReminder(id);
      toast.success('Reminder deleted');
      loadData();
    }
  };
  
  // Export handlers
  const handleExportExcel = () => {
    try {
      // Create CSV content
      const headers = ['Date', 'Category', 'Description', 'Paid To', 'Amount', 'Staff', 'Payment Method'];
      const rows = expenses.map(expense => [
        new Date(expense.date).toLocaleDateString(),
        getCategoryName(expense.categoryId),
        expense.description || '—',
        expense.paidTo || '—',
        `Rs. ${expense.amount.toLocaleString('en-IN')}`,
        getUserName(expense.staffId),
        expense.paymentMethod
      ]);
  
      // Add summary row
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      rows.push(['', '', '', 'TOTAL', `Rs. ${totalExpenses.toLocaleString('en-IN')}`, '', '']);
  
      // Convert to CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
  
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  
      toast.success('✅ Excel file downloaded successfully!');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('❌ Failed to export Excel file');
    }
  };
  
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 15;
  
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Financial Report', pageWidth / 2, yPos, { align: 'center' });
  
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
  
      yPos += 10;
  
      // Summary Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Financial Summary', 15, yPos);
  
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
        
      const summaryData = [
        ['Total Revenue', `Rs. ${summary.revenue.current.toLocaleString('en-IN')}`],
        ['Total Expenses', `Rs. ${summary.expenses.current.toLocaleString('en-IN')}`],
        ['Net Profit', `Rs. ${summary.profit.current.toLocaleString('en-IN')}`],
        ['Pending Bills', summary.pendingBills.toString()]
      ];
  
      doc.autoTable({
        startY: yPos,
        head: [['Item', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        margin: { left: 15, right: 15 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 80, halign: 'right', fontStyle: 'bold' }
        }
      });
  
      yPos = doc.lastAutoTable.finalY + 10;
  
      // Expenses Table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Expense Details', 15, yPos);
  
      yPos += 5;
  
      const tableData = expenses.map(expense => [
        new Date(expense.date).toLocaleDateString(),
        getCategoryName(expense.categoryId),
        expense.description || '—',
        expense.paidTo || '—',
        `Rs. ${expense.amount.toLocaleString('en-IN')}`,
        expense.paymentMethod
      ]);
  
      // Add total row
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      tableData.push(['', '', '', 'TOTAL', `Rs. ${totalExpenses.toLocaleString('en-IN')}`, '']);
  
      doc.autoTable({
        startY: yPos,
        head: [['Date', 'Category', 'Description', 'Paid To', 'Amount', 'Method']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [240, 248, 255]
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 40 },
          3: { cellWidth: 35 },
          4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
          5: { cellWidth: 25 }
        },
        margin: { left: 15, right: 15 },
        didParseCell: (data) => {
          // Make total row bold
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [220, 240, 255];
          }
        }
      });
  
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        doc.text('HEALit Med Laboratories - Financial Management', pageWidth / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
      }
  
      // Save PDF
      doc.save(`Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('✅ PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('❌ Failed to export PDF');
    }
  };
  
  // Get category name
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };
  
  // Get user name
  const getUserName = (userId) => {
    if (!userId) return '—';
    const user = users.find(u => u.userId === userId);
    return user ? user.fullName : 'Unknown';
  };
  
  if (!summary) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading financial data...</p>
      </div>
    );
  }
  
  return (
    <div className="financial-management-page">
      {/* Page Header */}
      <div className="page-header-finance">
        <div>
          <h1>Financial Management</h1>
          <p className="subtitle">Track expenses, revenue, and profit/loss analytics</p>
        </div>
        <div className="header-actions">
          <div className="range-selector">
            <button 
              className={`range-btn ${summaryRange === 'daily' ? 'active' : ''}`}
              onClick={() => setSummaryRange('daily')}
            >
              Today
            </button>
            <button 
              className={`range-btn ${summaryRange === 'week' ? 'active' : ''}`}
              onClick={() => setSummaryRange('week')}
            >
              This Week
            </button>
            <button 
              className={`range-btn ${summaryRange === 'month' ? 'active' : ''}`}
              onClick={() => setSummaryRange('month')}
            >
              This Month
            </button>
          </div>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet size={18} />
            Export Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText size={18} />
            Export PDF
          </Button>
          <Button 
            variant="danger" 
            onClick={() => {
              const confirmed = window.confirm(
                '⚠️ WARNING: Delete ALL Financial Data?\n\nThis will permanently delete:\n• All expenses\n• All categories\n• All reminders\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?'
              );
              if (confirmed) {
                const doubleConfirm = window.confirm(
                  '⚠️ FINAL CONFIRMATION\n\nYou are about to DELETE ALL FINANCIAL DATA!\n\nType YES to confirm or Cancel to abort.'
                );
                if (doubleConfirm) {
                  try {
                    localStorage.removeItem('medlab_expenses');
                    localStorage.removeItem('medlab_expense_categories');
                    localStorage.removeItem('medlab_expense_reminders');
                    toast.success('✅ All financial data deleted successfully!');
                    window.location.reload();
                  } catch (error) {
                    toast.error('❌ Failed to delete data');
                  }
                }
              }
            }}
          >
            <Trash2 size={18} />
            Delete All Data
          </Button>
        </div>
      </div>

      {/* SECTION 1 - Financial Summary Cards */}
      <div className="financial-summary-grid">
        <div className="summary-card revenue-card">
          <div className="card-header">
            <DollarSign size={24} />
            <span>Total Revenue</span>
          </div>
          <div className="card-value">₹{summary.revenue.current.toLocaleString()}</div>
          <div className={`card-trend ${summary.revenue.trend >= 0 ? 'positive' : 'negative'}`}>
            {summary.revenue.trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{Math.abs(summary.revenue.trend).toFixed(1)}% vs {summaryRange === 'daily' ? 'yesterday' : summaryRange === 'week' ? 'last week' : 'last month'}</span>
          </div>
        </div>

        <div className="summary-card expense-card">
          <div className="card-header">
            <CreditCard size={24} />
            <span>Total Expenses</span>
          </div>
          <div className="card-value">₹{summary.expenses.current.toLocaleString()}</div>
          <div className={`card-trend ${summary.expenses.trend <= 0 ? 'positive' : 'negative'}`}>
            {summary.expenses.trend <= 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
            <span>{Math.abs(summary.expenses.trend).toFixed(1)}% vs {summaryRange === 'daily' ? 'yesterday' : summaryRange === 'week' ? 'last week' : 'last month'}</span>
          </div>
        </div>

        <div className="summary-card profit-card">
          <div className="card-header">
            <PiggyBank size={24} />
            <span>Net Profit</span>
          </div>
          <div className="card-value">₹{summary.profit.current.toLocaleString()}</div>
          <div className={`card-trend ${summary.profit.trend >= 0 ? 'positive' : 'negative'}`}>
            {summary.profit.trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{Math.abs(summary.profit.trend).toFixed(1)}% vs {summaryRange === 'daily' ? 'yesterday' : summaryRange === 'week' ? 'last week' : 'last month'}</span>
          </div>
        </div>

        <div className="summary-card bills-card">
          <div className="card-header">
            <Bell size={24} />
            <span>Pending Bills</span>
          </div>
          <div className="card-value">{summary.pendingBills}</div>
          <div className="card-subtitle">Due in next 7 days</div>
        </div>
      </div>

      {/* SECTION 2 - Expenses Management Tabs */}
      <div className="finance-tabs-container">
        <div className="tabs-header">
          <button 
            className={`tab ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            All Expenses
          </button>
          <button 
            className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
          <button 
            className={`tab ${activeTab === 'staff-expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff-expenses')}
          >
            Staff Expenses
          </button>
          <button 
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button 
            className={`tab ${activeTab === 'reminders' ? 'active' : ''}`}
            onClick={() => setActiveTab('reminders')}
          >
            Reminders
          </button>
        </div>

        <div className="tab-content">
          {/* TAB 1 - All Expenses */}
          {activeTab === 'expenses' && (
            <div className="expenses-tab">
              <div className="tab-toolbar">
                <div className="toolbar-left">
                  <button className="btn-filter" onClick={() => setShowFilters(!showFilters)}>
                    <Filter size={18} />
                    Filters {Object.values(filters).some(v => v !== '') && '(Active)'}
                  </button>
                  <div className="search-box">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Search by description or vendor..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>
                </div>
                <Button variant="primary" onClick={() => { setEditingExpense(null); resetExpenseForm(); setShowExpenseModal(true); }}>
                  <Plus size={18} />
                  Add Expense
                </Button>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="filters-panel">
                  <div className="filter-row">
                    <div className="filter-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      />
                    </div>
                    <div className="filter-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      />
                    </div>
                    <div className="filter-group">
                      <label>Category</label>
                      <select value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
                        <option value="">All Categories</option>
                        {categories.filter(c => c.isActive).map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>Staff</label>
                      <select value={filters.staffId} onChange={(e) => setFilters({ ...filters, staffId: e.target.value })}>
                        <option value="">All Staff</option>
                        {users.filter(u => u.isActive).map(user => (
                          <option key={user.userId} value={user.userId}>{user.fullName}</option>
                        ))}
                      </select>
                    </div>
                    <Button variant="outline" onClick={resetFilters}>
                      <X size={18} />
                      Reset
                    </Button>
                  </div>
                </div>
              )}

              {/* Expenses Table */}
              <div className="expenses-table-wrapper">
                <table className="expenses-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Paid To</th>
                      <th>Amount</th>
                      <th>Staff</th>
                      <th>Method</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length > 0 ? (
                      expenses.map(expense => (
                        <tr key={expense.id}>
                          <td>{new Date(expense.date).toLocaleDateString()}</td>
                          <td>
                            <span className="category-badge">{getCategoryName(expense.categoryId)}</span>
                          </td>
                          <td>{expense.description || '—'}</td>
                          <td>{expense.paidTo || '—'}</td>
                          <td className="amount-cell">₹{expense.amount.toLocaleString()}</td>
                          <td>{getUserName(expense.staffId)}</td>
                          <td><span className="payment-method">{expense.paymentMethod}</span></td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-icon" onClick={() => handleEditExpense(expense)}>
                                <Edit size={16} />
                              </button>
                              <button className="btn-icon btn-delete" onClick={() => handleDeleteExpense(expense.id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="no-data">No expenses found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Remaining tabs will continue... */}
          
          {/* TAB 2 - Categories */}
          {activeTab === 'categories' && (
            <div className="categories-tab">
              <div className="tab-toolbar">
                <h3>Expense Categories</h3>
                <Button variant="primary" onClick={() => { setEditingCategory(null); setCategoryForm({ name: '' }); setShowCategoryModal(true); }}>
                  <Plus size={18} />
                  Add Category
                </Button>
              </div>
              <div className="categories-grid">
                {categories.map(cat => (
                  <div key={cat.id} className="category-card">
                    <div className="category-name">{cat.name}</div>
                    <div className="category-status">
                      <span className={`status-badge ${cat.isActive ? 'active' : 'inactive'}`}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="category-actions">
                      <button className="btn-icon" onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name }); setShowCategoryModal(true); }}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => handleDeleteCategory(cat.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* TAB 3 - Staff Expenses */}
          {activeTab === 'staff-expenses' && (
            <div className="staff-expenses-tab">
              <h3>Staff-Wise Expense Summary</h3>
              <div className="staff-expenses-table-wrapper">
                <table className="staff-expenses-table">
                  <thead>
                    <tr>
                      <th>Staff Name</th>
                      <th>Total Expenses</th>
                      <th>Category Breakdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffExpenses.length > 0 ? (
                      staffExpenses.map(se => (
                        <tr key={se.staffId}>
                          <td>{getUserName(se.staffId)}</td>
                          <td className="amount-cell">₹{se.totalExpenses.toLocaleString()}</td>
                          <td>
                            <div className="category-breakdown">
                              {Object.entries(se.categoryBreakdown).map(([cat, amount]) => (
                                <span key={cat} className="breakdown-item">
                                  {cat}: ₹{amount.toLocaleString()}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="no-data">No staff expenses found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* TAB 4 - Analytics */}
          {activeTab === 'analytics' && (
            <div className="analytics-tab">
              <div className="analytics-header">
                <h3>Profit & Loss Analytics</h3>
                <div className="analytics-range-selector">
                  <button className={analyticsRange === 'daily' ? 'active' : ''} onClick={() => setAnalyticsRange('daily')}>Daily</button>
                  <button className={analyticsRange === 'weekly' ? 'active' : ''} onClick={() => setAnalyticsRange('weekly')}>Weekly</button>
                  <button className={analyticsRange === 'month' ? 'active' : ''} onClick={() => setAnalyticsRange('month')}>Monthly</button>
                </div>
              </div>
              <div className="analytics-chart">
                <div className="chart-simple">
                  {analyticsData.map((data, idx) => (
                    <div key={idx} className="chart-bar-group">
                      <div className="chart-bars">
                        <div className="bar revenue-bar" style={{ height: `${(data.revenue / Math.max(...analyticsData.map(d => d.revenue || 1))) * 100}%` }}></div>
                        <div className="bar expense-bar" style={{ height: `${(data.expense / Math.max(...analyticsData.map(d => d.revenue || 1))) * 100}%` }}></div>
                      </div>
                      <div className="chart-label">{data.label}</div>
                    </div>
                  ))}
                </div>
                <div className="chart-legend">
                  <span className="legend-item"><span className="legend-color revenue"></span>Revenue</span>
                  <span className="legend-item"><span className="legend-color expense"></span>Expenses</span>
                  <span className="legend-item"><span className="legend-color profit"></span>Profit</span>
                </div>
              </div>
            </div>
          )}
          
          {/* TAB 5 - Reminders */}
          {activeTab === 'reminders' && (
            <div className="reminders-tab">
              <div className="tab-toolbar">
                <h3>Bill Reminders & Alerts</h3>
                <Button variant="primary" onClick={() => setShowReminderModal(true)}>
                  <Plus size={18} />
                  Add Reminder
                </Button>
              </div>
              <div className="reminders-list">
                {reminders.length > 0 ? (
                  reminders.map(reminder => (
                    <div key={reminder.id} className="reminder-card">
                      <div className="reminder-header">
                        <h4>{reminder.title}</h4>
                        <button className="btn-icon btn-delete" onClick={() => handleDeleteReminder(reminder.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="reminder-details">
                        <div className="reminder-date">
                          <Calendar size={16} />
                          {new Date(reminder.date).toLocaleDateString()}
                        </div>
                        <span className="reminder-repeat">{reminder.repeat}</span>
                      </div>
                      {reminder.notes && <p className="reminder-notes">{reminder.notes}</p>}
                      <div className="reminder-alerts">
                        {reminder.viaEmail && <span className="alert-badge">Email</span>}
                        {reminder.viaWhatsApp && <span className="alert-badge">WhatsApp</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-reminders">No reminders created yet</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
            <div className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="0.00" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select value={expenseForm.categoryId} onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}>
                    <option value="">Select category...</option>
                    {categories.filter(c => c.isActive).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select value={expenseForm.paymentMethod} onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}>
                    <option value="Cash">Cash</option>
                    <option value="GPay">GPay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="What was this expense for?" />
              </div>
              <div className="form-group">
                <label>Paid To</label>
                <input type="text" value={expenseForm.paidTo} onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })} placeholder="Vendor or person name" />
              </div>
              <div className="form-group">
                <label>Assign to Staff (Optional)</label>
                <select value={expenseForm.staffId} onChange={(e) => setExpenseForm({ ...expenseForm, staffId: e.target.value })}>
                  <option value="">None</option>
                  {users.filter(u => u.isActive).map(user => (
                    <option key={user.userId} value={user.userId}>{user.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <Button variant="outline" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleAddExpense}>Save Expense</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            <div className="modal-form">
              <div className="form-group">
                <label>Category Name *</label>
                <input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm({ name: e.target.value })} placeholder="e.g., Office Supplies" />
              </div>
              <div className="modal-actions">
                <Button variant="outline" onClick={() => setShowCategoryModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleAddCategory}>Save Category</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="modal-overlay" onClick={() => setShowReminderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Reminder</h3>
            <div className="modal-form">
              <div className="form-group">
                <label>Title *</label>
                <input type="text" value={reminderForm.title} onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })} placeholder="e.g., Laboratory Rent" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" value={reminderForm.date} onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Repeat</label>
                  <select value={reminderForm.repeat} onChange={(e) => setReminderForm({ ...reminderForm, repeat: e.target.value })}>
                    <option value="One-time">One-time</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={reminderForm.notes} onChange={(e) => setReminderForm({ ...reminderForm, notes: e.target.value })} placeholder="Additional details..." rows="3" />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={reminderForm.viaEmail} onChange={(e) => setReminderForm({ ...reminderForm, viaEmail: e.target.checked })} />
                  Send Email Alert
                </label>
                <label>
                  <input type="checkbox" checked={reminderForm.viaWhatsApp} onChange={(e) => setReminderForm({ ...reminderForm, viaWhatsApp: e.target.checked })} />
                  Send WhatsApp Alert
                </label>
              </div>
              <div className="modal-actions">
                <Button variant="outline" onClick={() => setShowReminderModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleAddReminder}>Create Reminder</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialManagement;