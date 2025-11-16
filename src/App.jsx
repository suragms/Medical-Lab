import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';

// Pages
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Patients from './pages/Patients/Patients';
import AddPatient from './pages/Patients/AddPatient';
import PatientDetails from './pages/Patients/PatientDetails';
import Results from './pages/Results/Results';
import EnterResults from './pages/Results/EnterResults';
import Financial from './pages/Financial/Financial';
import Settings from './pages/Settings/Settings';
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
        <Route path="/login" element={<Login />} />
        
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
          <Route path="patients" element={<Patients />} />
          <Route path="patients/add" element={<AddPatient />} />
          <Route path="patients/:id" element={<PatientDetails />} />
          <Route path="results" element={<Results />} />
          <Route path="results/enter/:patientId" element={<EnterResults />} />
          <Route
            path="financial"
            element={
              <ProtectedRoute adminOnly>
                <Financial />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute adminOnly>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/test-master"
            element={
              <ProtectedRoute adminOnly>
                <TestMaster />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/profile-manager"
            element={
              <ProtectedRoute adminOnly>
                <ProfileManager />
              </ProtectedRoute>
            }
          />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
