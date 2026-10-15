import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/services';
import { getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';
import logoSvg from '../../assets/logo.svg';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const { token, data } = res.data;
      setAuth(token, data);
      toast.success(`Welcome back, ${data.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box fade-in">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-badge" style={{ background: '#ffffff', padding: '8px', overflow: 'hidden' }}>
            <img src={logoSvg} alt="CSIR Emblem" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2>CSIR-HRDC Portal</h2>
          <p>Centralized Training Program Management & Analytics</p>
        </div>

        {/* GOI Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center',
            padding: '8px 16px',
            background: 'rgba(200, 150, 62, 0.08)',
            border: '1px solid rgba(200, 150, 62, 0.2)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '28px',
          }}
        >
          <Shield size={14} style={{ color: 'var(--color-secondary)' }} />
          <span style={{ fontSize: '11px', color: 'var(--color-secondary)', fontWeight: 600 }}>
            Government of India — Secure Portal
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="your.email@csir-hrdc.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: '44px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                id="toggle-password-visibility"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            id="login-btn"
            disabled={isLoading}
            style={{ marginTop: '8px' }}
          >
            {isLoading ? (
              <>
                <div
                  style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(36, 85, 181, 0.08)',
            border: '1px solid rgba(36, 85, 181, 0.2)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Demo Credentials
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Super Admin:</strong> superadmin@csir-hrdc.in / HRDC@2024!<br />
            <strong style={{ color: 'var(--color-text-primary)' }}>Admin:</strong> rajesh.kumar@csir-hrdc.in / Admin@2024!
          </p>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            marginTop: '24px',
          }}
        >
          CSIR-Human Resource Development Centre, Ghaziabad<br />
          © 2024 CSIR, Government of India. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
