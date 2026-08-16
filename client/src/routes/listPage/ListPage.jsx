import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiRequest from '../../lib/apiRequest';
import toast from 'react-hot-toast';
import { FiFilter, FiX, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { formatPrice, parseImages } from '../../lib/utils';
import './ListPage.scss';

const getCityName = (city) => (typeof city === 'string' ? city : city?.city || '');

function ListPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState({
    cities: [],
    states: [],
    propertyTypes: [],
    saleTypes: [],
    listingTypes: [],
    furnishingStatuses: []
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: 'ALL',
    state: searchParams.get('state') || '',
    city: searchParams.get('city') || '',
    locality: '',
    propertyType: searchParams.get('propertyType') || 'ALL',
    saleType: searchParams.get('saleType') || 'ALL',
    listingType: searchParams.get('listingType') || 'ALL',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    bedroom: searchParams.get('bedroom') || '',
    bathroom: searchParams.get('bathroom') || '',
    minArea: searchParams.get('minArea') || '',
    maxArea: searchParams.get('maxArea') || '',
    furnishingStatus: searchParams.get('furnishingStatus') || 'ALL',
    sort: searchParams.get('sort') || 'newest',
    isFeatured: searchParams.get('isFeatured') || '',
  });

  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [currentPage, filters.sort]);

  const fetchFilterOptions = async () => {
    try {
      const res = await apiRequest.get('/properties/filters');
      setFilterOptions(res.data || {});
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      let url = `/properties?page=${currentPage}&limit=12`;

      // Add all filters to URL
      if (filters.state) url += `&state=${encodeURIComponent(filters.state)}`;
      if (filters.city) url += `&city=${encodeURIComponent(filters.city)}`;
      if (filters.locality) url += `&locality=${encodeURIComponent(filters.locality)}`;
      if (filters.propertyType && filters.propertyType !== 'ALL') url += `&propertyType=${filters.propertyType}`;
      if (filters.saleType && filters.saleType !== 'ALL') url += `&saleType=${filters.saleType}`;
      if (filters.listingType && filters.listingType !== 'ALL') url += `&listingType=${filters.listingType}`;
      if (filters.minPrice) url += `&minPrice=${filters.minPrice}`;
      if (filters.maxPrice) url += `&maxPrice=${filters.maxPrice}`;
      if (filters.bedroom) url += `&bedroom=${filters.bedroom}`;
      if (filters.bathroom) url += `&bathroom=${filters.bathroom}`;
      if (filters.minArea) url += `&minArea=${filters.minArea}`;
      if (filters.maxArea) url += `&maxArea=${filters.maxArea}`;
      if (filters.furnishingStatus && filters.furnishingStatus !== 'ALL') url += `&furnishingStatus=${filters.furnishingStatus}`;
      if (filters.sort) url += `&sort=${filters.sort}`;
      if (filters.isFeatured) url += `&isFeatured=${filters.isFeatured}`;

      const res = await apiRequest.get(url);
      const data = res.data;
      const propertyList = data?.properties || data || [];
      const pagination = data?.pagination || {};
      const total = pagination.total || data?.total || propertyList.length;

      setProperties(propertyList);
      setTotalPages(pagination.totalPages || data?.totalPages || Math.ceil(total / 12) || 1);
      setTotalResults(total);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchProperties();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      status: 'ALL',
      state: '',
      city: '',
      locality: '',
      propertyType: 'ALL',
      saleType: 'ALL',
      listingType: 'ALL',
      minPrice: '',
      maxPrice: '',
      bedroom: '',
      bathroom: '',
      minArea: '',
      maxArea: '',
      furnishingStatus: 'ALL',
      sort: 'newest',
      isFeatured: '',
    });
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'sort') return false;
    if (key === 'status') return value !== 'ALL';
    return value && value !== 'ALL';
  });

  if (loading && properties.length === 0) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="list-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1>Browse Properties</h1>
            <p>Found {totalResults} properties</p>
          </div>
          <div className="header-actions">
            <select
              className="sort-select"
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="area_low">Area: Small to Large</option>
              <option value="area_high">Area: Large to Small</option>
            </select>
            <button className="btn-filter-toggle" onClick={() => setShowFilters(!showFilters)}>
              <FiFilter /> Filters {hasActiveFilters && <span className="filter-count">!</span>}
            </button>
          </div>
        </div>

        {/* Status Filters Row */}
        <div className="status-filters">
          <button
            className={filters.status === 'ALL' ? 'active' : ''}
            onClick={() => handleFilterChange('status', 'ALL')}
          >
            All
          </button>
          <button
            className={filters.status === 'AVAILABLE' ? 'active' : ''}
            onClick={() => handleFilterChange('status', 'AVAILABLE')}
          >
            Available
          </button>
          <button
            className={filters.status === 'TOKEN_BOOKED' ? 'active' : ''}
            onClick={() => handleFilterChange('status', 'TOKEN_BOOKED')}
          >
            Token Booked
          </button>
          <button
            className={filters.status === 'SOLD' ? 'active' : ''}
            onClick={() => handleFilterChange('status', 'SOLD')}
          >
            Sold
          </button>
        </div>

        {/* Main Content with Sidebar */}
        <div className="list-content">
          {/* Advanced Filters Sidebar */}
          <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
            <div className="sidebar-header">
              <h3>Advanced Filters</h3>
              <button className="btn-close-filters" onClick={() => setShowFilters(false)}>
                <FiX />
              </button>
            </div>

            <div className="filter-group">
              <label>State</label>
              <select value={filters.state} onChange={(e) => handleFilterChange('state', e.target.value)}>
                <option value="">All States</option>
                {(filterOptions.states || []).map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>City</label>
              <select value={filters.city} onChange={(e) => handleFilterChange('city', e.target.value)}>
                <option value="">All Cities</option>
                {(filterOptions.cities || []).map(city => {
                  const cityName = getCityName(city);

                  return cityName ? (
                    <option key={cityName} value={cityName}>{cityName}</option>
                  ) : null;
                })}
              </select>
            </div>

            <div className="filter-group">
              <label>Locality</label>
              <input
                type="text"
                placeholder="Enter locality"
                value={filters.locality}
                onChange={(e) => handleFilterChange('locality', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Property Type</label>
              <select value={filters.propertyType} onChange={(e) => handleFilterChange('propertyType', e.target.value)}>
                <option value="ALL">All Types</option>
                {(filterOptions.propertyTypes || ['PLOT', 'COMMERCIAL', 'HOUSE', 'APARTMENT', 'VILLA']).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sale Type</label>
              <select value={filters.saleType} onChange={(e) => handleFilterChange('saleType', e.target.value)}>
                <option value="ALL">All</option>
                {(filterOptions.saleTypes || ['SALE', 'RENT', 'LEASE']).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Listing Type</label>
              <select value={filters.listingType} onChange={(e) => handleFilterChange('listingType', e.target.value)}>
                <option value="ALL">All</option>
                {(filterOptions.listingTypes || ['NEW', 'RESALE']).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Budget Range</label>
              <div className="price-range">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                />
                <span className="range-separator">to</span>
                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                />
              </div>
            </div>

            {/* More Filters Toggle */}
            <button
              className="more-filters-toggle"
              onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
            >
              {moreFiltersOpen ? <FiChevronUp /> : <FiChevronDown />}
              {moreFiltersOpen ? 'Less Filters' : 'More Filters'}
            </button>

            {moreFiltersOpen && (
              <div className="more-filters">
                <div className="filter-group">
                  <label>Bedrooms</label>
                  <select value={filters.bedroom} onChange={(e) => handleFilterChange('bedroom', e.target.value)}>
                    <option value="">Any</option>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n}+ BHK</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Bathrooms</label>
                  <select value={filters.bathroom} onChange={(e) => handleFilterChange('bathroom', e.target.value)}>
                    <option value="">Any</option>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}+</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Area Range (sqft)</label>
                  <div className="price-range">
                    <input
                      type="number"
                      placeholder="Min Area"
                      value={filters.minArea}
                      onChange={(e) => handleFilterChange('minArea', e.target.value)}
                    />
                    <span className="range-separator">to</span>
                    <input
                      type="number"
                      placeholder="Max Area"
                      value={filters.maxArea}
                      onChange={(e) => handleFilterChange('maxArea', e.target.value)}
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label>Furnishing Status</label>
                  <select value={filters.furnishingStatus} onChange={(e) => handleFilterChange('furnishingStatus', e.target.value)}>
                    <option value="ALL">All</option>
                    {(filterOptions.furnishingStatuses || ['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED']).map(status => (
                      <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="filter-actions">
              <button className="btn-apply-filters" onClick={applyFilters}>
                Apply Filters
              </button>
              <button className="btn-clear-filters" onClick={clearFilters}>
                Clear All
              </button>
            </div>
          </aside>

          {/* Properties Grid */}
          <div className="properties-section">
            {properties.length === 0 ? (
              <div className="no-properties">
                <FiSearch />
                <h3>No properties found</h3>
                <p>Try adjusting your filters to see more results</p>
                <button onClick={clearFilters} className="btn-clear">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="properties-grid">
                  {properties.map((property) => {
                    const images = parseImages(property.images);
                    const firstImage = images?.[0] || 'https://via.placeholder.com/400x300';

                    return (
                      <div
                        key={property.id}
                        className="property-card"
                        onClick={() => navigate(`/property/${property.id}`)}
                      >
                        <div className="property-image">
                          <img
                            src={firstImage.startsWith('http') ? firstImage : `${window.location.origin}${firstImage}`}
                            alt={property.title}
                          />
                          <span className={`status-badge ${property.status.toLowerCase()}`}>
                            {property.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="property-content">
                          <h3>{property.title}</h3>
                          <p className="property-location">{property.city}, {property.state}</p>

                          <div className="property-details">
                            <span>{property.bedroom} Beds</span>
                            <span>{property.bathroom} Baths</span>
                            <span>{property.area} sqft</span>
                          </div>

                          <div className="property-price">
                            <div>
                              <small>Price</small>
                              <strong>{formatPrice(property.price)}</strong>
                            </div>
                            <div>
                              <small>Token</small>
                              <strong>{formatPrice(property.tokenAmount)}</strong>
                            </div>
                          </div>

                          <div className="property-type">
                            <span className="type-badge">{property.propertyType}</span>
                            <span className="sale-badge">{property.saleType}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      Previous
                    </button>
                    {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 7 && <span className="page-dots">...</span>}
                    {totalPages > 7 && (
                      <button
                        className={`page-btn ${currentPage === totalPages ? 'active' : ''}`}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    )}
                    <button
                      className="page-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="filters-overlay" onClick={() => setShowFilters(false)}></div>
      )}
    </div>
  );
}

export default ListPage;
