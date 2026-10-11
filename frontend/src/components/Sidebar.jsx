import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Percent, 
  FileCheck, 
  Sparkles, 
  History, 
  Settings,
  LogOut,
  Brain,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout, user, mobileOpen, setMobileOpen }) {
  const menuItems = [
    { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', name: 'Upload Resume', icon: UploadCloud },
    { id: 'ats', name: 'ATS Diagnostics', icon: Percent },
    { id: 'jd', name: 'JD Matching', icon: FileCheck },
    { id: 'insights', name: 'Resume Insights', icon: Sparkles },
    { id: 'history', name: 'History & Compare', icon: History },
    { id: 'settings', name: 'Settings & Profile', icon: Settings },
  ];

  const getInitials = (name) => {
    if (!name) return 'HL';
    const clean = name.includes('@') ? name.split('@')[0] : name;
    return clean
      .split(/[\s._-]+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'HL';
  };

  const handleItemClick = (id) => {
    setActiveTab(id);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const displayName = user?.name && !user.name.includes('@') 
    ? user.name 
    : (user?.name ? user.name.split('@')[0].replace(/[._]/g, ' ') : 'User');

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`w-64 bg-white text-slate-600 flex flex-col h-screen fixed left-0 top-0 border-r border-purple-100 z-50 transition-transform duration-300 ease-in-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-500/20">
              <Brain className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Hire<span className="text-violet-600">Lens</span>
            </span>
          </div>

          {/* Close button for mobile */}
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="px-5 py-4 border-b border-purple-50 bg-gradient-to-r from-purple-50/50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-sm flex-shrink-0">
                {getInitials(displayName)}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate" title={displayName}>
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-400 truncate max-w-[155px]" title={user.email}>
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs with Equal Spacing */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
                    : 'text-slate-600 hover:bg-purple-50 hover:text-violet-700'
                }`}
              >
                <IconComponent className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-3 border-t border-purple-50">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
