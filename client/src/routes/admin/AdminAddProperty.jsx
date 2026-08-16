import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiRequest from '../../lib/apiRequest';
import toast from 'react-hot-toast';
import { FiUpload, FiX } from 'react-icons/fi';
import './AdminAddProperty.scss';

function AdminAddProperty() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    tokenAmount: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    propertyType: 'APARTMENT',
    saleType: 'SALE',
    bedroom: '',
    bathroom: '',
    area: '',
    amenities: [],
    features: [],
    images: []
  });

  const [amenityInput, setAmenityInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    const formDataImg = new FormData();
    files.forEach(file => {
      formDataImg.append('images', file);
    });

    try {
      const res = await apiRequest.post('/company/upload-images', formDataImg, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...res.data.images]
      }));

      toast.success('Images uploaded successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addAmenity = () => {
    if (amenityInput.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }));
      setAmenityInput('');
    }
  };

  const removeAmenity = (index) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setLoading(true);

    try {
      const propertyData = {
        ...formData,
        price: parseFloat(formData.price),
        tokenAmount: parseFloat(formData.tokenAmount),
        bedroom: parseInt(formData.bedroom),
        bathroom: parseInt(formData.bathroom),
        area: parseInt(formData.area),
        images: formData.images,
        amenities: formData.amenities,
        features: formData.features
      };

      await apiRequest.post('/admin/properties', propertyData);
      toast.success('Property added successfully');
      navigate('/admin/properties');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-add-property">
      <div className="page-header">
        <h1>Add New Property</h1>
        <p>Fill in the details to add a new property</p>
      </div>

      <form onSubmit={handleSubmit} className="property-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label>Property Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Luxury 3BHK Apartment"
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Describe the property..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="5000000"
              />
            </div>

            <div className="form-group">
              <label>Token Amount (₹) *</label>
              <input
                type="number"
                name="tokenAmount"
                value={formData.tokenAmount}
                onChange={handleChange}
                required
                placeholder="50000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Property Type *</label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                required
              >
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="VILLA">Villa</option>
                <option value="PLOT">Plot</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </div>

            <div className="form-group">
              <label>Sale Type *</label>
              <select
                name="saleType"
                value={formData.saleType}
                onChange={handleChange}
                required
              >
                <option value="SALE">For Sale</option>
                <option value="RENT">For Rent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Location Details</h2>
          
          <div className="form-group">
            <label>Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="Street address"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
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

          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="12.9716"
              />
            </div>

            <div className="form-group">
              <label>Longitude</label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="77.5946"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Property Specifications</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Bedrooms *</label>
              <input
                type="number"
                name="bedroom"
                value={formData.bedroom}
                onChange={handleChange}
                required
                placeholder="3"
              />
            </div>

            <div className="form-group">
              <label>Bathrooms *</label>
              <input
                type="number"
                name="bathroom"
                value={formData.bathroom}
                onChange={handleChange}
                required
                placeholder="2"
              />
            </div>

            <div className="form-group">
              <label>Area (sq ft) *</label>
              <input
                type="number"
                name="area"
                value={formData.area}
                onChange={handleChange}
                required
                placeholder="1500"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Amenities</h2>
          
          <div className="input-with-button">
            <input
              type="text"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              placeholder="e.g., Parking, Swimming Pool"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
            />
            <button type="button" onClick={addAmenity} className="btn-add">
              Add
            </button>
          </div>

          <div className="tags-list">
            {formData.amenities.map((amenity, index) => (
              <span key={index} className="tag">
                {amenity}
                <button type="button" onClick={() => removeAmenity(index)}>
                  <FiX />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h2>Features</h2>
          
          <div className="input-with-button">
            <input
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              placeholder="e.g., Modular Kitchen, Wood Flooring"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            />
            <button type="button" onClick={addFeature} className="btn-add">
              Add
            </button>
          </div>

          <div className="tags-list">
            {formData.features.map((feature, index) => (
              <span key={index} className="tag">
                {feature}
                <button type="button" onClick={() => removeFeature(index)}>
                  <FiX />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h2>Property Images *</h2>
          
          <div className="image-upload">
            <input
              type="file"
              id="images"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImages}
            />
            <label htmlFor="images" className="upload-label">
              <FiUpload />
              <span>{uploadingImages ? 'Uploading...' : 'Click to upload images'}</span>
              <small>Upload multiple images (max 5MB each)</small>
            </label>
          </div>

          <div className="images-preview">
            {formData.images.map((image, index) => (
              <div key={index} className="image-preview">
                <img 
                  src={image.startsWith('http') ? image : `${window.location.origin}${image}`}
                  alt={`Preview ${index + 1}`}
                />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => removeImage(index)}
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/admin/properties')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || uploadingImages}
          >
            {loading ? 'Adding Property...' : 'Add Property'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminAddProperty;
