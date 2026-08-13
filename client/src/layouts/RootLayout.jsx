import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  AlertTriangle, 
  ShieldAlert, 
  MessageSquare, 
  LogOut,
  User,
  Radio,
  FileText
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import useAuthStore from '../store/useAuthStore';

export default function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Live Map', path: '/map', icon: Map },
    { name: 'Reports', path: '/reports', icon: AlertTriangle },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 dark:bg-dark-bg dark:text-dark-text transition-colors">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex flex-col bg-white dark:bg-dark-card border-b md:border-r border-slate-200 dark:border-dark-border z-10">
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-200 dark:border-dark-border">
          <Link to="/" className="flex items-center space-x-2 text-brand-600 dark:text-brand-500">
            <Radio className="w-8 h-8 animate-pulse-fast text-brand-600 dark:text-brand-500" />
            <span className="font-extrabold text-xl tracking-wider">LERN</span>
          </Link>
          <div className="flex items-center space-x-1">
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active 
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile & logout footer */}
        <div className="p-4 border-t border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="font-semibold text-sm truncate">{user?.name || 'Emergency Responder'}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.role || 'Citizen'} Mode</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2.5 w-full rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-medium text-sm text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <header className="h-16 px-6 flex items-center justify-between bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border">
          <div className="flex items-center space-x-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              System Live & Connected
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-brand-500/10 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Report Emergency</span>
            </button>
          </div>
        </header>

        {/* Route content */}
        <div className="flex-1 p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
