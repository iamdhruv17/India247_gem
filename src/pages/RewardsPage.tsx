import React, { useState, useEffect } from 'react';
import { Award, Star, TrendingUp, CheckCircle2, AlertCircle, Gift, ArrowRight, TrainFront, Car, Utensils, Film, Smartphone, Loader2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { rewardItems, mockCitizens } from '../data/mockData';
import { useAuth, db } from '../firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useToast, useLanguage } from '../components/Common';

const Badge = ({ name, earned, icon: Icon }: { name: string, earned: boolean, icon: any, key?: any }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all ${
        earned ? 'bg-gold/10 text-gold shadow-lg shadow-gold/20 scale-110' : 'bg-gray-100 text-gray-300 grayscale opacity-50'
      }`}>
        <Icon size={32} />
      </div>
      <div className="text-center">
        <h4 className={`text-xs font-bold ${earned ? 'text-navy' : 'text-gray-400'}`}>{name}</h4>
        {!earned && <p className="text-[10px] text-gray-400 mt-1">{t('locked')}</p>}
      </div>
    </div>
  );
};

const RewardCard = ({ reward, userPoints, onRedeem }: { reward: any, userPoints: number, onRedeem: (reward: any) => void, key?: any }) => {
  const { t } = useLanguage();
  const icons: Record<string, any> = {
    TrainFront: TrainFront,
    Car: Car,
    Utensils: Utensils,
    Film: Film,
    Smartphone: Smartphone,
    Gift: Gift,
  };
  const Icon = icons[reward.icon];
  const canAfford = userPoints >= reward.points;
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeem = async () => {
    setIsRedeeming(true);
    await onRedeem(reward);
    setIsRedeeming(false);
  };

  return (
    <div className={`card flex flex-col items-center text-center p-6 transition-all ${canAfford ? 'hover:shadow-md hover:border-gold/30' : 'opacity-60 grayscale'}`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${canAfford ? 'bg-gold/10 text-gold' : 'bg-gray-100 text-gray-400'}`}>
        <Icon size={32} />
      </div>
      <h4 className="text-sm font-bold text-navy mb-2">{reward.name}</h4>
      <p className="text-lg font-bold text-gold mb-6">⭐ {reward.points}</p>
      <button 
        disabled={!canAfford || isRedeeming}
        onClick={handleRedeem}
        className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
          canAfford ? 'bg-gold text-white hover:opacity-90 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isRedeeming ? <Loader2 size={14} className="animate-spin" /> : (canAfford ? t('redeemNow') : t('insufficientPoints'))}
      </button>
    </div>
  );
};

export default function RewardsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('My Rewards');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const userPoints = profile?.points || 0;
  const nextBadgePoints = userPoints < 1000 ? 1000 : userPoints < 5000 ? 5000 : 10000;
  const progress = Math.min((userPoints / nextBadgePoints) * 100, 100);

  useEffect(() => {
    if (activeTab === 'Point History' && user) {
      setLoadingHistory(true);
      const q = query(
        collection(db, 'users', user.uid, 'points_history'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHistory(data);
        setLoadingHistory(false);
      }, (error) => {
        console.error('Error fetching history:', error);
        setLoadingHistory(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab, user]);

  const handleRedeem = async (reward: any) => {
    if (!user) return;
    
    try {
      // Deduct points
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, {
        points: increment(-reward.points)
      });

      // Record point history
      const historyRef = collection(db, 'users', user.uid, 'points_history');
      await addDoc(historyRef, {
        amount: -reward.points,
        type: 'redeem',
        reason: `Redeemed: ${reward.name}`,
        rewardId: reward.id,
        createdAt: serverTimestamp()
      });

      // Record redemption
      await addDoc(collection(db, 'redemptions'), {
        uid: user.uid,
        rewardId: reward.id,
        rewardName: reward.name,
        pointsSpent: reward.points,
        status: 'Pending',
        createdAt: serverTimestamp()
      });

      addToast(`${t('redeemSuccess')} ${reward.name}!`, 'success');
    } catch (error) {
      console.error('Redemption error:', error);
      addToast(t('redeemError'), 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-12">
      {/* Hero Section */}
      <section className="card bg-navy text-white border-none shadow-2xl shadow-navy/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-navy font-bold text-3xl shadow-xl border border-white/20">
              {user?.displayName?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">{user?.displayName || 'Citizen'}</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-gold/20 text-gold rounded-full text-xs font-bold uppercase tracking-wider border border-gold/30">
                <Award size={14} />
                {userPoints < 1000 ? 'Bronze Reporter' : userPoints < 5000 ? 'Silver Reporter' : 'Gold Reporter'}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-4">
            <div className="text-right">
              <p className="text-xs text-white/60 font-medium uppercase tracking-widest mb-1">{t('currentBalance')}</p>
              <h3 className="text-5xl font-bold text-gold">⭐ {userPoints}</h3>
            </div>
            <div className="w-full md:w-64">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                <span>{t('next')} Gold Reporter</span>
                <span>{userPoints} / {nextBadgePoints}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gold shadow-[0_0_10px_rgba(232,184,75,0.5)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Badge Showcase */}
      <section className="card">
        <h3 className="text-lg font-bold mb-8">{t('yourAchievements')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <Badge name="Bronze Reporter" earned={true} icon={Award} />
          <Badge name="Silver Reporter" earned={true} icon={Award} />
          <Badge name="Gold Reporter" earned={false} icon={Award} />
          <Badge name="Civic Champion" earned={false} icon={Award} />
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-100">
        {[
          { id: 'My Rewards', label: t('myRewards') },
          { id: 'Point History', label: t('point_history') },
          { id: 'Leaderboard', label: t('leaderboard') }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 text-sm font-bold transition-all relative ${
              activeTab === tab.id ? 'text-primary' : 'text-gray-400 hover:text-navy'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'My Rewards' ? (
          <motion.div 
            key="rewards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-12"
          >
            {/* How to Earn */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card bg-bg border-none">
                <h3 className="text-lg font-bold mb-6">{t('howToEarnPoints')}</h3>
                <div className="space-y-4">
                  {[
                    { label: t('genuineComplaintFiled'), pts: '+10 pts', icon: CheckCircle2, color: 'text-success' },
                    { label: t('complaintResolvedText'), pts: '+25 pts', icon: TrendingUp, color: 'text-success' },
                    { label: t('complaintUpvotedBy10'), pts: '+15 pts', icon: Star, color: 'text-gold' },
                    { label: t('falseRejectedComplaint'), pts: '-20 pts', icon: AlertCircle, color: 'text-primary' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <item.icon size={18} className={item.color} />
                        <span className="text-sm font-medium text-navy">{item.label}</span>
                      </div>
                      <span className={`text-sm font-bold ${item.color}`}>{item.pts}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card bg-primary text-white border-none shadow-xl shadow-primary/20 flex flex-col justify-center items-center text-center p-12">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <Gift size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{t('referAFriend')}</h3>
                <p className="text-sm text-white/80 mb-8 max-w-xs">
                  {t('referAFriendDesc')}
                </p>
                <button className="w-full py-3 bg-white text-primary rounded-xl font-bold text-sm hover:bg-bg transition-all active:scale-95">
                  {t('shareReferralCode')}
                </button>
              </div>
            </div>

            {/* Redeem Rewards */}
            <div>
              <h3 className="text-2xl font-bold text-navy mb-8">{t('redeemYourPoints')}</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {rewardItems.map((reward) => (
                  <RewardCard key={reward.id} reward={reward} userPoints={userPoints} onRedeem={handleRedeem} />
                ))}
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'Point History' ? (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-6"
          >
            <div className="card">
              <h3 className="text-xl font-bold text-navy mb-8">{t('point_history')}</h3>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="text-primary animate-spin" />
                </div>
              ) : history.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-bg rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'earn' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                          {item.type === 'earn' ? <TrendingUp size={20} /> : <Gift size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy">{item.reason}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                      <div className={`text-lg font-black ${item.type === 'earn' ? 'text-success' : 'text-primary'}`}>
                        {item.amount > 0 ? '+' : ''}{item.amount}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-bold">{t('no_history')}</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-8"
          >
            <div className="card p-0 overflow-hidden">
              <div className="bg-navy p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">{t('globalLeaderboard')}</h3>
                <p className="text-sm text-white/60">{t('top10Citizens')}</p>
              </div>
              <div className="p-4">
                <div className="flex flex-col gap-2">
                  {mockCitizens.map((citizen, i) => (
                    <div key={citizen.rank} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${i === 2 ? 'bg-primary/5 border border-primary/20' : 'hover:bg-bg'}`}>
                      <div className="flex items-center gap-6">
                        <span className={`text-lg font-black w-6 ${i === 0 ? 'text-gold' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-primary' : 'text-navy/20'}`}>
                          {citizen.rank}
                        </span>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-navy font-bold text-sm shadow-sm border border-gray-100">
                            {citizen.avatar}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-navy mb-1">{citizen.name}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{citizen.badge}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gold">⭐ {citizen.points}</p>
                        {i === 2 && <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{t('you')}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
