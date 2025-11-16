import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, TrendingUp, Plus } from 'lucide-react';
import { useAuthStore, usePatientStore, useFinancialStore } from '../../store';
import StaffDashboard from './StaffDashboard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  
  // Show Staff Dashboard for staff users
  if (role === 'staff') {
    return <StaffDashboard />;
  }
  
  // Admin Dashboard
  const { patients } = usePatientStore();
  const { getTotalRevenue, getProfit } = useFinancialStore();

  // Calculate today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayPatients = patients.filter(p => {
    const createdDate = new Date(p.createdAt);
    return createdDate >= today && createdDate < tomorrow;
  });

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const monthRevenue = getTotalRevenue ? getTotalRevenue(thisMonth, nextMonth) : 0;
  const monthProfit = getProfit ? getProfit(thisMonth, nextMonth) : 0;

  const stats = [
    {
      title: 'Patients Today',
      value: todayPatients.length,
      icon: Users,
      color: '#1976d2',
      change: '+12%',
    },
    {
      title: 'Total Patients',
      value: patients.length,
      icon: Users,
      color: '#2e7d32',
      change: '+8%',
    },
    {
      title: 'Revenue This Month',
      value: `₹${monthRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: '#c62828',
      visible: role === 'admin',
    },
    {
      title: 'Profit This Month',
      value: `₹${monthProfit.toLocaleString()}`,
      icon: TrendingUp,
      color: '#f57c00',
      visible: role === 'admin',
    },
  ].filter(stat => stat.visible !== false);

  const quickActions = [
    {
      title: 'Add Patient',
      icon: Plus,
      action: () => navigate('/patients/add'),
      variant: 'primary',
    },
    {
      title: 'View Patients',
      icon: Users,
      action: () => navigate('/patients'),
      variant: 'secondary',
    },
    {
      title: 'Enter Results',
      icon: FileText,
      action: () => navigate('/results'),
      variant: 'success',
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Welcome Back!</h2>
          <p>Here's what's happening with your lab today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <Card key={index} className="stat-card">
            <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-title">{stat.title}</p>
              <h3 className="stat-value">{stat.value}</h3>
              {stat.change && <span className="stat-change positive">{stat.change} from last month</span>}
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="quick-actions">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              icon={action.icon}
              onClick={action.action}
              size="large"
              fullWidth
            >
              {action.title}
            </Button>
          ))}
        </div>
      </Card>

      {/* Recent Patients */}
      <Card title="Recent Patients">
        {patients.length === 0 ? (
          <div className="empty-state">
            <Users size={48} color="var(--text-tertiary)" />
            <p>No patients yet</p>
            <Button onClick={() => navigate('/patients/add')} variant="primary">
              Add First Patient
            </Button>
          </div>
        ) : (
          <div className="patients-list">
            {patients.slice(0, 5).map((patient) => (
              <div key={patient.id} className="patient-item" onClick={() => navigate(`/patients/${patient.id}`)}>
                <div className="patient-info">
                  <h4>{patient.name}</h4>
                  <p>{patient.age} years • {patient.gender}</p>
                </div>
                <div className="patient-meta">
                  <span className="patient-date">{new Date(patient.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
