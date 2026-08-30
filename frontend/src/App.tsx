import React, { useState } from 'react';
import { TabType, User } from './types';
import { Navigation } from './components/Navigation';
import { LoginPage } from './components/LoginPage';
import { DashboardTab } from './components/DashboardTab';
import { StudentDetailsTab } from './components/StudentDetailsTab';
import { FacultyMembersTab } from './components/FacultyMembersTab';
import { CompanyDetailsTab } from './components/CompanyDetailsTab';
import { ReportsTab } from './components/ReportsTab';
import { PublicRegistrationPage } from './components/PublicRegistrationPage';

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('placement_portal_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('placement_portal_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [companyRefreshTrigger, setCompanyRefreshTrigger] = useState(0);

  // Check if current URL is a public company registration link
  const getPublicRegistrationToken = () => {
    const path = window.location.pathname;
    const match = path.match(/\/company\/register\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];

    const hash = window.location.hash;
    const hashMatch = hash.match(/#\/?company\/register\/([a-zA-Z0-9_-]+)/);
    if (hashMatch && hashMatch[1]) return hashMatch[1];

    const params = new URLSearchParams(window.location.search);
    const regToken = params.get('register_token');
    if (regToken) return regToken;

    return null;
  };

  const publicRegToken = getPublicRegistrationToken();

  // Public Route: Company Student Registration form without requiring login
  if (publicRegToken) {
    return <PublicRegistrationPage token={publicRegToken} />;
  }

  const handleLoginSuccess = (authToken: string, user: User) => {
    setToken(authToken);
    setCurrentUser(user);
    localStorage.setItem('placement_portal_token', authToken);
    localStorage.setItem('placement_portal_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('placement_portal_token');
    localStorage.removeItem('placement_portal_user');
  };

  const handleCompanyAdded = () => {
    setCompanyRefreshTrigger(prev => prev + 1);
  };

  // Protected Route Check: Unauthenticated users are shown the LoginPage
  if (!token || !currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-[#1E293B]">
      {/* Header & Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardTab setActiveTab={setActiveTab} />}
        {activeTab === 'students' && <StudentDetailsTab currentUser={currentUser} />}
        {activeTab === 'faculties' && (
          <FacultyMembersTab
            currentUser={currentUser}
            onCompanyAdded={handleCompanyAdded}
          />
        )}
        {activeTab === 'companies' && (
          <CompanyDetailsTab
            currentUser={currentUser}
            refreshTrigger={companyRefreshTrigger}
          />
        )}
        {activeTab === 'reports' && <ReportsTab currentUser={currentUser} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-[#64748B]">
          Placement Portal System &bull; Active Account: <span className="font-semibold text-[#1E293B]">{currentUser.name}</span> ({currentUser.email}) &bull; Role: <span className="font-bold text-[#3B82F6]">{currentUser.role}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
