import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiRequest from '../../lib/apiRequest';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiChevronDown, FiMessageCircle, FiPhone, FiMail, FiHelpCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './FaqPage.scss';

function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);

  useEffect(() => {
    fetchFaqs();
    fetchCompanyInfo();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const url = activeCategory ? `/cms/faqs?category=${activeCategory}` : '/cms/faqs';
      const res = await apiRequest.get(url);
      const faqData = res.data || [];
      setFaqs(faqData);

      // Extract categories
      if (categories.length === 0) {
        const cats = [...new Set(faqData.map(f => f.category).filter(Boolean))];
        setCategories(cats);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      const res = await apiRequest.get('/company/settings');
      setCompanyInfo(res.data);
    } catch (error) {
      console.log('Company info not available');
    }
  };

  useEffect(() => {
    if (activeCategory !== '') {
      fetchFaqs();
    }
  }, [activeCategory]);

  const filteredFaqs = searchQuery
    ? faqs.filter(faq =>
        faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const defaultFaqs = [
    { question: 'How do I browse available properties?', answer: 'You can browse our properties by visiting the Properties page. Use filters to narrow down by city, property type, price range, and more.', category: 'General' },
    { question: 'How does the booking process work?', answer: 'Once you find a property you like, you can book it by paying a token amount online. Our team will then connect with you to complete the documentation.', category: 'Booking' },
    { question: 'Are the properties verified?', answer: 'Yes, all properties listed on our platform are thoroughly verified by our legal team. We ensure all documents are authentic before listing.', category: 'Verification' },
    { question: 'What payment methods do you accept?', answer: 'We accept UPI, bank transfers, credit/debit cards, and net banking for token payments. For full payments, we facilitate direct bank transfers.', category: 'Payment' },
    { question: 'Can I get a refund on my token amount?', answer: 'Token amounts are refundable within 7 days of booking, subject to our cancellation policy. Please contact our support team for assistance.', category: 'Payment' },
    { question: 'Do you offer property loans?', answer: 'While we dont directly offer loans, we have partnerships with leading banks and NBFCs that can help you secure financing for your property purchase.', category: 'Finance' },
  ];

  const displayFaqs = filteredFaqs.length > 0 ? filteredFaqs : (searchQuery ? [] : defaultFaqs);

  return (
    <div className="faq-page">
      {/* Hero Section */}
      <section className="faq-hero">
        <div className="hero-overlay" />
        <div className="container">
          <motion.div
            className="faq-hero-content"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="hero-badge"><FiHelpCircle size={16} /> Help Center</span>
            <h1>Frequently Asked Questions</h1>
            <p>Find answers to common questions about our real estate services</p>

            <div className="faq-search">
              <FiSearch size={20} />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="faq-categories">
        <div className="container">
          <div className="category-pills">
            <button
              className={`category-pill ${!activeCategory ? 'active' : ''}`}
              onClick={() => { setActiveCategory(''); setOpenIndex(null); }}
            >
              All Questions
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="faq-content">
        <div className="container">
          {loading ? (
            <div className="faq-skeleton">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="faq-skeleton-item">
                  <div className="skeleton-line long" />
                  <div className="skeleton-line medium" />
                </div>
              ))}
            </div>
          ) : displayFaqs.length === 0 ? (
            <div className="no-faqs">
              <span>🔍</span>
              <h3>No matching questions found</h3>
              <p>Try a different search term or browse all categories</p>
              <button className="btn btn-primary" onClick={() => { setSearchQuery(''); setActiveCategory(''); }}>
                View All FAQs
              </button>
            </div>
          ) : (
            <div className="faq-accordion">
              {displayFaqs.map((faq, index) => (
                <motion.div
                  key={faq.id || index}
                  className={`faq-item ${openIndex === index ? 'open' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <button
                    className="faq-question"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={openIndex === index}
                  >
                    <span className="faq-category-tag">{faq.category || 'General'}</span>
                    <span className="faq-question-text">{faq.question}</span>
                    <FiChevronDown className={`faq-chevron ${openIndex === index ? 'rotate' : ''}`} size={20} />
                  </button>
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        className="faq-answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="faq-answer-content">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="faq-cta">
        <div className="container">
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Still Have Questions?</h2>
            <p>Our support team is ready to help you with any queries about properties, bookings, or our services.</p>
            <div className="cta-actions">
              <Link to="/contact" className="btn btn-primary btn-lg">
                <FiMessageCircle size={18} /> Contact Support
              </Link>
              {companyInfo?.phone && (
                <a href={`tel:${companyInfo.phone}`} className="btn btn-outline btn-lg">
                  <FiPhone size={18} /> Call {companyInfo.phone}
                </a>
              )}
              {companyInfo?.email && (
                <a href={`mailto:${companyInfo.email}`} className="btn btn-outline btn-lg">
                  <FiMail size={18} /> Email Us
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default FaqPage;
