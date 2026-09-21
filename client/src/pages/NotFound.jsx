import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg p-6 text-center">
      <div className="max-w-md">
        <ShieldAlert className="w-16 h-16 text-brand-500 mx-auto mb-4 animate-bounce" />
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">404 - Area Restricted</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          The requested coordinate or operations terminal does not exist on this security layer.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center justify-center px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-brand-500/10"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
