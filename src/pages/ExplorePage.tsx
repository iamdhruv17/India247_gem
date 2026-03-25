import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Filter, Search, MapPin, Info, PlusCircle, ArrowRight, 
  LayoutGrid, Map as MapIcon, TrendingUp, Award, 
  MessageSquare, Share2, Heart, User, ShieldCheck, LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBadge, useLanguage, ComplaintCard } from '../components/Common';
import { COMPLAINT_STATUSES, CATEGORIES, mockCitizens } from '../data/mockData';
import { db, useAuth } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (status: string) => {
  let color = '#E8541A'; // Pending
  if (status === COMPLAINT_STATUSES.IN_PROGRESS || status === COMPLAINT_STATUSES.ASSIGNED || status === COMPLAINT_STATUSES.UNDER_INSPECTION) {
    color = '#E8B84B'; // Yellow/Orange
  } else if (status === COMPLAINT_STATUSES.RESOLVED) {
    color = '#1A6B3A'; // Green
  }

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

export default function ExplorePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');
  
  const [viewMode, setViewMode] = useState<'nearby' | 'myReports'>('nearby');
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Latest');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    setIsLoading(true);
    let q = query(collection(db, 'complaints'));

    if (viewMode === 'myReports' && user) {
      q = query(q, where('reportedByUid', '==', user.uid));
    }

    if (filter !== 'All') {
      q = query(q, where('status', '==', filter));
    }

    if (selectedCategory !== 'All') {
      q = query(q, where('category', '==', selectedCategory));
    }

    if (sortBy === 'Latest') {
      q = query(q, orderBy('createdAt', 'desc'));
    } else if (sortBy === 'Most Upvoted') {
      q = query(q, orderBy('upvotes', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(data);
      setIsLoading(false);

      if (targetId) {
        const target = data.find((c: any) => c.id === targetId);
        if (target && target.lat && target.lng) {
          setMapCenter([target.lat, target.lng]);
        }
      }
    }, (error) => {
      console.error('Error fetching explore data:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [filter, targetId, viewMode, user, selectedCategory, sortBy]);

  const trendingIssues = [...complaints].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Header & Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 pt-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <h2 className="text-3xl font-black text-navy">{t('explore')}</h2>
            
            <div className="flex p-1 bg-bg rounded-2xl w-fit">
              <button
                onClick={() => setViewMode('nearby')}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  viewMode === 'nearby' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'
                }`}
              >
                <MapPin size={14} />
                {t('nearby')}
              </button>
              <button
                onClick={() => setViewMode('myReports')}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  viewMode === 'myReports' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'
                }`}
              >
                <User size={14} />
                {t('myReports')}
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4 pb-4 overflow-x-auto scrollbar-hide">
            <div className="relative min-w-[140px]">
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-bg border-none rounded-xl px-4 py-2 text-[10px] font-bold text-navy focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none pr-10"
              >
                <option value="All">{t('allIssues')}</option>
                {Object.values(COMPLAINT_STATUSES).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <Filter size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative min-w-[140px]">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-bg border-none rounded-xl px-4 py-2 text-[10px] font-bold text-navy focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none pr-10"
              >
                <option value="All">{t('allCategories')}</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <Filter size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative min-w-[140px]">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-bg border-none rounded-xl px-4 py-2 text-[10px] font-bold text-navy focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none pr-10"
              >
                <option value="Latest">{t('latest')}</option>
                <option value="Most Upvoted">{t('mostUpvoted')}</option>
              </select>
              <TrendingUp size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <div className="flex-1 min-w-[200px] relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder={t('searchPlaceholder')}
                className="w-full bg-bg border-none rounded-xl py-2 pl-12 text-[10px] font-bold text-navy focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 py-16 grid lg:grid-cols-[1fr_360px] gap-12">
        {/* Main Content */}
        <div className="flex flex-col gap-12">
          {/* Map Section */}
          <div className="h-[500px] rounded-[3rem] overflow-hidden border border-gray-100 shadow-xl relative group">
            {isLoading ? (
              <div className="absolute inset-0 bg-bg/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-navy font-bold">{t('loadingMap')}</p>
                </div>
              </div>
            ) : (
              <MapContainer 
                center={[28.6139, 77.2090]} 
                zoom={12} 
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController center={mapCenter} />
                {complaints.map((complaint) => (
                  <Marker 
                    key={complaint.id} 
                    position={[complaint.lat || 28.6139, complaint.lng || 77.2090]}
                    icon={createCustomIcon(complaint.status)}
                  >
                    <Popup className="custom-popup">
                      <div className="p-2 min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{complaint.category}</span>
                          <StatusBadge status={complaint.status} />
                        </div>
                        <h4 className="text-sm font-bold text-navy mb-1">{complaint.id}</h4>
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-xs font-bold text-navy">
                            <PlusCircle size={14} className="text-primary" />
                            <span>{complaint.upvotes || 0}</span>
                          </div>
                          <Link to={`/tracker/${complaint.id}`} className="text-[10px] font-bold text-primary hover:underline">
                            {t('viewDetails')} →
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
            
            {/* Map Overlay Controls */}
            <div className="absolute bottom-6 right-6 z-[400] flex flex-col gap-2">
              <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-navy hover:text-primary transition-all">
                <MapPin size={20} />
              </button>
              <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-navy hover:text-primary transition-all">
                <LayoutGrid size={20} />
              </button>
            </div>
          </div>

          {/* Feed Section */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-navy">
                {viewMode === 'nearby' ? t('whatsHappening') : t('myReports')}
              </h3>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {complaints.length} {t('reportsFiled')}
              </span>
            </div>

            <div className="flex flex-col gap-6">
              <AnimatePresence>
                {viewMode === 'myReports' && !user ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[2.5rem] border border-gray-100 shadow-sm px-8">
                    <div className="w-24 h-24 bg-chakra/5 rounded-full flex items-center justify-center text-chakra/20 mb-6">
                      <LogIn size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-navy mb-2">{t('loginRequired')}</h3>
                    <p className="text-gray-500 mb-8 max-w-sm">{t('loginToSeeReports')}</p>
                    <button 
                      onClick={signIn}
                      className="btn-primary px-12 py-4 bg-chakra hover:bg-chakra/90"
                    >
                      <LogIn size={20} />
                      {t('loginWithGoogle')}
                    </button>
                  </div>
                ) : complaints.length > 0 ? (
                  complaints.map((complaint, i) => (
                    <motion.div
                      key={complaint.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <ComplaintCard complaint={complaint} />
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="w-24 h-24 bg-navy/5 rounded-full flex items-center justify-center text-navy/20 mb-6">
                      <Search size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-navy mb-2">{t('noComplaintsFound')}</h3>
                    <p className="text-gray-500">{t('noComplaintsDesc')}</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:flex flex-col gap-8 sticky top-[180px] h-fit">
          {/* Trending Issues */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={20} className="text-primary" />
              <h3 className="text-lg font-bold">{t('trendingIssues')}</h3>
            </div>
            <div className="flex flex-col gap-6">
              {trendingIssues.map((issue, i) => (
                <div key={issue.id} className="flex gap-4 group cursor-pointer" onClick={() => navigate(`/map?id=${issue.id}`)}>
                  <div className="text-2xl font-black text-navy/10 group-hover:text-primary/20 transition-colors">
                    0{i + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy mb-1 group-hover:text-primary transition-colors line-clamp-2">
                      {issue.description}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-primary">{issue.upvotes} {t('upvotes')}</span>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-[10px] text-gray-400">{issue.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Citizen Leaderboard */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <Award size={20} className="text-gold" />
              <h3 className="text-lg font-bold">{t('citizenLeaderboard')}</h3>
            </div>
            <div className="flex flex-col gap-4">
              {mockCitizens.map((citizen) => (
                <div key={citizen.rank} className="flex items-center justify-between p-3 bg-bg rounded-xl border border-gray-100 hover:border-gold/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-navy font-bold text-xs shadow-sm">
                      {citizen.avatar}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy leading-none mb-1">{citizen.name}</h4>
                      <p className="text-[10px] text-gray-400">{citizen.badge}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gold">⭐ {citizen.points}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="card bg-primary text-white border-none shadow-lg shadow-primary/20">
            <h3 className="text-lg font-bold mb-2">{t('beTheChange')}</h3>
            <p className="text-xs text-white/80 mb-6 leading-relaxed">
              {t('beTheChangeDesc')}
            </p>
            <button 
              onClick={() => navigate('/report')}
              className="w-full py-3 bg-white text-primary rounded-xl font-bold text-sm hover:bg-bg transition-all active:scale-95"
            >
              {t('reportIssue')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
