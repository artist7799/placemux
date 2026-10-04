import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Briefcase,
  FileCheck2,
  Calendar,
  Gift,
  Sparkles,
  Building2,
  Users,
  FileQuestion,
  School,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const studentNavItems = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', path: '/student/profile', icon: UserCheck },
    { label: 'Job Discovery', path: '/student/jobs', icon: Briefcase },
    { label: 'My Applications', path: '/student/applications', icon: FileCheck2 },
    { label: 'Interviews', path: '/student/interviews', icon: Calendar },
    { label: 'Offers', path: '/student/offers', icon: Gift },
  ];

  const companyNavItems = [
    { label: 'Job Manager', path: '/company/jobs', icon: Building2 },
    { label: 'Test Builder', path: '/company/assessments', icon: FileQuestion },
  ];

  const collegeNavItems = [
    { label: 'College Portal', path: '/college/dashboard', icon: School },
    { label: 'Student Directory', path: '/college/dashboard', icon: Users },
  ];

  const adminNavItems = [
    { label: 'Admin Governance', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Roster', path: '/admin/dashboard', icon: Users },
    { label: 'College Portal', path: '/college/dashboard', icon: School },
    { label: 'Job Drives', path: '/student/jobs', icon: Briefcase },
  ];

  let navItems = studentNavItems;
  if (user?.role === 'COMPANY') navItems = companyNavItems;
  if (user?.role === 'COLLEGE') navItems = collegeNavItems;
  if (user?.role === 'ADMIN') navItems = adminNavItems;

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/60 p-4 space-y-6 hidden md:block">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {user?.role} Portal
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
