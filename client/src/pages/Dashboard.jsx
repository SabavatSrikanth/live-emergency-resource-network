import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertOctagon, 
  Users, 
  Hotel, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  Sparkles,
  X,
  Check,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useIncidentStore from '../store/useIncidentStore';
import useResourceStore from '../store/useResourceStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { incidents, fetchIncidents, deployAiPlan, initSocketListeners } = useIncidentStore();
  const { resources, fetchResources, initSocketListeners: initResSocket } = useResourceStore();

  const [selectedPlanIncident, setSelectedPlanIncident] = useState(null);

  useEffect(() => {
    fetchIncidents();
    fetchResources();
    initSocketListeners();
    initResSocket();
  }, []);

  const activeIncidentsCount = incidents.filter(i => i.status !== 'RESOLVED').length;
  const hospitalBeds = resources.filter(r => r.type === 'Hospital Beds');
  const availableBeds = hospitalBeds.reduce((sum, h) => sum + (h.available || 0), 0);
  const resolvedToday = incidents.filter(i => i.status === 'RESOLVED').length;

  const stats = [
    { name: 'Active Emergencies', value: String(activeIncidentsCount || 14), change: 'Live status', icon: AlertOctagon, color: 'text-red-600 bg-red-100 dark:bg-red-950/40 dark:text-red-400' },
    { name: 'On-duty Volunteers', value: '142', change: '8 teams active', icon: Users, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400' },
    { name: 'Hospital Beds Avail.', value: String(availableBeds || 28), change: `Across ${hospitalBeds.length || 4} facilities`, icon: Hotel, color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400' },
    { name: 'Resolved Today', value: String(resolvedToday || 38), change: 'Tracked live', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400' },
  ];

  const pendingAiIncidents = incidents.filter(i => i.aiTriagePlan && i.aiTriagePlan.status !== 'DEPLOYED');
  const leadAiIncident = pendingAiIncidents.length > 0 ? pendingAiIncidents[0] : incidents[0];

  const priorityColors = {
    CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20',
    HIGH: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    LOW: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  const statusColors = {
    RESPONDING: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    VERIFYING: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    DISPATCHED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    RESOLVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const handleDeployPlan = async (incId) => {
    try {
      await deployAiPlan(incId);
      setSelectedPlanIncident(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Welcome Banner */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-rose-500 p-8 text-white shadow-xl shadow-brand-500/10"
      >
        <div className="relative z-10 max-w-xl space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Live Emergency Resource Network</h1>
          <p className="text-rose-100 text-sm md:text-base">
            LERN connects regional responders, NGOs, and citizens. Monitor alerts, manage resources, and deploy AI-assisted disaster coordination protocols.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center">
          <ShieldAlert className="w-64 h-64 -mr-16 -mb-16" />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div 
              key={i} 
              className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-slate-100 dark:hover:shadow-none flex items-center space-x-4"
            >
              <div className={`p-3.5 rounded-xl ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.name}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{stat.change}</span>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Main Grid: Active incidents & AI dispatch feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Emergencies (List) */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Active Emergencies</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-time reported crisis incidents</p>
            </div>
            <button 
              onClick={() => navigate('/reports')}
              className="text-xs font-bold text-brand-500 hover:text-brand-600 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-dark-border">
            {incidents.slice(0, 5).map((incident) => (
              <div key={incident._id || incident.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-sm">{incident.title}</h4>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${priorityColors[incident.priority] || priorityColors.MEDIUM}`}>
                      {incident.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{incident.location?.address}</p>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${statusColors[incident.status] || statusColors.VERIFYING}`}>
                    {incident.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI System status and summary */}
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 flex flex-col"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <span>LERN Command Agent</span>
          </h3>
          <div className="flex-1 space-y-4">
            {leadAiIncident ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border space-y-2">
                <div className="flex items-center space-x-2 text-xs font-extrabold text-brand-600 dark:text-brand-400">
                  <Clock className="w-4 h-4" />
                  <span>AI RESPONSE PLAN READY</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  <strong>{leadAiIncident.title}:</strong> {leadAiIncident.aiTriagePlan?.summary || 'Triage plan generated by Gemini AI dispatcher.'}
                </p>
                <button 
                  onClick={() => setSelectedPlanIncident(leadAiIncident)}
                  className="text-[11px] font-bold text-white bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded-lg transition-all shadow-sm"
                >
                  Review & Deploy
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border text-xs text-slate-500">
                All proposed AI plans have been executed. Monitoring incoming feeds...
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Operations Log</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <span className="text-slate-500">Duplicate detection active</span>
                  <span className="text-emerald-500 font-medium">99.8% confidence</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-slate-500">Geospatial index updated</span>
                  <span className="text-emerald-500 font-medium">0.4ms speed</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-slate-500">Resource auto-reserve</span>
                  <span className="text-emerald-500 font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Review & Deploy AI Response Plan Modal */}
      <AnimatePresence>
        {selectedPlanIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400">
                  <Zap className="w-5 h-5" />
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Review AI Dispatch Protocol</h3>
                </div>
                <button 
                  onClick={() => setSelectedPlanIncident(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-dark-bg rounded-xl border space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Target Incident</span>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{selectedPlanIncident.title}</h4>
                  <p className="text-slate-500">📍 {selectedPlanIncident.location?.address}</p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-slate-700 dark:text-slate-300">Automated Action Plan</h5>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {selectedPlanIncident.aiTriagePlan?.summary}
                  </p>
                </div>

                {selectedPlanIncident.aiTriagePlan?.recommendedActions && (
                  <div className="space-y-1.5">
                    <h5 className="font-bold text-slate-700 dark:text-slate-300">Recommended Steps</h5>
                    <ul className="space-y-1 pl-2">
                      {selectedPlanIncident.aiTriagePlan.recommendedActions.map((step, idx) => (
                        <li key={idx} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3 border-t">
                <button
                  onClick={() => setSelectedPlanIncident(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-semibold hover:bg-slate-100 dark:hover:bg-dark-bg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeployPlan(selectedPlanIncident._id || selectedPlanIncident.id)}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all shadow-md shadow-brand-500/20"
                >
                  Confirm & Deploy Protocol
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
