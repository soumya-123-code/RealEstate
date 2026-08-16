import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../lib/apiRequest';
import toast from 'react-hot-toast';
import './AgentLogin.scss';

function AgentLogin() {
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { updateUser, currentUser, isAgent, getRoleRedirect } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in as agent
  useEffect(() => {
    if (currentUser && isAgent()) {
      navigate(getRoleRedirect());
    }
  }, [currentUser, isAgent, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isEmail = identifier.includes('@');
    const isPhone = identifier.startsWith('+') || /^\d{10}$/.test(identifier.replace(/\s/g, ''));

    try {
      if (loginMethod === 'password') {
        // Password login - send as email for agent
        const res = await apiRequest.post('/auth/agent/login', {
          email: isEmail ? identifier : undefined,
          phone: isPhone ? (identifier.startsWith('+') ? identifier : `+91${identifier.replace(/\D/g, '')}`) : undefined,
          password
        });

        if (res.data.user.role !== 'AGENT') {
          toast.error('Access denied! Agent only.');
          setLoading(false);
          return;
        }

        if (!res.data.token) {
          toast.error('Authentication failed - no token received');
          setLoading(false);
          return;
        }

        updateUser(res.data.user, res.data.token);
        toast.success('Agent login successful!');
        navigate(getRoleRedirect());
      } else {
        // OTP login
        if (!otpSent) {
          // Step 1: Request OTP
          const res = await apiRequest.post('/auth/agent/login', {
            email: isEmail ? identifier : undefined,
            phone: isPhone ? (identifier.startsWith('+') ? identifier : `+91${identifier.replace(/\D/g, '')}`) : undefined,
            loginType: 'otp'
          });

          toast.success(res.data.message || 'OTP sent!');
          setOtpSent(true);
        } else {
          // Step 2: Verify OTP
          const res = await apiRequest.post('/auth/agent/verify-otp', {
            email: isEmail ? identifier : undefined,
            phone: isPhone ? (identifier.startsWith('+') ? identifier : `+91${identifier.replace(/\D/g, '')}`) : undefined,
            otp
          });

          if (res.data.user.role !== 'AGENT') {
            toast.error('Access denied! Agent only.');
            setLoading(false);
            return;
          }

          updateUser(res.data.user, res.data.token);
          toast.success('Agent login successful!');
          navigate(getRoleRedirect());
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleLoginMethod = () => {
    setLoginMethod(prev => prev === 'password' ? 'otp' : 'password');
    setOtpSent(false);
    setOtp('');
  };

  return (
    <div className="agent-login">
      <div className="login-container">
        <div className="login-header">
          <h1>Agent Portal</h1>
          <p>Login to manage your properties</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="identifier">
              {loginMethod === 'otp' ? 'Email or Phone' : 'Email'}
            </label>
            <input
              type={loginMethod === 'otp' ? 'text' : 'email'}
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder={loginMethod === 'otp' ? 'Enter email or phone' : 'Enter email'}
              autoComplete={loginMethod === 'password' ? 'email' : 'off'}
            />
          </div>

          {loginMethod === 'password' ? (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
          ) : (
            <>
              {otpSent && (
                <div className="form-group">
                  <label htmlFor="otp">Enter OTP</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    placeholder="Enter OTP"
                    maxLength={6}
                  />
                </div>
              )}
            </>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading
              ? 'Logging in...'
              : otpSent
                ? 'Verify OTP'
                : loginMethod === 'password'
                  ? 'Login'
                  : 'Send OTP'}
          </button>

          <button
            type="button"
            className="btn-link"
            onClick={toggleLoginMethod}
          >
            {loginMethod === 'password'
              ? 'Use OTP Login'
              : 'Use Password Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AgentLogin;