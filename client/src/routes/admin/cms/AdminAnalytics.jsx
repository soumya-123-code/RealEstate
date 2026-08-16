import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import apiRequest from '../../../lib/apiRequest';
import './AdminCms.scss';

function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest.get('/cms/admin/analytics');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
      setData(null);
      toast.error(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const overview = data?.overview || {};
  const cms = data?.cms || {};

  const overviewStats = [
    { label: 'Properties', value: overview.totalProperties },
    { label: 'Available', value: overview.availableProperties },
    { label: 'Token booked', value: overview.tokenBooked },
    { label: 'Sold', value: overview.soldProperties },
    { label: 'Bookings', value: overview.totalBookings },
    { label: 'Token paid', value: overview.tokenPaidBookings },
    { label: 'Users', value: overview.totalUsers },
    { label: 'Agents', value: overview.totalAgents },
    { label: 'Leads', value: overview.totalLeads },
    { label: 'New leads', value: overview.newLeads },
    { label: 'Contacts', value: overview.totalContacts },
    { label: 'Unread contacts', value: overview.unreadContacts },
  ];

  const cmsStats = [
    { label: 'Banners', value: cms.totalBanners },
    { label: 'Testimonials', value: cms.totalTestimonials },
    { label: 'FAQs', value: cms.totalFaqs },
    { label: 'Blog posts', value: cms.totalBlogPosts },
    { label: 'Team', value: cms.totalTeamMembers },
    { label: 'Partners', value: cms.totalPartners },
  ];

  return (
    <div className="cms-page">
      <div className="cms-toolbar">
        <div>
          <h2 className="cms-toolbar__title">CMS Analytics</h2>
          <p className="cms-toolbar__sub">Overview of inventory, leads, and content volume</p>
        </div>
        <div className="cms-toolbar__actions">
          <button type="button" className="cms-btn cms-btn--ghost" onClick={fetchData}>
            <FiRefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="cms-state">
          <div className="cms-spinner" />
          <p>Loading analytics…</p>
        </div>
      )}

      {!loading && error && (
        <div className="cms-state cms-state--error">
          <FiAlertCircle size={28} />
          <p>{error}</p>
          <button type="button" className="cms-btn cms-btn--ghost" onClick={fetchData}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="cms-panel">
            <h3 className="cms-panel__title">Business overview</h3>
            <div className="cms-stats">
              {overviewStats.map((stat) => (
                <div key={stat.label} className="cms-stat">
                  <p className="cms-stat__value">{stat.value ?? 0}</p>
                  <p className="cms-stat__label">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="cms-panel">
            <h3 className="cms-panel__title">CMS content</h3>
            <div className="cms-stats">
              {cmsStats.map((stat) => (
                <div key={stat.label} className="cms-stat">
                  <p className="cms-stat__value">{stat.value ?? 0}</p>
                  <p className="cms-stat__label">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminAnalytics;
