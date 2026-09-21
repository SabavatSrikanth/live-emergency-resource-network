import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  RefreshCw, 
  ShieldAlert, 
  PlusCircle, 
  CheckCircle2, 
  AlertOctagon, 
  Hotel, 
  Ambulance, 
  Truck,
  Filter,
  Layers
} from 'lucide-react';
import useIncidentStore from '../store/useIncidentStore';
import useResourceStore from '../store/useResourceStore';

// Custom SVG HTML Icons for Leaflet Markers
const createCustomIcon = (type, priority = 'MEDIUM') => {
  let bgColor = 'bg-rose-600';
  let iconContent = '🚨';

  if (type === 'hospital') {
    bgColor = 'bg-blue-600';
    iconContent = '🏥';
  } else if (type === 'resource') {
    bgColor = 'bg-amber-600';
    iconContent = '📦';
  } else {
    if (priority === 'CRITICAL') bgColor = 'bg-red-600 animate-pulse';
    else if (priority === 'HIGH') bgColor = 'bg-orange-500';
    else if (priority === 'MEDIUM') bgColor = 'bg-amber-500';
    else bgColor = 'bg-blue-500';
  }

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center w-9 h-9 ${bgColor} text-white rounded-full shadow-lg border-2 border-white ring-2 ring-black/10 transform hover:scale-110 transition-transform">
        <span class="text-base leading-none">${iconContent}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

// Map click listener component
function MapClickListener({ onMapClick, isAddingReport }) {
  useMapEvents({
    click(e) {
      if (isAddingReport) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

// Auto-adjust map center when new incidents are filed
function MapBoundsAdjuster({ incidents, setCenter }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (incidents && incidents.length > 0) {
      const validIncidents = incidents.filter(i => i.location?.coordinates?.lat && i.location?.coordinates?.lng);
      if (validIncidents.length > 0) {
        const latestInc = validIncidents[0];
        const lat = Number(latestInc.location.coordinates.lat);
        const lng = Number(latestInc.location.coordinates.lng);
        if (lat && lng) {
          map.setView([lat, lng], 10);
          if (setCenter) setCenter([lat, lng]);
        }
      }
    }
  }, [incidents.length]);
  return null;
}

export default function MapView() {
  const { incidents, fetchIncidents, initSocketListeners, createIncident, deployAiPlan } = useIncidentStore();
  const { resources, fetchResources, initSocketListeners: initResSocket } = useResourceStore();

  const [center, setCenter] = useState([40.7128, -74.0060]); // NYC default center
  const [searchRadiusKm, setSearchRadiusKm] = useState(25);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showEmergencies, setShowEmergencies] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showRadarDrawer, setShowRadarDrawer] = useState(false);
  
  // Quick Report mode on Map Click
  const [isClickToReport, setIsClickToReport] = useState(false);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportCategory, setNewReportCategory] = useState('Medical');
  const [newReportAddress, setNewReportAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIncidents();
    fetchResources();
    initSocketListeners();
    initResSocket();
  }, []);

  const handleMapClick = (latlng) => {
    setClickedCoords(latlng);
    setNewReportAddress(`Lat: ${latlng.lat.toFixed(4)}, Lng: ${latlng.lng.toFixed(4)}`);
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!clickedCoords || !newReportTitle) return;

    setIsSubmitting(true);
    try {
      await createIncident({
        title: newReportTitle,
        category: newReportCategory,
        description: `Map pin incident reported at ${newReportAddress}`,
        priority: 'HIGH',
        location: {
          address: newReportAddress,
          coordinates: { lat: clickedCoords.lat, lng: clickedCoords.lng }
        }
      });
      setClickedCoords(null);
      setNewReportTitle('');
      setIsClickToReport(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-6">
      {/* Interactive Map display container */}
      <div className="flex-1 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden relative shadow-sm z-0">
        
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickListener onMapClick={handleMapClick} isAddingReport={isClickToReport} />
          <MapBoundsAdjuster incidents={incidents} setCenter={setCenter} />

          {/* Search Radius Circle Overlay */}
          <Circle
            center={center}
            radius={searchRadiusKm * 1000}
            pathOptions={{ color: '#f43f5e', fillColor: '#f43f5e', fillOpacity: 0.08, weight: 1.5, dashArray: '6, 6' }}
          />

          {/* Incident Markers */}
          {showEmergencies && incidents.map((inc) => {
            const lat = inc.location?.coordinates?.lat || 40.7128;
            const lng = inc.location?.coordinates?.lng || -74.0060;
            return (
              <Marker
                key={inc._id || inc.id}
                position={[lat, lng]}
                icon={createCustomIcon('incident', inc.priority)}
              >
                <Popup className="custom-popup">
                  <div className="p-1 max-w-xs space-y-2 text-slate-900 dark:text-slate-100">
                    <div className="flex items-center justify-between gap-2 border-b pb-1.5 border-slate-200 dark:border-slate-800">
                      <span className="font-extrabold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wide">{inc.category}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded text-white ${
                        inc.priority === 'CRITICAL' ? 'bg-red-600' : 'bg-amber-500'
                      }`}>
                        {inc.priority}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{inc.title}</h4>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-800">{inc.description}</p>
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 pt-1 flex items-center justify-between">
                      <span>📍 {inc.location?.address}</span>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400 uppercase">{inc.status}</span>
                    </div>

                    {inc.aiTriagePlan && (
                      <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-[11px] border border-rose-200 dark:border-rose-800 space-y-1">
                        <span className="font-extrabold text-rose-700 dark:text-rose-300 block">🤖 AI Response Plan</span>
                        <p className="text-slate-800 dark:text-slate-200 text-[11px] font-medium leading-tight">{inc.aiTriagePlan.summary}</p>
                        {inc.aiTriagePlan.status !== 'DEPLOYED' && (
                          <button
                            onClick={() => deployAiPlan(inc._id || inc.id)}
                            className="mt-2 w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-2 rounded-lg text-xs transition-colors shadow-sm"
                          >
                            Deploy Plan
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Hospital & Resource Markers */}
          {showHospitals && resources.map((res) => {
            const lat = res.location?.coordinates?.lat || 40.7180;
            const lng = res.location?.coordinates?.lng || -74.0030;
            const isHosp = res.type === 'Hospital Beds';
            return (
              <Marker
                key={res._id || res.id}
                position={[lat, lng]}
                icon={createCustomIcon(isHosp ? 'hospital' : 'resource')}
              >
                <Popup>
                  <div className="p-2 space-y-1">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{res.type}</span>
                    <h4 className="font-bold text-sm">{res.name}</h4>
                    <div className="text-xs space-y-0.5">
                      <p>Available: <strong className="text-emerald-600">{res.available}</strong> / {res.quantity}</p>
                      <p className="text-slate-500 text-[11px]">📍 {res.location?.address}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Temporary clicked location marker */}
          {clickedCoords && (
            <Marker position={[clickedCoords.lat, clickedCoords.lng]}>
              <Popup defaultOpen>
                <div className="p-2 text-xs">
                  <p className="font-bold text-rose-600">Selected Location Pin</p>
                  <p>{newReportAddress}</p>
                </div>
              </Popup>
            </Marker>
          )}

        </MapContainer>

        {/* Floating Top Control Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-[1000]">
          <div className="glass px-4 py-2 rounded-xl border border-slate-200/50 dark:border-dark-border/50 text-xs font-bold shadow-md flex items-center space-x-2 pointer-events-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>OpenStreetMap Live ({incidents.length} Incidents)</span>
          </div>

          <div className="flex items-center space-x-2 pointer-events-auto">
            <button 
              onClick={() => setShowRadarDrawer(!showRadarDrawer)}
              className={`px-3 py-2 rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all ${
                showRadarDrawer 
                  ? 'bg-brand-600 text-white' 
                  : 'glass text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-border'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Geospatial Radar</span>
            </button>

            <button 
              onClick={() => setIsClickToReport(!isClickToReport)}
              className={`px-3 py-2 rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all ${
                isClickToReport 
                  ? 'bg-rose-600 text-white animate-bounce' 
                  : 'glass text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-border'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isClickToReport ? 'Click Map to Set Pin' : 'Report on Map'}</span>
            </button>

            <button 
              onClick={() => { fetchIncidents(); fetchResources(); }}
              className="glass p-2.5 rounded-xl border border-slate-200/50 dark:border-dark-border/50 shadow-md hover:bg-slate-50 dark:hover:bg-dark-border transition-colors text-slate-700 dark:text-slate-200"
              title="Refresh Map Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Floating Geospatial Radar Drawer Overlay */}
        {showRadarDrawer && (
          <div className="absolute top-16 right-4 w-72 glass border border-slate-200 dark:border-dark-border p-4 rounded-2xl shadow-2xl z-[1000] space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-xs flex items-center space-x-1.5 text-slate-800 dark:text-white">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Geospatial Radar</span>
              </h4>
              <button 
                onClick={() => setShowRadarDrawer(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>Search Radius</span>
                  <span className="text-rose-500 font-black">{searchRadiusKm} km</span>
                </label>
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  step="5"
                  value={searchRadiusKm}
                  onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2 border-t pt-2">
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Layer Controls</span>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center space-x-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Emergencies</span>
                  </span>
                  <input 
                    type="checkbox" 
                    checked={showEmergencies} 
                    onChange={(e) => setShowEmergencies(e.target.checked)}
                    className="rounded text-rose-500 w-4 h-4 cursor-pointer" 
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center space-x-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Hospitals</span>
                  </span>
                  <input 
                    type="checkbox" 
                    checked={showHospitals} 
                    onChange={(e) => setShowHospitals(e.target.checked)}
                    className="rounded text-blue-500 w-4 h-4 cursor-pointer" 
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center space-x-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Supply Depots</span>
                  </span>
                  <input 
                    type="checkbox" 
                    checked={showResources} 
                    onChange={(e) => setShowResources(e.target.checked)}
                    className="rounded text-amber-500 w-4 h-4 cursor-pointer" 
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Click to Report Quick Drawer Modal */}
        {clickedCoords && isClickToReport && (
          <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 glass border border-rose-200 dark:border-rose-900/50 p-5 rounded-2xl shadow-2xl z-[1000] space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-rose-600 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>File Incident at Pin</span>
              </h4>
              <button 
                onClick={() => setClickedCoords(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Incident Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Fallen Power Cable"
                  value={newReportTitle}
                  onChange={(e) => setNewReportTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-600 dark:text-slate-300">Category</label>
                <select
                  value={newReportCategory}
                  onChange={(e) => setNewReportCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                >
                  <option value="Medical">Medical</option>
                  <option value="Fire">Fire</option>
                  <option value="Flood">Flood</option>
                  <option value="Debris">Debris</option>
                  <option value="Search & Rescue">Search & Rescue</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setClickedCoords(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors"
                >
                  {isSubmitting ? 'Filing...' : 'Submit Incident'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* Map Control & Geospatial Search Panel */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-80 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 flex flex-col shadow-sm"
      >
        <h3 className="font-bold text-base mb-4 flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-rose-500" />
          <span>Geospatial Radar</span>
        </h3>

        <div className="space-y-6 flex-1">
          {/* Radius selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Search Radius</span>
              <span className="text-rose-500 font-bold">{searchRadiusKm} km</span>
            </label>
            <input 
              type="range" 
              min="5" 
              max="50" 
              step="5"
              value={searchRadiusKm}
              onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>5 km</span>
              <span>25 km</span>
              <span>50 km</span>
            </div>
          </div>

          {/* Quick Layer filters */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Layer Controls</span>
            </label>
            
            <div className="space-y-2.5">
              <label className="flex items-center justify-between text-xs cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors">
                <span className="flex items-center space-x-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Active Emergencies</span>
                </span>
                <input 
                  type="checkbox" 
                  checked={showEmergencies} 
                  onChange={(e) => setShowEmergencies(e.target.checked)}
                  className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 cursor-pointer" 
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors">
                <span className="flex items-center space-x-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Hospitals & Beds</span>
                </span>
                <input 
                  type="checkbox" 
                  checked={showHospitals} 
                  onChange={(e) => setShowHospitals(e.target.checked)}
                  className="rounded text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer" 
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors">
                <span className="flex items-center space-x-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Supply Depots</span>
                </span>
                <input 
                  type="checkbox" 
                  checked={showResources} 
                  onChange={(e) => setShowResources(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer" 
                />
              </label>
            </div>
          </div>

          {/* Active Stats summary */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border space-y-2 text-xs">
            <h4 className="font-bold text-slate-700 dark:text-slate-200">Radar Metrics</h4>
            <div className="flex justify-between text-slate-500">
              <span>Map Incidents:</span>
              <span className="font-bold text-rose-600">{incidents.length}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Hospitals Tracked:</span>
              <span className="font-bold text-blue-600">{resources.filter(r => r.type === 'Hospital Beds').length}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-dark-border pt-4 mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Center Lat/Lng:</span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">40.7128° N, 74.0060° W</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
