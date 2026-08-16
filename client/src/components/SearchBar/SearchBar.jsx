import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiRequest from '../../lib/apiRequest';
import { FiSearch, FiMapPin, FiHome, FiDollarSign, FiChevronDown } from 'react-icons/fi';
import './SearchBar.scss';

const getCityName = (city) => (typeof city === 'string' ? city : city?.city || '');
const getCityState = (city) => (typeof city === 'string' ? '' : city?.state || '');

function SearchBar() {
  const navigate = useNavigate();
  const [filterOptions, setFilterOptions] = useState({
    cities: [],
    states: [],
    propertyTypes: [],
    saleTypes: ['SALE', 'RENT', 'LEASE'],
  });

  const [searchData, setSearchData] = useState({
    state: '',
    city: '',
    propertyType: '',
    saleType: '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const res = await apiRequest.get('/properties/filters');
      setFilterOptions(res.data || {});
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchData.state) params.set('state', searchData.state);
    if (searchData.city) params.set('city', searchData.city);
    if (searchData.propertyType) params.set('propertyType', searchData.propertyType);
    if (searchData.saleType) params.set('saleType', searchData.saleType);
    navigate(`/list?${params.toString()}`);
  };

  // Filter cities based on selected state
  const filteredCities = searchData.state
    ? (filterOptions.cities || []).filter(c => getCityState(c) === searchData.state)
    : filterOptions.cities || [];

  // Get unique states from city data
  const uniqueStates = [...new Set((filterOptions.cities || []).map(getCityState))].filter(Boolean);

  return (
    <div className="search-bar">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-inputs">
          <div className="search-field">
            <FiMapPin className="field-icon" />
            <select name="state" value={searchData.state} onChange={handleChange}>
              <option value="">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="search-field">
            <FiMapPin className="field-icon" />
            <select name="city" value={searchData.city} onChange={handleChange}>
              <option value="">All Cities</option>
              {filteredCities.map(city => {
                const cityName = getCityName(city);

                return cityName ? (
                  <option key={cityName} value={cityName}>{cityName}</option>
                ) : null;
              })}
            </select>
          </div>

          <div className="search-field">
            <FiHome className="field-icon" />
            <select name="propertyType" value={searchData.propertyType} onChange={handleChange}>
              <option value="">Property Type</option>
              {(filterOptions.propertyTypes || ['APARTMENT', 'HOUSE', 'VILLA', 'PLOT', 'COMMERCIAL', 'LAND', 'FARMHOUSE', 'PENTHOUSE', 'STUDIO']).map(type => (
                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="search-field">
            <FiDollarSign className="field-icon" />
            <select name="saleType" value={searchData.saleType} onChange={handleChange}>
              <option value="">Buy / Rent</option>
              {['SALE', 'RENT', 'LEASE'].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="search-btn">
            <FiSearch /> Search
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchBar;
