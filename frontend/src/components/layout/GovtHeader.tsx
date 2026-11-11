import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Eye, Languages } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils/helpers';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Training Program Overview' },
  '/programs': { title: 'Training Programs', subtitle: 'Manage and monitor all programs' },
  '/trainees': { title: 'Trainees', subtitle: 'Centralized trainee database' },
  '/analytics': { title: 'Analytics', subtitle: 'Insights and performance metrics' },
  '/reports': { title: 'Reports & Export', subtitle: 'Generate and download reports' },
  '/users': { title: 'User Management', subtitle: 'Manage administrator accounts' },
  '/audit': { title: 'Audit Logs', subtitle: 'Security and activity trail' },
};

interface GovtHeaderProps {
  language?: 'en' | 'hi';
  onToggleLanguage?: () => void;
}

const GovtHeader: React.FC<GovtHeaderProps> = ({ language = 'en', onToggleLanguage }) => {
  const {
    sidebarCollapsed,
    toggleSidebar,
    toggleMobileSidebar,
    fontSize,
    setFontSize,
    theme,
    toggleTheme,
  } = useUIStore();
  const { user } = useAuthStore();
  const location = useLocation();

  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'CSIR-HRDC Portal', subtitle: '' };
  const today = new Date().toISOString();

  const handleSkipToMain = (e: React.MouseEvent) => {
    e.preventDefault();
    const mainEl = document.getElementById('main-content-area') || document.querySelector('main');
    if (mainEl) {
      mainEl.setAttribute('tabindex', '-1');
      mainEl.focus();
      mainEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="unified-govt-header" role="banner" aria-label="Official Government Header">
      {/* 1. GIGW 3.0 Top Compliance & Accessibility Strip */}
      <div className="gov-top-strip">
        <div className="gov-top-left">
          <a
            href="#main-content-area"
            onClick={handleSkipToMain}
            className="gov-skip-btn"
            title="Skip to content"
          >
            {language === 'hi' ? 'मुख्य सामग्री पर जाएं' : 'Skip to Content'}
          </a>
          <span className="gov-strip-sep">|</span>
          <span className="gov-national-text">
            {language === 'hi'
              ? 'वैज्ञानिक तथा औद्योगिक अनुसंधान परिषद | भारत सरकार'
              : 'Council of Scientific & Industrial Research | Government of India'}
          </span>
        </div>

        <div className="gov-top-right">
          {/* Accessibility Font Sizing (A / A+ / A++) */}
          <div className="gov-font-group" role="group" aria-label="Text sizing">
            <button
              type="button"
              className={`gov-font-btn ${fontSize === 'normal' ? 'active' : ''}`}
              onClick={() => setFontSize('normal')}
              title="Default Font (A)"
              aria-label="Default Font Size"
            >
              A
            </button>
            <button
              type="button"
              className={`gov-font-btn ${fontSize === 'large' ? 'active' : ''}`}
              onClick={() => setFontSize('large')}
              title="Large Font (A+)"
              aria-label="Large Font Size"
            >
              A+
            </button>
            <button
              type="button"
              className={`gov-font-btn ${fontSize === 'xlarge' ? 'active' : ''}`}
              onClick={() => setFontSize('xlarge')}
              title="Extra Large Font (A++)"
              aria-label="Extra Large Font Size"
            >
              A++
            </button>
          </div>

          <span className="gov-strip-sep">|</span>

          {/* High Contrast / Theme Toggle */}
          <button
            type="button"
            className="gov-tool-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Standard Light Mode' : 'Switch to High Contrast Mode'}
            aria-label="Toggle theme contrast"
          >
            <Eye size={12} aria-hidden="true" />
            <span>{theme === 'dark' ? 'Light' : 'High Contrast'}</span>
          </button>

          {onToggleLanguage && (
            <>
              <span className="gov-strip-sep">|</span>
              <button
                type="button"
                className="gov-tool-btn"
                onClick={onToggleLanguage}
                title="Toggle language"
              >
                <Languages size={12} aria-hidden="true" />
                <span>{language === 'hi' ? 'English' : 'हिंदी'}</span>
              </button>
            </>
          )}

          <span className="gov-strip-sep">|</span>
          <span className="gov-badge-pill">🔒 CERT-In / GIGW 3.0</span>
        </div>
      </div>

      {/* 2. Primary Navigation Bar (Breadcrumb / Title + User Profile) */}
      <div className="gov-main-navbar">
        <div className="gov-nav-left">
          <button
            type="button"
            className="toggle-btn"
            onClick={() => {
              if (window.innerWidth <= 1024) {
                toggleMobileSidebar();
              } else {
                toggleSidebar();
              }
            }}
            id="main-menu-toggle"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>

          <div className="gov-page-meta">
            <h1 className="gov-page-title">{pageInfo.title}</h1>
            <span className="gov-page-subtitle">{pageInfo.subtitle}</span>
          </div>
        </div>

        <div className="gov-nav-right">
          <div className="gov-user-meta">
            <span className="gov-user-name">{user?.name || 'Administrator'}</span>
            <span className="gov-date-string">{formatDate(today, 'dd MMM yyyy, EEEE')}</span>
          </div>

          <div className="gov-user-avatar" aria-hidden="true">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default GovtHeader;
