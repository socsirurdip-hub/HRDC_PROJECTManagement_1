import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import GovtHeader from './GovtHeader';
import GovtFooter from './GovtFooter';
import { useUIStore } from '../../store/uiStore';

const AppLayout: React.FC = () => {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <GovtHeader />
        <main className="page-container" id="main-content-area" tabIndex={-1}>
          <Outlet />
        </main>
        <GovtFooter />
      </div>
    </div>
  );
};

export default AppLayout;
