import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiRequest from '../../lib/apiRequest';
import Card from '../../components/Card/Card';
import { PropertyListSkeleton } from '../../components/Skeleton/Skeleton';
import { sanitizeAppPath } from '../../lib/sanitizeAppPath';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowRight,
  FiMapPin,
  FiShield,
  FiDollarSign,
  FiHeadphones,
  FiZap,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiUser,
  FiGlobe,
  FiPhone,
  FiPlay,
  FiSearch,
} from 'react-icons/fi';
import './HomePage.scss';

function HomePage() {
  const navigate = useNavigate();
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const statsRef = useRef(null);
  const bannerIntervalRef = useRef(null);

  // Default fallback data
  const defaultBanners = [
    {
      title: "Find a place you'll be proud to call home.",
      subtitle: 'Premium verified plots, homes, and commercial spaces across Odisha — guided by Suretreaven with clarity and care.',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=85',
      buttonText: 'Explore Properties',
      buttonLink: '/list',
      badge: 'Trusted Real Estate',
    }
  ];

  const defaultFeatures = [
    { icon: 'shield', title: 'Verified Properties', description: 'All properties are thoroughly verified and authenticated by our expert legal team' },
    { icon: 'dollar', title: 'Best Prices', description: 'Get the most competitive prices in the market with complete transparency' },
    { icon: 'headphones', title: 'Expert Support', description: '24/7 customer support to help you with all your property queries and concerns' },
    { icon: 'zap', title: 'Quick Process', description: 'Fast and hassle-free booking process with instant confirmation and documentation' }
  ];

  const defaultStats = [
    { value: 350, label: 'Properties Listed', icon: <FiZap size={28} /> },
    { value: 1200, label: 'Happy Customers', icon: <FiStar size={28} /> },
    { value: 6, label: 'Cities Covered', icon: <FiMapPin size={28} /> },
    { value: 12, label: 'Years Experience', icon: <FiCalendar size={28} /> },
  ];

  // Animated counter component
  const AnimatedCounter = useCallback(({ value, suffix = '+' }) => {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            let start = 0;
            const end = parseInt(value) || 0;
            if (end === 0) return;
            const duration = 2000;
            const increment = end / (duration / 16);
            const timer = setInterval(() => {
              start += increment;
              if (start >= end) {
                setCount(end);
                clearInterval(timer);
              } else {
                setCount(Math.floor(start));
              }
            }, 16);
          }
        },
        { threshold: 0.3 }
      );

      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, [value, hasAnimated]);

    return <span ref={ref}>{count}{suffix}</span>;
  }, []);

  // Get icon component from string name
  const getFeatureIcon = (iconName) => {
    const icons = {
      shield: <FiShield size={28} />,
      dollar: <FiDollarSign size={28} />,
      headphones: <FiHeadphones size={28} />,
      zap: <FiZap size={28} />,
      map: <FiMapPin size={28} />,
      star: <FiStar size={28} />,
      user: <FiUser size={28} />,
      globe: <FiGlobe size={28} />,
      phone: <FiPhone size={28} />,
      play: <FiPlay size={28} />,
      FiShield: <FiShield size={28} />,
      FiDollarSign: <FiDollarSign size={28} />,
      FiHeadphones: <FiHeadphones size={28} />,
      FiZap: <FiZap size={28} />,
    };
    return icons[iconName] || <FiZap size={28} />;
  };

  // Fetch homepage data from CMS API
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await apiRequest.get('/cms/homepage');
        if (res.data) {
          setHomeData(res.data);
        }
      } catch (error) {
        console.error('Error fetching homepage data:', error);
        // Use defaults on error
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Auto-rotate banner
  useEffect(() => {
    const banners = homeData?.banners || defaultBanners;
    if (banners.length <= 1) return;

    if (bannerIntervalRef.current) {
      clearInterval(bannerIntervalRef.current);
    }

    bannerIntervalRef.current = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % banners.length);
    }, 5000);

    return () => {
      if (bannerIntervalRef.current) {
        clearInterval(bannerIntervalRef.current);
      }
    };
  }, [homeData?.banners]);

  // Build stats from CMS data or defaults
  const buildStats = () => {
    const companyInfo = homeData?.companyInfo;
    const apiStats = homeData?.stats;

    if (companyInfo && (companyInfo.statsProperties > 0 || companyInfo.statsYears > 0)) {
      return [
        { value: companyInfo.statsProperties || apiStats?.totalProperties || 350, label: 'Properties Listed', icon: <FiZap size={28} /> },
        { value: companyInfo.statsCustomers || 1200, label: 'Happy Customers', icon: <FiStar size={28} /> },
        { value: companyInfo.statsCities || apiStats?.totalCities || 6, label: 'Cities Covered', icon: <FiMapPin size={28} /> },
        { value: companyInfo.statsYears || 12, label: 'Years Experience', icon: <FiCalendar size={28} /> },
      ];
    }

    if (apiStats) {
      return [
        { value: apiStats.totalProperties || 350, label: 'Properties Listed', icon: <FiZap size={28} /> },
        { value: apiStats.totalBookings || 1200, label: 'Happy Customers', icon: <FiStar size={28} /> },
        { value: apiStats.totalCities || 6, label: 'Cities Covered', icon: <FiMapPin size={28} /> },
        { value: 12, label: 'Years Experience', icon: <FiCalendar size={28} /> },
      ];
    }

    return defaultStats;
  };

  const banners = homeData?.banners || defaultBanners;
  const services = homeData?.services || defaultFeatures;
  const testimonials = homeData?.testimonials || [];
  const featuredProperties = homeData?.featuredProperties || [];
  const blogPosts = homeData?.blogPosts || [];
  const partners = homeData?.partners || [];
  const cityStats = homeData?.cityStats || [];
  const companyName = homeData?.companyInfo?.companyName || 'Suretreaven';
  const stats = buildStats();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  if (loading) {
    return <PropertyListSkeleton />;
  }

  return (
    <div className="homePage">
      {/* ===== HERO BANNER SECTION ===== */}
      <section className="hero-section" aria-label="Featured properties">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeBanner}
            className="hero-slide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            {banners[activeBanner]?.image ? (
              <div
                className="hero-bg-image"
                style={{
                  backgroundImage: `url(${banners[activeBanner].image.startsWith('http') ? banners[activeBanner].image : `${window.location.origin}${banners[activeBanner].image}`})`,
                }}
              />
            ) : (
              <div className="hero-bg-gradient" />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="hero-overlay" aria-hidden="true" />

        <div className="hero-content">
          <motion.p
            className="hero-brand"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            {companyName}
          </motion.p>

          <motion.h1
            key={`title-${activeBanner}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {banners[activeBanner]?.title || "Find a place you'll be proud to call home."}
          </motion.h1>

          <motion.p
            key={`subtitle-${activeBanner}`}
            className="hero-subtitle"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {banners[activeBanner]?.subtitle || 'Explore premium verified properties across Odisha'}
          </motion.p>

          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link
              to={sanitizeAppPath(banners[activeBanner]?.buttonLink, '/list')}
              className="hero-btn primary"
            >
              {banners[activeBanner]?.buttonText || 'Explore Properties'} <FiArrowRight />
            </Link>
            <Link to="/explore" className="hero-btn secondary">
              <FiMapPin /> Map View
            </Link>
            <Link to="/contact" className="hero-btn ghost">
              Contact Us
            </Link>
          </motion.div>

          <motion.form
            className="hero-search"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const city = String(fd.get('city') || '').trim();
              const propertyType = String(fd.get('propertyType') || '');
              const params = new URLSearchParams();
              if (city) params.set('city', city);
              if (propertyType && propertyType !== 'ALL') params.set('propertyType', propertyType);
              const qs = params.toString();
              navigate(qs ? `/list?${qs}` : '/list');
            }}
          >
            <label className="hero-search__field">
              <span>City</span>
              <input name="city" type="search" placeholder="Rourkela, Bhubaneswar…" autoComplete="address-level2" />
            </label>
            <label className="hero-search__field">
              <span>Type</span>
              <select name="propertyType" defaultValue="ALL">
                <option value="ALL">All types</option>
                <option value="PLOT">Plot</option>
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="VILLA">Villa</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </label>
            <button type="submit" className="hero-search__submit">
              <FiSearch /> Search
            </button>
          </motion.form>

          {banners.length > 1 && (
            <div className="hero-indicators" role="tablist" aria-label="Hero slides">
              {banners.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={activeBanner === index}
                  aria-label={`Show slide ${index + 1}`}
                  className={`indicator ${activeBanner === index ? 'active' : ''}`}
                  onClick={() => setActiveBanner(index)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== STATS COUNTER ===== */}
      <section className="stats-section" ref={statsRef}>
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="stat-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-number">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PROPERTIES ===== */}
      {featuredProperties.length > 0 && (
        <section className="featured-section">
          <div className="container">
            <motion.div
              className="section-header"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2>Featured Properties</h2>
              <p>Handpicked properties in prime locations across Odisha</p>
            </motion.div>

            <div className="featured-grid">
              {featuredProperties.map((property, index) => (
                <Card key={property.id} item={property} />
              ))}
            </div>

            <div className="section-cta">
              <Link to="/list" className="cta-btn">
                View All Properties <FiArrowRight />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== WHY CHOOSE US / SERVICES ===== */}
      <section className="features-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2>Why Choose {companyName}</h2>
            <p>Your trusted real estate partner in Odisha since {homeData?.companyInfo?.foundedYear || 2014}</p>
          </motion.div>

          <motion.div
            className="features-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {services.map((service, index) => (
              <motion.div
                key={service.id || index}
                className="feature-card"
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <div className="feature-icon-wrapper">
                  {service.icon ? getFeatureIcon(service.icon) : <FiZap size={28} />}
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== POPULAR CITIES ===== */}
      {cityStats.length > 0 && (
        <section className="cities-section">
          <div className="container">
            <motion.div
              className="section-header"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2>Popular Cities in Odisha</h2>
              <p>Explore properties in top cities across the state</p>
            </motion.div>

            <div className="cities-grid">
              {cityStats.map((city, index) => (
                <motion.div
                  key={index}
                  className="city-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  onClick={() => navigate(`/list?city=${encodeURIComponent(city.city)}`)}
                >
                  <div className="city-icon"><FiMapPin size={24} /></div>
                  <h3>{city.city}</h3>
                  <p>{city.state}</p>
                  <span className="city-count">{city.count} Properties</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== TESTIMONIALS ===== */}
      {testimonials.length > 0 && (
        <section className="testimonials-section">
          <div className="container">
            <motion.div
              className="section-header"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2>What Our Clients Say</h2>
              <p>Trusted by thousands of property buyers across Odisha</p>
            </motion.div>

            <div className="testimonials-carousel">
              <button
                className="carousel-btn prev"
                onClick={() => setActiveTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length)}
              >
                <FiChevronLeft />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  className="testimonial-card"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="testimonial-rating">
                    {[...Array(testimonials[activeTestimonial]?.rating || 5)].map((_, i) => (
                      <FiStar key={i} className="star" />
                    ))}
                  </div>
                  <p className="testimonial-text">"{testimonials[activeTestimonial]?.text}"</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">
                      {testimonials[activeTestimonial]?.avatar ? (
                        <img src={testimonials[activeTestimonial].avatar} alt={testimonials[activeTestimonial].name} />
                      ) : (
                        <FiUser size={24} />
                      )}
                    </div>
                    <div>
                      <h4>{testimonials[activeTestimonial]?.name}</h4>
                      <p>{testimonials[activeTestimonial]?.role}{testimonials[activeTestimonial]?.company ? ` at ${testimonials[activeTestimonial].company}` : ''}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <button
                className="carousel-btn next"
                onClick={() => setActiveTestimonial(prev => (prev + 1) % testimonials.length)}
              >
                <FiChevronRight />
              </button>
            </div>

            <div className="testimonial-dots">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${activeTestimonial === index ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PARTNERS ===== */}
      {partners.length > 0 && (
        <section className="partners-section">
          <div className="container">
            <motion.div
              className="section-header"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2>Our Trusted Partners</h2>
              <p>Collaborating with top organizations for the best real estate experience</p>
            </motion.div>

            <motion.div
              className="partners-grid"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {partners.map((partner, index) => (
                <div key={partner.id || index} className="partner-card">
                  {partner.website ? (
                    <a href={partner.website} target="_blank" rel="noopener noreferrer">
                      {partner.logo ? (
                        <img
                          src={partner.logo.startsWith('http') ? partner.logo : `${window.location.origin}${partner.logo}`}
                          alt={partner.name}
                          className="partner-logo"
                        />
                      ) : (
                        <div className="partner-name-only">{partner.name}</div>
                      )}
                    </a>
                  ) : (
                    <>
                      {partner.logo ? (
                        <img
                          src={partner.logo.startsWith('http') ? partner.logo : `${window.location.origin}${partner.logo}`}
                          alt={partner.name}
                          className="partner-logo"
                        />
                      ) : (
                        <div className="partner-name-only">{partner.name}</div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== BLOG POSTS ===== */}
      {blogPosts.length > 0 && (
        <section className="blog-section">
          <div className="container">
            <motion.div
              className="section-header"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2>Latest from Our Blog</h2>
              <p>Stay updated with real estate news and insights</p>
            </motion.div>

            <div className="blog-grid">
              {blogPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  className="blog-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Link to={`/blog/${post.slug}`}>
                    <div className="blog-image">
                      {post.coverImage ? (
                        <img
                          src={post.coverImage.startsWith('http') ? post.coverImage : `${window.location.origin}${post.coverImage}`}
                          alt={post.title}
                        />
                      ) : (
                        <div className="blog-image-placeholder">
                          <FiCalendar size={32} />
                        </div>
                      )}
                    </div>
                    <div className="blog-content">
                      {post.category && <span className="blog-category">{post.category}</span>}
                      <h3>{post.title}</h3>
                      <p>{post.excerpt || post.content?.substring(0, 120) + '...'}</p>
                      <span className="blog-date">
                        <FiCalendar size={14} /> {new Date(post.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="section-cta">
              <Link to="/blog" className="cta-btn">
                View All Posts <FiArrowRight />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA BANNER ===== */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Ready to Find Your Dream Property?</h2>
            <p>Contact our team today and let us help you find the perfect property in Rourkela and across Odisha.</p>
            <div className="cta-buttons">
              <Link to="/list" className="cta-btn primary">
                Browse Properties <FiArrowRight />
              </Link>
              <Link to="/contact" className="cta-btn secondary">
                Contact Us <FiPhone />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
