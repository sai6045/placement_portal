import React from 'react';
import { TabType, User } from '../types';
import { LayoutDashboard, Users, UserCheck, Building2, BarChart3, UserCircle, LogOut } from 'lucide-react';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentUser: User;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
}) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students' as TabType, label: 'Student Details', icon: Users },
    { id: 'faculties' as TabType, label: 'Faculty Members', icon: UserCheck },
    { id: 'companies' as TabType, label: 'Company Details', icon: Building2 },
    { id: 'reports' as TabType, label: 'Reports', icon: BarChart3 },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MANAGER':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg overflow-hidden bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center p-0.5">
              <img src="/logo.jpg" alt="Rathinam Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-[#1E293B] tracking-tight">RATHINAM PLACEMENT PORTAL</h1>
              <p className="text-[11px] text-[#64748B]">Career Development &amp; Placement Cell</p>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <UserCircle className="h-4 w-4 text-[#64748B]" />
              <div className="text-left">
                <p className="text-xs font-semibold text-[#1E293B] leading-tight">{currentUser.name}</p>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadge(currentUser.role)}`}>
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg transition-colors border border-[#E2E8F0] hover:border-rose-200"
              title="Logout from portal"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Five Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto border-t border-[#E2E8F0] pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all rounded-t-md ${
                  isActive
                    ? 'border-[#3B82F6] text-[#3B82F6] bg-[#EFF6FF]'
                    : 'border-transparent text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#3B82F6]' : 'text-[#64748B]'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
