import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../lib/apiRequest';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiLock, FiSave, FiUpload } from 'react-icons/fi';
import './profileUpdatePage.scss';

function ProfileUpdatePage() {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || '');

  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload the image
      uploadAvatar(file);
    }
  };

  const uploadAvatar = async (file) => {
    setUploadingAvatar(true);
    const formDataImg = new FormData();
    formDataImg.append('avatar', file);

    try {
      // You'll need to create this endpoint in your backend
      const res = await apiRequest.post('/users/upload-avatar', formDataImg, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setAvatarPreview(res.data.avatarUrl);
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to upload avatar');
      setAvatarPreview(currentUser?.avatar || '');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        avatar: avatarPreview
      };

      // Only include password if user wants to change it
      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      const res = await apiRequest.put(`/users/${currentUser.id}`, updateData);
      
      // Update the context with new user data
      const token = localStorage.getItem('token');
      updateUser(res.data, token);

      toast.success('Profile updated successfully');
      navigate('/profile');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-update-page">
      <div className="container">
        <div className="page-header">
          <h1>Update Profile</h1>
          <p>Update your account information</p>
        </div>

        <div className="profile-update-content">
          <div className="avatar-section">
            <div className="avatar-container">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  <FiUser />
                </div>
              )}
              {uploadingAvatar && (
                <div className="avatar-loading">
                  <div className="spinner"></div>
                </div>
              )}
            </div>

            <div className="avatar-upload">
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
              <label htmlFor="avatar" className="upload-btn">
                <FiUpload />
                {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
              </label>
              <small>JPG, PNG or GIF. Max size 2MB</small>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="update-form">
            <div className="form-section">
              <h2>Personal Information</h2>
              
              <div className="form-group">
                <label htmlFor="username">
                  <FiUser />
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Enter your username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <FiMail />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <FiPhone />
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Change Password</h2>
              <p className="section-note">Leave blank if you don&apos;t want to change password</p>

              <div className="form-group">
                <label htmlFor="newPassword">
                  <FiLock />
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <FiLock />
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate('/profile')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={loading || uploadingAvatar}
              >
                <FiSave />
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfileUpdatePage;
