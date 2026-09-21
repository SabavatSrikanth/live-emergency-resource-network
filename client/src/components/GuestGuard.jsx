import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function GuestGuard() {
  const { isAuthenticated, isLoading, init } = useAuthStore();

  useEffect(() => {
    init();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-white">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600 dark:text-brand-400 mb-4" />
        <p className="text-sm font-semibold tracking-wide uppercase opacity-75">Securing Connection...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
