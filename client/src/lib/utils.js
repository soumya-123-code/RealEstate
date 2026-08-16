// Format price in Indian currency format
export const formatPrice = (price) => {
  const numPrice = parseFloat(price);
  
  if (numPrice >= 10000000) {
    // Crores
    return `₹${(numPrice / 10000000).toFixed(2)} Cr`;
  } else if (numPrice >= 100000) {
    // Lakhs
    return `₹${(numPrice / 100000).toFixed(2)} L`;
  } else if (numPrice >= 1000) {
    // Thousands
    return `₹${(numPrice / 1000).toFixed(2)} K`;
  }
  
  return `₹${numPrice.toLocaleString('en-IN')}`;
};

// Format area
export const formatArea = (area) => {
  const numArea = parseInt(area);
  
  if (numArea >= 43560) {
    // Acres (1 acre = 43,560 sq ft)
    return `${(numArea / 43560).toFixed(2)} Acres`;
  } else if (numArea >= 9) {
    // Show both sq ft and sq yards
    const sqYards = (numArea / 9).toFixed(0);
    return `${numArea.toLocaleString()} sq ft (${sqYards} sq yd)`;
  }
  
  return `${numArea.toLocaleString()} sq ft`;
};

// Format date
export const formatDate = (date) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-IN', options);
};

// Format time ago
export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = seconds / 31536000; // years
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000; // months
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400; // days
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600; // hours
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60; // minutes
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return 'Just now';
};

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    AVAILABLE: 'success',
    TOKEN_BOOKED: 'warning',
    SOLD: 'danger',
    RENTED: 'info',
    UNAVAILABLE: 'neutral'
  };
  
  return colors[status] || 'neutral';
};

// Get property type label
export const getPropertyTypeLabel = (type) => {
  const labels = {
    APARTMENT: 'Apartment',
    HOUSE: 'Independent House',
    VILLA: 'Villa',
    PLOT: 'Plot/Land',
    COMMERCIAL: 'Commercial Space'
  };
  
  return labels[type] || type;
};

// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate phone (Indian format)
export const validatePhone = (phone) => {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone.replace(/\s+/g, ''));
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Parse images
export const parseImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') {
    try {
      return JSON.parse(images);
    } catch {
      return [images];
    }
  }
  return [];
};

// Parse amenities/features
export const parseJsonField = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  }
  return [];
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Scroll to top
export const scrollToTop = (smooth = true) => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
};

// Get error message
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};
