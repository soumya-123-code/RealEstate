import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../lib/apiRequest';
import { validateEmail, validatePhone } from '../../lib/utils';
import toast from 'react-hot-toast';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiArrowRight,
  FiRefreshCw,
  FiCheckCircle,
  FiHome,
  FiShield,
} from 'react-icons/fi';
import './Register.scss';

function Register() {
  const [step, setStep] = useState(1); // 1 = details, 2 = OTP verification
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  // Step 1 fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2 fields
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);

  const { updateUser } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle OTP input change
  const handleOtpChange = useCallback((index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  // Handle OTP key down
  const handleOtpKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  // Handle OTP paste
  const handleOtpPaste = useCallback((e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || '';
      }
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex(d => !d);
      if (nextEmpty !== -1) {
        otpInputRefs.current[nextEmpty]?.focus();
      } else {
        otpInputRefs.current[5]?.focus();
      }
    }
  }, [otp]);

  // Validate step 1
  const validateStep1 = () => {
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (phone && !validatePhone(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  // Submit step 1 - register and send OTP
  const handleStep1Submit = async () => {
    if (!validateStep1()) return;
    setError('');
    setLoading(true);
    try {
      const payload = { username: username.trim(), email: email.trim() };
      if (phone.trim()) payload.phone = phone.trim();
      const res = await apiRequest.post('/auth/register', payload);
      setStep(2);
      setCountdown(60);
      // Show dev OTP if returned (for testing - remove in production)
      if (res.data?.devOtp) {
        toast.success(`OTP sent to email! (Dev: ${res.data.devOtp})`, { duration: 10000 });
      } else {
        toast.success('Verification code sent to your email!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and create account
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest.post('/auth/verify-email', {
        email: email.trim(),
        otp: otpCode,
      });
      updateUser(res.data.user, res.data.token);
      toast.success('Account created successfully! Welcome!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest.post('/auth/resend-otp', { email: email.trim(), type: 'EMAIL_VERIFICATION' });
      setCountdown(60);
      if (res.data?.devOtp) {
        toast.success(`OTP resent! (Dev: ${res.data.devOtp})`, { duration: 10000 });
      } else {
        toast.success('Verification code resent!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // Go back to step 1
  const goBack = () => {
    setStep(1);
    setOtp(['', '', '', '', '', '']);
    setError('');
  };

  return (
    <div className="register-page">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="register-container">
        <div className="register-card">
          {/* Header */}
          <div className="register-header">
            <div className="logo-circle">
              <FiHome size={36} />
            </div>
            <h1>Create Account</h1>
            <p>Join us to find your dream property</p>
          </div>

          {/* Step Indicator */}
          <div className="step-indicator">
            <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
              <div className="step-dot">
                {step > 1 ? <FiCheckCircle size={16} /> : '1'}
              </div>
              <span>Your Details</span>
            </div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
              <div className="step-dot">2</div>
              <span>Verify Email</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={() => setError('')} type="button">&times;</button>
            </div>
          )}

          {/* Step 1: Enter Details */}
          {step === 1 && (
            <div className="step-content fade-in">
              <div className="step-info">
                <div className="step-icon">
                  <FiUser size={24} />
                </div>
                <h3>Your Information</h3>
                <p>Fill in your details to get started</p>
              </div>

              <div className="input-group">
                <label>Username <span className="required">*</span></label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Email Address <span className="required">*</span></label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Phone Number <span className="optional">(optional)</span></label>
                <div className="input-wrapper phone-input">
                  <span className="country-code">+91</span>
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <button
                className="btn-primary btn-submit"
                onClick={handleStep1Submit}
                disabled={loading}
                type="button"
              >
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    Send Verification Code
                    <FiArrowRight />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <div className="step-content fade-in">
              <div className="step-info">
                <div className="step-icon success">
                  <FiMail size={24} />
                </div>
                <h3>Verify Your Email</h3>
                <p>We've sent a 6-digit verification code to <strong>{email}</strong></p>
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
                onClick={handleVerifyOtp}
                disabled={loading || otp.join('').length !== 6}
                type="button"
              >
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    Verify &amp; Create Account
                    <FiCheckCircle />
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
                <button className="go-back-btn" onClick={goBack} type="button">
                  Change details
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="register-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
