import React, { useState } from 'react';
import { Plus, Trash2, Save, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { PROFILES, getAllProfiles, getProfileById } from '../../data/testMaster';
import { TEST_MASTER } from '../../data/testMaster';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './ProfileManager.css';

const ProfileManager = () => {
  const [profiles] = useState(getAllProfiles());
  const [selectedProfile, setSelectedProfile] = useState(profiles[0]?.id || null);
  const [profileTests, setProfileTests] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);

  React.useEffect(() => {
    if (selectedProfile) {
      const profile = getProfileById(selectedProfile);
      const testIds = PROFILES[selectedProfile] || [];
      const tests = testIds.map(id => TEST_MASTER.find(t => t.id === id)).filter(Boolean);
      setProfileTests(tests);

      // Available tests = all tests not in this profile
      const available = TEST_MASTER.filter(t => !testIds.includes(t.id) && t.active);
      setAvailableTests(available);
    }
  }, [selectedProfile]);

  const handleAddTest = (test) => {
    const newTests = [...profileTests, test];
    setProfileTests(newTests);
    setAvailableTests(availableTests.filter(t => t.id !== test.id));
    
    // Update PROFILES object (in real app, this would save to backend/store)
    PROFILES[selectedProfile] = newTests.map(t => t.id);
    toast.success(`${test.name} added to profile`);
  };

  const handleRemoveTest = (testId) => {
    const test = profileTests.find(t => t.id === testId);
    setProfileTests(profileTests.filter(t => t.id !== testId));
    setAvailableTests([...availableTests, test]);
    
    PROFILES[selectedProfile] = profileTests.filter(t => t.id !== testId).map(t => t.id);
    toast.success(`${test.name} removed from profile`);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newTests = [...profileTests];
    [newTests[index - 1], newTests[index]] = [newTests[index], newTests[index - 1]];
    setProfileTests(newTests);
    PROFILES[selectedProfile] = newTests.map(t => t.id);
    toast.success('Test order updated');
  };

  const handleMoveDown = (index) => {
    if (index === profileTests.length - 1) return;
    const newTests = [...profileTests];
    [newTests[index], newTests[index + 1]] = [newTests[index + 1], newTests[index]];
    setProfileTests(newTests);
    PROFILES[selectedProfile] = newTests.map(t => t.id);
    toast.success('Test order updated');
  };

  const currentProfile = getProfileById(selectedProfile);

  return (
    <div className="profile-manager-page">
      <div className="page-header">
        <div>
          <h1>Profile Manager</h1>
          <p>Manage test profiles and ordering</p>
        </div>
      </div>

      <div className="profile-selector">
        <Card title="Select Profile">
          <div className="profile-grid">
            {profiles.map(profile => (
              <div
                key={profile.id}
                className={`profile-card ${selectedProfile === profile.id ? 'selected' : ''}`}
                onClick={() => setSelectedProfile(profile.id)}
              >
                <h3>{profile.name}</h3>
                <p>{profile.shortName}</p>
                <span className="test-count">{PROFILES[profile.id]?.length || 0} tests</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {selectedProfile && (
        <div className="profile-content">
          <div className="profile-tests">
            <Card title={`Tests in ${currentProfile.name}`}>
              {profileTests.length === 0 ? (
                <div className="empty-state">
                  <p>No tests in this profile yet</p>
                </div>
              ) : (
                <div className="tests-list">
                  {profileTests.map((test, index) => (
                    <div key={test.id} className="test-item">
                      <div className="test-info">
                        <div className="test-order">{index + 1}</div>
                        <div>
                          <h4>{test.name}</h4>
                          <p>{test.unit} • {test.referenceText}</p>
                        </div>
                      </div>
                      <div className="test-actions">
                        <button
                          className="btn-icon"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === profileTests.length - 1}
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          className="btn-icon danger"
                          onClick={() => handleRemoveTest(test.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="available-tests">
            <Card title="Available Tests">
              {availableTests.length === 0 ? (
                <div className="empty-state">
                  <p>All active tests are already in this profile</p>
                </div>
              ) : (
                <div className="tests-list">
                  {availableTests.map(test => (
                    <div key={test.id} className="test-item">
                      <div className="test-info">
                        <div>
                          <h4>{test.name}</h4>
                          <p>{test.category} • {test.unit}</p>
                        </div>
                      </div>
                      <button
                        className="btn-icon success"
                        onClick={() => handleAddTest(test)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManager;
