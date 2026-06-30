import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, Menu, X } from 'lucide-react';

interface AdminSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  stats?: any;
}

// Icon wrapper for consistency
const HistoryIcon = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
    </svg>
);

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const isTabActive = (tabId: string, path?: string) => {
    if (path && location.pathname === path) return true;
    return activeTab === tabId;
  };

  const handleNav = (tabId: string, path?: string) => {
    setMobileOpen(false);
    if (path) {
      navigate(path);
    } else if (onTabChange) {
      if (location.pathname !== '/admin') {
        navigate('/admin', { state: { activeTab: tabId } });
      } else {
        onTabChange(tabId);
      }
    } else {
      navigate('/admin', { state: { activeTab: tabId } });
    }
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: '📊', section: 'Main Menu' },
    { id: 'editors', label: 'Editors Management', icon: '👥', section: 'Main Menu' },
    { id: 'users', label: 'User Directory', icon: '👤', section: 'Main Menu' },
    { id: 'payments', label: 'Payment Verification', icon: '💳', section: 'Financials & Logistics' },
    { id: 'copyrights', label: 'Copyright Forms', icon: '📑', section: 'Financials & Logistics', path: '/admin/copyrights' },
    { id: 'selected', label: 'Selected Users', icon: '', section: 'Financials & Logistics' },
    { id: 'support', label: 'Support Tickets', icon: '💬', section: 'System Tools' },
    { id: 'pdfs', label: 'Asset Management', icon: '📄', section: 'System Tools' },
    { id: 'paperAcceptance', label: 'Quick Accept Tool', icon: '⚡', section: 'System Tools', path: '/admin/paper-acceptance' },
    { id: 'tracking', label: 'Paper Tracking', icon: <HistoryIcon className="w-4 h-4" />, section: 'System Tools', specialClass: 'blue' },
    { id: 'database', label: 'Admin Database', icon: '🗄️', section: 'System Tools', specialClass: 'violet' },
    { id: 'submitAuthor', label: 'Submit for Author', icon: <Upload className="w-4 h-4" />, section: 'System Tools', path: '/admin/paper-submission', specialClass: 'orange' },
  ];

  const sections = ['Main Menu', 'Financials & Logistics', 'System Tools'];

  return (
    <>
      <button
        type="button"
        aria-label="Open admin menu"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-30 flex items-center justify-center w-11 h-11 rounded-xl bg-[#F5A051] text-white shadow-lg border border-orange-400/30"
      >
        <Menu className="w-6 h-6" />
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="lg:hidden fixed inset-0 z-39 bg-black/50 backdrop-blur-[1px]"
          onClick={() => setMobileOpen(false)}
        />
      )}

    <aside
      className={[
        'w-64 max-w-[85vw] bg-white border-r border-gray-200 flex flex-col shadow-sm z-40',
        'fixed inset-y-0 left-0 lg:sticky lg:top-0 h-screen lg:h-screen lg:max-w-none',
        'transition-transform duration-200 ease-out lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ].join(' ')}
    >
      <div className="p-4 sm:p-6 border-b border-gray-100 bg-white flex items-start justify-between gap-2 shrink-0">
        <div className="min-w-0">
        <h1 
            className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2 cursor-pointer"
            onClick={() => { setMobileOpen(false); navigate('/admin'); }}
        >
          <div className="w-8 h-8 bg-[#F5A051] rounded-lg flex items-center justify-center text-white text-xs shrink-0">A</div>
          <span className="leading-tight truncate">Admin Panel</span>
        </h1>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Conference Management</p>
        </div>
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 shrink-0"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 custom-scrollbar min-h-0 overscroll-contain">
        {sections.map(section => (
          <React.Fragment key={section}>
            <div className="h-4"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 mb-2">{section}</p>
            {navItems.filter(item => item.section === section).map(item => (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNav(item.id, item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-all ${
                  isTabActive(item.id, item.path)
                    ? item.specialClass === 'blue' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' :
                      item.specialClass === 'violet' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' :
                      item.specialClass === 'orange' ? 'bg-[#F5A051] text-white shadow-md shadow-[#F5A051]/20' :
                      'bg-[#F5A051] text-white shadow-md shadow-[#F5A051]/20'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="shrink-0">{typeof item.icon === 'string' ? item.icon : item.icon}</span>
                <span className="min-w-0 break-words">{item.label}</span>
              </button>
            ))}
          </React.Fragment>
        ))}
      </nav>

    </aside>
    </>
  );
};

export default AdminSidebar;
