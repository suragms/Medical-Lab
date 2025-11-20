import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Bell, FileSignature, Save, Upload } from 'lucide-react';
import { useAuthStore } from '../../store';
import { getCurrentUser, updateUser, changePassword } from '../../services/authService';
import { getSettings } from '../../services/firestoreService';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import './StaffSettings.css';

const StaffSettings = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const currentUser = getCurrentUser();
  const settings = getSettings();
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    qualification: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        qualification: currentUser.qualification || ''
      });
      if (currentUser.signatureUrl) {
        setSignaturePreview(currentUser.signatureUrl);
      }
    }
  }, [currentUser]);

  const handleProfileUpdate = () => {
    try {
      updateUser(currentUser.userId, profileData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordChange = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      changePassword(currentUser.userId, passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result);
        setSignatureFile(file);
        updateUser(currentUser.userId, { signatureUrl: reader.result });
        toast.success('Signature uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="staff-settings-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>My Settings</h1>
          <p className="subtitle">Manage your personal profile and preferences</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Profile Information */}
        <div className="settings-card">
          <div className="card-header">
            <User size={24} color="#2563EB" />
            <h3>Profile Information</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="your.email@example.com"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="10-digit number"
              />
            </div>
            <div className="form-group">
              <label>Qualification</label>
              <input
                type="text"
                value={profileData.qualification}
                onChange={(e) => setProfileData({ ...profileData, qualification: e.target.value })}
                placeholder="e.g., Lab Technician, MLT, B.Sc"
              />
            </div>
            <Button variant="primary" icon={Save} onClick={handleProfileUpdate}>
              Save Profile
            </Button>
          </div>
        </div>

        {/* Change Password */}
        <div className="settings-card">
          <div className="card-header">
            <Lock size={24} color="#2563EB" />
            <h3>Change Password</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
            <Button variant="primary" icon={Lock} onClick={handlePasswordChange}>
              Change Password
            </Button>
          </div>
        </div>

        {/* Signature Upload */}
        <div className="settings-card">
          <div className="card-header">
            <FileSignature size={24} color="#2563EB" />
            <h3>Digital Signature</h3>
          </div>
          <div className="card-body">
            <p className="help-text">
              Upload your digital signature to appear on PDF reports
            </p>
            {signaturePreview && (
              <div className="signature-preview">
                <img src={signaturePreview} alt="Signature" />
              </div>
            )}
            <div className="upload-area">
              <input
                type="file"
                id="signature-upload"
                accept="image/*"
                onChange={handleSignatureUpload}
                style={{ display: 'none' }}
              />
              <Button
                variant="outline"
                icon={Upload}
                onClick={() => document.getElementById('signature-upload').click()}
              >
                {signaturePreview ? 'Change Signature' : 'Upload Signature'}
              </Button>
            </div>
            <p className="hint-text">Recommended: PNG or JPG, transparent background</p>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="settings-card">
          <div className="card-header">
            <Bell size={24} color="#2563EB" />
            <h3>Notification Preferences</h3>
          </div>
          <div className="card-body">
            <div className="preference-item">
              <div className="preference-info">
                <strong>Email Notifications</strong>
                <p>Receive email alerts for new patient registrations</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="preference-item">
              <div className="preference-info">
                <strong>Result Reminders</strong>
                <p>Get notified about pending result entries</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="preference-item">
              <div className="preference-info">
                <strong>Sound Alerts</strong>
                <p>Play sound for important notifications</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffSettings;
