import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Percent, 
  FileCheck, 
  Sparkles, 
  History, 
  LogOut,
  Brain
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', name: 'Upload Resume', icon: UploadCloud },
    { id: 'ats', name: 'ATS Analysis', icon: Percent },
    { id: 'jd', name: 'JD Matching', icon: FileCheck },
    { id: 'insights', name: 'Resume Insights', icon: Sparkles },
    { id: 'history', name: 'History', icon: History }
  ];

  return (
    <aside className="w-64 bg-white text-slate-500 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-200/80 z-30">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 px-6 py-6 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
          <Brain className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-800">
          Hire<span className="text-primary-600">Lens</span>
        </span>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/15' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <IconComponent className="w-5 h-5" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
