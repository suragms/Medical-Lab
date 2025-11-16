import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth Store
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      role: null, // 'admin' or 'staff'
      isAuthenticated: false,
      
      login: (userData) => set({ 
        user: userData, 
        role: userData.role,
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        role: null,
        isAuthenticated: false 
      }),
      
      updateUser: (userData) => set({ user: userData })
    }),
    {
      name: 'auth-storage'
    }
  )
);

// Patient Store
export const usePatientStore = create((set, get) => ({
  patients: [],
  currentPatient: null,
  
  setPatients: (patients) => set({ patients }),
  
  addPatient: (patient) => set((state) => ({ 
    patients: [patient, ...state.patients] 
  })),
  
  updatePatient: (patientId, updates) => set((state) => ({
    patients: state.patients.map(p => 
      p.id === patientId ? { ...p, ...updates } : p
    )
  })),
  
  setCurrentPatient: (patient) => set({ currentPatient: patient }),
  
  getPatientById: (patientId) => {
    return get().patients.find(p => p.id === patientId);
  }
}));

// Test Result Store
export const useTestResultStore = create((set, get) => ({
  results: [],
  
  setResults: (results) => set({ results }),
  
  addResult: (result) => set((state) => ({
    results: [...state.results, result]
  })),
  
  updateResult: (resultId, updates) => set((state) => ({
    results: state.results.map(r =>
      r.id === resultId ? { ...r, ...updates } : r
    )
  })),
  
  getResultsByPatient: (patientId) => {
    return get().results.filter(r => r.patientId === patientId);
  }
}));

// Financial Store
export const useFinancialStore = create((set, get) => ({
  revenue: [],
  expenses: [],
  
  setRevenue: (revenue) => set({ revenue }),
  
  addRevenue: (revenueEntry) => set((state) => ({
    revenue: [...state.revenue, revenueEntry]
  })),
  
  setExpenses: (expenses) => set({ expenses }),
  
  addExpense: (expense) => set((state) => ({
    expenses: [...state.expenses, expense]
  })),
  
  updateExpense: (expenseId, updates) => set((state) => ({
    expenses: state.expenses.map(e =>
      e.id === expenseId ? { ...e, ...updates } : e
    )
  })),
  
  deleteExpense: (expenseId) => set((state) => ({
    expenses: state.expenses.filter(e => e.id !== expenseId)
  })),
  
  getTotalRevenue: (startDate, endDate) => {
    const revenue = get().revenue;
    return revenue
      .filter(r => {
        const date = new Date(r.date);
        return date >= startDate && date <= endDate;
      })
      .reduce((sum, r) => sum + r.amount, 0);
  },
  
  getTotalExpenses: (startDate, endDate) => {
    const expenses = get().expenses;
    return expenses
      .filter(e => {
        const date = new Date(e.date);
        return date >= startDate && date <= endDate;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  },
  
  getProfit: (startDate, endDate) => {
    const totalRevenue = get().getTotalRevenue(startDate, endDate);
    const totalExpenses = get().getTotalExpenses(startDate, endDate);
    return totalRevenue - totalExpenses;
  }
}));

// Staff Activity Store
export const useActivityStore = create((set, get) => ({
  activities: [],
  
  setActivities: (activities) => set({ activities }),
  
  addActivity: (activity) => set((state) => ({
    activities: [...state.activities, activity]
  })),
  
  getActivitiesByStaff: (staffId) => {
    return get().activities.filter(a => a.staffId === staffId);
  },
  
  getActivitiesByPatient: (patientId) => {
    return get().activities.filter(a => a.patientId === patientId);
  }
}));

// App Settings Store
export const useSettingsStore = create(
  persist(
    (set) => ({
      labInfo: {
        name: 'HEALit Med Laboratories - Kunnathpeedika Centre',
        phone: '7356865161',
        address: 'Kunnathpeedika, Kerala',
        email: 'info@healitlab.com',
        inCharge: 'Awsin',
        logo: null,
        signature: null
      },
      
      updateLabInfo: (info) => set((state) => ({
        labInfo: { ...state.labInfo, ...info }
      })),
      
      testMaster: [],
      
      setTestMaster: (tests) => set({ testMaster: tests }),
      
      updateTest: (testId, updates) => set((state) => ({
        testMaster: state.testMaster.map(t =>
          t.id === testId ? { ...t, ...updates } : t
        )
      }))
    }),
    {
      name: 'settings-storage'
    }
  )
);
