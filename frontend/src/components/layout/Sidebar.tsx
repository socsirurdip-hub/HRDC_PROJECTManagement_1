import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, BarChart3,
  FileText, Shield, LogOut, GraduationCap
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { authApi } from '../../api/services';
import { getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';
import logoSvg from '../../assets/logo.svg';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
}

const NAV_ITEMS: { section: string; items: NavItem[] }[] = [
  {
    section: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/programs', icon: BookOpen, label: 'Training Programs' },
      { to: '/trainees', icon: GraduationCap, label: 'Trainees' },
    ],
  },
  {
    section: 'Analytics',
    items: [
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/reports', icon: FileText, label: 'Reports & Export' },
    ],
  },
  {
    section: 'Administration',
    items: [
      { to: '/users', icon: Users, label: 'User Management', roles: ['super_admin'] },
      { to: '/audit', icon: Shield, label: 'Audit Logs', roles: ['super_admin'] },
    ],
  },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, mobileSidebarOpen, toggleSidebar, closeMobileSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const isVisible = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || '');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-overlay"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 999, backdropFilter: 'blur(4px)',
          }}
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}
        id="main-sidebar"
      >
        {/* Header */}
        <div
          className="sidebar-header"
          style={
            sidebarCollapsed
              ? {
                  padding: '16px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  justifyContent: 'center',
                }
              : {}
          }
        >
          <div
            className="sidebar-logo"
            onClick={sidebarCollapsed ? toggleSidebar : undefined}
            style={{
              cursor: sidebarCollapsed ? 'pointer' : 'default',
            }}
            title={sidebarCollapsed ? 'Click to expand sidebar' : undefined}
          >
            <img src={logoSvg} alt="CSIR Emblem" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-logo-text">
              <h1>CSIR-HRDC</h1>
              <span>Training Portal</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ section, items }) => {
            const visibleItems = items.filter(isVisible);
            if (!visibleItems.length) return null;
            return (
              <div key={section} className="sidebar-section">
                {!sidebarCollapsed && (
                  <div className="sidebar-section-label">{section}</div>
                )}
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMobileSidebar}
                    className={({ isActive }) =>
                      `sidebar-item ${isActive ? 'active' : ''}`
                    }
                    title={sidebarCollapsed ? item.label : undefined}
                    id={`nav-${item.label.toLowerCase().replace(/ /g, '-')}`}
                  >
                    <span className="sidebar-item-icon">
                      <item.icon size={18} />
                    </span>
                    {!sidebarCollapsed && (
                      <span className="sidebar-item-text">{item.label}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={handleLogout} title="Logout">
            <div className="user-avatar">{getInitials(user?.name || 'U')}</div>
            {!sidebarCollapsed && (
              <div className="user-info">
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role?.replace('_', ' ').toUpperCase()}</div>
              </div>
            )}
            {!sidebarCollapsed && (
              <LogOut size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
