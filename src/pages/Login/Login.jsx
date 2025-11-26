import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store';
import Button from '../../components/ui/Button';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.usernameOrEmail) {
      newErrors.usernameOrEmail = 'Username or Email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const result = await login(formData.usernameOrEmail, formData.password);
      
      if (result.success) {
        toast.success(`Welcome back, ${result.user.fullName}!`);
        // Redirect based on role
        navigate('/dashboard');
      } else {
        setErrors({ general: result.error || 'Invalid login credentials' });
        toast.error(result.error || 'Invalid login credentials');
      }
    } catch (error) {
      setErrors({ general: 'Login failed. Please try again.' });
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-split-container">
        {/* Left Side - Medical Lab Image & Branding */}
        <div className="login-left">
          <div className="branding-content">
            <div className="brand-title">
              <h1 className="brand-main">HEALit</h1>
              <span className="brand-sub">Med Lab</span>
            </div>
            <p className="tagline">Advanced Laboratory Management System</p>
            <div className="features">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <span>Digital Patient Records</span>
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <span>Real-time Results</span>
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                <span>Automated Reporting</span>
              </div>
            </div>
          </div>
          <div className="branding-footer">
            <p>Kunnathpeedika Centre, Thrissur</p>
            <p>© 2024 HEALit Med Lab. All rights reserved.</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-right">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {errors.general && (
                <div className="error-banner">
                  {errors.general}
                </div>
              )}

              <div className="form-group">
                <label>Username or Email</label>
                <input
                  type="text"
                  value={formData.usernameOrEmail}
                  onChange={(e) => {
                    setFormData({...formData, usernameOrEmail: e.target.value});
                    setErrors({...errors, usernameOrEmail: ''});
                  }}
                  placeholder="Enter username or email"
                  className={errors.usernameOrEmail ? 'error' : ''}
                  disabled={loading}
                  autoComplete="username"
                />
                {errors.usernameOrEmail && <span className="error-text">{errors.usernameOrEmail}</span>}
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({...formData, password: e.target.value});
                      setErrors({...errors, password: ''});
                    }}
                    placeholder="Enter password"
                    className={errors.password ? 'error' : ''}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <Button type="submit" fullWidth icon={LogIn} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
