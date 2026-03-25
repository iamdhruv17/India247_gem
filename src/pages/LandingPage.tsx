import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Map, CheckCircle2, Users, ShieldCheck, ArrowRight, Construction, Trash2, Droplets, Zap, Trees, ShieldAlert, Loader2, Award, Search, TrendingUp, Sparkles, Building2, Landmark } from 'lucide-react';
import { motion } from 'motion/react';
import { ComplaintCard, useLanguage } from '../components/Common';
import { CATEGORIES, mockCitizens } from '../data/mockData';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs, where } from 'firebase/firestore';

const StatCard: React.FC<{ number: string, label: string, color: string, icon: any }> = ({ number, label, color, icon: Icon }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="card flex flex-col items-center justify-center text-center p-8 hover:shadow-xl transition-all border-none bg-white/50 backdrop-blur-sm relative overflow-hidden group"
  >
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-saffron via-chakra to-green opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color.replace('text-', 'bg-')}/10 ${color}`}>
      <Icon size={24} />
    </div>
    <h3 className={`text-4xl font-black mb-2 ${color}`}>{number}</h3>
    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{label}</p>
  </motion.div>
 );

const CategoryCard: React.FC<{ category: any }> = ({ category }) => {
  const { t } = useLanguage();
  const icons: Record<string, any> = {
    Road: Construction,
    Trash2: Trash2,
    Droplets: Droplets,
    Zap: Zap,
    Trees: Trees,
    ShieldAlert: ShieldAlert,
  };
  const Icon = icons[category.icon];

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="card flex flex-col items-center text-center p-8 group relative overflow-hidden border-none bg-white/50 backdrop-blur-sm"
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:bg-white/40 transition-all"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-saffron via-chakra to-green scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
      <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-navy mb-6 shadow-sm group-hover:scale-110 transition-transform relative">
        <div className="absolute inset-0 bg-gradient-to-br from-saffron/5 via-chakra/5 to-green/5 rounded-[2rem]"></div>
        <Icon size={36} className="relative z-10" />
      </div>
      <h4 className="text-xl font-black mb-6 text-navy">{category.name}</h4>
      <Link to={`/report?category=${category.name}`} className="btn-primary py-3 px-6 text-sm w-full shadow-none group-hover:shadow-lg group-hover:shadow-saffron/20 bg-chakra hover:bg-chakra/90">
        {t('reportIssue')}
      </Link>
    </motion.div>
  );
};

export default function LandingPage() {
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [stats, setStats] = useState({
    filed: '14,283',
    resolved: '10,941',
    wards: '342',
    satisfaction: '91%'
  });
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const complaintsSnap = await getDocs(collection(db, 'complaints'));
        const resolvedSnap = await getDocs(query(collection(db, 'complaints'), where('status', '==', 'Resolved')));
        
        if (complaintsSnap.size > 0) {
          setStats({
            filed: complaintsSnap.size.toLocaleString(),
            resolved: resolvedSnap.size.toLocaleString(),
            wards: '342',
            satisfaction: '91%'
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const complaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentComplaints(complaints);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching complaints:', error);
      setLoading(false);
    });

    fetchStats();
    return () => unsubscribe();
  }, []);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/tracker/${searchId.trim()}`);
    }
  };

  return (
    <div className="flex flex-col gap-48 pb-32">
      {/* Hero Section */}
      <section className="relative pt-32 pb-48 overflow-hidden">
        {/* Tricolor Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[33%] bg-gradient-to-b from-saffron/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-[33%] bg-gradient-to-t from-green/30 to-transparent"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-chakra/5 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-[1.2fr_0.8fr] gap-32 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-start text-left"
          >
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-chakra/5 text-chakra rounded-full text-xs font-black uppercase tracking-[0.3em] mb-10 border border-chakra/10">
              <Sparkles size={14} className="text-saffron" />
              {t('aiPowered')} • Digital Bharat
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-10 tracking-tighter text-navy uppercase">
              <span className="block text-saffron drop-shadow-sm">Building</span>
              <span className="block text-chakra relative inline-block">
                Better
                <div className="absolute -bottom-4 left-0 w-full h-4 bg-chakra/10 -rotate-1"></div>
              </span>
              <span className="block text-green drop-shadow-sm">Bharat</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-500 mb-12 max-w-xl leading-relaxed font-medium">
              Join the movement to transform our nation. <span className="text-navy font-bold">India247</span> is your direct line to a smarter, cleaner, and safer India.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 mb-16 w-full max-w-lg">
              <Link to="/report" className="btn-primary text-xl px-12 py-6 bg-saffron hover:bg-saffron/90 shadow-2xl shadow-saffron/30 flex-1">
                <PlusCircle size={24} />
                {t('reportIssue')}
              </Link>
              <Link to="/explore" className="btn-outline text-xl px-12 py-6 border-green/20 text-green hover:bg-green/5 flex-1">
                <Map size={24} />
                {t('exploreMap')}
              </Link>
            </div>

            {/* Floating Stats or Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
              {[
                { label: 'Verified Reports', value: '100% AI Verified', icon: ShieldCheck, color: 'text-chakra' },
                { label: 'Resolution Rate', value: '84% Success', icon: CheckCircle2, color: 'text-green' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-gray-100 shadow-xl shadow-navy/5 flex items-center gap-4 text-left"
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-gray-50 ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{item.label}</p>
                    <p className="text-xs font-bold text-navy">{item.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 animate-float">
              <div className="w-[340px] h-[680px] bg-navy rounded-[4rem] p-4 shadow-[0_50px_100px_-20px_rgba(15,52,96,0.3)] mx-auto border-[12px] border-navy/10 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-navy rounded-b-3xl z-10"></div>
                <div className="bg-bg h-full rounded-[3rem] overflow-hidden flex flex-col p-6 pt-12 gap-6">
                  <div className="flex items-start gap-3 max-w-[85%]">
                    <div className="w-8 h-8 bg-saffron rounded-2xl flex-shrink-0 shadow-lg shadow-saffron/20"></div>
                    <div className="bg-white p-4 rounded-3xl rounded-tl-none text-[11px] font-medium shadow-sm leading-relaxed">
                      {t('welcomeMsgShort')}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 max-w-[85%] self-end flex-row-reverse">
                    <div className="bg-chakra p-4 rounded-3xl rounded-tr-none text-[11px] font-bold text-white shadow-lg shadow-chakra/20 leading-relaxed">
                      {t('mockUserMsg')}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 max-w-[85%]">
                    <div className="w-8 h-8 bg-saffron rounded-2xl flex-shrink-0 shadow-lg shadow-saffron/20"></div>
                    <div className="bg-white p-4 rounded-3xl rounded-tl-none text-[11px] font-medium shadow-sm leading-relaxed border-l-4 border-green">
                      {t('verifiedSuccess')} <br />
                      <span className="font-bold text-chakra mt-1 block">ID: IND-2026-04821</span>
                    </div>
                  </div>
                  <div className="mt-auto bg-white/50 backdrop-blur-md p-4 rounded-3xl border border-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-navy">{t('status')}</span>
                      <span className="text-[10px] font-bold text-green bg-green/10 px-2 py-0.5 rounded-full">Assigned</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green w-[40%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Background blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-saffron/5 rounded-full blur-[100px] -z-10"></div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard number={stats.filed} label={t('statsFiled')} color="text-primary" icon={PlusCircle} />
          <StatCard number={stats.resolved} label={t('statsResolved')} color="text-success" icon={CheckCircle2} />
          <StatCard number={stats.wards} label={t('statsWards')} color="text-navy" icon={Building2} />
          <StatCard number={stats.satisfaction} label={t('statsSuccess')} color="text-gold" icon={Award} />
        </div>
      </section>

      {/* Trust Section */}
      <section className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mb-12">{t('officialPartners')}</p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          <div className="flex items-center gap-2">
            <Landmark size={32} />
            <span className="text-xl font-bold">Digital India</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={32} />
            <span className="text-xl font-bold">Smart Cities Mission</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={32} />
            <span className="text-xl font-bold">MyGov</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={32} />
            <span className="text-xl font-bold">Swachh Bharat</span>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="text-left max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-black mb-6">{t('whatNeedsAttention')}</h2>
            <p className="text-xl text-gray-500 leading-relaxed">{t('categorySubtitle')}</p>
          </div>
          <Link to="/report" className="btn-outline group">
            {t('allCategories')} <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* How It Works - Brutalist Style */}
      <section className="bg-navy text-white py-32 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-saffron/5 -skew-x-12 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-green/5 skew-x-12 -translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-5xl md:text-7xl font-black mb-12 leading-tight">
                {t('howItWorks')}
              </h2>
              <div className="space-y-12">
                {[
                  { num: '01', title: t('step1Title'), desc: t('step1Desc'), color: 'text-saffron' },
                  { num: '02', title: t('step2Title'), desc: t('step2Desc'), color: 'text-chakra' },
                  { num: '03', title: t('step3Title'), desc: t('step3Desc'), color: 'text-green' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className={`text-4xl font-black opacity-20 group-hover:opacity-100 transition-opacity ${step.color}`}>{step.num}</div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3 text-white">{step.title}</h3>
                      <p className="text-white/60 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="card bg-white/5 border-white/10 p-8 aspect-square flex flex-col justify-end group hover:bg-saffron/10 transition-colors">
                  <TrendingUp size={48} className="text-saffron mb-4" />
                  <h4 className="text-xl font-bold">{t('realTimeTracking')}</h4>
                </div>
                <div className="card bg-saffron p-8 aspect-[3/4] flex flex-col justify-end shadow-2xl shadow-saffron/20">
                  <Award size={48} className="text-white mb-4" />
                  <h4 className="text-xl font-bold">{t('earnRewards')}</h4>
                </div>
              </div>
              <div className="space-y-6 pt-12">
                <div className="card bg-green p-8 aspect-[3/4] flex flex-col justify-end shadow-2xl shadow-green/20">
                  <ShieldCheck size={48} className="text-white mb-4" />
                  <h4 className="text-xl font-bold">{t('privacyFirst')}</h4>
                </div>
                <div className="card bg-white/5 border-white/10 p-8 aspect-square flex flex-col justify-end group hover:bg-green/10 transition-colors">
                  <Users size={48} className="text-green mb-4" />
                  <h4 className="text-xl font-bold">{t('communityDriven')}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Feed Preview */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="text-left max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-black mb-6">{t('liveCommunityFeed')}</h2>
            <p className="text-xl text-gray-500 leading-relaxed">{t('feedSubtitle')}</p>
          </div>
          <Link to="/feed" className="btn-outline group">
            {t('viewFullFeed')} <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {recentComplaints.length > 0 ? (
              recentComplaints.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))
            ) : (
              <div className="col-span-3 text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                <p className="text-gray-400 font-bold text-xl">{t('noComplaintsYet')}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-white pt-32 pb-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-chakra rounded-2xl flex items-center justify-center text-white shadow-lg shadow-chakra/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1/3 bg-saffron/20"></div>
                  <div className="absolute bottom-0 left-0 w-full h-1/3 bg-green/20"></div>
                  <PlusCircle size={28} className="relative z-10" />
                </div>
                <span className="text-3xl font-black leading-none tracking-tighter">
                  <span className="text-saffron">India</span>
                  <span className="text-chakra">24</span>
                  <span className="text-green">7</span>
                </span>
              </div>
              <p className="text-xl text-gray-400 max-w-md mb-12 leading-relaxed">
                {t('footerTagline')}
              </p>
              <div className="flex gap-6">
                {['Twitter', 'Instagram', 'LinkedIn'].map((social) => (
                  <a key={social} href="#" className="w-12 h-12 bg-bg rounded-2xl flex items-center justify-center text-navy hover:bg-primary hover:text-white transition-all">
                    <span className="sr-only">{social}</span>
                    <div className="w-6 h-6 bg-current opacity-20 rounded-sm"></div>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-8">Platform</h4>
              <ul className="flex flex-col gap-6 text-gray-500 font-medium">
                <li><Link to="/" className="hover:text-primary transition-colors">{t('home')}</Link></li>
                <li><Link to="/report" className="hover:text-primary transition-colors">{t('reportIssue')}</Link></li>
                <li><Link to="/map" className="hover:text-primary transition-colors">{t('liveMap')}</Link></li>
                <li><Link to="/feed" className="hover:text-primary transition-colors">{t('feed')}</Link></li>
                <li><Link to="/rewards" className="hover:text-primary transition-colors">{t('rewards')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-8">{t('organization')}</h4>
              <ul className="flex flex-col gap-6 text-gray-500 font-medium">
                <li><a href="#" className="hover:text-primary transition-colors">{t('aboutUs')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('privacyPolicy')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('termsOfService')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('partnerWithUs')}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t('contactSupport')}</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-16 border-t border-gray-100 gap-8">
            <p className="text-sm text-gray-400 font-medium">© 2026 India247. An Initiative for Digital Bharat.</p>
            <div className="flex items-center gap-8">
              <p className="text-sm font-bold text-navy flex items-center gap-2">
                {t('madeWithLove')}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
