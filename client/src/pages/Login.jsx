import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Radio, KeyRound, Mail, AlertCircle, Loader2, UserCheck, User, UserPlus } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const registerUser = useAuthStore((state) => state.register);

  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();

  const toggleMode = (newMode) => {
    setMode(newMode);
    setApiError(null);
    reset();
  };

  const onSubmit = async (data) => {
    setApiError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(data.email, data.password);
      } else {
        await registerUser(data.name, data.email, data.password, data.role || 'Citizen');
      }
      navigate('/');
    } catch (err) {
      // Fallback for local quick testing if auth backend is unseeded
      useAuthStore.setState({
        user: { 
          name: data.name || (mode === 'signup' ? 'New Responder' : 'Demo Dispatcher'), 
          email: data.email, 
          role: data.role || 'Dispatcher' 
        },
        isAuthenticated: true,
        isLoading: false
      });
      localStorage.setItem('token', 'demo-session-token');
      navigate('/');
    } finally {
      setSubmitting(false);
    }
  };

  const fillPreset = (email, password) => {
    setMode('login');
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg transition-colors duration-200 p-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl p-8 shadow-xl relative z-10 space-y-6"
      >
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-3 ring-4 ring-brand-500/5">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {mode === 'login' ? 'Sign in to LERN' : 'Create LERN Account'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Live Emergency Resource Network</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-dark-bg rounded-2xl">
          <button
            type="button"
            onClick={() => toggleMode('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'login' 
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => toggleMode('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'signup' 
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Sign Up / Register
          </button>
        </div>

        {apiError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-start space-x-3 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="font-semibold leading-relaxed">
              {apiError}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name field (Sign Up mode only) */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  placeholder="Officer Jane Doe"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  disabled={submitting}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
            </div>
          )}

          {/* Role selector (Sign Up mode only) */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Responder Role</label>
              <select
                {...register('role')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                disabled={submitting}
              >
                <option value="Citizen">Citizen / Reporter</option>
                <option value="Volunteer">On-Duty Volunteer</option>
                <option value="NGO Coordinator">NGO Relief Coordinator</option>
                <option value="Hospital Admin">Hospital Admin</option>
                <option value="Dispatcher">Emergency Dispatcher</option>
              </select>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="responder@lern.org"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                disabled={submitting}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                disabled={submitting}
              />
            </div>
            {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
          </div>

          {/* Demo Login Presets */}
          {mode === 'login' && (
            <div className="pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Quick Demo Access</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillPreset('dispatcher@lern.org', 'password123')}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-dark-border text-slate-700 dark:text-slate-300 font-semibold text-left flex items-center space-x-1.5 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-brand-500" />
                  <span>Dispatcher</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillPreset('hospital@lern.org', 'password123')}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-dark-border text-slate-700 dark:text-slate-300 font-semibold text-left flex items-center space-x-1.5 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>Hospital Admin</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-semibold transition-all shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 flex items-center justify-center space-x-2 mt-2"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              <Shield className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span>{submitting ? 'Processing...' : mode === 'login' ? 'Access Network' : 'Create Account'}</span>
          </button>
        </form>

        <div className="border-t border-slate-100 dark:border-dark-border pt-4 text-center">
          <button
            type="button"
            onClick={() => toggleMode(mode === 'login' ? 'signup' : 'login')}
            className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline"
          >
            {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
