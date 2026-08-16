import { useState, useEffect } from 'react';
import apiRequest from '../../lib/apiRequest';
import toast from 'react-hot-toast';
import { FiUpload, FiSave } from 'react-icons/fi';
import './AdminSettings.scss';

function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    website: '',
    description: '',
    whatsappNumber: '',
    companyLogo: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetchingSettings(true);
      const res = await apiRequest.get('/company/settings');
      setFormData({
        companyName: res.data.companyName || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        city: res.data.city || '',
        state: res.data.state || '',
        pincode: res.data.pincode || '',
        website: res.data.website || '',
        description: res.data.description || '',
        whatsappNumber: res.data.whatsappNumber || '',
        companyLogo: res.data.companyLogo || ''
      });
    } catch (error) {
      console.error('Error:', error);
      // Settings might not exist yet, that's okay
    } finally {
      setFetchingSettings(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    const formDataLogo = new FormData();
    formDataLogo.append('logo', file);

    try {
      const res = await apiRequest.post('/company/upload-logo', formDataLogo, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData(prev => ({
        ...prev,
        companyLogo: res.data.logoUrl
      }));

      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiRequest.put('/company/settings', formData);
      toast.success('Settings updated successfully');
      // Reload to update sidebar logo
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingSettings) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-settings">
      <div className="page-header">
        <h1>Company Settings</h1>
        <p>Manage your company information</p>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-section">
          <h2>Company Logo</h2>
          
          <div className="logo-upload-section">
            {formData.companyLogo && (
              <div className="current-logo">
                <img 
                  src={`${window.location.origin}${formData.companyLogo}`}
                  alt="Company Logo"
                />
              </div>
            )}

            <div className="logo-upload">
              <input
                type="file"
                id="logo"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
              />
              <label htmlFor="logo" className="upload-label">
                <FiUpload />
                <span>{uploadingLogo ? 'Uploading...' : 'Upload New Logo'}</span>
                <small>Recommended: Square image, min 200x200px</small>
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              placeholder="Enter company name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="company@example.com"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Website</label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="www.example.com or https://www.example.com"
            />
            <small className="form-hint">
              Enter your website URL (e.g., www.example.com)
            </small>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Brief description about your company..."
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Address Information</h2>
          
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street address"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              />
            </div>

            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
              />
            </div>

            <div className="form-group">
              <label>Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="560001"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>WhatsApp Integration</h2>
          
          <div className="form-group">
            <label>WhatsApp Number</label>
            <input
              type="text"
              name="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={handleChange}
              placeholder="919876543210"
            />
            <small className="form-hint">
              This number will be used for WhatsApp booking integration. 
              Format: Country code + number (e.g., 919876543210)
            </small>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || uploadingLogo}
          >
            <FiSave />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminSettings;
