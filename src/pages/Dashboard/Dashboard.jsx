import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, TrendingUp, Plus, FileText, TestTube, 
  ArrowUpRight, ArrowDownRight, Eye, Edit, DollarSign,
  TrendingDown, Activity, AlertCircle, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { getAdminDashboardData, getStaffDashboardData } from '../../services/dashboardService';
import { getVisits } from '../../services/firestoreService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState({ waiting: [], unpaid: [], pendingResults: [] });

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    
    // Listen for data updates
    const handleDataUpdate = () => {
      loadDashboardData();
    };
    
    window.addEventListener('healit-data-update', handleDataUpdate);
    return () => window.removeEventListener('healit-data-update', handleDataUpdate);
  }, [role, user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (role === 'admin') {
        const data = getAdminDashboardData();
        setDashboardData(data);
        
        // Load alerts for admin - FIXED LOGIC
        const allVisits = await getVisits();
        // WAITING = Sample collected, waiting for results entry (sample_times_set)
        const waitingPatients = allVisits.filter(v => v.status === 'sample_times_set');
        // UNPAID = Payment not received yet (check for undefined too)
        const unpaidInvoices = allVisits.filter(v => !v.paymentStatus || v.paymentStatus === 'unpaid');
        // PENDING RESULTS = Sample times set but report not yet generated
        // (This includes both entering results AND generating report)
        const pendingResults = allVisits.filter(v => v.status === 'sample_times_set' && !v.reportedAt);
        
        setAlerts({
          waiting: waitingPatients.slice(0, 5),
          unpaid: unpaidInvoices.slice(0, 5),
          pendingResults: pendingResults.slice(0, 5)
        });
      } else {
        const data = getStaffDashboardData(user?.userId);
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Render Staff Dashboard
  if (role === 'staff') {
    return (
      <div className="dashboard staff-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Staff Dashboard</h1>
            <p>Welcome back! Here are your tasks for today</p>
          </div>
        </div>

        {/* Quick Actions for Staff */}
        <div className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            <div className="action-card" onClick={() => navigate('/patients/add-patient')}>
              <div className="action-icon" style={{ background: '#000000' }}>
                <Plus size={40} color="#FFFFFF" />
              </div>
              <h3>Add Patient</h3>
              <p>Register new</p>
            </div>
            <div className="action-card" onClick={() => navigate('/patients')}>
              <div className="action-icon" style={{ background: '#059669' }}>
                <TestTube size={40} color="#FFFFFF" />
              </div>
              <h3>Pending Results</h3>
              <p>Enter results</p>
            </div>
          </div>
        </div>

        {/* Today's Patients for Staff */}
        <Card className="patients-table-card">
          <div className="card-header">
            <h3>Today's Patients</h3>
            <span className="count-badge">{dashboardData.patientsToday}</span>
          </div>
          {dashboardData.patientsListToday.length === 0 ? (
            <div className="empty-state">
              <Users size={48} color="var(--text-tertiary)" />
              <p>No patients registered today yet.</p>
              <Button onClick={() => navigate('/patients/add-patient')} variant="primary">
                Add First Patient
              </Button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Age/Gender</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.patientsListToday.map(patient => (
                    <tr key={patient.patientId}>
                      <td>
                        <div className="patient-name">{patient.name}</div>
                      </td>
                      <td>{patient.age}Y / {patient.gender}</td>
                      <td>{patient.phone}</td>
                      <td>
                        <span className={`status-badge status-${patient.status.toLowerCase().replace('_', '-')}`}>
                          {patient.status === 'tests_selected' ? 'Registered' :
                           patient.status === 'sample_times_set' ? 'Sample Collected' :
                           patient.status === 'report_generated' ? 'Completed' : patient.status}
                        </span>
                      </td>
                      <td>
                        {patient.status === 'sample_times_set' && (
                          <Button 
                            size="small" 
                            variant="primary"
                            onClick={() => navigate(`/results/${patient.visitId}`)}
                          >
                            Enter Results
                          </Button>
                        )}
                        {patient.status === 'report_generated' && (
                          <Button 
                            size="small" 
                            variant="secondary"
                            icon={Eye}
                            onClick={() => navigate(`/patients/${patient.visitId}`)}
                          >
                            View
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Admin Dashboard Stats
  const stats = [
    {
      title: 'Patients Today',
      value: dashboardData.patientsToday,
      icon: Users,
      color: '#2563EB',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Total Patients This Month',
      value: dashboardData.totalPatientsMonth,
      icon: Users,
      color: '#059669',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Revenue This Month',
      value: `₹${dashboardData.revenueMonth.toLocaleString()}`,
      icon: DollarSign,
      color: '#DC2626',
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'Profit This Month',
      value: `₹${dashboardData.profitMonth.toLocaleString()}`,
      icon: TrendingUp,
      color: '#F59E0B',
      trend: '+10%',
      trendUp: true
    }
  ];

  // Financial cards for today
  const financialToday = [
    {
      title: 'Revenue Today',
      value: `₹${dashboardData.revenueToday.toLocaleString()}`,
      color: '#059669'
    },
    {
      title: 'Expenses Today',
      value: `₹${dashboardData.expensesToday.toLocaleString()}`,
      color: '#DC2626'
    },
    {
      title: 'Net Profit Today',
      value: `₹${dashboardData.profitToday.toLocaleString()}`,
      color: '#2563EB'
    }
  ];

  // Admin Dashboard
  return (
    <div className="dashboard admin-dashboard">
      <div className="dashboard-grid">
        {/* Left Section - Quick Actions + Stats */}
        <div className="dashboard-left">
          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h2 className="section-title">Quick Actions</h2>
            <div className="quick-actions-grid">
              <div className="action-card" onClick={() => navigate('/patients/add-patient')}>
                <div className="action-icon" style={{ background: '#000000' }}>
                  <Plus size={28} />
                </div>
                <h3>Add New Patient</h3>
                <p>Register a new patient</p>
              </div>
              <div className="action-card" onClick={() => navigate('/patients')}>
                <div className="action-icon" style={{ background: '#000000' }}>
                  <TestTube size={28} />
                </div>
                <h3>Pending Results</h3>
                <p>Enter test results</p>
              </div>
              <div className="action-card" onClick={() => navigate('/patients')}>
                <div className="action-icon" style={{ background: '#000000' }}>
                  <FileText size={28} />
                </div>
                <h3>Generate Report</h3>
                <p>Create PDF reports</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="metrics-section">
            <h2 className="section-title">Key Metrics</h2>
            <div className="metrics-grid">
              {stats.map((stat, index) => (
                <div key={index} className="metric-card">
                  <div className="metric-icon">
                    <stat.icon size={24} />
                  </div>
                  <div className="metric-content">
                    <p className="metric-label">{stat.title}</p>
                    <h3 className="metric-value">{stat.value}</h3>
                    <div className="metric-trend">
                      {stat.trendUp ? (
                        <ArrowUpRight size={16} />
                      ) : (
                        <ArrowDownRight size={16} />
                      )}
                      <span>{stat.trend}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Patients Table */}
          <Card className="patients-table-card">
            <div className="card-header">
              <h3>Today's Patients</h3>
              <span className="count-badge">{dashboardData.patientsToday}</span>
            </div>
            {dashboardData.patientsListToday.length === 0 ? (
              <div className="empty-state">
                <Users size={48} color="var(--text-tertiary)" />
                <p>No patients registered today yet.</p>
                <Button onClick={() => navigate('/patients/add-patient')} variant="primary">
                  Add First Patient
                </Button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="patients-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Age/Gender</th>
                      <th>Phone</th>
                      <th>Test Profile</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.patientsListToday.map(patient => (
                      <tr key={patient.patientId}>
                        <td>
                          <div className="patient-name">{patient.name}</div>
                        </td>
                        <td>{patient.age}Y / {patient.gender}</td>
                        <td>{patient.phone}</td>
                        <td>{patient.profileName || 'N/A'}</td>
                        <td>
                          <span className={`status-badge status-${patient.status.toLowerCase().replace('_', '-')}`}>
                            {patient.status === 'tests_selected' ? 'Registered' :
                             patient.status === 'sample_times_set' ? 'Sample Collected' :
                             patient.status === 'report_generated' ? 'Completed' : patient.status}
                          </span>
                        </td>
                        <td>
                          {patient.status === 'sample_times_set' && (
                            <Button 
                              size="small" 
                              variant="primary"
                              onClick={() => navigate(`/results/${patient.visitId}`)}
                            >
                              Enter Results
                            </Button>
                          )}
                          {patient.status === 'report_generated' && (
                            <Button 
                              size="small" 
                              variant="secondary"
                              icon={Eye}
                              onClick={() => navigate(`/patients/${patient.visitId}`)}
                            >
                              View Report
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Section - Staff Activity + Financial Snapshot */}
        <div className="dashboard-right">
          {/* Staff Activity */}
          <Card className="staff-activity-card">
            <div className="card-header">
              <h3>Staff Activity</h3>
              <Activity size={20} />
            </div>
            {dashboardData.staffActivity.length === 0 ? (
              <div className="empty-state-small">
                <p>No staff activity today</p>
              </div>
            ) : (
              <div className="staff-list">
                {dashboardData.staffActivity.map((staff, index) => (
                  <div key={index} className="staff-item">
                    <div className="staff-avatar">
                      {staff.staffName.charAt(0)}
                    </div>
                    <div className="staff-info">
                      <h4>{staff.staffName}</h4>
                      <div className="staff-stats">
                        <span>{staff.patientsHandled} patients</span>
                        <span className="divider">•</span>
                        <span>{staff.reportsGenerated} reports</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Financial Snapshot */}
          <Card className="financial-card">
            <div className="card-header">
              <h3>Financial Snapshot</h3>
              <DollarSign size={20} />
            </div>
            <div className="financial-today">
              {financialToday.map((item, index) => (
                <div key={index} className="financial-item">
                  <p className="financial-label">{item.title}</p>
                  <h4 className="financial-value">{item.value}</h4>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
