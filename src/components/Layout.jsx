import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Flag,
  User,
  Shield,
  Eye,
  EyeOff,
  LogOut,
  Bell
} from 'lucide-react';

export default function Layout() {
  const { currentUser, userRole, actualRole, isMemberView, setIsMemberView, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Ledger', path: '/ledger', icon: BookOpen },
    { name: 'My Dues', path: '/my-dues', icon: Users },
    { name: 'Team', path: '/team-progress', icon: Flag },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  // Mobile Top Header
  const MobileHeader = () => (
    <header className="h-16 flex items-center justify-between px-4 bg-white border-b border-slate-100 flex-shrink-0 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
          <span className="text-sm">✦</span>
        </span>
        <h1 className="text-lg font-bold tracking-tight text-slate-900">Kurukshetra</h1>
      </div>
      <NotificationDropdown />
    </header>
  );

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <aside className="w-64 bg-white text-slate-500 flex flex-col h-full border-r border-slate-200 shadow-sm z-10 flex-shrink-0">
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

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
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
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              {item.name}
            </Link>
          )
        })}
        
        {userRole === 'admin' && (
          <Link
            to="/admin"
            className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
              location.pathname === '/admin'
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Shield className={`w-5 h-5 mr-3 ${location.pathname === '/admin' ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
            Admin Panel
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-slate-100">
        {actualRole === 'admin' && (
          <button
            onClick={() => setIsMemberView(!isMemberView)}
            className="w-full group flex items-center px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left mb-1"
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
  );

  // Desktop Header
  const DesktopHeader = () => (
    <header className="h-20 flex items-center justify-end px-8 flex-shrink-0 bg-transparent">
      <div className="flex items-center gap-6">
        <NotificationDropdown />
        <div 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 bg-white pl-2 pr-4 py-1.5 rounded-full shadow-sm cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
            {currentUser?.email?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700 leading-tight">
               {currentUser?.email?.split('@')[0]?.toUpperCase()}
            </p>
            <p className="text-xs text-slate-400 capitalize font-medium">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );

  // Mobile Bottom Tab Bar
  const MobileBottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex justify-around items-center px-2 z-50 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full min-w-[44px] min-h-[44px] ${
              isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon className={`w-6 h-6 mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium leading-none">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      {isDesktop && <DesktopSidebar />}

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {isDesktop ? <DesktopHeader /> : <MobileHeader />}
        
        <div className={`flex-1 overflow-y-auto w-full ${isDesktop ? 'px-8 pb-8' : 'px-0 pb-20'}`}>
          <Outlet />
        </div>

        {!isDesktop && <MobileBottomNav />}
      </main>
    </div>
  );
}
