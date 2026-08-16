import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiRequest from '../../lib/apiRequest';
import { motion } from 'framer-motion';
import { FiCalendar, FiUser, FiArrowRight, FiSearch, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './BlogListPage.scss';

function BlogListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const postsPerPage = 9;

  useEffect(() => {
    fetchPosts();
  }, [currentPage, selectedCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let url = `/cms/blog?page=${currentPage}&limit=${postsPerPage}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      const res = await apiRequest.get(url);
      const postList = res.data?.posts || res.data || [];
      const pagination = res.data?.pagination || {};
      const total = pagination.total || res.data?.total || postList.length;

      setPosts(postList);
      setTotalPages(pagination.totalPages || res.data?.totalPages || Math.ceil(total / postsPerPage) || 1);

      // Extract categories from posts if not provided
      if (categories.length === 0 && postList.length > 0) {
        const cats = [...new Set(postList.map(p => p.category).filter(Boolean))];
        setCategories(cats);
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  // Filter by search query client-side
  const filteredPosts = searchQuery
    ? posts.filter(post =>
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  return (
    <div className="blog-list-page">
      {/* Hero Section */}
      <section className="blog-hero">
        <div className="hero-overlay" />
        <div className="container">
          <motion.div
            className="blog-hero-content"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="hero-badge">Our Blog</span>
            <h1>Latest Insights & Articles</h1>
            <p>Stay updated with the latest real estate trends, tips, and news from Rourkela and Odisha</p>
          </motion.div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="blog-filters">
        <div className="container">
          <div className="filters-bar">
            <div className="search-box">
              <FiSearch size={18} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="category-filters">
              <button
                className={`category-btn ${!selectedCategory ? 'active' : ''}`}
                onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="blog-content">
        <div className="container">
          {loading ? (
            <div className="blog-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="blog-card-skeleton">
                  <div className="skeleton-image" />
                  <div className="skeleton-content">
                    <div className="skeleton-line long" />
                    <div className="skeleton-line medium" />
                    <div className="skeleton-line short" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="no-posts">
              <span className="no-posts-icon">📝</span>
              <h3>No Articles Found</h3>
              <p>{searchQuery ? 'Try a different search term' : 'Check back later for new articles'}</p>
              {searchQuery && (
                <button className="btn btn-primary" onClick={() => setSearchQuery('')}>
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <motion.div
              className="blog-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredPosts.map((post) => (
                <motion.div key={post.id} variants={itemVariants}>
                  <Link to={`/blog/${post.slug}`} className="blog-card">
                    <div className="blog-card-image">
                      {post.coverImage ? (
                        <img
                          src={post.coverImage.startsWith('http') ? post.coverImage : `${window.location.origin}${post.coverImage}`}
                          alt={post.title}
                        />
                      ) : (
                        <div className="blog-card-placeholder">
                          <span>📝</span>
                        </div>
                      )}
                      {post.category && (
                        <span className="blog-card-category">
                          <FiTag size={12} /> {post.category}
                        </span>
                      )}
                    </div>
                    <div className="blog-card-content">
                      <h3>{post.title}</h3>
                      <p className="blog-card-excerpt">
                        {post.excerpt || post.content?.substring(0, 150) + '...'}
                      </p>
                      <div className="blog-card-meta">
                        <span><FiCalendar size={14} /> {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {post.author && <span><FiUser size={14} /> {post.author?.username || post.author}</span>}
                      </div>
                      <span className="read-more">
                        Read More <FiArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

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
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default BlogListPage;
