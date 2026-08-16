import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../lib/apiRequest';
import { resolvePostLoginRedirect } from '../../lib/auth';
import { validateEmail, validatePhone } from '../../lib/utils';
import toast from 'react-hot-toast';
import {
  FiMail,
  FiPhone,
  FiEyeOff,
  FiArrowRight,
  FiRefreshCw,
  FiCheckCircle,
  FiHome,
} from 'react-icons/fi';
import './Login.scss';

const TABS = [
  { key: 'email', label: 'Email Login', icon: <FiMail /> },
  { key: 'phone', label: 'Phone Login', icon: <FiPhone /> },
];

function Login() {
  const [activeTab, setActiveTab] = useState('email');

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);

  const [canUsePassword, setCanUsePassword] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showPasswordOption, setShowPasswordOption] = useState(false);
  const [password, setPassword] = useState('');
  const [showLoginOptions, setShowLoginOptions] = useState(false);

  // Always show OTP option so both options are available
  const showOtpOption = true;

  const { updateUser, getRoleRedirect } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const finishLogin = (user, token, redirectTo) => {
    updateUser(user, token);
    const target = resolvePostLoginRedirect(
      user,
      searchParams.get('redirect') || redirectTo
    );
    navigate(target || getRoleRedirect(user), { replace: true });
  };

  const previewUser = useCallback(async (identifier) => {
    setLoading(true);
    try {
      const res = await apiRequest.get('/auth/preview', { params: identifier });
      if (res.data?.exists) {
        const role = res.data.userType;
        const adminOrStaff = role === 'ADMIN' || role === 'STAFF';
        const canUsePwd = !!res.data.passwordLoginEnabled;

        setUserRole(role);
        setCanUsePassword(canUsePwd);
        // Only admin/staff with password enabled AND admin panel access
        // get the password option surfaced.
        setShowPasswordOption(adminOrStaff && canUsePwd && !!res.data.canAccessAdminPanel);
        setShowLoginOptions(true);
      } else {
        // Unknown identifier -> treat as regular user, OTP only
        setUserRole('USER');
        setCanUsePassword(false);
        setShowPasswordOption(false);
        setShowLoginOptions(true);
      }
    } catch {
      // Silent fail - treat as regular user
      setUserRole('USER');
      setCanUsePassword(false);
      setShowPasswordOption(false);
      setShowLoginOptions(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetOtpState = useCallback(() => {
    setOtpSent(false);
    setOtp(['', '', '', '', '', '']);
    setError('');
    setCountdown(0);
    setCanUsePassword(false);
    setShowPasswordOption(false);
    setUserRole(null);
    setPassword('');
    setShowLoginOptions(false);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    resetOtpState();
    // keep identifier input values, only reset auth step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleOtpChange = useCallback(
    (index, value) => {
      if (!/^\d*$/.test(value)) return;

      const newOtp = [...otp];
      newOtp[index] = value.slice(-1);
      setOtp(newOtp);

      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleOtpKeyDown = useCallback(
    (index, e) => {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handleOtpPaste = useCallback(
    (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      if (pastedData.length > 0) {
        const next = [...otp];
        for (let i = 0; i < 6; i++) next[i] = pastedData[i] || '';
        setOtp(next);

        const nextEmpty = next.findIndex((d) => !d);
        if (nextEmpty !== -1) otpInputRefs.current[nextEmpty]?.focus();
        else otpInputRefs.current[5]?.focus();
      }
    },
    [otp]
  );

  const buildIdentifierPayload = () => {
    if (activeTab === 'email') return { email: email.trim().toLowerCase() };
    // phone: keep digits only; backend normalizes with +91
    const digits = phone.replace(/\D/g, '');
    return { phone: digits };
  };

  const unifiedSendOtp = async ({ email: emailValue, phone: phoneValue }) => {
    setError('');
    setLoading(true);
    try {
      const body = {
        ...(emailValue ? { email: emailValue } : {}),
        ...(phoneValue ? { phone: phoneValue } : {}),
        loginType: 'otp',
      };

      const res = await apiRequest.post('/auth/login', body);

      // Keep showPasswordOption from preview - don't override here
      setUserRole(res.data?.userRole);

      setOtpSent(true);
      setCountdown(60);
      setPassword('');

      toast.success(res.data?.message || 'Verification code sent');
      if (res.data?.devOtp) {
        toast.success(`🔑 Dev OTP: ${res.data.devOtp}`, { duration: 10000 });
      }

      return res;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
      toast.error(err.response?.data?.message || 'Failed to send OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOtp = async () => {
    if (!email) return setError('Please enter your email address');
    if (!validateEmail(email)) return setError('Please enter a valid email address');
    await unifiedSendOtp({ email, phone: null });
  };

  const sendPhoneOtp = async () => {
    if (!phone) return setError('Please enter your phone number');
    if (!validatePhone(phone)) return setError('Please enter a valid 10-digit phone number');

    await unifiedSendOtp({ email: null, phone });
  };

  const loginWithPassword = async () => {
    if (!password) return setError('Please enter your password');
    setError('');
    setLoading(true);
    try {
      const identifier = buildIdentifierPayload();
      const res = await apiRequest.post('/auth/login', {
        ...identifier,
        password,
      });

      toast.success('Login successful!');
      finishLogin(res.data.user, res.data.token, res.data.redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = { otp: otpCode, ...buildIdentifierPayload() };
      const res = await apiRequest.post('/auth/verify-otp', payload);

      toast.success('Login successful!');
      finishLogin(res.data.user, res.data.token, res.data.redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;

    setError('');
    setLoading(true);
    try {
      let res;
      if (activeTab === 'email') {
        res = await apiRequest.post('/auth/resend-otp', { email, type: 'EMAIL_LOGIN' });
      } else {
        res = await apiRequest.post('/auth/resend-otp', { phone, type: 'PHONE_LOGIN' });
      }

      setCountdown(60);
      if (res?.data?.devOtp) toast.success(`OTP resent! (Dev: ${res.data.devOtp})`, { duration: 10000 });
      else toast.success('Verification code resent!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const getOtpDescription = () => {
    if (activeTab === 'email') return `We've sent a 6-digit code to ${email}`;
    return `We've sent a 6-digit code to +91 ${phone}`;
  };

  const handleChangeIdentifier = () => {
    setShowLoginOptions(false);
    setOtpSent(false);
    setOtp(['', '', '', '', '', '']);
    setPassword('');
    setCanUsePassword(false);
    setShowPasswordOption(false);
    setUserRole(null);
  };

  return (
    <div className="login-page">
      <div className="animated-bg">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-circle">
              <FiHome size={36} />
            </div>
            <h1>Welcome Back</h1>
            <p>Sign in to continue to your account</p>
          </div>

          <div className="tab-switcher">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={() => setError('')} type="button">
                &times;
              </button>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="login-form-wrapper fade-in">
              {!showLoginOptions && (
                <div className="otp-step">
                  <div className="step-info">
                    <div className="step-icon">
                      <FiMail size={24} />
                    </div>
                    <h3>Login with Email</h3>
                    <p>Enter your email address to continue</p>
                  </div>

                  <div className="input-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <FiMail className="input-icon" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        autoComplete="email"
                        onKeyDown={(e) => e.key === 'Enter' && email && previewUser({ email: e.target.value.trim() })}
                      />
                    </div>
                  </div>

                  <button className="btn-primary btn-submit" onClick={() => previewUser({ email: email.trim() })} disabled={loading || !email} type="button">
                    {loading ? <span className="loading-spinner"></span> : (
                      <>
                        Continue
                        <FiArrowRight />
                      </>
                    )}
                  </button>
                </div>
              )}

              {showLoginOptions && !otpSent && (
                <div className="otp-step fade-in">
                  {/* Password option: only admin/staff with password login enabled */}
                  {showPasswordOption && (
                    <div className="login-option-card">
                      <div className="option-header">
                        <h4>Password Login</h4>
                        <p>Use your password to login</p>
                      </div>
                      <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                          <FiEyeOff className="input-icon" />
                          <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && password) loginWithPassword();
                            }}
                          />
                        </div>
                      </div>
                      <button className="btn-primary btn-submit" onClick={loginWithPassword} disabled={loading || !password} type="button">
                        {loading ? <span className="loading-spinner"></span> : <>Login with Password <FiArrowRight /></>}
                      </button>
                    </div>
                  )}

                  {/* OTP option: regular users always; admin/staff only as fallback */}
                  {showOtpOption && (
                    <div className="login-option-card">
                      <div className="option-header">
                        <h4>OTP Verification</h4>
                        <p>Receive a verification code on your email</p>
                      </div>
                      <button className="btn-secondary btn-submit" onClick={sendEmailOtp} disabled={loading} type="button">
                        {loading ? <span className="loading-spinner"></span> : <>Send Verification Code <FiArrowRight /></>}
                      </button>
                    </div>
                  )}

                  <button className="change-email-btn" onClick={handleChangeIdentifier} type="button">
                    Change email
                  </button>
                </div>
              )}

              {showLoginOptions && otpSent && (
                <div className="otp-step fade-in">
                  <div className="step-info">
                    <div className="step-icon success">
                      <FiCheckCircle size={24} />
                    </div>
                    <h3>Enter Verification Code</h3>
                    <p>{getOtpDescription()}</p>
                  </div>

                  <div className="otp-input-group">
                    <label>6-Digit Code</label>
                    <div className="otp-boxes" onPaste={handleOtpPaste}>
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className="otp-box"
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          aria-label={`Digit ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    className="btn-primary btn-submit"
                    onClick={verifyOtp}
                    disabled={loading || otp.join('').length !== 6}
                    type="button"
                  >
                    {loading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <>
                        Verify &amp; Login
                        <FiArrowRight />
                      </>
                    )}
                  </button>

                  <div className="resend-row">
                    {countdown > 0 ? (
                      <span className="resend-timer">
                        Resend code in <strong>{countdown}s</strong>
                      </span>
                    ) : (
                      <button className="resend-btn" onClick={resendOtp} type="button">
                        <FiRefreshCw size={14} />
                        Resend Code
                      </button>
                    )}
                    <button className="change-email-btn" onClick={handleChangeIdentifier} type="button">
                      Change email
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'phone' && (
            <div className="login-form-wrapper fade-in">
              {!showLoginOptions && (
                <div className="otp-step">
                  <div className="step-info">
                    <div className="step-icon">
                      <FiPhone size={24} />
                    </div>
                    <h3>Login with Phone</h3>
                    <p>Enter your phone number to continue</p>
                  </div>

                  <div className="input-group">
                    <label>Phone Number</label>
                    <div className="input-wrapper phone-input">
                      <span className="country-code">+91</span>
                      <FiPhone className="input-icon" />
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                          setError('');
                        }}
                        autoComplete="tel"
                        onKeyDown={(e) => e.key === 'Enter' && phone.length === 10 && previewUser({ phone })}
                      />
                    </div>
                  </div>

                  <button className="btn-primary btn-submit" onClick={() => previewUser({ phone })} disabled={loading || phone.length !== 10} type="button">
                    {loading ? <span className="loading-spinner"></span> : (
                      <>
                        Continue
                        <FiArrowRight />
                      </>
                    )}
                  </button>
                </div>
              )}

              {showLoginOptions && !otpSent && (
                <div className="otp-step fade-in">
                  {/* Password option: only admin/staff with password login enabled */}
                  {showPasswordOption && (
                    <div className="login-option-card">
                      <div className="option-header">
                        <h4>Password Login</h4>
                        <p>Use your password to login</p>
                      </div>
                      <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                          <FiEyeOff className="input-icon" />
                          <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && password) loginWithPassword();
                            }}
                          />
                        </div>
                      </div>
                      <button className="btn-primary btn-submit" onClick={loginWithPassword} disabled={loading || !password} type="button">
                        {loading ? <span className="loading-spinner"></span> : <>Login with Password <FiArrowRight /></>}
                      </button>
                    </div>
                  )}

                  {/* OTP option: regular users always; admin/staff only as fallback */}
                  {showOtpOption && (
                    <div className="login-option-card">
                      <div className="option-header">
                        <h4>OTP Verification</h4>
                        <p>Receive a verification code on your phone</p>
                      </div>
                      <button className="btn-secondary btn-submit" onClick={sendPhoneOtp} disabled={loading} type="button">
                        {loading ? <span className="loading-spinner"></span> : <>Send Verification Code <FiArrowRight /></>}
                      </button>
                    </div>
                  )}

                  <button className="change-email-btn" onClick={handleChangeIdentifier} type="button">
                    Change number
                  </button>
                </div>
              )}

              {showLoginOptions && otpSent && (
                <div className="otp-step fade-in">
                  <div className="step-info">
                    <div className="step-icon success">
                      <FiCheckCircle size={24} />
                    </div>
                    <h3>Enter Verification Code</h3>
                    <p>{getOtpDescription()}</p>
                  </div>

                  <div className="otp-input-group">
                    <label>6-Digit Code</label>
                    <div className="otp-boxes" onPaste={handleOtpPaste}>
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className="otp-box"
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          aria-label={`Digit ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    className="btn-primary btn-submit"
                    onClick={verifyOtp}
                    disabled={loading || otp.join('').length !== 6}
                    type="button"
                  >
                    {loading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <>
                        Verify &amp; Login
                        <FiArrowRight />
                      </>
                    )}
                  </button>

                  <div className="resend-row">
                    {countdown > 0 ? (
                      <span className="resend-timer">
                        Resend code in <strong>{countdown}s</strong>
                      </span>
                    ) : (
                      <button className="resend-btn" onClick={resendOtp} type="button">
                        <FiRefreshCw size={14} />
                        Resend Code
                      </button>
                    )}
                    <button className="change-email-btn" onClick={handleChangeIdentifier} type="button">
                      Change number
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="login-footer">
            <p>
              Don&apos;t have an account?{' '}
              <Link to="/register">Create Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;