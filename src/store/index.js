import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as authLogin, logout as authLogout, getCurrentUser } from '../services/authService';
import apiService from '../services/apiService';

// Helper function to sync with backend
const syncWithBackend = async (storeName, getData) => {
  try {
    const data = getData();
    // Sync happens automatically through API calls
    return data;
  } catch (error) {
    console.warn(`Sync error for ${storeName}:`, error);
    return null;
  }
};

// Auth Store - Integrated with authService
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: getCurrentUser(),
      role: getCurrentUser()?.role || null,
      isAuthenticated: !!getCurrentUser(),
      
      login: async (usernameOrEmail, password) => {
        try {
          const { user } = authLogin(usernameOrEmail, password);
          set({ 
            user, 
            role: user.role,
            isAuthenticated: true 
          });
          return { success: true, user };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      
      logout: () => {
        authLogout();
        set({ 
          user: null, 
          role: null,
          isAuthenticated: false 
        });
      },
      
      updateUser: (userData) => set({ user: userData }),
      
      refreshUser: () => {
        const user = getCurrentUser();
        set({ 
          user,
          role: user?.role || null,
          isAuthenticated: !!user
        });
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);

// Patient Store - WITH PERSISTENCE AND API SYNC
export const usePatientStore = create(
  persist(
    (set, get) => ({
      patients: [],
      currentPatient: null,
      isLoading: false,
      
      // Load patients from API
      loadPatients: async () => {
        set({ isLoading: true });
        try {
          const response = await apiService.getPatients();
          if (response.success) {
            set({ patients: response.data, isLoading: false });
          }
        } catch (error) {
          console.error('Error loading patients:', error);
          set({ isLoading: false });
        }
      },
      
      setPatients: (patients) => set({ patients }),
      
      addPatient: async (patient) => {
        try {
          const response = await apiService.createPatient(patient);
          if (response.success) {
            set((state) => ({ 
              patients: [response.data, ...state.patients] 
            }));
            return response.data;
          }
        } catch (error) {
          console.error('Error adding patient:', error);
          // Fallback to local storage
          set((state) => ({ 
            patients: [patient, ...state.patients] 
          }));
          return patient;
        }
      },
      
      updatePatient: async (patientId, updates) => {
        try {
          const response = await apiService.updatePatient(patientId, updates);
          if (response.success) {
            set((state) => ({
              patients: state.patients.map(p => 
                p.id === patientId ? response.data : p
              )
            }));
          }
        } catch (error) {
          console.error('Error updating patient:', error);
          // Fallback to local update
          set((state) => ({
            patients: state.patients.map(p => 
              p.id === patientId ? { ...p, ...updates } : p
            )
          }));
        }
      },
      
      setCurrentPatient: (patient) => set({ currentPatient: patient }),
      
      getPatientById: (patientId) => {
        return get().patients.find(p => p.id === patientId);
      }
    }),
    {
      name: 'patient-storage',
      version: 1
    }
  )
);

// Test Result Store - WITH PERSISTENCE AND API SYNC
export const useTestResultStore = create(
  persist(
    (set, get) => ({
      results: [],
      isLoading: false,
      
      // Load results from API
      loadResults: async (patientId = null) => {
        set({ isLoading: true });
        try {
          const response = await apiService.getResults(patientId);
          if (response.success) {
            set({ results: response.data, isLoading: false });
          }
        } catch (error) {
          console.error('Error loading results:', error);
          set({ isLoading: false });
        }
      },
      
      setResults: (results) => set({ results }),
      
      addResult: async (result) => {
        try {
          const response = await apiService.createResult(result);
          if (response.success) {
            set((state) => ({
              results: [...state.results, response.data]
            }));
            return response.data;
          }
        } catch (error) {
          console.error('Error adding result:', error);
          // Fallback to local storage
          set((state) => ({
            results: [...state.results, result]
          }));
          return result;
        }
      },
      
      updateResult: async (resultId, updates) => {
        try {
          const response = await apiService.updateResult(resultId, updates);
          if (response.success) {
            set((state) => ({
              results: state.results.map(r =>
                r.id === resultId ? response.data : r
              )
            }));
          }
        } catch (error) {
          console.error('Error updating result:', error);
          // Fallback to local update
          set((state) => ({
            results: state.results.map(r =>
              r.id === resultId ? { ...r, ...updates } : r
            )
          }));
        }
      },
      
      getResultsByPatient: (patientId) => {
        return get().results.filter(r => r.patientId === patientId);
      }
    }),
    {
      name: 'test-result-storage',
      version: 1
    }
  )
);

// Financial Store - WITH PERSISTENCE
export const useFinancialStore = create(
  persist(
    (set, get) => ({
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
    }),
    {
      name: 'financial-storage',
      version: 1
    }
  )
);

// Staff Activity Store - WITH PERSISTENCE
export const useActivityStore = create(
  persist(
    (set, get) => ({
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
    }),
    {
      name: 'activity-storage',
      version: 1
    }
  )
);

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
      name: 'settings-storage',
      version: 1
    }
  )
);
