import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';
import { initializeSeedData } from './features/shared/dataService';
import { initializeAuthData } from './services/authService';

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
import TestMaster from './pages/Admin/TestMaster';
import ProfileManager from './pages/Admin/ProfileManager';

import Layout from './components/Layout/Layout';

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
  // Initialize seed data on app load
  useEffect(() => {
    try {
      initializeSeedData();
      initializeAuthData();
    } catch (error) {
      console.error('Error initializing seed data:', error);
    }
  }, []);

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
        <Route path="/login" element={<Login />} />
        
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
            path="settings"
            element={
              <ProtectedRoute adminOnly>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/technicians"
            element={
              <ProtectedRoute adminOnly>
                <TechniciansPage />
              </ProtectedRoute>
            }
          />
          {/* NEW Test Master Page */}
          <Route
            path="admin/test-master"
            element={
              <ProtectedRoute adminOnly>
                <TestMaster />
              </ProtectedRoute>
            }
          />
          {/* NEW Profile Manager Page */}
          <Route
            path="admin/profile-manager"
            element={
              <ProtectedRoute adminOnly>
                <ProfileManager />
              </ProtectedRoute>
            }
          />
        </Route>
        
        {/* Catch all - redirect to login if not authenticated, else dashboard */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
