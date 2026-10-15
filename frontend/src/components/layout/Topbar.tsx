import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Sun, Moon } from 'lucide-react';
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

const Topbar: React.FC = () => {
  const {
    toggleSidebar,
    sidebarCollapsed,
    toggleMobileSidebar,
    theme,
    toggleTheme,
    fontSize,
    setFontSize,
  } = useUIStore();
  const { user } = useAuthStore();
  const location = useLocation();

  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'CSIR-HRDC Portal', subtitle: '' };
  const today = new Date().toISOString();

  return (
    <header className="topbar" id="main-topbar">
      <div className="topbar-left">
        <button
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
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <div className="topbar-title">{pageInfo.title}</div>
          <div className="topbar-subtitle">{pageInfo.subtitle}</div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Font Size Accessibility Controls (A- / A / A+) */}
        <div className="font-switcher" title="Adjust text size">
          <button
            type="button"
            className={`font-size-btn ${fontSize === 'normal' ? 'active' : ''}`}
            onClick={() => setFontSize('normal')}
            title="Default text size (A)"
          >
            A
          </button>
          <button
            type="button"
            className={`font-size-btn ${fontSize === 'large' ? 'active' : ''}`}
            onClick={() => setFontSize('large')}
            title="Large text size (A+)"
          >
            A+
          </button>
          <button
            type="button"
            className={`font-size-btn ${fontSize === 'xlarge' ? 'active' : ''}`}
            onClick={() => setFontSize('xlarge')}
            title="Extra large text size (A++)"
          >
            A++
          </button>
        </div>

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          className="toggle-btn theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          id="theme-toggle-btn"
          style={{ cursor: 'pointer' }}
        >
          {theme === 'dark' ? (
            <Sun size={17} style={{ color: '#f59e0b' }} />
          ) : (
            <Moon size={17} style={{ color: '#2455b5' }} />
          )}
        </button>

        {/* User Info */}
        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            textAlign: 'right',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            {user?.name}
          </span>
          <span>{formatDate(today, 'dd MMM yyyy, EEEE')}</span>
        </div>

        {/* User Avatar */}
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '700',
            color: 'white',
            flexShrink: '0' as React.CSSProperties['flexShrink'],
          }}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
