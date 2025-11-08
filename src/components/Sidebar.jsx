import React from 'react';
import { ScanFace, Clock, BarChart2, GraduationCap, UserCog, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';

const baseLinks = [
  { key: 'scanner', label: 'Scanner', icon: ScanFace },
  { key: 'history', label: 'History', icon: Clock },
  { key: 'dashboard', label: 'Dashboard', icon: BarChart2 }
];

const adminLinks = [
  { key: 'students', label: 'Student Manager', icon: GraduationCap },
  { key: 'users', label: 'User Manager', icon: UserCog }
];

const Sidebar = ({ currentPage, setCurrentPage, userData }) => {
  const { signOut } = useAuth();
  const isAdmin = userData?.role === 'admin';

  const handleNavClick = (key) => () => setCurrentPage(key);

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
          <ScanFace className="h-7 w-7" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-100">Student Disciplinary</p>
          <p className="text-sm text-slate-400">{userData?.email || 'Guest'}</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="px-2 text-xs uppercase tracking-wide text-slate-500">Main</p>
        <ul className="mt-2 space-y-1">
          {baseLinks.map((link) => {
            const Icon = link.icon;
            const active = currentPage === link.key;
            return (
              <li key={link.key}>
                <button
                  onClick={handleNavClick(link.key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? 'bg-primary/20 text-primary' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </button>
              </li>
            );
          })}
        </ul>
        {isAdmin && (
          <>
            <p className="mt-6 px-2 text-xs uppercase tracking-wide text-slate-500">Administration</p>
            <ul className="mt-2 space-y-1">
              {adminLinks.map((link) => {
                const Icon = link.icon;
                const active = currentPage === link.key;
                return (
                  <li key={link.key}>
                    <button
                      onClick={handleNavClick(link.key)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active ? 'bg-primary/20 text-primary' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </nav>
      <div className="border-t border-slate-800 px-6 py-5">
        <button
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
        >
          <LogOut className="h-5 w-5" /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
