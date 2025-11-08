import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../contexts/AuthContext.js';
import ScannerPage from './ScannerPage.jsx';
import HistoryPage from './HistoryPage.jsx';
import DashboardPage from './DashboardPage.jsx';
import StudentManagerPage from './StudentManagerPage.jsx';
import UserManagerPage from './UserManagerPage.jsx';

const MainLayout = () => {
  const { userData } = useAuth();
  const [currentPage, setCurrentPage] = useState('scanner');
  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    if (!isAdmin && (currentPage === 'students' || currentPage === 'users')) {
      setCurrentPage('scanner');
    }
  }, [currentPage, isAdmin]);

  const CurrentPageComponent = useMemo(() => {
    switch (currentPage) {
      case 'scanner':
        return <ScannerPage />;
      case 'history':
        return <HistoryPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'students':
        return isAdmin ? <StudentManagerPage /> : null;
      case 'users':
        return isAdmin ? <UserManagerPage /> : null;
      default:
        return <ScannerPage />;
    }
  }, [currentPage, isAdmin]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} userData={userData} />
      <main className="flex-1 overflow-y-auto bg-slate-900/60 p-8">
        {CurrentPageComponent || (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-300">
            You do not have permission to view this page.
          </div>
        )}
      </main>
    </div>
  );
};

export default MainLayout;
