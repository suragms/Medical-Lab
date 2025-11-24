import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Package,
  Bell,
  UserCircle,
  BarChart3,
  Clock,
  Activity,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { getVisits, getPatients } from '../../features/shared/dataService';
import { LOGO_PATHS } from '../../utils/assetPath';
import './Layout.css';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState({ waiting: [], unpaid: [], pendingResults: [] });
  const [logoError, setLogoError] = useState(false);

  // Load alerts
  const loadAlerts = useCallback(async () => {
    if (role === 'admin' || role === 'staff') {
      const allPatients = await getPatients();
      const allVisits = await getVisits();
      
      // Helper to calculate waiting time
      const calculateWaitingTime = (timestamp) => {
        if (!timestamp) return null;
        const now = new Date();
        const sampleTime = new Date(timestamp);
        const diffMs = now - sampleTime;
        
        if (diffMs < 0) return null; // Future time
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h`;
        return 'Just now';
      };
      
      // Helper to get full visit data with patient info
      const enrichVisitData = (visit) => {
        // Find the patient for this visit
        const patient = allPatients.find(p => p.patientId === visit.patientId);
        
        // Calculate waiting time if sample collected
        const waitingTime = visit.sampleCollectedAt 
          ? calculateWaitingTime(visit.sampleCollectedAt)
          : null;
        
        return {
          ...visit,
          name: patient?.name || 'Unknown Patient',
          age: patient?.age || 'N/A',
          gender: patient?.gender || 'N/A',
          phone: patient?.phone || 'N/A',
          selectedTests: visit.tests || [], // Use visit.tests field
          totalAmount: visit.finalAmount || visit.totalAmount || 0,
          sampleId: visit.sampleId || visit.visitId,
          waitingTime
        };
      };
      
      const waitingPatients = allVisits
        .filter(v => v.status === 'sample_times_set')
        .map(enrichVisitData)
        .slice(0, 5);
        
      const unpaidInvoices = allVisits
        .filter(v => !v.paymentStatus || v.paymentStatus === 'unpaid')
        .map(enrichVisitData)
        .slice(0, 5);
        
      const pendingResults = allVisits
        .filter(v => v.status === 'sample_times_set' && !v.reportedAt)
        .map(enrichVisitData)
        .slice(0, 5);
      
      setAlerts({
        waiting: waitingPatients,
        unpaid: unpaidInvoices,
        pendingResults: pendingResults
      });
    }
  }, [role]);
  
  useEffect(() => {
    loadAlerts();
    
    const handleDataUpdate = () => {
      loadAlerts();
    };
    
    window.addEventListener('healit-data-update', handleDataUpdate);
    return () => window.removeEventListener('healit-data-update', handleDataUpdate);
  }, [loadAlerts]);

  const totalAlerts = alerts.waiting.length + alerts.unpaid.length + alerts.pendingResults.length;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'staff'] },
    { icon: Users, label: 'Patients', path: '/patients', roles: ['admin', 'staff'] },
    { icon: Package, label: 'Profiles', path: '/admin/profile-manager', roles: ['admin', 'staff'] },
    { icon: BarChart3, label: 'Performance', path: '/staff-performance', roles: ['admin'] },
    { icon: DollarSign, label: 'Financial', path: '/financial', roles: ['admin'] },
    { icon: SettingsIcon, label: 'Settings', path: '/settings', roles: ['admin'] },
    { icon: SettingsIcon, label: 'Settings', path: '/settings/staff', roles: ['staff'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* Main Content - Full Width */}
      <div className="main-content full-width">
        {/* Compact Top Nav Header */}
        <header className="top-nav">
          {/* Mobile Menu Button (visible only on mobile) */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Left: Logo + App Name + Quick Nav */}
          <div className="nav-left">
            <div className="nav-logo">
              {!logoError ? (
                <img 
                  src={LOGO_PATHS.healit} 
                  alt="HEALit Logo" 
                  className="logo-image"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="logo-fallback" style={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 'bold' }}>🏥</span>
              )}
              <span className="app-name">HEALit Med Lab</span>
            </div>
            
            {/* Quick Navigation */}
            <div className="quick-nav">
              {filteredMenu.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`quick-nav-btn ${location.pathname === item.path ? 'active' : ''}`}
                  title={item.label}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Right: User Actions */}
          <div className="nav-right">
            <div className="notification-wrapper">
              <button 
                className="nav-icon-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Bell size={18} />
                {totalAlerts > 0 && (
                  <span className="notification-badge">{totalAlerts}</span>
                )}
              </button>
              
              {showNotifications && (
                <>
                  <div className="notification-overlay" onClick={() => setShowNotifications(false)} />
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h3>Notifications</h3>
                      <span className="notification-count">{totalAlerts} alerts</span>
                    </div>
                    
                    {totalAlerts === 0 ? (
                      <div className="notification-empty">
                        <p>No notifications</p>
                      </div>
                    ) : (
                      <div className="notification-list">
                        {alerts.waiting.length > 0 && (
                          <div className="notification-section">
                            <div className="notification-section-header">
                              <Clock size={14} />
                              <span>Waiting for Sample Collection ({alerts.waiting.length})</span>
                            </div>
                            {alerts.waiting.map(visit => (
                              <div 
                                key={visit.visitId} 
                                className="notification-item"
                                onClick={() => {
                                  navigate(`/patients/${visit.visitId}`);
                                  setShowNotifications(false);
                                }}
                              >
                                <div className="notification-content">
                                  <p className="notification-patient">{visit.name}</p>
                                  <p className="notification-detail">{visit.age}Y / {visit.gender} • Phone: {visit.phone}</p>
                                  <p className="notification-tests">Tests: {visit.selectedTests?.map(t => t.name).join(', ') || 'N/A'}</p>
                                  {visit.waitingTime && (
                                    <p className="notification-waiting">⏱️ Waiting: {visit.waitingTime}</p>
                                  )}
                                </div>
                                <span className="notification-time">ID: {visit.visitId}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {alerts.pendingResults.length > 0 && (
                          <div className="notification-section">
                            <div className="notification-section-header">
                              <Activity size={14} />
                              <span>Pending Results Entry ({alerts.pendingResults.length})</span>
                            </div>
                            {alerts.pendingResults.map(visit => (
                              <div 
                                key={visit.visitId} 
                                className="notification-item"
                                onClick={() => {
                                  navigate(`/results/${visit.visitId}`);
                                  setShowNotifications(false);
                                }}
                              >
                                <div className="notification-content">
                                  <p className="notification-patient">{visit.name}</p>
                                  <p className="notification-detail">{visit.age}Y / {visit.gender} • Sample ID: {visit.sampleId || 'N/A'}</p>
                                  <p className="notification-tests">Tests pending: {visit.selectedTests?.map(t => t.name).join(', ') || 'N/A'}</p>
                                  {visit.waitingTime && (
                                    <p className="notification-waiting urgent">⏱️ Waiting: {visit.waitingTime}</p>
                                  )}
                                </div>
                                <span className="notification-time">ID: {visit.visitId}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {alerts.unpaid.length > 0 && (
                          <div className="notification-section">
                            <div className="notification-section-header">
                              <XCircle size={14} />
                              <span>Unpaid Invoices ({alerts.unpaid.length})</span>
                            </div>
                            {alerts.unpaid.map(visit => (
                              <div 
                                key={visit.visitId} 
                                className="notification-item"
                                onClick={() => {
                                  navigate(`/patients/${visit.visitId}`);
                                  setShowNotifications(false);
                                }}
                              >
                                <div className="notification-content">
                                  <p className="notification-patient">{visit.name}</p>
                                  <p className="notification-detail">Amount: ₹{visit.totalAmount || 0} • Phone: {visit.phone}</p>
                                  <p className="notification-tests">Tests: {visit.selectedTests?.map(t => t.name).join(', ') || 'N/A'}</p>
                                </div>
                                <span className="notification-time">ID: {visit.visitId}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <button className="nav-icon-btn" onClick={() => navigate(role === 'admin' ? '/settings' : '/settings/staff')} title="Settings">
              <SettingsIcon size={18} />
            </button>
            <button className="nav-icon-btn" title={`Profile: ${user?.fullName || user?.username || 'User'}`}>
              <UserCircle size={18} />
              <span className="username-display">
                {user?.fullName || user?.username || 'User'}
              </span>
            </button>
            <button className="nav-icon-btn logout" onClick={handleLogout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="mobile-sidebar-overlay" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar Menu */}
        <aside className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="mobile-sidebar-header">
            <div className="mobile-sidebar-logo">
              {!logoError ? (
                <img 
                  src={LOGO_PATHS.healit} 
                  alt="HEALit Logo" 
                  className="logo-image"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="logo-fallback">🏥</span>
              )}
              <span className="app-name">HEALit Med Lab</span>
            </div>
            <button 
              className="mobile-sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="mobile-sidebar-nav">
            {filteredMenu.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mobile-sidebar-footer">
            <div className="mobile-user-info">
              <UserCircle size={20} />
              <span>{user?.fullName || user?.username || 'User'}</span>
            </div>
            <button 
              className="mobile-logout-btn"
              onClick={() => {
                handleLogout();
                setSidebarOpen(false);
              }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Page Content */}
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
