import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Calendar, Phone, User } from 'lucide-react';
import { getVisits, getPatients, getProfileById } from '../../features/shared/dataService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Patients.css';

const Patients = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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
      <Card
        title="All Patients"
        actions={
          <Button onClick={() => navigate('/patients/add-patient')} icon={Plus}>
            Add New Patient
          </Button>
        }
      >
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
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
