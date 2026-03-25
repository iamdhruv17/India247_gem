import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, CheckCircle2, AlertTriangle, User, Star, ArrowLeft, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBadge, useLanguage } from '../components/Common';
import { mockOfficers, COMPLAINT_STATUSES } from '../data/mockData';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const Step = ({ title, desc, time, status, isLast }: { title: string, desc: string, time?: string, status: 'completed' | 'active' | 'pending', isLast?: boolean }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
        status === 'completed' ? 'bg-success text-white shadow-lg shadow-success/20' :
        status === 'active' ? 'bg-primary text-white shadow-lg shadow-primary/20 animate-pulse' : 'bg-gray-200 text-gray-400'
      }`}>
        {status === 'completed' ? <CheckCircle2 size={16} /> : status === 'active' ? <Clock size={16} /> : <div className="w-1.5 h-1.5 bg-current rounded-full"></div>}
      </div>
      {!isLast && <div className={`w-0.5 h-16 transition-colors ${status === 'completed' ? 'bg-success' : 'bg-gray-200'}`}></div>}
    </div>
    <div className="flex-1 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
        <h4 className={`text-sm font-bold ${status === 'pending' ? 'text-gray-400' : 'text-navy'}`}>{title}</h4>
        {time && <span className="text-[10px] text-gray-400 font-medium">{time}</span>}
      </div>
      <p className={`text-xs leading-relaxed ${status === 'pending' ? 'text-gray-300' : 'text-gray-500'}`}>{desc}</p>
    </div>
  </div>
);

export default function TrackerPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState(id || '');
  const [complaint, setComplaint] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchId.trim()) return;
    
    setIsLoading(true);
    setError(false);
    
    try {
      const docRef = doc(db, 'complaints', searchId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setComplaint({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError(true);
        setComplaint(null);
      }
    } catch (err) {
      console.error('Error tracking complaint:', err);
      setError(true);
      setComplaint(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      handleSearch();
    }
  }, [id]);

  const officer = mockOfficers[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-12">
      {/* Search Bar */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl text-navy hover:text-primary transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-3xl font-bold text-navy">{t('trackComplaint')}</h2>
        </div>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder={t('trackPlaceholder')}
              className="input-field pl-12"
            />
          </div>
          <button type="submit" className="btn-primary px-8 flex items-center gap-2">
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : t('track')}
          </button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-navy font-bold">{t('fetchingDetails')}</p>
          </motion.div>
        ) : error ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-24 h-24 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={48} />
            </div>
            <h3 className="text-xl font-bold text-navy mb-2">{t('noComplaintFound')}</h3>
            <p className="text-gray-500 mb-8">{t('noComplaintDesc')} <span className="font-bold text-navy">{searchId}</span></p>
            <button onClick={() => setSearchId('')} className="btn-outline">{t('tryAnotherId')}</button>
          </motion.div>
        ) : complaint ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-8"
          >
            {/* Complaint Summary Card */}
            <div className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-bg rounded-2xl flex items-center justify-center text-primary shadow-sm">
                    <Info size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-navy mb-1">{complaint.id}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 font-medium">
                      <MapPin size={14} className="text-primary" />
                      {complaint.location}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={complaint.status} />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{complaint.category}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-6 p-4 bg-bg rounded-xl border border-gray-100">
                "{complaint.description}"
              </p>
              {complaint.photoUrl && (
                <div className="aspect-video rounded-2xl overflow-hidden mb-6 border border-gray-100">
                  <img src={complaint.photoUrl} alt="Reported Issue" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>

            {/* Escalation Alert */}
            {complaint.status === COMPLAINT_STATUSES.PENDING && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy mb-1">{t('escalationAlert')}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {t('escalationDesc')}
                  </p>
                </div>
              </div>
            )}

            {/* Visual Timeline */}
            <div className="card">
              <h3 className="text-lg font-bold mb-8">{t('resolutionTimeline')}</h3>
              <div className="flex flex-col">
                <Step 
                  title={t('complaintFiledTitle')} 
                  desc={t('complaintFiledDescText')} 
                  time={complaint.createdAt?.toDate ? complaint.createdAt.toDate().toLocaleString() : 'Just now'}
                  status="completed"
                />
                <Step 
                  title={t('sentToDepartment')} 
                  desc={`${t('assignedTo')} ${complaint.category} Department`} 
                  time={complaint.createdAt?.toDate ? complaint.createdAt.toDate().toLocaleString() : 'Just now'}
                  status="completed"
                />
                <Step 
                  title={t('officerAssignedTitle')} 
                  desc={complaint.status === 'Pending' ? t('waitingForAssignment') : t('officerInvestigating')} 
                  status={complaint.status === 'Pending' ? 'active' : 'completed'}
                />
                <Step 
                  title={t('workInProgressTitle')} 
                  desc={t('workInProgressDescText')} 
                  status={complaint.status === 'In Progress' ? 'active' : complaint.status === 'Resolved' ? 'completed' : 'pending'}
                />
                <Step 
                  title={t('resolvedTitle')} 
                  desc={t('resolvedDescText')} 
                  status={complaint.status === 'Resolved' ? 'completed' : 'pending'}
                  isLast
                />
              </div>
            </div>

            {/* Officer Card */}
            <div className="card">
              <h3 className="text-lg font-bold mb-6">{t('assignedOfficer')}</h3>
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-navy/5 rounded-2xl flex items-center justify-center text-navy font-bold text-xl shadow-sm">
                    {officer.avatar}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-navy leading-none mb-2">{officer.name}</h4>
                    <p className="text-xs text-gray-400 font-medium mb-2">{officer.designation} • {officer.ward}</p>
                    <div className="flex items-center gap-1 text-gold">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={s <= 4 ? 'currentColor' : 'none'} />)}
                      <span className="text-xs font-bold ml-1">{officer.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-end gap-2">
                  <div className="px-3 py-1 bg-success/10 text-success rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Score: {officer.performance}/100
                  </div>
                  <div className="px-3 py-1 bg-navy/5 text-navy rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Avg Time: {officer.avgResolutionTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Reopen Button */}
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-xs text-gray-400 font-medium">{t('notSatisfied')}</p>
              <button className="btn-outline px-12">{t('reopenComplaint')}</button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-navy/5 rounded-full flex items-center justify-center text-navy/20 mb-6">
              <Search size={48} />
            </div>
            <h3 className="text-xl font-bold text-navy mb-2">{t('searchForComplaint')}</h3>
            <p className="text-gray-500">{t('searchForComplaintDesc')}</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
