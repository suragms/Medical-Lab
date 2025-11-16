import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePatientStore, useAuthStore } from '../../store';
import { getTestsByProfile, getProfileById, validateTestValue, getReferenceRange, TEST_TYPES } from '../../data/testMaster';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './EnterResults.css';

const EnterResults = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { getPatientById, updatePatient } = usePatientStore();
  const { user } = useAuthStore();
  
  const patient = getPatientById(patientId);
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState({});
  const [validations, setValidations] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (patient && patient.testProfile) {
      const profileTests = getTestsByProfile(patient.testProfile);
      setTests(profileTests);
      
      // Initialize results
      const initialResults = {};
      profileTests.forEach(test => {
        initialResults[test.id] = patient.results?.[test.id] || '';
      });
      setResults(initialResults);
    }
  }, [patient]);

  // Auto-save every 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(results).length > 0) {
        handleAutoSave();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [results]);

  const handleAutoSave = () => {
    if (!patient) return;
    
    updatePatient(patient.id, {
      results: results,
      lastModified: new Date().toISOString(),
      modifiedBy: user?.name || 'Staff'
    });
  };

  const handleValueChange = (testId, value) => {
    setResults(prev => ({ ...prev, [testId]: value }));
    
    // Validate value
    const test = tests.find(t => t.id === testId);
    if (test) {
      const validation = validateTestValue(test, value, patient.gender);
      setValidations(prev => ({ ...prev, [testId]: validation }));
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Create result snapshot
    const snapshot = tests.map(test => ({
      testId: test.id,
      testName: test.name,
      value: results[test.id] || '',
      unit: test.unit,
      referenceRange: getReferenceRange(test, patient.gender),
      validation: validations[test.id],
      category: test.category,
      type: test.type,
      order: test.order
    }));

    updatePatient(patient.id, {
      results: results,
      resultSnapshot: snapshot,
      status: 'results_entered',
      resultEnteredAt: new Date().toISOString(),
      resultEnteredBy: user?.name || 'Staff'
    });

    toast.success('Results saved successfully!');
    setIsSaving(false);
  };

  const handleGeneratePDF = () => {
    handleSave();
    
    updatePatient(patient.id, {
      status: 'completed',
      reportedAt: new Date().toISOString(),
      reportedBy: user?.name || 'Staff'
    });

    toast.success('Report generated!');
    navigate(`/patients/${patient.id}`);
  };

  const getStatusColor = (validation) => {
    if (!validation) return 'black';
    if (validation.status === 'HIGH') return '#c62828';
    if (validation.status === 'LOW') return '#1976d2';
    return 'black';
  };

  const renderInput = (test) => {
    const value = results[test.id] || '';
    
    switch (test.type) {
      case TEST_TYPES.NUMBER:
      case TEST_TYPES.MICROSCOPY_NUMBER:
        return (
          <input
            type="number"
            step="any"
            value={value}
            onChange={(e) => handleValueChange(test.id, e.target.value)}
            placeholder="Enter value"
            className="result-input"
            style={{ color: getStatusColor(validations[test.id]) }}
          />
        );
      
      case TEST_TYPES.TEXT:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(test.id, e.target.value)}
            placeholder="Enter value"
            className="result-input"
          />
        );
      
      case TEST_TYPES.DROPDOWN:
        return (
          <select
            value={value}
            onChange={(e) => handleValueChange(test.id, e.target.value)}
            className="result-input"
          >
            <option value="">Select</option>
            {test.dropdownOptions?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case TEST_TYPES.CALCULATED:
        // Auto-calculate based on formula
        return (
          <input
            type="text"
            value="Auto-calculated"
            disabled
            className="result-input calculated"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(test.id, e.target.value)}
            className="result-input"
          />
        );
    }
  };

  if (!patient) {
    return <div>Patient not found</div>;
  }

  const profile = getProfileById(patient.testProfile);

  return (
    <div className="enter-results-page">
      <div className="results-header">
        <Button variant="ghost" onClick={() => navigate('/patients')} icon={ArrowLeft}>
          Back
        </Button>
        <div className="patient-info-header">
          <h2>{patient.name}</h2>
          <p>{patient.age} years • {patient.gender} • {patient.phone}</p>
          <p className="profile-name">{profile?.name}</p>
        </div>
      </div>

      <Card title="Enter Test Results" className="results-card">
        <div className="results-table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Value</th>
                <th>Unit</th>
                <th>Reference Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => {
                const validation = validations[test.id];
                const refRange = getReferenceRange(test, patient.gender);
                
                return (
                  <tr key={test.id}>
                    <td className="test-name">{test.name}</td>
                    <td className="test-value">
                      {renderInput(test)}
                    </td>
                    <td className="test-unit">{test.unit}</td>
                    <td className="test-reference">{refRange}</td>
                    <td className="test-status">
                      {validation && validation.status !== 'NORMAL' && validation.status !== 'INVALID' && (
                        <span 
                          className={`status-badge ${validation.status.toLowerCase()}`}
                          style={{ color: getStatusColor(validation) }}
                        >
                          {validation.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="results-actions">
          <Button 
            onClick={handleSave} 
            variant="secondary"
            icon={Save}
            loading={isSaving}
          >
            Save Results
          </Button>
          <Button 
            onClick={handleGeneratePDF}
            variant="primary"
            icon={FileText}
          >
            Save & Generate PDF
          </Button>
        </div>

        <div className="auto-save-indicator">
          Auto-saving...
        </div>
      </Card>
    </div>
  );
};

export default EnterResults;
