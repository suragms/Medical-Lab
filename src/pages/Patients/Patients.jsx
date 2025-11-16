import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { usePatientStore } from '../../store';
import { getProfileById } from '../../data/testMaster';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Patients.css';

const Patients = () => {
  const navigate = useNavigate();
  const { patients } = usePatientStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  return (
    <div className="patients-page">
      <Card
        title="All Patients"
        actions={
          <Button onClick={() => navigate('/patients/add')} icon={Plus}>
            Add Patient
          </Button>
        }
      >
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredPatients.length === 0 ? (
          <div className="empty-state">
            <p>No patients found</p>
          </div>
        ) : (
          <div className="patients-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age/Gender</th>
                  <th>Phone</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => {
                  const profile = getProfileById(patient.testProfile);
                  return (
                    <tr key={patient.id} onClick={() => navigate(`/patients/${patient.id}`)}>
                      <td>{patient.name}</td>
                      <td>{patient.age} / {patient.gender}</td>
                      <td>{patient.phone}</td>
                      <td>{new Date(patient.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Button size="small" onClick={() => navigate(`/patients/${patient.id}`)}>
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
