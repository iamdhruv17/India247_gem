import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, Award, PlusCircle, ArrowUp, MessageSquare, Share2, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ComplaintCard, StatusBadge, useLanguage } from '../components/Common';
import { CATEGORIES, mockCitizens } from '../data/mockData';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function FeedPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('Latest');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => {
    setIsLoading(true);
    let q = query(collection(db, 'complaints'));

    if (selectedCategory !== 'All' && selectedCategory !== 'All Categories' && selectedCategory !== t('allCategories')) {
      q = query(q, where('category', '==', selectedCategory));
    }

    if (sortBy === 'Latest' || sortBy === t('latest')) {
      q = query(q, orderBy('createdAt', 'desc'));
    } else if (sortBy === 'Most Upvoted' || sortBy === t('mostUpvoted')) {
      q = query(q, orderBy('upvotes', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(data);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching feed:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCategory, sortBy, t]);

  const trendingIssues = [...complaints].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_320px] gap-12">
      {/* Left: Feed */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h2 className="text-3xl md:text-4xl font-bold text-navy">{t('whatsHappening')}</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-navy focus:outline-none focus:border-primary cursor-pointer appearance-none pr-10"
              >
                <option value="Latest">{t('latest')}</option>
                <option value="Most Upvoted">{t('mostUpvoted')}</option>
                <option value="Near Me">{t('nearMe')}</option>
              </select>
              <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-navy focus:outline-none focus:border-primary cursor-pointer appearance-none pr-10"
              >
                <option value="All">{t('allCategories')}</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
                  <div className="flex flex-col gap-2">
                    <div className="w-32 h-4 bg-gray-100 rounded"></div>
                    <div className="w-20 h-3 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="w-full h-6 bg-gray-100 rounded mb-4"></div>
                <div className="w-full h-48 bg-gray-100 rounded mb-6"></div>
                <div className="flex justify-between">
                  <div className="w-24 h-8 bg-gray-100 rounded"></div>
                  <div className="w-24 h-8 bg-gray-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <AnimatePresence>
              {complaints.length > 0 ? (
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
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-24 h-24 bg-navy/5 rounded-full flex items-center justify-center text-navy/20 mb-6">
                    <Search size={48} />
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-2">{t('noComplaintsFound')}</h3>
                  <p className="text-gray-500">{t('noComplaintsDesc')}</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Right: Sidebar */}
      <div className="hidden lg:flex flex-col gap-8">
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
          <button className="w-full text-center text-xs font-bold text-navy mt-6 hover:text-primary transition-colors">
            {t('viewFullLeaderboard')} →
          </button>
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
  );
}
