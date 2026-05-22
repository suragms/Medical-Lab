import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Upload, Eye, UserCog, CheckCircle, XCircle } from 'lucide-react';
import { 
  getTechnicians, 
  createTechnician, 
  updateTechnician, 
  deactivateTechnician,
  uploadSignature,
  getUsers
} from '../../services/authService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';
import './TechniciansPage.css';

const TechniciansPage = () => {
  const [technicians, setTechnicians] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(null);
  const [editingTech, setEditingTech] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    qualification: '',
    userId: '',
    signatureLeftFile: null,
    signatureLeftUrl: null,
    signatureRightFile: null,
    signatureRightUrl: null
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTechnicians(getTechnicians());
    setUsers(getUsers().filter(u => u.role === 'staff' && u.isActive));
  };

  const handleFileChange = async (e, position) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const base64Url = await uploadSignature(file);
      if (position === 'left') {
        setFormData(prev => ({
          ...prev,
          signatureLeftFile: file,
          signatureLeftUrl: base64Url
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          signatureRightFile: file,
          signatureRightUrl: base64Url
        }));
      }
      toast.success(`${position === 'left' ? 'Left' : 'Right'} signature uploaded successfully`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.qualification) {
      toast.error('Name and qualification are required');
      return;
    }

    try {
      if (editingTech) {
        updateTechnician(editingTech.technicianId, {
          name: formData.name,
          qualification: formData.qualification,
          userId: formData.userId || null,
          signatureLeftUrl: formData.signatureLeftUrl,
          signatureRightUrl: formData.signatureRightUrl
        });
        toast.success('Technician updated successfully');
      } else {
        createTechnician({
          name: formData.name,
          qualification: formData.qualification,
          userId: formData.userId || null,
          signatureLeftUrl: formData.signatureLeftUrl,
          signatureRightUrl: formData.signatureRightUrl
        });
        toast.success('Technician created successfully');
      }

      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (tech) => {
    setEditingTech(tech);
    setFormData({
      name: tech.name,
      qualification: tech.qualification,
      userId: tech.userId || '',
      signatureLeftFile: null,
      signatureLeftUrl: tech.signatureLeftUrl || null,
      signatureRightFile: null,
      signatureRightUrl: tech.signatureRightUrl || null
    });
    setShowModal(true);
  };

  const handleDeactivate = async (techId) => {
    if (!confirm('Are you sure you want to deactivate this technician?')) return;

    try {
      deactivateTechnician(techId);
      toast.success('Technician deactivated');
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      qualification: '',
      userId: '',
      signatureLeftFile: null,
      signatureLeftUrl: null,
      signatureRightFile: null,
      signatureRightUrl: null
    });
    setEditingTech(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="technicians-page">
      <div className="page-header">
        <div>
          <h1>Technicians Management</h1>
          <p className="subtitle">Manage lab technicians and their digital signatures</p>
        </div>
        <Button 
          variant="primary" 
          icon={Plus}
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Add Technician
        </Button>
      </div>

      <Card>
        <div className="technicians-table-wrapper">
          <table className="technicians-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Qualification</th>
                <th>Linked User</th>
                <th>Signature</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {technicians.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    <UserCog size={48} color="var(--text-tertiary)" />
                    <p>No technicians found</p>
                    <Button onClick={() => setShowModal(true)} variant="outline">
                      Add First Technician
                    </Button>
                  </td>
                </tr>
              ) : (
                technicians.map((tech) => {
                  const linkedUser = tech.userId ? users.find(u => u.userId === tech.userId) : null;
                  return (
                    <tr key={tech.technicianId} className={!tech.isActive ? 'inactive' : ''}>
                      <td>
                        <div className="tech-avatar">
                          {tech.name.charAt(0).toUpperCase()}
                        </div>
                      </td>
                      <td>
                        <strong>{tech.name}</strong>
                      </td>
                      <td>{tech.qualification}</td>
                      <td>
                        {linkedUser ? (
                          <span className="linked-user">{linkedUser.email}</span>
                        ) : (
                          <span className="no-link">Not linked</span>
                        )}
                      </td>
                      <td>
                        {tech.signatureUrl ? (
                          <div className="signature-preview-cell">
                            <img 
                              src={tech.signatureUrl} 
                              alt="Signature" 
                              className="signature-thumbnail"
                            />
                            <Button 
                              variant="ghost" 
                              size="sm"
                              icon={Eye}
                              onClick={() => setShowPreview(tech.signatureUrl)}
                            >
                              View
                            </Button>
                          </div>
                        ) : (
                          <span className="no-signature">No signature</span>
                        )}
                      </td>
                      <td>
                        {tech.isActive ? (
                          <span className="status-badge active">
                            <CheckCircle size={14} />
                            Active
                          </span>
                        ) : (
                          <span className="status-badge inactive">
                            <XCircle size={14} />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            icon={Edit2}
                            onClick={() => handleEdit(tech)}
                          />
                          {tech.isActive && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              icon={Trash2}
                              onClick={() => handleDeactivate(tech.technicianId)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content tech-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTech ? 'Edit Technician' : 'Add New Technician'}</h2>
              <button onClick={handleCloseModal} className="close-button">×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  placeholder="e.g., Dr. John Smith"
                  required
                />
              </div>

              <div className="form-group">
                <label>Qualification *</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                  className="form-input"
                  placeholder="e.g., Lab Technician, DMLT"
                  required
                />
              </div>

              <div className="form-group">
                <label>Link to User Account (Optional)</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                  className="form-input"
                >
                  <option value="">No linked user</option>
                  {users.map(user => (
                    <option key={user.userId} value={user.userId}>
                      {user.fullName} ({user.email})
                    </option>
                  ))}
                </select>
                <small className="help-text">Link to a staff user for auto-signature selection</small>
              </div>

              <div className="signature-section">
                <h3>Digital Signatures</h3>
                <p className="help-text">Upload left and right signatures for PDF reports</p>
                
                <div className="signature-uploads-grid">
                  {/* Left Signature */}
                  <div className="form-group">
                    <label>Left Signature</label>
                    <div className="signature-upload-area">
                      {formData.signatureLeftUrl ? (
                        <div className="signature-preview">
                          <img src={formData.signatureLeftUrl} alt="Left Signature" />
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, signatureLeftUrl: null, signatureLeftFile: null }))}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="upload-zone">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={(e) => handleFileChange(e, 'left')}
                            id="signature-left-upload"
                            className="file-input"
                          />
                          <label htmlFor="signature-left-upload" className="upload-label">
                            <Upload size={32} />
                            <span>{uploading ? 'Uploading...' : 'Upload Left Signature'}</span>
                            <small>PNG or JPEG, max 2MB</small>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Signature */}
                  <div className="form-group">
                    <label>Right Signature</label>
                    <div className="signature-upload-area">
                      {formData.signatureRightUrl ? (
                        <div className="signature-preview">
                          <img src={formData.signatureRightUrl} alt="Right Signature" />
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, signatureRightUrl: null, signatureRightFile: null }))}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="upload-zone">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={(e) => handleFileChange(e, 'right')}
                            id="signature-right-upload"
                            className="file-input"
                          />
                          <label htmlFor="signature-right-upload" className="upload-label">
                            <Upload size={32} />
                            <span>{uploading ? 'Uploading...' : 'Upload Right Signature'}</span>
                            <small>PNG or JPEG, max 2MB</small>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={uploading}>
                  {editingTech ? 'Update' : 'Create'} Technician
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signature Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Signature Preview</h3>
              <button onClick={() => setShowPreview(null)} className="close-button">×</button>
            </div>
            <div className="preview-content">
              <img src={showPreview} alt="Signature" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechniciansPage;
