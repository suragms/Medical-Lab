import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePatientStore, useAuthStore } from '../../store';
import { getAllProfiles } from '../../data/testMaster';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const AddPatient = () => {
  const navigate = useNavigate();
  const { addPatient } = usePatientStore();
  const { user } = useAuthStore();
  const profiles = getAllProfiles();
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    address: '',
    referredBy: '',
    testProfile: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newPatient = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
      collectedAt: null,
      receivedAt: null,
      reportedAt: null,
      createdBy: user?.name || 'Staff',
      status: 'registered'
    };

    addPatient(newPatient);
    toast.success('Patient added successfully!');
    navigate(`/results/enter/${newPatient.id}`);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <Button variant="ghost" onClick={() => navigate('/patients')} icon={ArrowLeft} style={{ marginBottom: '1rem' }}>
        Back
      </Button>

      <Card title="Add New Patient">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Age *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone *</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Address</label>
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Test Profile *</label>
              <select
                name="testProfile"
                value={formData.testProfile}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}
              >
                <option value="">Select Profile</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} ({profile.shortName}) - ₹{profile.price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Referred By</label>
              <input
                name="referredBy"
                value={formData.referredBy}
                onChange={handleChange}
                placeholder="Doctor name (optional)"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}
              />
            </div>

            <Button type="submit" icon={Save} fullWidth>
              Save & Continue to Results
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddPatient;
