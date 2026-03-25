import React, { useState, useEffect } from 'react';
import { Search, Filter, Bell, CheckCircle2, AlertTriangle, Clock, User, LogOut, MoreVertical, ChevronRight, BarChart3, Star, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBadge, useToast, useLanguage } from '../components/Common';
import { COMPLAINT_STATUSES } from '../data/mockData';
import { db, useAuth } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, orderBy, arrayUnion } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, color, icon: Icon }: { label: string, value: string, color: string, icon: any, key?: any }) => (
  <div className="card flex items-center gap-4 p-6">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-sm`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-navy">{value}</p>
    </div>
  </div>
);

export default function OfficerDashboard() {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(data);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching officer dashboard:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  const handleStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      const docRef = doc(db, 'complaints', complaintId);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        timeline: arrayUnion({
          status: newStatus,
          timestamp: new Date().toISOString(),
          message: `Status updated to ${newStatus} by Officer`
        })
      });
      addToast(`${t('statusUpdatedTo')} ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      addToast(t('failedToUpdateStatus'), 'error');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const stats = [
    { label: t('pending'), value: complaints.filter(c => c.status === 'Pending').length.toString(), color: 'bg-pending-bg text-pending-text', icon: Clock },
    { label: t('inProgress'), value: complaints.filter(c => c.status === 'In Progress').length.toString(), color: 'bg-in-progress-bg text-in-progress-text', icon: AlertTriangle },
    { label: t('resolved'), value: complaints.filter(c => c.status === 'Resolved').length.toString(), color: 'bg-resolved-bg text-resolved-text', icon: CheckCircle2 },
    { label: t('total'), value: complaints.length.toString(), color: 'bg-primary/10 text-primary', icon: BarChart3 },
  ];

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card max-w-md w-full p-12 text-center"
        >
          <div className="w-20 h-20 bg-navy text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-navy/20">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-bold text-navy mb-2">{t('officerLogin')}</h2>
          <p className="text-sm text-gray-500 mb-12 font-medium">{t('authorizedPersonnelOnly')}</p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">{t('officerId')}</label>
              <input type="text" placeholder={t('enterId')} className="input-field" required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">{t('password')}</label>
              <input type="password" placeholder="••••••••" className="input-field" required />
            </div>
            <button type="submit" className="btn-primary mt-4 py-4 bg-navy hover:bg-navy/90">
              {t('loginAsOfficer')}
            </button>
          </form>
          
          <p className="text-[10px] text-gray-400 mt-8 leading-relaxed">
            {t('unauthorizedAccessProhibited')}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl font-bold text-navy mb-2">{t('goodMorningOfficer')}, {profile?.displayName || 'Officer'} 👋</h2>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500 font-medium">{new Date().toLocaleDateString(language === 'en' ? 'en-IN' : 'hi-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <span className="text-gray-300">•</span>
            <p className="text-sm font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">{t('ward')}: North Delhi - Ward 14</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-navy shadow-sm hover:text-primary transition-colors relative">
            <Bell size={24} />
            <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white"></div>
          </button>
          <button onClick={() => setIsLoggedIn(false)} className="btn-outline flex items-center gap-2 border-gray-200 text-gray-500 hover:text-primary hover:border-primary">
            <LogOut size={18} />
            {t('logout')}
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </section>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-12">
        {/* Left: Complaints Table */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h3 className="text-2xl font-bold text-navy">{t('activeComplaints')}</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder={t('searchIdPlaceholder')} className="input-field py-2 pl-12 text-xs max-w-[200px]" />
              </div>
              <button className="p-2 bg-white rounded-xl text-navy hover:text-primary transition-colors border border-gray-100 shadow-sm">
                <Filter size={20} />
              </button>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-bg border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-navy uppercase tracking-widest">{t('id')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-navy uppercase tracking-widest">{t('category')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-navy uppercase tracking-widest">{t('location')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-navy uppercase tracking-widest">{t('filed')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-navy uppercase tracking-widest">{t('status')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-navy uppercase tracking-widest">{t('action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('loadingComplaints')}</p>
                      </td>
                    </tr>
                  ) : complaints.length > 0 ? (
                    complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-bg/50 transition-colors group">
                        <td className="px-6 py-4">
                          <Link to={`/tracker/${c.id}`} className="text-xs font-bold text-navy group-hover:text-primary transition-colors">{c.id}</Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">{c.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500">{c.location}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-400">
                            {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : 'Just now'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {c.status === 'Pending' ? (
                              <button 
                                onClick={() => handleStatusUpdate(c.id, 'In Progress')}
                                className="px-3 py-1.5 bg-navy text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-navy/90 transition-all active:scale-95"
                              >
                                {t('accept')}
                              </button>
                            ) : c.status === 'In Progress' ? (
                              <button 
                                onClick={() => handleStatusUpdate(c.id, 'Resolved')}
                                className="px-3 py-1.5 bg-success text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-success/90 transition-all active:scale-95"
                              >
                                {t('resolve')}
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-success uppercase tracking-widest">{t('completed')}</span>
                            )}
                            <button className="p-1.5 text-gray-400 hover:text-navy transition-colors">
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('noComplaintsFound')}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-bg/30 border-t border-gray-50 flex items-center justify-between">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('showingComplaints')}</p>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-gray-400">{t('prev')}</button>
                <button className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-navy">{t('nextBtn')}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="flex flex-col gap-8">
          {/* Escalation Alerts */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-primary" />
                <h3 className="text-lg font-bold">{t('escalations')}</h3>
              </div>
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold">02 {t('new')}</span>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { id: 'IND-2026-04821', time: '6h overdue', level: 'L1' },
                { id: 'IND-2026-04826', time: '12h overdue', level: 'L2' },
              ].map((alert) => (
                <div key={alert.id} className="p-4 bg-primary/5 border border-primary/20 rounded-2xl group cursor-pointer hover:bg-primary/10 transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-navy">{alert.id}</span>
                    <span className="text-[10px] font-bold text-primary bg-white px-2 py-0.5 rounded shadow-sm">{alert.level}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium mb-3">{t('escalatedDueToInactivity')}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-primary font-bold flex items-center gap-1">
                      <Clock size={10} /> {alert.time}
                    </span>
                    <ChevronRight size={14} className="text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={20} className="text-navy" />
              <h3 className="text-lg font-bold">{t('performance')}</h3>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                  <span>{t('completionRate')}</span>
                  <span className="text-success">92%</span>
                </div>
                <div className="h-2 bg-bg rounded-full overflow-hidden">
                  <div className="h-full bg-success w-[92%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                  <span>{t('avgResolutionTime')}</span>
                  <span className="text-navy">18.4 hrs</span>
                </div>
                <div className="h-2 bg-bg rounded-full overflow-hidden">
                  <div className="h-full bg-navy w-[75%]"></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t('citizenRating')}</p>
                  <div className="flex items-center gap-1 text-gold">
                    <Star size={14} fill="currentColor" />
                    <span className="text-sm font-bold">4.8</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t('monthlyBadge')}</p>
                  <span className="text-lg">🏆</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card bg-navy text-white border-none shadow-xl shadow-navy/20">
            <h3 className="text-lg font-bold mb-4">{t('quickActions')}</h3>
            <div className="flex flex-col gap-3">
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-between px-4">
                {t('generateWardReport')}
                <ArrowRight size={14} />
              </button>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-between px-4">
                {t('broadcastAnnouncement')}
                <ArrowRight size={14} />
              </button>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-between px-4">
                {t('contactSeniorOfficer')}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
