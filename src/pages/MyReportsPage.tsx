import React, { useState, useEffect } from 'react';
import { Search, LayoutGrid, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ComplaintCard, useLanguage } from '../components/Common';
import { db, useAuth } from '../firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function MyReportsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    setIsLoading(true);
    // Query complaints where reportedByUid matches current user
    const q = query(
      collection(db, 'complaints'),
      where('reportedByUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(data);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching my reports:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-navy hover:bg-bg transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-navy">{t('my_reports')}</h2>
          <p className="text-gray-500 text-sm">{t('track_your_filed_complaints') || 'Track all your filed complaints here'}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="w-full h-48 bg-gray-100 rounded-3xl mb-4"></div>
              <div className="w-3/4 h-6 bg-gray-100 rounded mb-2"></div>
              <div className="w-1/2 h-4 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                <div className="w-24 h-24 bg-navy/5 rounded-full flex items-center justify-center text-navy/20 mb-6">
                  <LayoutGrid size={48} />
                </div>
                <h3 className="text-xl font-bold text-navy mb-2">{t('noComplaintsFound')}</h3>
                <p className="text-gray-500 mb-8">{t('you_havent_filed_any_complaints') || "You haven't filed any complaints yet."}</p>
                <button 
                  onClick={() => navigate('/report')}
                  className="btn-primary"
                >
                  {t('reportIssue')}
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
