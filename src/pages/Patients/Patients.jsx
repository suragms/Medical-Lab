import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Eye,
  Calendar,
  Phone,
  User,
  Users,
  Activity,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { getVisits, getPatients, getProfileById } from '../../features/shared/dataService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Patients.css';

const Patients = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const statusCounts = useMemo(() => {
    return visits.reduce(
      (acc, visit) => {
        if (visit.status === 'report_generated') {
          acc.completed += 1;
        } else if (visit.status === 'results_entered') {
          acc.results += 1;
        } else if (visit.status === 'sample_times_set') {
          acc.sample += 1;
        } else {
          acc.registered += 1;
        }
        return acc;
      },
      { registered: 0, sample: 0, results: 0, completed: 0 }
    );
  }, [visits]);

  const totalPatients = patients.length;
  const totalVisits = visits.length;
  const activeVisits = totalVisits - statusCounts.completed;
  const profileCount = useMemo(() => {
    const ids = new Set(
      visits
        .map((visit) => visit.profileId)
        .filter((profileId) => typeof profileId !== 'undefined' && profileId !== null)
    );
    return ids.size;
  }, [visits]);

  const summaryCards = [
    {
      label: 'Total Patients',
      value: totalPatients,
      sublabel: `${statusCounts.registered} in registration`,
      icon: Users
    },
    {
      label: 'Active Visits',
      value: activeVisits,
      sublabel: `${statusCounts.sample + statusCounts.results} awaiting results`,
      icon: Activity
    },
    {
      label: 'Completed Reports',
      value: statusCounts.completed,
      sublabel: `${statusCounts.results} ready to finalize`,
      icon: ShieldCheck
    },
    {
      label: 'Profiles in Use',
      value: profileCount,
      sublabel: `${totalVisits} total visits logged`,
      icon: Layers
    }
  ];

  // Load visits and patients from localStorage
  useEffect(() => {
    const allVisits = getVisits();
    const allPatients = getPatients();
    setVisits(allVisits);
    setPatients(allPatients);
  }, []);

  // Get patient info for a visit
  const getPatientForVisit = (visit) => {
    return patients.find(p => p.patientId === visit.patientId);
  };

  const filteredVisits = visits.filter(visit => {
    const patient = getPatientForVisit(visit);
    if (!patient) return false;
    
    return patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           patient.phone.includes(searchTerm);
  });

  return (
    <div className="patients-page">
      <Card title="All Patients" className="patients-card">
        <div className="patients-hero">
          <div className="hero-text">
            <p className="eyebrow">Patient Management</p>
            <h1>Patient Directory</h1>
            <p>Monitor registrations, samples, and completed reports in one place.</p>
          </div>
          <div className="hero-actions">
            <div className="hero-stat">
              <span>Total Visits</span>
              <strong>{totalVisits}</strong>
            </div>
            <Button onClick={() => navigate('/patients/add-patient')} icon={Plus}>
              Add New Patient
            </Button>
          </div>
        </div>

        <div className="patients-stats-grid">
          {summaryCards.map(({ label, value, sublabel, icon: Icon }) => (
            <div key={label} className="stat-card">
              <div className="stat-icon">
                <Icon size={18} />
              </div>
              <div>
                <p className="stat-label">{label}</p>
                <div className="stat-value-row">
                  <strong>{value}</strong>
                </div>
                <p className="stat-sublabel">{sublabel}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="filters-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="status-legend">
            <span className="status-pill status-registered">Registered</span>
            <span className="status-pill status-sample">Sample Collected</span>
            <span className="status-pill status-results">Results Entered</span>
            <span className="status-pill status-completed">Completed</span>
          </div>
        </div>

        {filteredVisits.length === 0 ? (
          <div className="empty-state">
            <User size={64} className="empty-icon" />
            <h3>No visits found</h3>
            <p>Add your first patient to get started</p>
            <Button onClick={() => navigate('/patients/add-patient')} icon={Plus} variant="primary">
              Add Patient
            </Button>
          </div>
        ) : (
          <div className="patients-table">
            <table>
              <thead>
                <tr>
                  <th><User size={16} /> Patient Name</th>
                  <th><Calendar size={16} /> Age/Gender</th>
                  <th><Phone size={16} /> Phone</th>
                  <th>Test Profile</th>
                  <th><Calendar size={16} /> Visit Date</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map((visit) => {
                  const patient = getPatientForVisit(visit);
                  if (!patient) return null;
                  
                  const profile = visit.profileId ? getProfileById(visit.profileId) : null;
                  
                  // Determine visit status
                  let statusText = 'Registered';
                  let statusClass = 'status-registered';
                  
                  if (visit.status === 'report_generated') {
                    statusText = 'Completed';
                    statusClass = 'status-completed';
                  } else if (visit.status === 'results_entered') {
                    statusText = 'Results Entered';
                    statusClass = 'status-results';
                  } else if (visit.status === 'sample_times_set') {
                    statusText = 'Sample Collected';
                    statusClass = 'status-sample';
                  }
                  
                  return (
                    <tr key={visit.visitId}>
                      <td className="patient-name">
                        <div className="name-cell">
                          <div className="avatar">{patient.name.charAt(0).toUpperCase()}</div>
                          <span>{patient.name}</span>
                        </div>
                      </td>
                      <td>{patient.age} yrs / {patient.gender}</td>
                      <td className="phone-cell">{patient.phone}</td>
                      <td className="profile-cell">
                        <span className="profile-tag">{profile?.name || 'N/A'}</span>
                      </td>
                      <td>{new Date(visit.createdAt).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}</td>
                      <td className="text-center">
                        <span className={`status-badge ${statusClass}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="text-center">
                        <Button 
                          size="small" 
                          variant="outline"
                          icon={Eye}
                          onClick={() => {
                            const targetId = visit.visitId || visit.id;
                            if (targetId) {
                              navigate(`/patients/${targetId}`);
                            }
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Patients;
