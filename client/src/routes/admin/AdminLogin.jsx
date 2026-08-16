import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../lib/apiRequest';
import { hasAdminPanelAccess, resolvePostLoginRedirect } from '../../lib/auth';
import toast from 'react-hot-toast';
import { FiMail, FiPhone, FiLock, FiKey, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import './AdminLogin.scss';

// Which login methods are allowed for admin/staff
const METHODS = ['password', 'otp'];

function AdminLogin() {
  const [method, setMethod] = useState('password'); // 'password' | 'otp'
  const [identifierType, setIdentifierType] = useState('email'); // 'email' | 'phone'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const { updateUser, getRoleRedirect } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const buildPayload = () => {
    const clean = identifier.trim();
    if (identifierType === 'email') return { email: clean };
    const digits = clean.replace(/\D/g, '');
    return { phone: digits.startsWith('91') ? `+${digits}` : `+91${digits}` };
  };

  const finishAdminLogin = (user, token, redirectTo) => {
    if (!hasAdminPanelAccess(user)) {
      toast.error("You don't have permission to access the admin panel.");
      return;
    }
    updateUser(user, token);
    toast.success('Welcome back!');
    navigate(
      resolvePostLoginRedirect(user, searchParams.get('redirect') || redirectTo) ||
        getRoleRedirect(user),
      { replace: true }
    );
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return toast.error('Fill all fields');
    setLoading(true);
    try {
      const res = await apiRequest.post('/auth/login', { ...buildPayload(), password });
      finishAdminLogin(res.data.user, res.data.token, res.data.redirectTo);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to sign you in. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return toast.error('Enter email or phone');
    setLoading(true);
    try {
      const res = await apiRequest.post('/auth/login', { ...buildPayload(), loginType: 'otp' });
      toast.success(res.data.message || 'OTP sent!');
      if (res.data.devOtp) toast(`🔑 Dev OTP: ${res.data.devOtp}`, { duration: 10000 });
      setOtpSent(true);
      setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return toast.error('Enter OTP');
    setLoading(true);
    try {
      const res = await apiRequest.post('/auth/verify-otp', { ...buildPayload(), otp });
      finishAdminLogin(res.data.user, res.data.token, res.data.redirectTo);
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtp('');
    setCountdown(0);
  };

  return (
    <div className="admin-login">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-icon">🏠</div>
          <h1>Admin Panel</h1>
          <p>Real Estate Management System</p>
        </div>

        {/* Method tabs */}
        <div className="method-tabs">
          {METHODS.map(m => (
            <button
              key={m}
              className={method === m ? 'active' : ''}
              onClick={() => { setMethod(m); resetOtpFlow(); }}
              type="button"
            >
              {m === 'password' ? <><FiLock /> Password</> : <><FiKey /> OTP</>}
            </button>
          ))}
        </div>

        {/* Identifier type */}
        <div className="id-tabs">
          <button
            type="button"
            className={identifierType === 'email' ? 'active' : ''}
            onClick={() => setIdentifierType('email')}
          >
            <FiMail /> Email
          </button>
          <button
            type="button"
            className={identifierType === 'phone' ? 'active' : ''}
            onClick={() => setIdentifierType('phone')}
          >
            <FiPhone /> Phone
          </button>
        </div>

        {method === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="login-form">
            <div className="form-group">
              <label>{identifierType === 'email' ? 'Email' : 'Phone'}</label>
              <input
                type={identifierType === 'email' ? 'email' : 'tel'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={identifierType === 'email' ? 'admin@example.com' : '9876543210'}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing in…' : <>Sign In <FiArrowRight /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="login-form">
            <div className="form-group">
              <label>{identifierType === 'email' ? 'Email' : 'Phone'}</label>
              <input
                type={identifierType === 'email' ? 'email' : 'tel'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={identifierType === 'email' ? 'admin@example.com' : '9876543210'}
                required
                disabled={otpSent}
              />
            </div>
            {otpSent && (
              <div className="form-group">
                <label>OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  required
                />
              </div>
            )}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Please wait…' : otpSent ? <>Verify OTP <FiArrowRight /></> : <>Send OTP <FiArrowRight /></>}
            </button>
            {otpSent && (
              <button
                type="button"
                className="resend-btn"
                disabled={countdown > 0 || loading}
                onClick={handleSendOtp}
              >
                <FiRefreshCw /> {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </button>
            )}
          </form>
        )}

        <p className="login-footer">
          <Link to="/">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
