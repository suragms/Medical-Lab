import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Activity, Award, Calendar, BarChart3, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store';
import { getStaffPerformance, getOverallStats } from '../../services/analyticsService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import './StaffPerformance.css';

const StaffPerformance = () => {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const [period, setPeriod] = useState('daily');
  const [staffMetrics, setStaffMetrics] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = () => {
    const metrics = getStaffPerformance(period);
    const overallStats = getOverallStats();
    setStaffMetrics(metrics);
    setStats(overallStats);
  };

  // Permission check - Admin only
  if (role !== 'admin') {
    return (
      <div className="unauthorized-container">
        <AlertCircle size={64} color="#DC2626" />
        <h2>Access Denied</h2>
        <p>Admin access only. You do not have permission to view this page.</p>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      default: return 'All Time';
    }
  };

  const currentStats = stats?.[period === 'daily' ? 'today' : period === 'weekly' ? 'week' : 'month'] || {
    patients: 0,
    visits: 0,
    revenue: 0
  };

  return (
    <div className="staff-performance-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Staff Performance Analytics</h1>
          <p className="subtitle">Track team productivity and individual contributions</p>
        </div>
        <div className="period-selector">
          <button
            className={`period-btn ${period === 'daily' ? 'active' : ''}`}
            onClick={() => setPeriod('daily')}
          >
            Daily
          </button>
          <button
            className={`period-btn ${period === 'weekly' ? 'active' : ''}`}
            onClick={() => setPeriod('weekly')}
          >
            Weekly
          </button>
          <button
            className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
            onClick={() => setPeriod('monthly')}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Patients ({getPeriodLabel()})</p>
            <h2 className="stat-value">{currentStats.patients}</h2>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Visits ({getPeriodLabel()})</p>
            <h2 className="stat-value">{currentStats.visits}</h2>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Revenue ({getPeriodLabel()})</p>
            <h2 className="stat-value">₹{currentStats.revenue.toLocaleString()}</h2>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon" style={{ background: '#DBEAFE', color: '#2563EB' }}>
            <Award size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Staff</p>
            <h2 className="stat-value">{staffMetrics.length}</h2>
          </div>
        </Card>
      </div>

      {/* Staff Performance Table */}
      <Card className="performance-table-card">
        <div className="card-header">
          <h3>
            <BarChart3 size={20} />
            Staff Performance - {getPeriodLabel()}
          </h3>
        </div>

        {staffMetrics.length === 0 ? (
          <div className="empty-state">
            <Users size={48} color="var(--text-tertiary)" />
            <p>No staff activity for this period</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Staff Member</th>
                  <th>Username</th>
                  <th>User ID</th>
                  <th>Patients Registered</th>
                  <th>Tests Performed</th>
                  <th>Reports Generated</th>
                  <th>Revenue (₹)</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {staffMetrics.map((staff, index) => (
                  <tr key={staff.userId} className={index === 0 ? 'top-performer' : ''}>
                    <td>
                      <div className="rank-badge">
                        {index === 0 && <Award size={16} color="#F59E0B" />}
                        #{index + 1}
                      </div>
                    </td>
                    <td>
                      <strong>{staff.fullName}</strong>
                    </td>
                    <td>
                      <code className="username-badge">{staff.username}</code>
                    </td>
                    <td>
                      <code className="userid-badge">{staff.userId}</code>
                    </td>
                    <td>
                      <div className="metric-cell">
                        <Users size={14} />
                        {staff.patientsRegistered}
                      </div>
                    </td>
                    <td>
                      <div className="metric-cell">
                        <Activity size={14} />
                        {staff.testsPerformed}
                      </div>
                    </td>
                    <td>
                      <div className="metric-cell">
                        <BarChart3 size={14} />
                        {staff.reportsGenerated}
                      </div>
                    </td>
                    <td>
                      <strong className="revenue-amount">
                        ₹{staff.revenue.toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <div className="last-active">
                        <Calendar size={14} />
                        {new Date(staff.lastActive).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
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
};

export default StaffPerformance;
