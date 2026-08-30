import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  FilePlus2, 
  CheckCircle, 
  X, 
  Send, 
  Sparkles,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Zap
} from 'lucide-react';
import useIncidentStore from '../store/useIncidentStore';
import useAuthStore from '../store/useAuthStore';

export default function Reports() {
  const { incidents, fetchIncidents, createIncident, updateIncidentStatus, deployAiPlan, initSocketListeners } = useIncidentStore();
  const { user } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState('ALL');
  
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Medical');
  const [priority, setPriority] = useState('HIGH');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIncidents();
    initSocketListeners();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !address) return;

    setIsSubmitting(true);
    try {
      await createIncident({
        title,
        category,
        priority,
        description,
        location: {
          address
        }
      });
      setIsModalOpen(false);
      setTitle('');
      setAddress('');
      setDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredIncidents = filterPriority === 'ALL' 
    ? incidents 
    : incidents.filter(i => i.priority === filterPriority);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Emergency Incident Reports</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time incident stream, verification workflow & AI dispatch triage
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchIncidents}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-slate-50 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-500/20 flex items-center space-x-2"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>File New Incident Report</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-dark-border pb-3">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterPriority === p
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-card'
            }`}
          >
            {p === 'ALL' ? 'All Incidents' : p}
          </button>
        ))}
      </div>

      {/* Incidents Table */}
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-dark-bg border-b border-slate-100 dark:border-dark-border text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Incident & ID</th>
                <th className="p-4">Category</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4">AI Triage</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-xs">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No incidents match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((item) => (
                  <tr key={item._id || item.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-bg/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.title}</div>
                      <div className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">ID: {item._id || item.id}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-1 rounded bg-slate-100 dark:bg-dark-bg text-[11px] font-bold">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        item.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                        item.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' :
                        'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      📍 {item.location?.address}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        item.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600' :
                        item.status === 'DISPATCHED' ? 'bg-blue-500/10 text-blue-600' :
                        item.status === 'RESPONDING' ? 'bg-purple-500/10 text-purple-600' :
                        'bg-yellow-500/10 text-yellow-600'
                      }`}>
                        {item.status === 'RESOLVED' && <CheckCircle className="w-3 h-3" />}
                        {item.status === 'VERIFYING' && <AlertTriangle className="w-3 h-3 animate-pulse" />}
                        <span>{item.status}</span>
                      </span>
                    </td>
                    <td className="p-4 max-w-xs">
                      {item.aiTriagePlan ? (
                        <div className="text-[10px] space-y-0.5">
                          <span className={`font-extrabold ${item.aiTriagePlan.status === 'DEPLOYED' ? 'text-emerald-500' : 'text-brand-500'}`}>
                            {item.aiTriagePlan.status === 'DEPLOYED' ? '✓ Plan Deployed' : '⚡ AI Plan Ready'}
                          </span>
                          <p className="text-slate-500 line-clamp-1">{item.aiTriagePlan.summary}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">Manual review</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {item.status === 'DISPATCHED' && user?.role !== 'Citizen' && (
                        <button
                          onClick={() => updateIncidentStatus(item._id || item.id, 'RESPONDING')}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-sm"
                          title="Mark Volunteers En Route"
                        >
                          🚑 En Route (Responders)
                        </button>
                      )}
                      {item.status !== 'RESOLVED' && user?.role === 'Dispatcher' && (
                        <button
                          onClick={() => updateIncidentStatus(item._id || item.id, 'RESOLVED')}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                      {item.aiTriagePlan && item.aiTriagePlan.status !== 'DEPLOYED' && user?.role === 'Dispatcher' && (
                        <button
                          onClick={() => deployAiPlan(item._id || item.id)}
                          className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[10px] font-bold transition-colors shadow-sm"
                        >
                          Deploy AI
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Incident Report Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-brand-500/10 text-brand-600 rounded-xl">
                    <FilePlus2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg">File Emergency Incident</h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Incident Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flash Flood Near Metro Station"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                    >
                      <option value="Medical">Medical</option>
                      <option value="Fire">Fire</option>
                      <option value="Flood">Flood</option>
                      <option value="Debris">Debris</option>
                      <option value="Search & Rescue">Search & Rescue</option>
                      <option value="Hazardous Material">Hazardous Material</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Priority Level</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Location / Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5th Avenue & 23rd St Junction"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Detailed Description</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Provide details about trapped citizens, casualties, or required emergency supplies..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end space-x-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-500 font-semibold hover:bg-slate-100 dark:hover:bg-dark-bg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all shadow-md shadow-brand-500/20"
                  >
                    {isSubmitting ? 'Submitting & Triage...' : 'File Report'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
