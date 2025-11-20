import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileSignature, Shield, Palette, TestTube, DollarSign,
  Bell, Database, Settings as SettingsIcon, AlertCircle, Plus, Edit,
  Trash2, Upload, Download, Eye, EyeOff, Save, Check
} from 'lucide-react';
import { useAuthStore } from '../../../store';
import { getCurrentUser, getUsers, addUser, updateUser, deleteUser, adminResetPassword } from '../../../services/authService';
import { getSettings, updateSettings } from '../../../services/settingsService';
import Button from '../../../components/ui/Button';
import DataSync from '../../../components/DataSync/DataSync';
import toast from 'react-hot-toast';
import './AdminSettings.css';

const AdminSettings = () => {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const currentUser = getCurrentUser();
  
  // State (MUST be before conditional return - React Hooks Rules)
  const [activeTab, setActiveTab] = useState('staff');
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Staff form
  const [staffForm, setStaffForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'staff',
    password: '',
    isActive: true
  });
  
  // Load data
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = () => {
    setUsers(getUsers());
    setSettings(getSettings());
  };
  
  // Permission check - Admin only (AFTER all hooks)
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
  
  // Staff Management Handlers
  const handleAddStaff = () => {
    if (!staffForm.username || !staffForm.fullName || !staffForm.email || !staffForm.password) {
      toast.error('Username, name, email, and password are required');
      return;
    }
    
    try {
      const newUser = {
        ...staffForm,
        userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        qualification: staffForm.role === 'staff' ? 'Lab Technician' : 'Administrator',
        signatureUrl: null,
        createdAt: new Date().toISOString()
      };
      
      addUser(newUser);
      toast.success('Staff added successfully');
      resetStaffForm();
      loadData();
    } catch (error) {
      toast.error('Failed to add staff: ' + error.message);
    }
  };
  
  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        deleteUser(userId);
        toast.success('User deleted');
        loadData();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };
  
  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };
  
  const handleSaveNewPassword = () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      adminResetPassword(selectedUser.userId, newPassword);
      toast.success(`Password reset successfully for ${selectedUser.fullName}`);
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
      loadData();
    } catch (error) {
      toast.error('Failed to reset password: ' + error.message);
    }
  };
  
  const resetStaffForm = () => {
    setStaffForm({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      role: 'staff',
      password: '',
      isActive: true
    });
  };
  
  // Settings Handlers
  const handleUpdateSettings = (key, value) => {
    try {
      updateSettings({ [key]: value });
      setSettings({ ...settings, [key]: value });
      toast.success('Settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };
  
  const handleToggleSetting = (key) => {
    const newValue = !settings[key];
    handleUpdateSettings(key, newValue);
  };
  
  // Export handlers
  const handleExport = (type) => {
    toast.success(`Exporting ${type}... (Feature coming soon)`);
  };
  
  // Clear all data handler (DISABLED for Firestore - use Firebase Console)
  const handleClearAllData = () => {
    toast.error('⚠️ Data clearing is disabled in cloud mode. Please use Firebase Console to manage data.');
  };
  
  if (!settings) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }
  
  return (
    <div className="admin-settings-page">
      {/* Page Header */}
      <div className="page-header-settings">
        <div>
          <h1>Admin Settings</h1>
          <p className="subtitle">Configure lab system, staff, branding, and advanced controls</p>
        </div>
      </div>

      {/* Two-Column Layout: Sidebar Tabs + Content */}
      <div className="settings-layout">
        {/* Left Sidebar - Vertical Tabs */}
        <div className="settings-sidebar">
          <button
            className={`sidebar-tab ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            <Users size={20} />
            <span>Staff Management</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'technicians' ? 'active' : ''}`}
            onClick={() => setActiveTab('technicians')}
          >
            <FileSignature size={20} />
            <span>Technician Signatures</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'permissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            <Shield size={20} />
            <span>Roles & Permissions</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'branding' ? 'active' : ''}`}
            onClick={() => setActiveTab('branding')}
          >
            <Palette size={20} />
            <span>Lab Branding & PDF</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            <TestTube size={20} />
            <span>Tests & Profiles</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            <DollarSign size={20} />
            <span>Pricing & Billing</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={20} />
            <span>Notifications</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            <Database size={20} />
            <span>Data Backup</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            <SettingsIcon size={20} />
            <span>App Behavior</span>
          </button>
        </div>

        {/* Right Content Area */}
        <div className="settings-content">
          {/* TAB 1 - Staff Management */}
          {activeTab === 'staff' && (
            <div className="tab-panel">
              <div className="panel-header">
                <h2>Staff Management</h2>
                <p>Add, edit, or remove staff accounts</p>
              </div>

              {/* Add Staff Form */}
              <div className="card-settings">
                <h3>Add New Staff</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      value={staffForm.username}
                      onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                      placeholder="Unique username (lowercase)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={staffForm.fullName}
                      onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      placeholder="10-digit number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Role *</label>
                    <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      value={staffForm.password}
                      onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={staffForm.isActive}
                        onChange={(e) => setStaffForm({ ...staffForm, isActive: e.target.checked })}
                      />
                      Active
                    </label>
                  </div>
                </div>
                <div className="form-actions">
                  <Button variant="outline" onClick={resetStaffForm}>Clear</Button>
                  <Button variant="primary" onClick={handleAddStaff}>
                    <Plus size={18} />
                    Add Staff
                  </Button>
                </div>
              </div>

              {/* Staff Table */}
              <div className="card-settings">
                <h3>Existing Staff</h3>
                <div className="table-wrapper">
                  <table className="settings-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.userId}>
                          <td><strong>{user.username || '-'}</strong></td>
                          <td>{user.fullName}</td>
                          <td>{user.email}</td>
                          <td>{user.phone || '—'}</td>
                          <td>
                            <span className={`role-badge ${user.role}`}>{user.role}</span>
                          </td>
                          <td>
                            <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-icon" onClick={() => handleResetPassword(user)} title="Reset Password">
                                <Eye size={16} />
                              </button>
                              <button className="btn-icon btn-delete" onClick={() => handleDeleteUser(user.userId)} title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2 - Technician Signatures */}
          {activeTab === 'technicians' && (
            <div className="tab-panel">
              <div className="panel-header">
                <h2>Technician Signatures</h2>
                <p>Manage technicians and their digital signatures for PDF reports</p>
              </div>
              <div className="card-settings">
                <p className="info-message">
                  <AlertCircle size={18} />
                  Technician management is available in the separate Technicians page. Click below to navigate.
                </p>
                <Button variant="primary" onClick={() => navigate('/settings/technicians')}>
                  Go to Technicians Management
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3 - Roles & Permissions */}
          {activeTab === 'permissions' && (
            <div className="tab-panel">
              <div className="panel-header">
                <h2>Roles & Permissions</h2>
                <p>Control what staff can and cannot do</p>
              </div>

              <div className="card-settings">
                <h3>Staff Permissions</h3>
                <div className="permissions-list">
                  <div className="permission-item">
                    <div className="permission-info">
                      <strong>Allow Staff to Edit Price</strong>
                      <p>Staff can modify test prices during patient registration</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.allowStaffEditPrice || false}
                        onChange={() => handleToggleSetting('allowStaffEditPrice')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="permission-item">
                    <div className="permission-info">
                      <strong>Allow Staff to Apply Discount</strong>
                      <p>Staff can apply discounts to patient bills</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.allowStaffEditDiscount || false}
                        onChange={() => handleToggleSetting('allowStaffEditDiscount')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="permission-item">
                    <div className="permission-info">
                      <strong>Allow Manual Test Addition</strong>
                      <p>Staff can create custom tests on-the-fly</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.allowManualTests || false}
                        onChange={() => handleToggleSetting('allowManualTests')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="permission-item">
                    <div className="permission-info">
                      <strong>Allow PDF Re-generation</strong>
                      <p>Staff can regenerate PDFs after initial creation</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.allowPDFRegeneration || false}
                        onChange={() => handleToggleSetting('allowPDFRegeneration')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="permission-item">
                    <div className="permission-info">
                      <strong>Allow Partial Reports</strong>
                      <p>Generate PDF even if not all results are entered</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.allowPartialReports || false}
                        onChange={() => handleToggleSetting('allowPartialReports')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4 - Lab Branding & PDF Settings */}
          {activeTab === 'branding' && (
            <div className="tab-panel">
              <div className="panel-header">
                <h2>Lab Branding & PDF Settings</h2>
                <p>Customize lab identity and PDF appearance</p>
              </div>

              <div className="card-settings">
                <h3>Lab Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Lab Name</label>
                    <input
                      type="text"
                      defaultValue={settings.labName || 'HEALit Med Laboratories'}
                      onBlur={(e) => handleUpdateSettings('labName', e.target.value)}
                      placeholder="Lab Name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Lab Address</label>
                    <textarea
                      defaultValue={settings.labAddress || 'Thrissur, Kerala'}
                      onBlur={(e) => handleUpdateSettings('labAddress', e.target.value)}
                      placeholder="Full address"
                      rows="2"
                    />
                  </div>
                  <div className="form-group">
                    <label>Lab Phone</label>
                    <input
                      type="tel"
                      defaultValue={settings.labPhone || ''}
                      onBlur={(e) => handleUpdateSettings('labPhone', e.target.value)}
                      placeholder="Contact number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Lab Email</label>
                    <input
                      type="email"
                      defaultValue={settings.labEmail || ''}
                      onBlur={(e) => handleUpdateSettings('labEmail', e.target.value)}
                      placeholder="contact@lab.com"
                    />
                  </div>
                </div>
              </div>

              <div className="card-settings">
                <h3>PDF Settings</h3>
                <div className="permissions-list">
                  <div className="permission-item">
                    <div className="permission-info">
                      <strong>Show Partner Logo</strong>
                      <p>Display partner/franchise logo in PDF header</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.showPartnerLogo || true}
                        onChange={() => handleToggleSetting('showPartnerLogo')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="permission-item">
                    <div className="permission-info">
                      <strong>Show Test Prices in Result PDF</strong>
                      <p>Display individual test prices in result report</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.showPriceInResultPDF || false}
                        onChange={() => handleToggleSetting('showPriceInResultPDF')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="permission-item">
                    <div className="permission-info">
                      <strong>Show Signature Block</strong>
                      <p>Include technician signature in PDFs</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.showSignatureBlock !== false}
                        onChange={() => handleToggleSetting('showSignatureBlock')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5 - Tests & Profiles */}
          {activeTab === 'tests' && (
            <div className="tab-panel">
              <div className="panel-header">
                <h2>Tests & Profiles Settings</h2>
                <p>Manage test master and profile configurations</p>
              </div>
              <div className="card-settings">
                <p className="info-message">
                  <AlertCircle size={18} />
                  Test and Profile management is available in the respective management pages.
                </p>
                <div className="button-grid">
                  <Button variant="primary" onClick={() => navigate('/profiles')}>
                    Manage Tests
                  </Button>
                  <Button variant="primary" onClick={() => navigate('/profiles')}>
                    Manage Profiles
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6 - Pricing & Billing */}
          {activeTab === 'billing' && (
            <div className="tab-panel">
              <div className="panel-header">
                <h2>Pricing & Billing Rules</h2>
                <p>Configure pricing, discounts, and invoicing</p>
              </div>

              <div className="card-settings">
                <h3>Billing Configuration</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Default Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={settings.defaultDiscount || 0}
                      onBlur={(e) => handleUpdateSettings('defaultDiscount', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tax Name</label>
                    <input
                      type="text"
                      defaultValue={settings.taxName || 'GST'}
                      onBlur={(e) => handleUpdateSettings('taxName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tax Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="18"
                      step="0.1"
                      defaultValue={settings.taxPercentage || 0}
                      onBlur={(e) => handleUpdateSettings('taxPercentage', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Invoice Prefix</label>
                    <input
                      type="text"
                      defaultValue={settings.invoicePrefix || 'HEALIT-'}
                      onBlur={(e) => handleUpdateSettings('invoicePrefix', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7 - Notifications */}
          {activeTab === 'notifications' && (
            <div className="tab-panel">
              <div className="panel-header">
                <h2>Notifications & Reminders</h2>
                <p>Configure alerts and notification preferences</p>
              </div>

              <div className="card-settings">
                <h3>Notification Channels</h3>
                <div className="permissions-list">
                  <div className="permission-item">
                    <div className="permission-info">
                      <strong>Email Notifications</strong>
                      <p>Send email alerts for important events</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.enableEmailNotifications || false}
                        onChange={() => handleToggleSetting('enableEmailNotifications')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="permission-item">
                    <div className="permission-info">
                      <strong>WhatsApp Notifications</strong>
                      <p>Send WhatsApp alerts (requires API integration)</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.enableWhatsAppNotifications || false}
                        onChange={() => handleToggleSetting('enableWhatsAppNotifications')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="card-settings">
                <p className="info-message">
                  <AlertCircle size={18} />
                  Manage reminders in the Financial Management section.
                </p>
                <Button variant="primary" onClick={() => navigate('/financial')}>
                  Go to Financial Management
                </Button>
              </div>
            </div>
          )}

          {/* TAB 8 - Data Backup & Sync */}
          {activeTab === 'backup' && (
            <div className="tab-panel">
              <DataSync />
              
              {/* Danger Zone - Keep Clear All Data */}
              <div className="card-settings" style={{marginTop: '32px'}}>
                <h3 style={{color: '#DC2626'}}>Danger Zone</h3>
                <div className="alert-box-danger">
                  <AlertCircle size={20} />
                  <div>
                    <strong>Clear All Data</strong>
                    <p>Permanently delete all patient records, visits, test results, invoices, and financial data. This action cannot be undone!</p>
                  </div>
                </div>
                <Button 
                  variant="primary" 
                  onClick={handleClearAllData}
                  style={{background: '#DC2626', borderColor: '#DC2626'}}
                >
                  <Trash2 size={18} />
                  Clear All Data & Start Fresh
                </Button>
              </div>
            </div>
          )}

          {/* TAB 9 - App Behavior */}
          {activeTab === 'advanced' && (
            <div className="tab-panel">
              <div className="panel-header">
                <h2>App Behavior & Advanced Settings</h2>
                <p>Configure advanced system behavior</p>
              </div>

              <div className="card-settings">
                <h3>System Settings</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Auto-save Frequency (seconds)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      defaultValue={settings.autosaveFrequency || 2}
                      onBlur={(e) => handleUpdateSettings('autosaveFrequency', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Session Timeout (minutes)</label>
                    <input
                      type="number"
                      min="15"
                      max="480"
                      defaultValue={settings.sessionTimeout || 60}
                      onBlur={(e) => handleUpdateSettings('sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="permissions-list">
                  <div className="permission-item">
                    <div className="permission-info">
                      <strong>Lock Snapshot After PDF</strong>
                      <p>Prevent editing test details after report generation</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.lockSnapshotAfterPDF !== false}
                        onChange={() => handleToggleSetting('lockSnapshotAfterPDF')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="permission-item">
                    <div className="permission-info">
                      <strong>Enable Dark Mode</strong>
                      <p>System-wide dark theme (Coming soon)</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.darkMode || false}
                        onChange={() => handleToggleSetting('darkMode')}
                        disabled
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="permission-item">
                    <div className="permission-info">
                      <strong>Allow Manual Reported Time</strong>
                      <p>Admin can manually set report generation time</p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.allowManualReportedTime || false}
                        onChange={() => handleToggleSetting('allowManualReportedTime')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Reset Password</h3>
            <p>User: <strong>{selectedUser.fullName}</strong> (@{selectedUser.username})</p>
            <p className="help-text">Enter a new password for this user (minimum 6 characters)</p>
            <div className="form-group">
              <label>New Password *</label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <Button variant="outline" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveNewPassword}>
                <Save size={18} />
                Reset Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
