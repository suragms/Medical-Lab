import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, TestTube2, DollarSign, Settings } from 'lucide-react';
import { useAuthStore } from '../../store';
import './MobileNav.css';

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuthStore();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home', roles: ['admin', 'staff'] },
    { path: '/patients', icon: Users, label: 'Patients', roles: ['admin', 'staff'] },
    { path: '/profiles', icon: TestTube2, label: 'Tests', roles: ['admin', 'staff'] },
    { path: '/financial', icon: DollarSign, label: 'Finance', roles: ['admin'] },
    { path: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] }
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === path || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="mobile-nav">
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <button
            key={item.path}
            className={`mobile-nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <Icon size={24} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNav;
