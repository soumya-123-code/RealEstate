import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiMapPin, FiSearch, FiShield, FiMessageCircle } from 'react-icons/fi';
import apiRequest from '../../lib/apiRequest';
import Card from '../../components/Card/Card';
import { PropertyListSkeleton } from '../../components/Skeleton/Skeleton';
import { sanitizeAppPath } from '../../lib/sanitizeAppPath';
import { mediaUrl } from '../../lib/utils';
import './HomePage.scss';

export default function HomePage() {
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([apiRequest.get('/cms/banners'), apiRequest.get('/properties?isFeatured=true&limit=6')]).then(([bannerResult, propertyResult]) => {
      if (!active) return;
      if (bannerResult.status === 'fulfilled') setBanner(bannerResult.value.data?.[0] || null);
      if (propertyResult.status === 'fulfilled') setProperties(propertyResult.value.data?.properties || []);
      if (bannerResult.status === 'rejected' && propertyResult.status === 'rejected') setError("We couldn't load the homepage data. Please try again.");
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (loading) return <PropertyListSkeleton />;
  const heroImage = banner?.image ? mediaUrl(banner.image) : '';
  const heroTarget = sanitizeAppPath(banner?.buttonLink, '/list');

  return <main className="homePage">
    <section className="hero-section" aria-label="Find your property">
      {heroImage ? <div className="hero-bg-image" style={{ backgroundImage: `url(${heroImage})` }} /> : <div className="hero-bg-gradient" />}
      <div className="hero-overlay" />
      <div className="hero-content">
        <p className="hero-brand">Suretreaven</p>
        <h1>{banner?.title || 'Find Your Perfect Property'}</h1>
        <p className="hero-subtitle">{banner?.subtitle || 'Discover trusted properties with Suretreaven.'}</p>
        <div className="hero-buttons"><Link to={heroTarget} className="hero-btn primary">Explore Properties <FiArrowRight /></Link><Link to="/chat" className="hero-btn secondary"><FiMessageCircle /> Contact an Agent</Link></div>
        <form className="hero-search" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const city = String(data.get('city') || '').trim(); const type = String(data.get('propertyType') || ''); const params = new URLSearchParams(); if (city) params.set('city', city); if (type && type !== 'ALL') params.set('propertyType', type); navigate(params.toString() ? `/list?${params}` : '/list'); }}>
          <label className="hero-search__field"><span>City</span><input name="city" type="search" placeholder="Search by city" /></label>
          <label className="hero-search__field"><span>Property type</span><select name="propertyType" defaultValue="ALL"><option value="ALL">All types</option><option value="PLOT">Plot</option><option value="APARTMENT">Apartment</option><option value="HOUSE">House</option><option value="VILLA">Villa</option><option value="COMMERCIAL">Commercial</option></select></label>
          <button type="submit" className="hero-search__submit"><FiSearch /> Search</button>
        </form>
      </div>
    </section>
    {error && <div className="container"><p className="home-error">{error}</p></div>}
    <section className="trust-section"><div className="container trust-grid"><div><FiShield /><strong>Trusted listings</strong><span>Property information comes from the Suretreaven managed inventory.</span></div><div><FiMapPin /><strong>Clear property details</strong><span>Search location, type, price and key property information.</span></div><div><FiMessageCircle /><strong>Talk to an agent</strong><span>Ask questions before you make a booking.</span></div></div></section>
    {properties.length > 0 && <section className="featured-section"><div className="container"><div className="section-header"><h2>Featured Properties</h2><p>Explore available properties selected by Suretreaven.</p></div><div className="featured-grid">{properties.map((property) => <Card key={property.id} item={property} />)}</div><div className="section-cta"><Link to="/list" className="cta-btn">View All Properties <FiArrowRight /></Link></div></div></section>}
  </main>;
}
