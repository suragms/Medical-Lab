// Financial Management Service - LocalStorage Simulation
import { getPatients, getVisits } from '../../shared/dataService';

const STORAGE_KEYS = {
  EXPENSES: 'lab_expenses',
  CATEGORIES: 'lab_expense_categories',
  REMINDERS: 'lab_finance_reminders'
};

// Initialize default categories
const DEFAULT_CATEGORIES = [
  { id: 'cat_1', name: 'Rent', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_2', name: 'Salary', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_3', name: 'Electricity', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_4', name: 'Internet', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_5', name: 'Consumables', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_6', name: 'Reagents', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_7', name: 'Marketing', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_8', name: 'Maintenance', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_9', name: 'Miscellaneous', isActive: true, createdAt: new Date().toISOString() }
];

// Initialize data
const initializeFinanceData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REMINDERS)) {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify([]));
  }
};

initializeFinanceData();

// ============= CATEGORIES =============

export const getCategories = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
};

export const addCategory = (categoryData) => {
  const categories = getCategories();
  const newCategory = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: categoryData.name,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  categories.push(newCategory);
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  return newCategory;
};

export const updateCategory = (id, updates) => {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === id);
  if (index !== -1) {
    categories[index] = { ...categories[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return categories[index];
  }
  return null;
};

export const deleteCategory = (id) => {
  const expenses = getExpenses();
  const hasExpenses = expenses.some(e => e.categoryId === id);
  
  if (hasExpenses) {
    throw new Error('Cannot delete category with linked expenses');
  }
  
  const categories = getCategories().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  return true;
};

// ============= EXPENSES =============

export const getExpenses = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
};

export const getExpenseById = (id) => {
  const expenses = getExpenses();
  return expenses.find(e => e.id === id);
};

export const addExpense = (expenseData) => {
  const expenses = getExpenses();
  const newExpense = {
    id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: expenseData.date || new Date().toISOString(),
    categoryId: expenseData.categoryId,
    amount: parseFloat(expenseData.amount),
    description: expenseData.description || '',
    paidTo: expenseData.paidTo || '',
    staffId: expenseData.staffId || null,
    attachmentUrl: expenseData.attachmentUrl || null,
    paymentMethod: expenseData.paymentMethod || 'Cash',
    createdByAdminId: expenseData.createdByAdminId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  expenses.push(newExpense);
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  return newExpense;
};

export const updateExpense = (id, updates) => {
  const expenses = getExpenses();
  const index = expenses.findIndex(e => e.id === id);
  if (index !== -1) {
    expenses[index] = {
      ...expenses[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return expenses[index];
  }
  return null;
};

export const deleteExpense = (id) => {
  const expenses = getExpenses().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  return true;
};

// ============= REMINDERS =============

export const getReminders = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.REMINDERS) || '[]');
};

export const addReminder = (reminderData) => {
  const reminders = getReminders();
  const newReminder = {
    id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: reminderData.title,
    date: reminderData.date,
    repeat: reminderData.repeat || 'One-time',
    notes: reminderData.notes || '',
    viaEmail: reminderData.viaEmail || false,
    viaWhatsApp: reminderData.viaWhatsApp || false,
    createdBy: reminderData.createdBy,
    createdAt: new Date().toISOString()
  };
  reminders.push(newReminder);
  localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  return newReminder;
};

export const deleteReminder = (id) => {
  const reminders = getReminders().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  return true;
};

// ============= ANALYTICS =============

export const getFinancialSummary = (range = 'month') => {
  const expenses = getExpenses();
  const allVisits = getVisits(); // Get visits separately
  const now = new Date();
  
  // Calculate date range
  let startDate, endDate, prevStartDate, prevEndDate;
  
  if (range === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (range === 'week') {
    const day = now.getDay();
    startDate = new Date(now);
    startDate.setDate(now.getDate() - day);
    endDate = new Date(now);
    prevStartDate = new Date(startDate);
    prevStartDate.setDate(startDate.getDate() - 7);
    prevEndDate = new Date(startDate);
    prevEndDate.setDate(startDate.getDate() - 1);
  } else { // daily
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    prevStartDate = new Date(startDate);
    prevStartDate.setDate(startDate.getDate() - 1);
    prevEndDate = new Date(endDate);
    prevEndDate.setDate(endDate.getDate() - 1);
  }
  
  // Calculate current period revenue - ONLY COUNT PAID VISITS
  const currentRevenue = allVisits.reduce((sum, visit) => {
    const visitDate = new Date(visit.createdAt);
    const isPaid = visit.paymentStatus === 'paid';
    if (visitDate >= startDate && visitDate <= endDate && isPaid) {
      return sum + (visit.finalAmount || visit.totalAmount || 0);
    }
    return sum;
  }, 0);
  
  // Calculate previous period revenue - ONLY COUNT PAID VISITS
  const prevRevenue = allVisits.reduce((sum, visit) => {
    const visitDate = new Date(visit.createdAt);
    const isPaid = visit.paymentStatus === 'paid';
    if (visitDate >= prevStartDate && visitDate <= prevEndDate && isPaid) {
      return sum + (visit.finalAmount || visit.totalAmount || 0);
    }
    return sum;
  }, 0);
  
  // Calculate current period expenses
  const currentExpenses = expenses.reduce((sum, expense) => {
    const expenseDate = new Date(expense.date);
    if (expenseDate >= startDate && expenseDate <= endDate) {
      return sum + expense.amount;
    }
    return sum;
  }, 0);
  
  // Calculate previous period expenses
  const prevExpenses = expenses.reduce((sum, expense) => {
    const expenseDate = new Date(expense.date);
    if (expenseDate >= prevStartDate && expenseDate <= prevEndDate) {
      return sum + expense.amount;
    }
    return sum;
  }, 0);
  
  // Calculate profit
  const currentProfit = currentRevenue - currentExpenses;
  const prevProfit = prevRevenue - prevExpenses;
  
  // Calculate trends
  const revenueTrend = prevRevenue > 0 
    ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 
    : 0;
  const expensesTrend = prevExpenses > 0 
    ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 
    : 0;
  const profitTrend = prevProfit !== 0 
    ? ((currentProfit - prevProfit) / Math.abs(prevProfit)) * 100 
    : 0;
  
  // Get pending bills (reminders in next 7 days)
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const reminders = getReminders();
  const pendingBills = reminders.filter(r => {
    const reminderDate = new Date(r.date);
    return reminderDate <= sevenDaysFromNow && reminderDate >= now;
  }).length;
  
  return {
    revenue: {
      current: currentRevenue,
      previous: prevRevenue,
      trend: revenueTrend
    },
    expenses: {
      current: currentExpenses,
      previous: prevExpenses,
      trend: expensesTrend
    },
    profit: {
      current: currentProfit,
      previous: prevProfit,
      trend: profitTrend
    },
    pendingBills
  };
};

export const getAnalyticsData = (range = 'month', customStart = null, customEnd = null) => {
  const expenses = getExpenses();
  const allVisits = getVisits(); // Get visits separately
  
  // Generate date range
  let dataPoints = [];
  const now = new Date();
  
  if (range === 'daily') {
    // Last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
  } else if (range === 'weekly') {
    // Last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - (i * 7));
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        label: `Week ${12 - i}`
      });
    }
  } else { // monthly
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      });
    }
  }
  
  // Calculate revenue and expenses for each period
  const chartData = dataPoints.map(point => {
    const pointDate = new Date(point.date);
    let periodStart, periodEnd;
    
    if (range === 'daily') {
      periodStart = new Date(pointDate);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(pointDate);
      periodEnd.setHours(23, 59, 59, 999);
    } else if (range === 'weekly') {
      periodStart = new Date(pointDate);
      periodEnd = new Date(pointDate);
      periodEnd.setDate(periodEnd.getDate() + 6);
    } else { // monthly
      periodStart = new Date(pointDate.getFullYear(), pointDate.getMonth(), 1);
      periodEnd = new Date(pointDate.getFullYear(), pointDate.getMonth() + 1, 0);
    }
    
    // Calculate revenue - ONLY COUNT PAID VISITS
    const revenue = allVisits.reduce((sum, visit) => {
      const visitDate = new Date(visit.createdAt);
      const isPaid = visit.paymentStatus === 'paid';
      if (visitDate >= periodStart && visitDate <= periodEnd && isPaid) {
        return sum + (visit.finalAmount || visit.totalAmount || 0);
      }
      return sum;
    }, 0);
    
    // Calculate expenses
    const expense = expenses.reduce((sum, exp) => {
      const expDate = new Date(exp.date);
      if (expDate >= periodStart && expDate <= periodEnd) {
        return sum + exp.amount;
      }
      return sum;
    }, 0);
    
    return {
      label: point.label,
      revenue,
      expense,
      profit: revenue - expense
    };
  });
  
  return chartData;
};

export const getStaffExpensesSummary = () => {
  const expenses = getExpenses();
  const categories = getCategories();
  
  // Group by staff
  const staffMap = {};
  
  expenses.forEach(expense => {
    if (!expense.staffId) return;
    
    if (!staffMap[expense.staffId]) {
      staffMap[expense.staffId] = {
        staffId: expense.staffId,
        totalExpenses: 0,
        categoryBreakdown: {}
      };
    }
    
    staffMap[expense.staffId].totalExpenses += expense.amount;
    
    const category = categories.find(c => c.id === expense.categoryId);
    const categoryName = category ? category.name : 'Unknown';
    
    if (!staffMap[expense.staffId].categoryBreakdown[categoryName]) {
      staffMap[expense.staffId].categoryBreakdown[categoryName] = 0;
    }
    staffMap[expense.staffId].categoryBreakdown[categoryName] += expense.amount;
  });
  
  return Object.values(staffMap);
};

export const filterExpenses = (filters = {}) => {
  let expenses = getExpenses();
  
  // Filter by date range
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    expenses = expenses.filter(e => {
      const expDate = new Date(e.date);
      return expDate >= start && expDate <= end;
    });
  }
  
  // Filter by category
  if (filters.categoryId) {
    expenses = expenses.filter(e => e.categoryId === filters.categoryId);
  }
  
  // Filter by staff
  if (filters.staffId) {
    expenses = expenses.filter(e => e.staffId === filters.staffId);
  }
  
  // Filter by search term
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    expenses = expenses.filter(e => 
      e.description.toLowerCase().includes(searchLower) ||
      e.paidTo.toLowerCase().includes(searchLower)
    );
  }
  
  // Filter by amount range
  if (filters.minAmount !== undefined) {
    expenses = expenses.filter(e => e.amount >= filters.minAmount);
  }
  if (filters.maxAmount !== undefined) {
    expenses = expenses.filter(e => e.amount <= filters.maxAmount);
  }
  
  return expenses;
};
