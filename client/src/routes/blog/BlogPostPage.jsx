import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiRequest from '../../lib/apiRequest';
import { motion } from 'framer-motion';
import { FiCalendar, FiUser, FiArrowLeft, FiShare2, FiFacebook, FiTwitter, FiLink, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './BlogPostPage.scss';

function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchPost();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await apiRequest.get(`/cms/blog/${slug}`);
      setPost(res.data);

      // Fetch related posts
      if (res.data?.category) {
        try {
          const relatedRes = await apiRequest.get(`/cms/blog?category=${res.data.category}&limit=3`);
          const related = (relatedRes.data?.posts || relatedRes.data || [])
            .filter(p => p.slug !== slug)
            .slice(0, 3);
          setRelatedPosts(related);
        } catch (err) {
          console.log('Could not fetch related posts');
        }
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
      toast.error('Post not found');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = post?.title || '';

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          setCopySuccess(true);
          toast.success('Link copied to clipboard!');
          setTimeout(() => setCopySuccess(false), 2000);
        });
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="blog-post-page">
        <div className="container">
          <div className="post-skeleton">
            <div className="skeleton-image" />
            <div className="skeleton-content">
              <div className="skeleton-line long" />
              <div className="skeleton-line medium" />
              <div className="skeleton-line long" />
              <div className="skeleton-line short" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="blog-post-page">
        <div className="container">
          <div className="post-not-found">
            <span>📝</span>
            <h2>Post Not Found</h2>
            <p>The blog post you are looking for does not exist or has been removed.</p>
            <Link to="/blog" className="btn btn-primary">
              <FiArrowLeft /> Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-post-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-bar">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/blog">Blog</Link>
            <span>/</span>
            <span className="current">{post.title}</span>
          </div>
        </div>
      </div>

      <article className="blog-post-content">
        <div className="container">
          <div className="post-layout">
            {/* Main Content */}
            <motion.div
              className="post-main"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Cover Image */}
              {post.coverImage && (
                <div className="post-cover">
                  <img
                    src={post.coverImage.startsWith('http') ? post.coverImage : `${window.location.origin}${post.coverImage}`}
                    alt={post.title}
                  />
                </div>
              )}

              {/* Post Header */}
              <div className="post-header">
                {post.category && (
                  <span className="post-category">
                    <FiTag size={14} /> {post.category}
                  </span>
                )}
                <h1>{post.title}</h1>
                <div className="post-meta">
                  <span><FiCalendar size={14} /> {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  {post.author && (
                    <span className="author-info">
                      <FiUser size={14} /> {post.author?.username || post.author}
                    </span>
                  )}
                  {post.readTime && <span>⏱ {post.readTime} min read</span>}
                </div>
              </div>

              {/* Post Body */}
              <div
                className="post-body"
                dangerouslySetInnerHTML={{ __html: post.content || post.body || '' }}
              />

              {/* Share Buttons */}
              <div className="post-share">
                <h4>Share this article</h4>
                <div className="share-buttons">
                  <button className="share-btn facebook" onClick={() => handleShare('facebook')}>
                    <FiFacebook size={18} /> Facebook
                  </button>
                  <button className="share-btn twitter" onClick={() => handleShare('twitter')}>
                    <FiTwitter size={18} /> Twitter
                  </button>
                  <button className="share-btn copy" onClick={() => handleShare('copy')}>
                    <FiLink size={18} /> {copySuccess ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* Author Card */}
              {post.author && (
                <div className="author-card">
                  <div className="author-avatar">
                    {post.author?.avatar ? (
                      <img src={post.author.avatar} alt={post.author.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {(post.author?.username || post.author || 'A').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="author-details">
                    <h4>{post.author?.username || post.author}</h4>
                    <p>{post.author?.bio || post.authorBio || 'Real estate enthusiast and content writer.'}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Sidebar */}
            <aside className="post-sidebar">
              {/* Share Sidebar */}
              <div className="sidebar-card share-sidebar">
                <h4><FiShare2 size={16} /> Share</h4>
                <div className="share-icons">
                  <button onClick={() => handleShare('facebook')} aria-label="Share on Facebook">
                    <FiFacebook size={20} />
                  </button>
                  <button onClick={() => handleShare('twitter')} aria-label="Share on Twitter">
                    <FiTwitter size={20} />
                  </button>
                  <button onClick={() => handleShare('copy')} aria-label="Copy link">
                    <FiLink size={20} />
                  </button>
                </div>
              </div>

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div className="sidebar-card related-sidebar">
                  <h4>Related Articles</h4>
                  <div className="related-list">
                    {relatedPosts.map((relPost) => (
                      <Link key={relPost.id} to={`/blog/${relPost.slug}`} className="related-item">
                        <div className="related-image">
                          {relPost.coverImage ? (
                            <img
                              src={relPost.coverImage.startsWith('http') ? relPost.coverImage : `${window.location.origin}${relPost.coverImage}`}
                              alt={relPost.title}
                            />
                          ) : (
                            <span>📝</span>
                          )}
                        </div>
                        <div className="related-info">
                          <h5>{relPost.title}</h5>
                          <span>{new Date(relPost.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Back to Blog */}
              <Link to="/blog" className="back-to-blog">
                <FiArrowLeft size={16} /> Back to Blog
              </Link>
            </aside>
          </div>
        </div>
      </article>
    </div>
  );
}

export default BlogPostPage;
