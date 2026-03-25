import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Filter, Search, MapPin, Info, PlusCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { StatusBadge, useLanguage } from '../components/Common';
import { COMPLAINT_STATUSES } from '../data/mockData';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
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

// Helper component to center map on a specific complaint
function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

export default function MapPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');
  const [filter, setFilter] = useState('All');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    setIsLoading(true);
    let q = query(collection(db, 'complaints'));

    if (filter !== 'All') {
      q = query(q, where('status', '==', filter));
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
      console.error('Error fetching map data:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [filter, targetId]);

  const stats = [
    { label: t('totalComplaints'), value: complaints.length },
    { label: t('pendingLongest'), value: complaints.find(c => c.status === 'Pending')?.id || 'N/A' },
    { label: t('mostUpvoted'), value: complaints.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))[0]?.id || 'N/A' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button 
              onClick={() => setFilter('All')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filter === 'All' ? 'bg-navy text-white' : 'bg-bg text-gray-500 hover:bg-gray-200'}`}
            >
              {t('allIssues')}
            </button>
            {Object.values(COMPLAINT_STATUSES).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filter === status ? 'bg-navy text-white' : 'bg-bg text-gray-500 hover:bg-gray-200'}`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')}
              className="input-field py-2 pl-12 text-sm max-w-[300px]"
            />
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="flex-1 relative">
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
      </div>

      {/* Stats Section */}
      <div className="bg-white border-t border-gray-100 p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-bg rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                {i === 0 ? <Info size={24} /> : i === 1 ? <MapPin size={24} /> : <PlusCircle size={24} />}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-bold text-navy">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
