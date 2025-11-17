import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  TestTube,
  Package
} from 'lucide-react';
import { useAuthStore } from '../../store';
import './Layout.css';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'staff'] },
    { icon: Users, label: 'Patients', path: '/patients', roles: ['admin', 'staff'] },
    { icon: TestTube, label: 'Test Master', path: '/admin/test-master', roles: ['admin'] },
    { icon: Package, label: 'Profiles', path: '/admin/profile-manager', roles: ['admin'] },
    { icon: DollarSign, label: 'Financial', path: '/financial', roles: ['admin'] },
    { icon: SettingsIcon, label: 'Settings', path: '/settings', roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">{sidebarExpanded && 'HEALit Med Lab'}</h2>
          <button className="sidebar-toggle" onClick={() => setSidebarExpanded(!sidebarExpanded)}>
            <Menu size={24} />
          </button>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {filteredMenu.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              title={item.label}
            >
              <item.icon size={20} />
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
            {sidebarExpanded && (
              <div className="user-details">
                <div className="user-name">{user?.name || 'User'}</div>
                <div className="user-role">{role === 'admin' ? 'Admin' : 'Staff'}</div>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
            <span className="logout-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 className="page-title">
            {filteredMenu.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h1>
        </header>

        {/* Page Content */}
        <main className="content">
          <Outlet />
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default Layout;
