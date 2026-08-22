import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import apiRequest from '../../lib/apiRequest';
import Card from '../../components/Card/Card';
import { PropertyListSkeleton } from '../../components/Skeleton/Skeleton';
import Seo from '../../components/Seo/Seo';
import { sanitizeAppPath } from '../../lib/sanitizeAppPath';
import { mediaUrl } from '../../lib/utils';
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
  FiHome,
  FiX,
  FiUsers,
  FiMonitor,
  FiFileText,
} from 'react-icons/fi';
import { BRAND_IMAGES } from '../../lib/brand-images';
import './HomePage.scss';

const HERO_FEATURES = [
  { title: 'Thoughtful Design', description: 'Homes crafted with care and precision.', icon: <FiHome /> },
  { title: 'Prime Locations', description: 'Well-connected and future-ready.', icon: <FiMapPin /> },
  { title: 'Sustainable Living', description: 'Eco-friendly homes for a better tomorrow.', icon: <FiGlobe /> },
  { title: 'Trusted Quality', description: 'Built on integrity, delivered with pride.', icon: <FiShield /> },
];

/**
 * Section renderer registry. Order and visibility come from the CMS page
 * composition (Admin → Website → Pages → Home); each renderer receives its
 * PageSection so admins control titles, subtitles and CTA labels.
 */
function HomePage() {
  const navigate = useNavigate();
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);
  const bannerIntervalRef = useRef(null);

  const defaultBanners = [
    {
      title: 'Rooted in Odisha.',
      subtitle: 'Thoughtfully designed homes inspired by nature, culture and the timeless spirit of Odisha.',
      image: BRAND_IMAGES.hero,
      buttonText: 'Explore Properties',
      buttonLink: '/list',
    },
  ];

  const defaultFeatures = [
    { icon: 'map', title: 'Local Expertise', description: 'Deep knowledge of Odisha’s real estate market to help you find the right property.' },
    { icon: 'shield', title: 'Trusted & Verified', description: 'Every property is verified for authenticity, legal compliance and peace of mind.' },
    { icon: 'users', title: 'Personalized Service', description: 'Dedicated support tailored to your needs at every step.' },
    { icon: 'monitor', title: 'Smart Technology', description: 'Advanced tools and real-time updates for a faster, easier search.' },
    { icon: 'file', title: 'Transparent Process', description: 'Clear communication and honest documentation, always.' },
    { icon: 'headphones', title: 'After-Sales Support', description: 'We stay with you even after you buy for any support you need.' },
  ];

  // Get icon component from string name
  const getFeatureIcon = (iconName) => {
    const icons = {
      shield: <FiShield size={22} />,
      dollar: <FiDollarSign size={22} />,
      headphones: <FiHeadphones size={22} />,
      zap: <FiZap size={22} />,
      map: <FiMapPin size={22} />,
      star: <FiStar size={22} />,
      user: <FiUser size={22} />,
      users: <FiUsers size={22} />,
      globe: <FiGlobe size={22} />,
      phone: <FiPhone size={22} />,
      play: <FiPlay size={22} />,
      monitor: <FiMonitor size={22} />,
      file: <FiFileText size={22} />,
      FiShield: <FiShield size={22} />,
      FiDollarSign: <FiDollarSign size={22} />,
      FiHeadphones: <FiHeadphones size={22} />,
      FiZap: <FiZap size={22} />,
      FiUsers: <FiUsers size={22} />,
      FiMonitor: <FiMonitor size={22} />,
      FiFileText: <FiFileText size={22} />,
      FiMapPin: <FiMapPin size={22} />,
    };
    return icons[iconName] || <FiStar size={22} />;
  };

  // Fetch homepage data (content + section composition) from CMS API
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

  const banners = homeData?.banners?.length ? homeData.banners : defaultBanners;

  useEffect(() => {
    if (banners.length <= 1) return;

    if (bannerIntervalRef.current) clearInterval(bannerIntervalRef.current);
    bannerIntervalRef.current = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => {
      if (bannerIntervalRef.current) clearInterval(bannerIntervalRef.current);
    };
  }, [banners.length]);
  const cmsServices = homeData?.services || [];
  const services = defaultFeatures.map((item, index) => {
    const cms = cmsServices[index];
    if (!cms) return item;
    return {
      ...item,
      id: cms.id,
      title: cms.title || item.title,
      description: cms.description || item.description,
      icon: cms.icon || item.icon,
    };
  });
  const testimonials = homeData?.testimonials || [];
  const featuredProperties = homeData?.featuredProperties || [];
  const blogPosts = homeData?.blogPosts || [];
  const partners = homeData?.partners || [];
  const cityStats = homeData?.cityStats || [];
  const companyName = homeData?.companyInfo?.companyName || 'Suretreaven';

  /**
   * CMS section composition. When absent (fresh install / API down) fall
   * back to the canonical layout so the homepage is never blank.
   */
  const FALLBACK_SECTIONS = [
    { key: 'hero', type: 'HERO' },
    { key: 'featured', type: 'FEATURED_PROPERTIES' },
    { key: 'services', type: 'SERVICES' },
    { key: 'cities', type: 'CUSTOM' },
    { key: 'testimonials', type: 'TESTIMONIALS' },
    { key: 'partners', type: 'PARTNERS' },
    { key: 'blog', type: 'BLOG' },
    { key: 'cta', type: 'CTA', subtitle: 'Ready to find your dream property?', buttonText: 'Browse Properties', buttonLink: '/list' },
  ];
  const sections =
    Array.isArray(homeData?.sections) && homeData.sections.length > 0
      ? homeData.sections
      : FALLBACK_SECTIONS;

  const sectionValue = (section, field, fallback) => {
    const v = section?.[field];
    return v === undefined || v === null || v === '' ? fallback : v;
  };

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

  // ============ SECTION RENDERERS ============

  const renderHero = () => {
    const slide = banners[activeBanner] || banners[0];
    const slideImage = slide?.image ? mediaUrl(slide.image) : BRAND_IMAGES.hero;

    return (
    <section className="hero-section" aria-label="Rooted in Odisha" key="hero">
      <div className="hero-visual" aria-hidden="true">
        <AnimatePresence mode="wait">
          <motion.div
            key={slideImage || activeBanner}
            className="hero-slide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div
              className="hero-bg-image"
              style={{ backgroundImage: `url(${slideImage})` }}
            />
          </motion.div>
        </AnimatePresence>
        <div className="hero-chakra" />
        <div className="hero-frieze" />
        <div className="hero-overlay" />
      </div>

      <div className="hero-inner">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <p className="hero-kicker">Modern Living Spaces.</p>
          <h1>Rooted in Odisha.</h1>
          <p className="hero-subtitle">
            Thoughtfully designed homes inspired by nature, culture and the timeless spirit of Odisha. Premium properties. Trusted legacy.
          </p>
          <div className="hero-buttons">
            <Link to="/list" className="hero-btn primary">
              Explore Properties <FiArrowRight />
            </Link>
            <button type="button" className="hero-btn watch" onClick={() => setVideoOpen(true)}>
              <span className="hero-btn__play" aria-hidden="true"><FiPlay /></span>
              Watch Video
            </button>
          </div>
        </motion.div>
      </div>

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

      <div className="hero-features">
        {HERO_FEATURES.map((item) => (
          <div className="hero-feature" key={item.title}>
            <span className="hero-feature__icon" aria-hidden="true">{item.icon}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {videoOpen && createPortal(
        <div className="hero-video-modal" role="dialog" aria-modal="true" aria-label="Watch video">
          <button type="button" className="hero-video-modal__backdrop" onClick={() => setVideoOpen(false)} aria-label="Close video" />
          <div className="hero-video-modal__panel">
            <button type="button" className="hero-video-modal__close" onClick={() => setVideoOpen(false)} aria-label="Close">
              <FiX size={22} />
            </button>
            <video src="/hero.mp4" controls autoPlay playsInline />
          </div>
        </div>,
        document.body
      )}
    </section>
    );
  };

  const renderFeatured = (section) => {
    if (!featuredProperties.length) return null;
    const limit = Number(section?.config?.count) || 4;

    return (
      <section className="featured-section" key="featured">
        <div className="featured-deco featured-deco--mandala" aria-hidden="true" />
        <img
          className="featured-deco featured-deco--folk"
          src="/brand/title-warli.png?v=2"
          alt=""
        />
        <img className="featured-deco featured-deco--leaves" src="/brand/deco-leaves.png" alt="" />
        <div className="container">
          <motion.div
            className="featured-heading-row"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="section-header featured-header">
              <p className="featured-kicker">
                <span>◆</span> Featured Properties <span>◆</span>
              </p>
              <h2>
                <span className="featured-title-lead">Our Featured</span>{' '}
                Properties
              </h2>
              <p>
                {sectionValue(
                  section,
                  'subtitle',
                  'Handpicked premium properties that blend modern living with Odisha’s natural beauty and culture.'
                )}
              </p>
            </div>
          </motion.div>

          <div className="featured-grid">
            {featuredProperties.slice(0, limit).map((property) => (
              <Card key={property.id} item={property} />
            ))}
          </div>

          <div className="section-cta">
            <Link to="/list" className="cta-btn featured-cta">
              View All Properties <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>
    );
  };

  const renderServices = (section) => {
    const whyTitle = sectionValue(section, 'title', 'Why Choose Us');
    const whyWords = String(whyTitle).trim().split(/\s+/);
    const whyLead = whyWords[0] || 'Why';
    const whyRest = whyWords.slice(1).join(' ') || 'Choose Us';

    return (
    <section className="why-section" key="services">
      <div className="why-deco" aria-hidden="true">
        <img className="why-deco__art" src="/brand/why-left.png" alt="" />
      </div>
      <div className="container">
        <motion.div
          className="why-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="why-kicker">
            <span>◆</span> Why Choose Us <span>◆</span>
          </p>
          <h2>
            <span className="why-title-lead">{whyLead}</span> {whyRest}
          </h2>
          <span className="why-divider" aria-hidden="true" />
          <p>
            {sectionValue(
              section,
              'subtitle',
              'We combine local expertise with trusted service and modern technology to deliver the best property experience.'
            )}
          </p>
        </motion.div>

        <motion.div
          className="why-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {services.map((service, index) => (
            <motion.div
              key={service.id || index}
              className="why-card"
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
            >
              <div className="why-card__icon">
                {service.icon ? getFeatureIcon(service.icon) : <FiStar size={22} />}
              </div>
              <div className="why-card__body">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
    );
  };

  const renderCities = (section) => {
    if (!cityStats.length) return null;

    return (
      <section className="cities-section" key="cities">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2>{sectionValue(section, 'title', 'Popular Cities in Odisha')}</h2>
            <p>{sectionValue(section, 'subtitle', 'Explore properties in top cities across the state')}</p>
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
    );
  };

  const renderTestimonials = (section) => {
    if (!testimonials.length) return null;

    return (
      <section className="testimonials-section" key="testimonials">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2>{sectionValue(section, 'title', 'What Our Clients Say')}</h2>
            <p>{sectionValue(section, 'subtitle', 'Trusted by thousands of property buyers across Odisha')}</p>
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
                <p className="testimonial-text">&ldquo;{testimonials[activeTestimonial]?.text}&rdquo;</p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {testimonials[activeTestimonial]?.avatar ? (
                      <img src={mediaUrl(testimonials[activeTestimonial].avatar)} alt={testimonials[activeTestimonial].name} />
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
    );
  };

  const renderPartners = (section) => {
    if (!partners.length) return null;

    return (
      <section className="partners-section" key="partners">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2>{sectionValue(section, 'title', 'Our Trusted Partners')}</h2>
            <p>{sectionValue(section, 'subtitle', 'Collaborating with top organizations for the best real estate experience')}</p>
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
                        src={mediaUrl(partner.logo)}
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
                        src={mediaUrl(partner.logo)}
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
    );
  };

  const renderBlog = (section) => {
    if (!blogPosts.length) return null;

    return (
      <section className="blog-section" key="blog">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2>{sectionValue(section, 'title', 'Latest from Our Blog')}</h2>
            <p>{sectionValue(section, 'subtitle', 'Stay updated with real estate news and insights')}</p>
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
                        src={mediaUrl(post.coverImage)}
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
    );
  };

  const renderCta = (section) => (
    <section className="cta-section" key="cta">
      <div className="container">
        <motion.div
          className="cta-content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>{sectionValue(section, 'title', 'Ready to Find Your Dream Property?')}</h2>
          <p>{sectionValue(section, 'subtitle', 'Contact our team today and let us help you find the perfect property in Rourkela and across Odisha.')}</p>
          <div className="cta-buttons">
            <Link to={sanitizeAppPath(section?.buttonLink, '/list')} className="cta-btn primary">
              {sectionValue(section, 'buttonText', 'Browse Properties')} <FiArrowRight />
            </Link>
            <Link to="/contact" className="cta-btn secondary">
              Contact Us <FiPhone />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );

  const renderCustom = (section) => {
    // Generic content block for admin-created CUSTOM sections
    if (!section?.title && !section?.content) return null;
    return (
      <section className="features-section" key={`custom-${section.key}`}>
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {section.title && <h2>{section.title}</h2>}
            {section.subtitle && <p>{section.subtitle}</p>}
          </motion.div>
          {section.content && <div className="custom-section-content"><p>{section.content}</p></div>}
          {section.buttonText && section.buttonLink && (
            <div className="section-cta">
              <Link to={sanitizeAppPath(section.buttonLink, '/list')} className="cta-btn">
                {section.buttonText} <FiArrowRight />
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderSection = (section) => {
    // The 'cities' CUSTOM section keeps its dedicated renderer
    if (section.type === 'CUSTOM' && section.key === 'cities') return renderCities(section);

    switch (section.type) {
      case 'HERO': return renderHero();
      case 'SEARCH': return null;
      case 'STATS': return null;
      case 'FEATURED_PROPERTIES': return renderFeatured(section);
      case 'SERVICES': return renderServices(section);
      case 'TESTIMONIALS': return renderTestimonials(section);
      case 'PARTNERS': return renderPartners(section);
      case 'BLOG': return renderBlog(section);
      case 'CTA': return renderCta(section);
      case 'CUSTOM': return renderCustom(section);
      default: return null;
    }
  };

  return (
    <div className="homePage">
      <Seo page="home" />
      {sections.map((section) => renderSection(section))}
    </div>
  );
}

export default HomePage;
