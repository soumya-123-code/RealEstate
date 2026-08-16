import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiRequest from '../../lib/apiRequest';
import { motion } from 'framer-motion';
import { FiShield, FiDollarSign, FiHeadphones, FiZap, FiMapPin, FiPhone, FiMail, FiArrowRight, FiTarget, FiEye, FiAward, FiUsers, FiGlobe } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './About.scss';

function About() {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [team, setTeam] = useState([]);
  const [services, setServices] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const [companyRes, teamRes, servicesRes, partnersRes] = await Promise.allSettled([
          apiRequest.get('/company/settings'),
          apiRequest.get('/cms/team'),
          apiRequest.get('/cms/services'),
          apiRequest.get('/cms/partners'),
        ]);

        if (companyRes.status === 'fulfilled') setCompanyInfo(companyRes.value.data);
        if (teamRes.status === 'fulfilled') setTeam(teamRes.value.data || []);
        if (servicesRes.status === 'fulfilled') setServices(servicesRes.value.data || []);
        if (partnersRes.status === 'fulfilled') setPartners(partnersRes.value.data || []);
      } catch (error) {
        console.error('Error fetching about data:', error);
        toast.error('Failed to load some content');
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();
  }, []);

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

  const getFeatureIcon = (iconName) => {
    const icons = {
      shield: <FiShield size={28} />,
      dollar: <FiDollarSign size={28} />,
      headphones: <FiHeadphones size={28} />,
      zap: <FiZap size={28} />,
      FiShield: <FiShield size={28} />,
      FiDollarSign: <FiDollarSign size={28} />,
      FiHeadphones: <FiHeadphones size={28} />,
      FiZap: <FiZap size={28} />,
    };
    return icons[iconName] || <FiZap size={28} />;
  };

  const defaultServices = [
    { icon: 'shield', title: 'Verified Properties', description: 'All land properties are thoroughly verified and authenticated by our expert legal team' },
    { icon: 'dollar', title: 'Best Prices', description: 'Get the most competitive prices in the market with complete transparency' },
    { icon: 'headphones', title: 'Expert Support', description: '24/7 customer support to help you with all your property queries and concerns' },
    { icon: 'zap', title: 'Quick Process', description: 'Fast and hassle-free booking process with instant confirmation and documentation' }
  ];

  const displayServices = services.length > 0 ? services : defaultServices;
  const companyName = companyInfo?.companyName || 'Suretreaven';

  const statsData = [
    { value: companyInfo?.statsProperties || 500, label: 'Properties Listed', icon: <FiAward size={28} /> },
    { value: companyInfo?.statsCustomers || 350, label: 'Happy Customers', icon: <FiUsers size={28} /> },
    { value: companyInfo?.statsCities || 25, label: 'Cities Covered', icon: <FiMapPin size={28} /> },
    { value: companyInfo?.statsYears || 10, label: 'Years Experience', icon: <FiZap size={28} /> }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-overlay" />
        <div className="container">
          <motion.div
            className="about-hero-content"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="hero-badge">About Us</span>
            <h1>{companyName}</h1>
            <p>{companyInfo?.tagline || 'Your trusted partner in finding the perfect property in Rourkela & Odisha'}</p>
          </motion.div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="about-overview">
        <div className="container">
          <div className="overview-grid">
            <motion.div
              className="overview-content"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2>Who We Are</h2>
              <p className="overview-description">
                {companyInfo?.description || 'We are a leading real estate platform based in Rourkela, Odisha, dedicated to making property buying, selling, and renting easier and more transparent. Our platform connects property seekers with their dream homes while providing comprehensive property management solutions.'}
              </p>

              <div className="overview-highlights">
                <div className="highlight-item">
                  <FiTarget size={20} />
                  <div>
                    <h4>Our Mission</h4>
                    <p>{companyInfo?.mission || 'To provide transparent, verified, and affordable real estate solutions that empower every Indian to find their perfect property.'}</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <FiEye size={20} />
                  <div>
                    <h4>Our Vision</h4>
                    <p>{companyInfo?.vision || 'To become the most trusted real estate platform in Odisha and Eastern India, known for integrity and innovation.'}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="overview-image"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {companyInfo?.aboutImage ? (
                <img
                  src={companyInfo.aboutImage.startsWith('http') ? companyInfo.aboutImage : `${window.location.origin}${companyInfo.aboutImage}`}
                  alt={companyName}
                />
              ) : (
                <div className="image-placeholder">
                  <span>🏠</span>
                  <p>Building Dreams Since 2014</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats">
        <div className="container">
          <div className="stats-grid">
            {statsData.map((stat, index) => (
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

      {/* Why Choose Us / Services */}
      <section className="about-services">
        <div className="container">
          <motion.div
            className="section-header-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2>Why Choose {companyName}</h2>
            <p>Your trusted partner in real estate since {companyInfo?.foundedYear || 2014}</p>
          </motion.div>

          <motion.div
            className="services-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {displayServices.map((service, index) => (
              <motion.div
                key={service.id || index}
                className="service-card"
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <div className="service-icon-wrapper">
                  {service.icon ? getFeatureIcon(service.icon) : <FiZap size={28} />}
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      {team.length > 0 && (
        <section className="about-team">
          <div className="container">
            <motion.div
              className="section-header-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2>Meet Our Team</h2>
              <p>The experts behind your real estate success</p>
            </motion.div>

            <motion.div
              className="team-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {team.map((member) => (
                <motion.div key={member.id} className="team-card" variants={itemVariants}>
                  <div className="team-avatar">
                    {member.photo ? (
                      <img
                        src={member.photo.startsWith('http') ? member.photo : `${window.location.origin}${member.photo}`}
                        alt={member.name}
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {member.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3>{member.name}</h3>
                  <p className="team-role">{member.designation || member.role}</p>
                  {member.bio && <p className="team-bio">{member.bio}</p>}
                  <div className="team-social">
                    {member.linkedin && (
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">in</a>
                    )}
                    {member.email && (
                      <a href={`mailto:${member.email}`} aria-label="Email"><FiMail size={16} /></a>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Partners Section */}
      {partners.length > 0 && (
        <section className="about-partners">
          <div className="container">
            <motion.div
              className="section-header-center"
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
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '32px',
                padding: '20px 0',
              }}
            >
              {partners.map((partner, index) => (
                <div
                  key={partner.id || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 24px',
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    minWidth: '160px',
                    minHeight: '80px',
                  }}
                >
                  {partner.logo ? (
                    <img
                      src={partner.logo.startsWith('http') ? partner.logo : `${window.location.origin}${partner.logo}`}
                      alt={partner.name}
                      style={{ maxHeight: '50px', maxWidth: '140px', objectFit: 'contain', opacity: 0.7 }}
                    />
                  ) : (
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>{partner.name}</span>
                  )}
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="about-cta">
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
              <Link to="/list" className="btn btn-primary btn-lg">
                Browse Properties <FiArrowRight />
              </Link>
              <Link to="/contact" className="btn btn-outline btn-lg">
                Contact Us
              </Link>
            </div>
            {companyInfo?.phone && (
              <a href={`tel:${companyInfo.phone}`} className="cta-phone">
                <FiPhone size={18} /> Call us: {companyInfo.phone}
              </a>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default About;
