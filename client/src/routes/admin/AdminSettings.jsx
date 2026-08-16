import { useState, useEffect } from 'react';
import apiRequest from '../../lib/apiRequest';
import toast from 'react-hot-toast';
import { FiUpload, FiSave } from 'react-icons/fi';
import { useSite } from '../../context/SiteContext';
import { canManageCms } from '../../lib/auth';
import { useAuth } from '../../context/AuthContext';
import { resolveAssetUrl } from '../../lib/config';
import './AdminSettings.scss';

const INITIAL = {
  companyName: '',
  tagline: '',
  foundedYear: '',
  email: '',
  phone: '',
  whatsappNumber: '',
  website: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  description: '',
  mission: '',
  vision: '',
  aboutImage: '',
  companyLogo: '',
  facebook: '',
  twitter: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  googleMapsEmbed: '',
  statsProperties: 0,
  statsCustomers: 0,
  statsCities: 0,
  statsYears: 0,
  statsProjects: 0,
  metaTitle: '',
  metaDescription: '',
  privacyContent: '',
  termsContent: '',
};

function AdminSettings() {
  const { refreshSite } = useSite();
  const { currentUser } = useAuth();
  const canWrite = canManageCms(currentUser);

  const [loading, setLoading] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState(INITIAL);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetchingSettings(true);
      const res = await apiRequest.get('/company/settings');
      const d = res.data || {};
      setFormData((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.keys(INITIAL).map((k) => [k, d[k] === null || d[k] === undefined ? (typeof INITIAL[k] === 'number' ? 0 : '') : d[k]])
        ),
      }));
    } catch (error) {
      console.error('Error:', error);
      // Settings might not exist yet, that's okay
    } finally {
      setFetchingSettings(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpload = async (e, field, setUploading) => {
    const file = e.target.files[0];
    if (!file) return;

    // Basic validation — the API enforces type/size again
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append('images', file);

    try {
      const res = await apiRequest.post('/company/upload-images', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.images?.[0] || res.data?.urls?.[0] || res.data?.[0] || res.data?.url;
      if (!url) throw new Error('No URL returned');
      setFormData((prev) => ({ ...prev, [field]: url }));
      toast.success('Image uploaded — remember to save');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    const fd = new FormData();
    fd.append('logo', file);

    try {
      const res = await apiRequest.post('/company/upload-logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, companyLogo: res.data.logoUrl }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      toast.error('You do not have permission to change website settings');
      return;
    }
    setLoading(true);

    try {
      const payload = {
        ...formData,
        foundedYear: formData.foundedYear ? Number(formData.foundedYear) : null,
        statsProperties: Number(formData.statsProperties) || 0,
        statsCustomers: Number(formData.statsCustomers) || 0,
        statsCities: Number(formData.statsCities) || 0,
        statsYears: Number(formData.statsYears) || 0,
        statsProjects: Number(formData.statsProjects) || 0,
      };
      await apiRequest.put('/company/settings', payload);
      toast.success('Website settings updated');
      refreshSite(); // live-update header/footer company info
    } catch (error) {
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

  const disabled = !canWrite;

  return (
    <div className="admin-settings">
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-section">
          <h2>Brand</h2>

          <div className="logo-upload-section">
            {formData.companyLogo && (
              <div className="current-logo">
                <img src={resolveAssetUrl(formData.companyLogo)} alt="Company Logo" />
              </div>
            )}
            <div className="logo-upload">
              <input
                type="file"
                id="logo"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo || disabled}
              />
              <label htmlFor="logo" className="upload-label">
                <FiUpload />
                <span>{uploadingLogo ? 'Uploading...' : 'Upload New Logo'}</span>
                <small>Recommended: Square image, min 200x200px</small>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              disabled={disabled}
              placeholder="Enter company name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tagline</label>
              <input
                type="text"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                disabled={disabled}
                placeholder="Your trusted real estate partner"
              />
            </div>
            <div className="form-group">
              <label>Founded Year</label>
              <input
                type="number"
                name="foundedYear"
                value={formData.foundedYear}
                onChange={handleChange}
                disabled={disabled}
                placeholder="2014"
                min="1800"
                max="2100"
              />
            </div>
          </div>

          <div className="form-group">
            <label>About Page Image</label>
            <div className="image-field">
              <input
                type="text"
                name="aboutImage"
                value={formData.aboutImage}
                onChange={handleChange}
                disabled={disabled}
                placeholder="/uploads/… or https://…"
              />
              <label className="upload-label">
                <FiUpload />
                <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploadingImage || disabled}
                  onChange={(e) => handleUpload(e, 'aboutImage', setUploadingImage)}
                />
              </label>
            </div>
            {formData.aboutImage && (
              <div className="current-logo">
                <img src={resolveAssetUrl(formData.aboutImage)} alt="About" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Company Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              disabled={disabled}
              placeholder="Shown on the About page and in the footer…"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mission</label>
              <textarea
                name="mission"
                value={formData.mission}
                onChange={handleChange}
                rows="3"
                disabled={disabled}
              />
            </div>
            <div className="form-group">
              <label>Vision</label>
              <textarea
                name="vision"
                value={formData.vision}
                onChange={handleChange}
                rows="3"
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Contact & Address</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={disabled}
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
                disabled={disabled}
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>WhatsApp Number</label>
              <input
                type="text"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                disabled={disabled}
                placeholder="919876543210"
              />
              <small className="form-hint">
                Country code + number, e.g. 919876543210
              </small>
            </div>
            <div className="form-group">
              <label>Website</label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                disabled={disabled}
                placeholder="www.example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={disabled}
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
                disabled={disabled}
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                disabled={disabled}
              />
            </div>
            <div className="form-group">
              <label>Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Google Maps Embed URL</label>
            <input
              type="text"
              name="googleMapsEmbed"
              value={formData.googleMapsEmbed}
              onChange={handleChange}
              disabled={disabled}
              placeholder="https://www.google.com/maps/embed?pb=…"
            />
            <small className="form-hint">Used on the Contact page map. Paste the src URL from a Google Maps embed.</small>
          </div>
        </div>

        <div className="form-section">
          <h2>Social Media</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Facebook</label>
              <input type="url" name="facebook" value={formData.facebook} onChange={handleChange} disabled={disabled} placeholder="https://facebook.com/…" />
            </div>
            <div className="form-group">
              <label>Twitter / X</label>
              <input type="url" name="twitter" value={formData.twitter} onChange={handleChange} disabled={disabled} placeholder="https://x.com/…" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Instagram</label>
              <input type="url" name="instagram" value={formData.instagram} onChange={handleChange} disabled={disabled} placeholder="https://instagram.com/…" />
            </div>
            <div className="form-group">
              <label>LinkedIn</label>
              <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} disabled={disabled} placeholder="https://linkedin.com/…" />
            </div>
          </div>
          <div className="form-group">
            <label>YouTube</label>
            <input type="url" name="youtube" value={formData.youtube} onChange={handleChange} disabled={disabled} placeholder="https://youtube.com/…" />
          </div>
        </div>

        <div className="form-section">
          <h2>Company Stats</h2>
          <p className="section-hint">Numbers shown in the homepage and about page counters.</p>

          <div className="form-row">
            <div className="form-group">
              <label>Properties Listed</label>
              <input type="number" name="statsProperties" value={formData.statsProperties} onChange={handleChange} disabled={disabled} min="0" />
            </div>
            <div className="form-group">
              <label>Happy Customers</label>
              <input type="number" name="statsCustomers" value={formData.statsCustomers} onChange={handleChange} disabled={disabled} min="0" />
            </div>
            <div className="form-group">
              <label>Cities Covered</label>
              <input type="number" name="statsCities" value={formData.statsCities} onChange={handleChange} disabled={disabled} min="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Years Experience</label>
              <input type="number" name="statsYears" value={formData.statsYears} onChange={handleChange} disabled={disabled} min="0" />
            </div>
            <div className="form-group">
              <label>Projects Delivered</label>
              <input type="number" name="statsProjects" value={formData.statsProjects} onChange={handleChange} disabled={disabled} min="0" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Default SEO</h2>
          <p className="section-hint">Fallback title/description for pages without their own SEO entry (per-page SEO lives under Website → SEO).</p>

          <div className="form-group">
            <label>Default Meta Title</label>
            <input
              type="text"
              name="metaTitle"
              value={formData.metaTitle}
              onChange={handleChange}
              disabled={disabled}
              placeholder="Suretreaven | Premium Real Estate"
            />
          </div>
          <div className="form-group">
            <label>Default Meta Description</label>
            <textarea
              name="metaDescription"
              value={formData.metaDescription}
              onChange={handleChange}
              rows="3"
              disabled={disabled}
              placeholder="Discover premium properties…"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Legal Pages</h2>
          <p className="section-hint">Basic HTML is allowed (headings, lists, links, bold). These render on /privacy and /terms.</p>

          <div className="form-group">
            <label>Privacy Policy Content</label>
            <textarea
              name="privacyContent"
              value={formData.privacyContent}
              onChange={handleChange}
              rows="8"
              disabled={disabled}
              placeholder="&lt;h2&gt;Information we collect&lt;/h2&gt; &lt;p&gt;…&lt;/p&gt;"
            />
          </div>
          <div className="form-group">
            <label>Terms &amp; Conditions Content</label>
            <textarea
              name="termsContent"
              value={formData.termsContent}
              onChange={handleChange}
              rows="8"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || uploadingLogo || uploadingImage || disabled}
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
