import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { getProfiles } from '../../features/shared/dataService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';
import './ProfileManager.css';

const ProfileManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfiles, setSelectedProfiles] = useState([]);

  const editorBase = location.pathname.startsWith('/admin/profile-manager')
    ? '/admin/profile-manager'
    : '/profiles';

  useEffect(() => {
    setProfiles(getProfiles());
  }, [location.pathname]);

  const filteredProfiles = profiles.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteProfile = (profileId) => {
    if (!confirm('Are you sure you want to DELETE this profile permanently? This cannot be undone.')) return;

    try {
      const allProfiles = JSON.parse(localStorage.getItem('healit_profiles') || '[]');
      const updatedProfiles = allProfiles.filter((p) => p.profileId !== profileId);
      localStorage.setItem('healit_profiles', JSON.stringify(updatedProfiles));
      toast.success('Profile deleted successfully');
      setProfiles(getProfiles());
      setSelectedProfiles([]);
    } catch {
      toast.error('Failed to delete profile');
    }
  };

  const handleDeleteSelected = () => {
    if (selectedProfiles.length === 0) {
      toast.error('No profiles selected');
      return;
    }

    if (!confirm(`Delete ${selectedProfiles.length} selected profile(s)? This cannot be undone.`)) return;

    try {
      const allProfiles = JSON.parse(localStorage.getItem('healit_profiles') || '[]');
      const updatedProfiles = allProfiles.filter((p) => !selectedProfiles.includes(p.profileId));
      localStorage.setItem('healit_profiles', JSON.stringify(updatedProfiles));
      toast.success(`${selectedProfiles.length} profile(s) deleted successfully`);
      setSelectedProfiles([]);
      setProfiles(getProfiles());
    } catch {
      toast.error('Failed to delete profiles');
    }
  };

  const toggleSelectProfile = (profileId) => {
    setSelectedProfiles((prev) =>
      prev.includes(profileId) ? prev.filter((id) => id !== profileId) : [...prev, profileId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProfiles.length === filteredProfiles.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(filteredProfiles.map((p) => p.profileId));
    }
  };

  return (
    <div className="profile-manager-page">
      <div className="page-header">
        <div>
          <h1>Profile Manager</h1>
          <p className="subtitle">Create and manage test profile packages</p>
        </div>
        <Button icon={Plus} onClick={() => navigate(`${editorBase}/new`)}>
          Add New Profile
        </Button>
      </div>

      <Card className="filters-card">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bulk-actions">
          {filteredProfiles.length > 0 && (
            <>
              <Button variant="outline" size="small" onClick={toggleSelectAll}>
                {selectedProfiles.length === filteredProfiles.length ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedProfiles.length > 0 && (
                <Button variant="danger" size="small" icon={Trash2} onClick={handleDeleteSelected}>
                  Delete Selected ({selectedProfiles.length})
                </Button>
              )}
            </>
          )}
        </div>
      </Card>

      <div className="profiles-grid">
        {filteredProfiles.map((profile) => (
          <Card
            key={profile.profileId}
            className={`profile-card ${selectedProfiles.includes(profile.profileId) ? 'selected' : ''}`}
          >
            <div className="profile-card-header">
              <input
                type="checkbox"
                checked={selectedProfiles.includes(profile.profileId)}
                onChange={() => toggleSelectProfile(profile.profileId)}
                className="profile-checkbox"
              />
              <div className="profile-icon">
                <Package size={24} />
              </div>
              <div className="profile-info">
                <h3>{profile.name}</h3>
                {profile.description && <p className="profile-desc">{profile.description}</p>}
                {profile.createdByName && (
                  <p className="profile-creator">
                    Created by {profile.createdByName} ({profile.createdByRole || 'admin'})
                  </p>
                )}
              </div>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">Tests</span>
                <span className="stat-value">{profile.tests?.length || profile.testIds?.length || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Package Price</span>
                <span className="stat-value">₹{profile.packagePrice || 0}</span>
              </div>
            </div>

            <div className="profile-actions">
              <Button
                variant="outline"
                size="small"
                icon={Edit2}
                onClick={() => navigate(`${editorBase}/edit/${profile.profileId}`)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="small"
                icon={Trash2}
                onClick={() => handleDeleteProfile(profile.profileId)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProfileManager;
