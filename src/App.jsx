import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';
import { initializeSeedData } from './features/shared/dataService';
import { initializeAuthData } from './services/authService';
import { preloadCriticalImages } from './utils/assetPath';
import { initializeAutoClear } from './utils/browserCacheManager';
import dataMigrationService from './services/dataMigrationService';
import apiService from './services/apiService';
import syncService from './services/syncService';

// Pages
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Patients from './pages/Patients/Patients';
import PatientDetails from './pages/Patients/PatientDetails';

// NEW Rebuilt Patient Flow
import AddPatientPage from './features/patient/AddPatientPage';
import SampleTimePage from './features/results/SampleTimePage';
import ResultEntryPage from './features/results/ResultEntryPage';

// NEW Admin Pages (Latest)
import FinancialManagement from './features/admin/financial-management/FinancialManagement';
import AdminSettings from './features/admin/settings/AdminSettings';
import TechniciansPage from './pages/Settings/TechniciansPage';
import ProfileManager from './pages/Admin/ProfileManager';
import StaffSettings from './pages/Settings/StaffSettings';
import StaffPerformance from './pages/Admin/StaffPerformance';

import Layout from './components/Layout/Layout';

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize app on load
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app with multi-device sync...');

        // Initialize seed data (for first-time users)
        initializeSeedData();
        initializeAuthData();

        // Preload critical images for PDFs and UI
        preloadCriticalImages();

        // Initialize automatic browser cache clearing
        await initializeAutoClear();

        // 🚀 FIXED: Proper MongoDB sync with error handling
        try {
          console.log('🔄 Checking MongoDB connection...');
          const healthCheck = await apiService.healthCheck();

          if (healthCheck && healthCheck.status === 'ok' && healthCheck.database === 'connected') {
            console.log('✅ MongoDB connected successfully');

            // Initial sync from MongoDB (download first)
            console.log('📥 Downloading data from MongoDB...');
            await dataMigrationService.syncFromBackend();
            console.log('✅ Initial data loaded from MongoDB');

            // Start auto-sync (upload + download every 30 seconds)
            syncService.startAutoSync();
            console.log('✅ Auto-sync enabled (every 30 seconds)');
            console.log('🌐 Multi-device sync active - All PCs will stay in sync!');
          } else {
            throw new Error('MongoDB health check failed');
          }
        } catch (apiError) {
          console.warn('⚠️ MongoDB unavailable - using localStorage only');
          console.warn('💻 Single device mode - Data NOT synced across computers');
          console.warn('Error:', apiError.message);
          // App continues with localStorage only
        }

        console.log('App initialization complete');
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      syncService.stopAutoSync();
    };
  }, []);

  if (isInitializing) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#2e7d32'
      }}>
        <div>
          <div style={{ marginBottom: '10px' }}>🔄 Initializing HEALit Lab System...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Loading and syncing data...</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#2c3e50',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#2e7d32',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#c62828',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Public Route - Login */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Patients */}
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientDetails />} />

          {/* Patient Workflow */}
          <Route path="patients/add-patient" element={<AddPatientPage />} />
          <Route path="sample-times/:visitId" element={<SampleTimePage />} />
          <Route path="results/:visitId" element={<ResultEntryPage />} />

          {/* Admin Only Routes */}
          <Route
            path="financial"
            element={
              <ProtectedRoute adminOnly>
                <FinancialManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="staff-performance"
            element={
              <ProtectedRoute adminOnly>
                <StaffPerformance />
              </ProtectedRoute>
            }
          />
          {/* Settings Routes */}
          <Route
            path="settings"
            element={
              <ProtectedRoute adminOnly>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/staff"
            element={<StaffSettings />}
          />
          <Route
            path="settings/technicians"
            element={
              <ProtectedRoute adminOnly>
                <TechniciansPage />
              </ProtectedRoute>
            }
          />
          {/* Profile Manager Page - Admin AND Staff */}
          <Route
            path="profiles"
            element={<ProfileManager />}
          />
          <Route
            path="admin/profile-manager"
            element={<ProfileManager />}
          />
        </Route>

        {/* Catch all - redirect to login if not authenticated, else dashboard */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;