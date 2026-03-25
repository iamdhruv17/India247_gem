import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar, MobileBottomNav, ToastProvider, LanguageProvider } from './components/Common';
import { FirebaseProvider } from './firebase';
import { motion, AnimatePresence } from 'motion/react';

// Lazy load pages for performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const RewardsPage = lazy(() => import('./pages/RewardsPage'));
const MyReportsPage = lazy(() => import('./pages/MyReportsPage'));
const OfficerDashboard = lazy(() => import('./pages/OfficerDashboard'));

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="min-h-screen pt-20 pb-24 md:pb-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-bg">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-navy font-bold animate-pulse">Namaste! Loading India247...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <Router>
      <FirebaseProvider>
        <LanguageProvider>
          <ToastProvider>
            <div className="min-h-screen bg-bg selection:bg-primary/20 selection:text-primary">
              <Navbar />
              <Suspense fallback={<LoadingFallback />}>
                <PageTransition>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/map" element={<ExplorePage />} />
                    <Route path="/feed" element={<ExplorePage />} />
                    <Route path="/tracker" element={<TrackerPage />} />
                    <Route path="/tracker/:id" element={<TrackerPage />} />
                    <Route path="/rewards" element={<RewardsPage />} />
                    <Route path="/my-reports" element={<MyReportsPage />} />
                    <Route path="/officer" element={<OfficerDashboard />} />
                  </Routes>
                </PageTransition>
              </Suspense>
              <MobileBottomNav />
            </div>
          </ToastProvider>
        </LanguageProvider>
      </FirebaseProvider>
    </Router>
  );
}
