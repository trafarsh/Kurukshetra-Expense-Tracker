import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Shield, 
  LogOut, 
  Bell, 
  Mail, 
  Search,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Layout() {
  const { currentUser, userRole, actualRole, isMemberView, setIsMemberView, logout } = useAuth();
  const location = useLocation();

  const getNavIcon = (name, isActive) => {
    const className = `w-5 h-5 mr-3 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`;
    switch (name) {
      case 'Dashboard': return <LayoutDashboard className={className} />;
      case 'Ledger': return <BookOpen className={className} />;
      case 'My Dues': return <Users className={className} />;
      case 'Admin Panel': return <Shield className={className} />;
      default: return <LayoutDashboard className={className} />;
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Ledger', path: '/ledger' },
    { name: 'My Dues', path: '/my-dues' },
    { name: 'Team Progress', path: '/team-progress' },
    // Only show Admin panel to admins
    ...(userRole === 'admin' ? [{ name: 'Admin Panel', path: '/admin' }] : []),
  ];

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white text-slate-500 flex flex-col h-full border-r border-slate-200 shadow-sm z-10">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <span className="text-sm">✦</span>
            </span>
            Kurukshetra
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 ml-10 uppercase tracking-widest font-bold">Expense Tracker</p>
        </div>
        
        <div className="px-6 mb-2 mt-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Overview</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {getNavIcon(item.name, isActive)}
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="px-6 mb-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Settings</p>
        </div>
        
        <div className="px-4 pb-6 space-y-1">
          {actualRole === 'admin' && (
            <button
              onClick={() => setIsMemberView(!isMemberView)}
              className="w-full group flex items-center px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left"
            >
              {isMemberView ? <EyeOff className="w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-600" /> : <Eye className="w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-600" />}
              {isMemberView ? 'Exit Member View' : 'View as Member'}
            </button>
          )}

          <button 
            onClick={logout}
            className="w-full group flex items-center px-4 py-3 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
          >
            <LogOut className="w-5 h-5 mr-3 text-red-400 group-hover:text-red-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-24 flex items-center justify-between px-8 flex-shrink-0">
           {/* Search */}
           <div className="relative w-[400px]">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
             <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white border-none shadow-sm text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400" 
             />
           </div>
           
           {/* Profile area */}
           <div className="flex items-center gap-6">
             <div className="flex items-center gap-4">
                <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </button>
                <NotificationDropdown />
             </div>
             <div className="flex items-center gap-3 bg-white pl-2 pr-4 py-1.5 rounded-full shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
               <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                 {currentUser?.email?.charAt(0)?.toUpperCase()}
               </div>
               <div className="hidden md:block">
                 <p className="text-sm font-bold text-slate-700 leading-tight">
                    {currentUser?.email?.split('@')[0]?.toUpperCase()}
                 </p>
                 <p className="text-xs text-slate-400 capitalize font-medium">{userRole}</p>
               </div>
             </div>
           </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto px-8 pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
