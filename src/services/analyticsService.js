// Analytics & Performance Tracking Service
import { getPatients, getVisits } from '../features/shared/dataService';
import { getUsers } from './authService';

/**
 * Get staff performance metrics
 */
export const getStaffPerformance = (period = 'daily') => {
  const patients = getPatients();
  const visits = getVisits();
  const users = getUsers().filter(u => u.role === 'staff' && u.isActive);
  
  const now = new Date();
  let startDate;
  
  // Determine date range based on period
  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(0); // All time
  }
  
  // Calculate metrics for each staff member
  const staffMetrics = users.map(staff => {
    // Filter patients added by this staff in the period
    const staffPatients = patients.filter(p => {
      const createdAt = new Date(p.createdAt);
      return p.addedBy === staff.userId && createdAt >= startDate;
    });
    
    // Filter visits by this staff
    const staffVisits = visits.filter(v => {
      const createdAt = new Date(v.createdAt);
      return v.addedBy === staff.userId && createdAt >= startDate;
    });
    
    // Calculate revenue from visits
    const revenue = staffVisits.reduce((sum, v) => sum + (v.finalAmount || 0), 0);
    
    // Count completed reports
    const completedReports = staffVisits.filter(v => 
      v.status === 'completed' || v.status === 'results_entered'
    ).length;
    
    return {
      userId: staff.userId,
      username: staff.username || staff.email.split('@')[0],
      fullName: staff.fullName,
      patientsRegistered: staffPatients.length,
      testsPerformed: staffVisits.reduce((sum, v) => sum + (v.tests?.length || 0), 0),
      reportsGenerated: completedReports,
      revenue: revenue,
      lastActive: staffVisits.length > 0 
        ? staffVisits[staffVisits.length - 1].createdAt 
        : staff.updatedAt
    };
  });
  
  // Sort by patients registered (descending)
  staffMetrics.sort((a, b) => b.patientsRegistered - a.patientsRegistered);
  
  return staffMetrics;
};

/**
 * Get overall statistics
 */
export const getOverallStats = () => {
  const patients = getPatients();
  const visits = getVisits();
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return {
    today: {
      patients: patients.filter(p => new Date(p.createdAt) >= todayStart).length,
      visits: visits.filter(v => new Date(v.createdAt) >= todayStart).length,
      revenue: visits.filter(v => new Date(v.createdAt) >= todayStart)
        .reduce((sum, v) => sum + (v.finalAmount || 0), 0)
    },
    week: {
      patients: patients.filter(p => new Date(p.createdAt) >= weekStart).length,
      visits: visits.filter(v => new Date(v.createdAt) >= weekStart).length,
      revenue: visits.filter(v => new Date(v.createdAt) >= weekStart)
        .reduce((sum, v) => sum + (v.finalAmount || 0), 0)
    },
    month: {
      patients: patients.filter(p => new Date(p.createdAt) >= monthStart).length,
      visits: visits.filter(v => new Date(v.createdAt) >= monthStart).length,
      revenue: visits.filter(v => new Date(v.createdAt) >= monthStart)
        .reduce((sum, v) => sum + (v.finalAmount || 0), 0)
    },
    allTime: {
      patients: patients.length,
      visits: visits.length,
      revenue: visits.reduce((sum, v) => sum + (v.finalAmount || 0), 0)
    }
  };
};

/**
 * Get activity timeline for a specific staff member
 */
export const getStaffActivityTimeline = (userId, days = 7) => {
  const visits = getVisits().filter(v => v.addedBy === userId);
  const timeline = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dayVisits = visits.filter(v => {
      const visitDate = new Date(v.createdAt);
      return visitDate >= date && visitDate < nextDate;
    });
    
    timeline.push({
      date: date.toISOString().split('T')[0],
      patients: dayVisits.length,
      revenue: dayVisits.reduce((sum, v) => sum + (v.finalAmount || 0), 0)
    });
  }
  
  return timeline;
};

export default {
  getStaffPerformance,
  getOverallStats,
  getStaffActivityTimeline
};
