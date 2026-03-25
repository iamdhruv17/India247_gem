import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, PlusCircle, Map, LayoutGrid, Award, User, Bell, CheckCircle2, 
  AlertCircle, Info, LogOut, Globe, ChevronDown, TrendingUp, Clock, 
  ArrowRight, ShieldCheck, Lock, Phone, Smartphone, MessageSquare, Share2, Heart, MapPin
} from 'lucide-react';
import { db, useAuth, OperationType, handleFirestoreError } from '../firebase';
import { doc, updateDoc, increment, setDoc, deleteDoc, getDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Language Context
type Language = 'en' | 'hi';
interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

const translations: Translations = {
  home: { en: 'Home', hi: 'होम' },
  map: { en: 'Map', hi: 'नक्शा' },
  feed: { en: 'Feed', hi: 'फीड' },
  rewards: { en: 'Rewards', hi: 'इनाम' },
  officer: { en: 'Officer Dashboard', hi: 'अधिकारी डैशबोर्ड' },
  report: { en: 'Report Issue', hi: 'शिकायत करें' },
  login: { en: 'Login', hi: 'लॉगिन' },
  logout: { en: 'Logout', hi: 'लॉगआउट' },
  points: { en: 'Points', hi: 'अंक' },
  notifications: { en: 'Notifications', hi: 'सूचनाएं' },
  no_notifications: { en: 'No new notifications', hi: 'कोई नई सूचना नहीं' },
  track_id: { en: 'Tracking ID', hi: 'ट्रैकिंग आईडी' },
  status: { en: 'Status', hi: 'स्थिति' },
  latest: { en: 'Latest', hi: 'नवीनतम' },
  trending: { en: 'Trending', hi: 'ट्रेंडिंग' },
  heroTitle: { en: 'Build a Better Bharat Together.', hi: 'मिलकर एक बेहतर भारत बनाएं।' },
  heroSubtitle: { en: 'The official bridge between citizens and government. Report issues in 60 seconds, track them in real-time, and earn rewards for being a responsible citizen.', hi: 'नागरिकों और सरकार के बीच आधिकारिक सेतु। 60 सेकंड में समस्याओं की रिपोर्ट करें, उन्हें रीयल-टाइम में ट्रैक करें, और एक जिम्मेदार नागरिक होने के लिए इनाम जीतें।' },
  reportIssue: { en: 'Report an Issue', hi: 'समस्या की रिपोर्ट करें' },
  liveMap: { en: 'Live Map', hi: 'लाइव मैप' },
  trackPlaceholder: { en: 'Enter Tracking ID (e.g. IND-2026-04821)', hi: 'ट्रैकिंग आईडी दर्ज करें (उदा. IND-2026-04821)' },
  trackBtn: { en: 'Track', hi: 'ट्रैक करें' },
  statsFiled: { en: 'Reports Filed', hi: 'दर्ज रिपोर्ट' },
  statsResolved: { en: 'Issues Resolved', hi: 'सुलझाई गई समस्याएं' },
  statsWards: { en: 'Active Wards', hi: 'सक्रिय वार्ड' },
  statsSuccess: { en: 'Success Rate', hi: 'सफलता दर' },
  whatNeedsAttention: { en: 'What needs attention?', hi: 'किस पर ध्यान देने की जरूरत है?' },
  categorySubtitle: { en: 'Select a category to report an issue. Our AI will automatically route it to the correct department for immediate action.', hi: 'रिपोर्ट करने के लिए एक श्रेणी चुनें। हमारा AI इसे तुरंत कार्रवाई के लिए सही विभाग को भेज देगा।' },
  allCategories: { en: 'All Categories', hi: 'सभी श्रेणियां' },
  howItWorks: { en: 'Reporting made dead simple.', hi: 'रिपोर्टिंग हुई बहुत आसान।' },
  step1Title: { en: 'Chat with AI', hi: 'AI के साथ चैट करें' },
  step1Desc: { en: 'No complex forms. Just tell our AI assistant what the problem is, just like you would tell a friend.', hi: 'कोई जटिल फॉर्म नहीं। बस हमारे AI सहायक को बताएं कि समस्या क्या है, जैसे आप किसी दोस्त को बताते हैं।' },
  step2Title: { en: 'Instant Verification', hi: 'त्वरित सत्यापन' },
  step2Desc: { en: 'Our AI analyzes your photo and location to verify the issue and prevent spam reports.', hi: 'हमारा AI समस्या को सत्यापित करने और स्पैम रिपोर्ट को रोकने के लिए आपकी फोटो और स्थान का विश्लेषण करता है।' },
  step3Title: { en: 'Direct Routing', hi: 'सीधा प्रेषण' },
  step3Desc: { en: 'The complaint is instantly sent to the Junior Engineer or Inspector of your specific ward.', hi: 'शिकायत तुरंत आपके विशिष्ट वार्ड के जूनियर इंजीनियर या इंस्पेक्टर को भेज दी जाती है।' },
  liveCommunityFeed: { en: 'Live Community Feed', hi: 'लाइव कम्युनिटी फ़ीड' },
  feedSubtitle: { en: 'See what issues are being reported and resolved in real-time across the city.', hi: 'देखें कि शहर भर में वास्तविक समय में कौन सी समस्याएं रिपोर्ट और हल की जा रही हैं।' },
  viewFullFeed: { en: 'View Full Feed', hi: 'पूरी फ़ीड देखें' },
  footerTagline: { en: 'Empowering 1.4 billion citizens to build smarter, cleaner, and safer cities through technology and transparency.', hi: 'तकनीक और पारदर्शिता के माध्यम से 1.4 अरब नागरिकों को स्मार्ट, स्वच्छ और सुरक्षित शहर बनाने के लिए सशक्त बनाना।' },
  madeWithLove: { en: 'Made with ❤️ for Bharat', hi: 'भारत के लिए ❤️ के साथ बनाया गया' },
  officialPartners: { en: 'Official Partners & Recognition', hi: 'आधिकारिक भागीदार और मान्यता' },
  aiPowered: { en: 'AI-Powered Civic Platform', hi: 'AI-संचालित नागरिक मंच' },
  filingProgress: { en: 'Filing Progress', hi: 'फाइलिंग प्रगति' },
  selectIssue: { en: 'Select Issue', hi: 'समस्या चुनें' },
  describeIssue: { en: 'Describe Issue', hi: 'समस्या का वर्णन करें' },
  uploadPhoto: { en: 'Upload Photo', hi: 'फोटो अपलोड करें' },
  aiVerification: { en: 'AI Verification', hi: 'AI सत्यापन' },
  addLocation: { en: 'Add Location', hi: 'स्थान जोड़ें' },
  confirmSubmit: { en: 'Confirm & Submit', hi: 'पुष्टि करें और सबमिट करें' },
  privacyGuaranteed: { en: 'Privacy Guaranteed', hi: 'गोपनीयता की गारंटी' },
  privacyDesc: { en: 'Your data is encrypted and only shared with relevant civic departments.', hi: 'आपका डेटा एन्क्रिप्टेड है और केवल संबंधित नागरिक विभागों के साथ साझा किया जाता है।' },
  assistantName: { en: 'India247 Assistant', hi: 'India247 सहायक' },
  onlineAI: { en: 'Online | AI Powered', hi: 'ऑनलाइन | AI संचालित' },
  typeMessage: { en: 'Type your message...', hi: 'अपना संदेश टाइप करें...' },
  useCurrentLocation: { en: 'Use My Current Location', hi: 'मेरे वर्तमान स्थान का उपयोग करें' },
  typeAddress: { en: 'Type My Address', hi: 'मेरा पता टाइप करें' },
  keepAnonymous: { en: 'Yes, keep me anonymous', hi: 'हाँ, मुझे गुमनाम रखें' },
  useMyName: { en: 'No, use my name', hi: 'नहीं, मेरे नाम का उपयोग करें' },
  complaintFiled: { en: 'Complaint Filed!', hi: 'शिकायत दर्ज की गई!' },
  complaintSuccessDesc: { en: 'Your issue has been reported successfully. Our team will look into it shortly.', hi: 'आपकी समस्या सफलतापूर्वक रिपोर्ट कर दी गई है। हमारी टीम जल्द ही इस पर गौर करेगी।' },
  trackMyComplaint: { en: 'Track My Complaint', hi: 'मेरी शिकायत ट्रैक करें' },
  reportAnother: { en: 'Report Another Issue', hi: 'एक और समस्या की रिपोर्ट करें' },
  loginToSecurelyFile: { en: 'You\'re almost there! Please login to securely file your complaint and earn points.', hi: 'आप बस पहुँच ही गए हैं! अपनी शिकायत सुरक्षित रूप से दर्ज करने और अंक अर्जित करने के लिए कृपया लॉगिन करें।' },
  loginWithGoogle: { en: 'Login with Google', hi: 'गूगल के साथ लॉगिन करें' },
  welcomeMsg: { en: 'Namaste! 🙏 I\'m India247 Assistant. I\'ll help you file your complaint in under 60 seconds. What civic issue are you facing today?', hi: 'नमस्ते! 🙏 मैं India247 सहायक हूँ। मैं 60 सेकंड से कम समय में आपकी शिकायत दर्ज करने में आपकी मदद करूँगा। आज आप किस नागरिक समस्या का सामना कर रहे हैं?' },
  descMsg: { en: 'Can you describe the issue in a bit more detail? (e.g., how big is the pothole, since how long has garbage not been collected, etc.)', hi: 'क्या आप समस्या का थोड़ा और विस्तार से वर्णन कर सकते हैं? (जैसे, गड्ढा कितना बड़ा है, कचरा कितने समय से जमा नहीं किया गया है, आदि)' },
  photoMsg: { en: 'Please upload a photo of the issue. This helps our AI verify your complaint and speeds up resolution! 📸', hi: 'कृपया समस्या की एक फोटो अपलोड करें। यह हमारे AI को आपकी शिकायत को सत्यापित करने में मदद करता है और समाधान में तेजी लाता है! 📸' },
  locMsg: { en: 'Great! AI has confirmed this looks like a genuine issue 🎉. Now, can you share your location? This helps assign your complaint to the right ward.', hi: 'बहुत बढ़िया! AI ने पुष्टि की है कि यह एक वास्तविक समस्या लग रही है 🎉। अब, क्या आप अपना स्थान साझा कर सकते हैं? यह आपकी शिकायत को सही वार्ड में भेजने में मदद करता है।' },
  anonMsg: { en: 'One last thing — do you want to keep your identity anonymous? Your complaint will still be filed and tracked, but officials won\'t see your name or contact details.', hi: 'एक आखिरी बात - क्या आप अपनी पहचान गुप्त रखना चाहते हैं? आपकी शिकायत अभी भी दर्ज और ट्रैक की जाएगी, लेकिन अधिकारियों को आपका नाम या संपर्क विवरण नहीं दिखेगा।' },
  verifyingMsg: { en: 'AI Verification in Progress', hi: 'AI सत्यापन प्रगति पर है' },
  analyzingImg: { en: 'Analyzing uploaded image...', hi: 'अपलोड की गई इमेज का विश्लेषण किया जा रहा है...' },
  detectingCat: { en: 'Detecting issue category...', hi: 'समस्या श्रेणी का पता लगाया जा रहा है...' },
  verifyingLoc: { en: 'Verifying location authenticity...', hi: 'स्थान की प्रामाणिकता सत्यापित की जा रही है...' },
  verifiedSuccess: { en: 'Complaint verified successfully!', hi: 'शिकायत सफलतापूर्वक सत्यापित हो गई!' },
  whatsHappening: { en: "What's Happening Around You", hi: 'आपके आसपास क्या हो रहा है' },
  mostUpvoted: { en: 'Most Upvoted', hi: 'सर्वाधिक वोट' },
  nearMe: { en: 'Near Me', hi: 'मेरे पास' },
  noComplaintsFound: { en: 'No complaints found', hi: 'कोई शिकायत नहीं मिली' },
  noComplaintsDesc: { en: 'Try changing your filters or category selection', hi: 'अपने फ़िल्टर या श्रेणी चयन को बदलने का प्रयास करें' },
  trendingIssues: { en: 'Trending Issues', hi: 'ट्रेंडिंग मुद्दे' },
  citizenLeaderboard: { en: 'Citizen Leaderboard', hi: 'सिटीजन लीडरबोर्ड' },
  viewFullLeaderboard: { en: 'View Full Leaderboard', hi: 'पूरा लीडरबोर्ड देखें' },
  beTheChange: { en: 'Be the change!', hi: 'बदलाव बनें!' },
  beTheChangeDesc: { en: 'Spotted something that needs attention? Report it now and help make your city better.', hi: 'कुछ ऐसा देखा जिस पर ध्यान देने की जरूरत है? अभी रिपोर्ट करें और अपने शहर को बेहतर बनाने में मदद करें।' },
  upvotes: { en: 'Upvotes', hi: 'अपवोट' },
  allIssues: { en: 'All Issues', hi: 'सभी मुद्दे' },
  explore: { en: 'Explore', hi: 'खोजें' },
  nearby: { en: 'Nearby', hi: 'पास के' },
  myReports: { en: 'My Reports', hi: 'मेरी रिपोर्ट' },
  timeline: { en: 'Timeline', hi: 'समयरेखा' },
  assignedTo: { en: 'Assigned to:', hi: 'को सौंपा गया:' },
  updateTimeline: { en: 'Update Timeline', hi: 'समयरेखा अपडेट करें' },
  addEvent: { en: 'Add Event', hi: 'घटना जोड़ें' },
  searchPlaceholder: { en: 'Search area or ID...', hi: 'क्षेत्र या आईडी खोजें...' },
  loadingMap: { en: 'Loading Live Map...', hi: 'लाइव मैप लोड हो रहा है...' },
  totalComplaints: { en: 'Total Complaints', hi: 'कुल शिकायतें' },
  pendingLongest: { en: 'Pending Longest', hi: 'सबसे लंबे समय से लंबित' },
  viewDetails: { en: 'View Details', hi: 'विवरण देखें' },
  trackComplaint: { en: 'Track Complaint', hi: 'शिकायत ट्रैक करें' },
  track: { en: 'Track', hi: 'ट्रैक' },
  fetchingDetails: { en: 'Fetching complaint details...', hi: 'शिकायत विवरण प्राप्त किया जा रहा है...' },
  noComplaintFound: { en: 'No complaint found', hi: 'कोई शिकायत नहीं मिली' },
  noComplaintDesc: { en: "We couldn't find any complaint with the ID:", hi: 'हमें इस आईडी के साथ कोई शिकायत नहीं मिली:' },
  tryAnotherId: { en: 'Try another ID', hi: 'दूसरी आईडी आज़माएं' },
  resolutionTimeline: { en: 'Resolution Timeline', hi: 'समाधान समयरेखा' },
  complaintFiledTitle: { en: 'Complaint Filed', hi: 'शिकायत दर्ज' },
  complaintFiledDescText: { en: 'Your complaint has been successfully recorded in our system.', hi: 'आपकी शिकायत हमारे सिस्टम में सफलतापूर्वक दर्ज कर ली गई है।' },
  sentToDepartment: { en: 'Sent to Department', hi: 'विभाग को भेजा गया' },
  officerAssignedTitle: { en: 'Officer Assigned', hi: 'अधिकारी नियुक्त' },
  waitingForAssignment: { en: 'Waiting for officer assignment...', hi: 'अधिकारी नियुक्ति की प्रतीक्षा की जा रही है...' },
  officerInvestigating: { en: 'An officer has been assigned to investigate.', hi: 'जांच के लिए एक अधिकारी नियुक्त किया गया है।' },
  workInProgressTitle: { en: 'Work in Progress', hi: 'काम प्रगति पर है' },
  workInProgressDescText: { en: 'The assigned department is working on the resolution.', hi: 'नियुक्त विभाग समाधान पर काम कर रहा है।' },
  resolvedTitle: { en: 'Resolved', hi: 'समाधान हो गया' },
  resolvedDescText: { en: 'The issue has been fixed and verified by the department.', hi: 'समस्या को ठीक कर दिया गया है और विभाग द्वारा सत्यापित किया गया है।' },
  assignedOfficer: { en: 'Assigned Officer', hi: 'नियुक्त अधिकारी' },
  notSatisfied: { en: 'Not satisfied with the resolution?', hi: 'समाधान से संतुष्ट नहीं हैं?' },
  reopenComplaint: { en: 'Reopen Complaint', hi: 'शिकायत फिर से खोलें' },
  searchForComplaint: { en: 'Search for a complaint', hi: 'शिकायत खोजें' },
  searchForComplaintDesc: { en: 'Enter your complaint ID above to see real-time updates', hi: 'वास्तविक समय के अपडेट देखने के लिए ऊपर अपनी शिकायत आईडी दर्ज करें' },
  escalationAlert: { en: 'Escalation Alert', hi: 'एस्केलेशन अलर्ट' },
  escalationDesc: { en: 'This complaint was escalated to Senior Officer after 6 hours of no response. Junior Officer flagged for delayed action.', hi: '6 घंटे तक कोई प्रतिक्रिया नहीं मिलने के बाद इस शिकायत को वरिष्ठ अधिकारी के पास भेज दिया गया। जूनियर अधिकारी को देरी से कार्रवाई के लिए चिह्नित किया गया।' },
  locked: { en: 'Locked', hi: 'बंद' },
  redeemNow: { en: 'Redeem Now', hi: 'अभी रिडीम करें' },
  insufficientPoints: { en: 'Insufficient Points', hi: 'अपर्याप्त अंक' },
  myRewards: { en: 'My Rewards', hi: 'मेरे इनाम' },
  leaderboard: { en: 'Leaderboard', hi: 'लीडरबोर्ड' },
  currentBalance: { en: 'Current Balance', hi: 'वर्तमान बैलेंस' },
  next: { en: 'Next:', hi: 'अगला:' },
  yourAchievements: { en: 'Your Achievements', hi: 'आपकी उपलब्धियां' },
  howToEarnPoints: { en: 'How to Earn Points', hi: 'अंक कैसे अर्जित करें' },
  genuineComplaintFiled: { en: 'Genuine complaint filed', hi: 'वास्तविक शिकायत दर्ज की गई' },
  complaintResolvedText: { en: 'Complaint resolved', hi: 'शिकायत का समाधान हो गया' },
  complaintUpvotedBy10: { en: 'Complaint upvoted by 10+ people', hi: 'शिकायत को 10+ लोगों ने अपवोट किया' },
  falseRejectedComplaint: { en: 'False/rejected complaint', hi: 'झूठी/अस्वीकृत शिकायत' },
  referAFriend: { en: 'Refer a Friend', hi: 'एक दोस्त को रेफर करें' },
  referAFriendDesc: { en: 'Help your friends make their city better and earn 50 points for every successful report they file!', hi: 'अपने दोस्तों को उनके शहर को बेहतर बनाने में मदद करें और उनके द्वारा दर्ज की गई प्रत्येक सफल रिपोर्ट के लिए 50 अंक अर्जित करें!' },
  shareReferralCode: { en: 'Share Referral Code', hi: 'रेफरल कोड साझा करें' },
  redeemYourPoints: { en: 'Redeem Your Points', hi: 'अपने अंक रिडीम करें' },
  globalLeaderboard: { en: 'Global Leaderboard', hi: 'ग्लोबल लीडरबोर्ड' },
  top10Citizens: { en: 'Top 10 citizens making an impact this month', hi: 'इस महीने प्रभाव डालने वाले शीर्ष 10 नागरिक' },
  you: { en: 'You', hi: 'आप' },
  redeemSuccess: { en: 'Successfully redeemed', hi: 'सफलतापूर्वक रिडीम किया गया' },
  redeemError: { en: 'Failed to redeem reward. Please try again.', hi: 'इनाम रिडीम करने में विफल। कृपया पुनः प्रयास करें।' },
  officerLogin: { en: 'Officer Login', hi: 'अधिकारी लॉगिन' },
  authorizedPersonnelOnly: { en: 'For authorized government personnel only', hi: 'केवल अधिकृत सरकारी कर्मियों के लिए' },
  officerId: { en: 'Officer ID', hi: 'अधिकारी आईडी' },
  enterId: { en: 'Enter your ID', hi: 'अपनी आईडी दर्ज करें' },
  password: { en: 'Password', hi: 'पासवर्ड' },
  loginAsOfficer: { en: 'Login as Officer', hi: 'अधिकारी के रूप में लॉगिन करें' },
  unauthorizedAccessProhibited: { en: 'Unauthorized access is strictly prohibited and monitored. By logging in, you agree to our security protocols.', hi: 'अनधिकृत पहुंच सख्त वर्जित है और इसकी निगरानी की जाती है। लॉगिन करके, आप हमारे सुरक्षा प्रोटोकॉल से सहमत होते हैं।' },
  goodMorningOfficer: { en: 'Good morning, Officer', hi: 'सुप्रभात, अधिकारी' },
  ward: { en: 'Ward', hi: 'वार्ड' },
  activeComplaints: { en: 'Active Complaints', hi: 'सक्रिय शिकायतें' },
  searchIdPlaceholder: { en: 'Search ID...', hi: 'आईडी खोजें...' },
  id: { en: 'ID', hi: 'आईडी' },
  category: { en: 'Category', hi: 'श्रेणी' },
  filed: { en: 'Filed', hi: 'दर्ज' },
  action: { en: 'Action', hi: 'कार्रवाई' },
  accept: { en: 'Accept', hi: 'स्वीकार करें' },
  resolve: { en: 'Resolve', hi: 'समाधान करें' },
  completed: { en: 'Completed', hi: 'पूरा हुआ' },
  showingComplaints: { en: 'Showing 10 of 42 complaints', hi: '42 में से 10 शिकायतें दिखाई जा रही हैं' },
  prev: { en: 'Prev', hi: 'पिछला' },
  nextBtn: { en: 'Next', hi: 'अगला' },
  escalations: { en: 'Escalations', hi: 'एस्केलेशन' },
  new: { en: 'New', hi: 'नया' },
  escalatedDueToInactivity: { en: 'Escalated due to inactivity', hi: 'निष्क्रियता के कारण एस्केलेट किया गया' },
  performance: { en: 'Performance', hi: 'प्रदर्शन' },
  completionRate: { en: 'Completion Rate', hi: 'पूर्णता दर' },
  avgResolutionTime: { en: 'Avg Resolution Time', hi: 'औसत समाधान समय' },
  citizenRating: { en: 'Citizen Rating', hi: 'नागरिक रेटिंग' },
  monthlyBadge: { en: 'Monthly Badge', hi: 'मासिक बैज' },
  quickActions: { en: 'Quick Actions', hi: 'त्वरित कार्रवाई' },
  generateWardReport: { en: 'Generate Ward Report', hi: 'वार्ड रिपोर्ट तैयार करें' },
  broadcastAnnouncement: { en: 'Broadcast Announcement', hi: 'घोषणा प्रसारित करें' },
  contactSeniorOfficer: { en: 'Contact Senior Officer', hi: 'वरिष्ठ अधिकारी से संपर्क करें' },
  statusUpdatedTo: { en: 'Status updated to', hi: 'स्थिति अपडेट की गई' },
  failedToUpdateStatus: { en: 'Failed to update status', hi: 'स्थिति अपडेट करने में विफल' },
  tagline: { en: 'Apna Shehar, Apni Zimmedari', hi: 'अपना शहर, अपनी जिम्मेदारी' },
  statusUpdated: { en: 'Status Updated', hi: 'स्थिति अपडेट की गई' },
  details: { en: 'Details', hi: 'विवरण' },
  photoUploaded: { en: 'Photo uploaded ✓', hi: 'फोटो अपलोड हो गई ✓' },
  currentLocationShared: { en: '📍 Current Location shared', hi: '📍 वर्तमान स्थान साझा किया गया' },
  anonymousCitizen: { en: 'Anonymous Citizen', hi: 'गुमनाम नागरिक' },
  unknownLocation: { en: 'Unknown Location', hi: 'अज्ञात स्थान' },
  complaintSuccessPrefix: { en: '🎉 Your complaint has been successfully filed! Tracking ID:', hi: '🎉 आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है! ट्रैकिंग आईडी:' },
  earnedPointsSuffix: { en: 'You earned +10 points!', hi: 'आपने +10 अंक अर्जित किए!' },
  complaintFiledSuccessToast: { en: 'Complaint filed successfully!', hi: 'शिकायत सफलतापूर्वक दर्ज की गई!' },
  complaintFiledErrorToast: { en: 'Failed to file complaint. Please try again.', hi: 'शिकायत दर्ज करने में विफल। कृपया पुनः प्रयास करें।' },
  clickToUpload: { en: 'Click to upload or drag and drop', hi: 'अपलोड करने के लिए क्लिक करें या ड्रैग एंड ड्रॉप करें' },
  uploadFormat: { en: 'Accepts JPG, PNG (Max 5MB)', hi: 'JPG, PNG स्वीकार करता है (अधिकतम 5MB)' },
  welcomeMsgShort: { en: "Namaste! I'm your India247 Assistant. What civic issue can I help you report today? 🙏", hi: "नमस्ते! मैं आपका India247 सहायक हूँ। आज मैं आपकी किस नागरिक समस्या को रिपोर्ट करने में मदद कर सकता हूँ? 🙏" },
  mockUserMsg: { en: "There's a major water leak in Sector 4 market area.", hi: "सेक्टर 4 मार्केट क्षेत्र में पानी का बड़ा रिसाव है।" },
  realTimeTracking: { en: 'Real-time Tracking', hi: 'रीयल-टाइम ट्रैकिंग' },
  earnRewards: { en: 'Earn Rewards', hi: 'इनाम जीतें' },
  privacyFirst: { en: 'Privacy First', hi: 'गोपनीयता पहले' },
  communityDriven: { en: 'Community Driven', hi: 'समुदाय संचालित' },
  noComplaintsYet: { en: 'No complaints filed yet. Be the first to report!', hi: 'अभी तक कोई शिकायत दर्ज नहीं की गई है। रिपोर्ट करने वाले पहले व्यक्ति बनें!' },
  organization: { en: 'Organization', hi: 'संगठन' },
  aboutUs: { en: 'About Us', hi: 'हमारे बारे में' },
  privacyPolicy: { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
  termsOfService: { en: 'Terms of Service', hi: 'सेवा की शर्तें' },
  partnerWithUs: { en: 'Partner with Us', hi: 'हमारे साथ भागीदार बनें' },
  contactSupport: { en: 'Contact Support', hi: 'सहायता से संपर्क करें' },
  my_reports: { en: 'My Reports', hi: 'मेरी रिपोर्ट' },
  track_your_filed_complaints: { en: 'Track all your filed complaints here', hi: 'अपनी सभी दर्ज शिकायतों को यहाँ ट्रैक करें' },
  you_havent_filed_any_complaints: { en: "You haven't filed any complaints yet.", hi: 'आपने अभी तक कोई शिकायत दर्ज नहीं की है।' },
  point_history: { en: 'Point History', hi: 'अंकों का इतिहास' },
  no_history: { en: 'No point history yet', hi: 'अभी तक कोई अंकों का इतिहास नहीं है' },
};

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('i247_lang') as Language) || 'en';
  });

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  useEffect(() => {
    localStorage.setItem('i247_lang', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Toast Context
type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{
  addToast: (message: string, type?: ToastType) => void;
}>({ addToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-24 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={cn(
                'p-4 rounded-2xl shadow-xl flex items-center gap-3 min-w-[280px] pointer-events-auto border border-black/5',
                toast.type === 'success' ? 'bg-success text-white' :
                toast.type === 'error' ? 'bg-primary text-white' : 'bg-white text-navy'
              )}
            >
              {toast.type === 'success' ? <CheckCircle2 size={20} /> :
               toast.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} className="text-primary" />}
              <span className="text-sm font-bold">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const StatusBadge = ({ status }: { status: string, key?: any }) => {
  const styles: Record<string, string> = {
    'Pending': 'bg-pending-bg text-pending-text',
    'In Progress': 'bg-in-progress-bg text-in-progress-text',
    'Assigned': 'bg-assigned-bg text-assigned-text',
    'Under Inspection': 'bg-inspection-bg text-inspection-text',
    'Resolved': 'bg-resolved-bg text-resolved-text',
  };

  return (
    <span className={cn('status-pill', styles[status] || 'bg-gray-100 text-gray-600')}>
      {status}
    </span>
  );
};

export const Logo = ({ className = "" }: { className?: string }) => (
  <div className={cn("flex items-center gap-2 group cursor-pointer", className)}>
    <div className="relative w-10 h-10 flex items-center justify-center">
      <div className="absolute inset-0 bg-primary rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-primary/20"></div>
      <div className="absolute inset-0 bg-navy rounded-xl -rotate-3 group-hover:-rotate-6 transition-transform duration-300"></div>
      <ShieldCheck size={22} className="relative text-white z-10" />
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-xl font-black text-navy tracking-tighter">INDIA<span className="text-primary">247</span></span>
      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">Civic Response</span>
    </div>
  </div>
);

export const LoginModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'citizen' | 'officer'>('citizen');
  const [loginMethod, setLoginMethod] = useState<'google' | 'phone'>('google');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const { addToast } = useToast();

  const handleOfficerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (officerId && password) {
      addToast(t('loginSuccess')?.en || 'Login Successful', 'success');
      window.location.href = '/officer';
      onClose();
    }
  };

  const handleGoogleLogin = async () => {
    await signIn();
    onClose();
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length >= 10) {
      setShowOtp(true);
      addToast('OTP sent to your phone', 'info');
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '123456' || otp.length === 6) {
      addToast('Login successful', 'success');
      onClose();
    } else {
      addToast('Invalid OTP. Use 123456', 'error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <Logo />
                <button onClick={onClose} className="p-2 hover:bg-bg rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex p-1 bg-bg rounded-2xl mb-8">
                <button
                  onClick={() => setActiveTab('citizen')}
                  className={cn(
                    "flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                    activeTab === 'citizen' ? "bg-white text-navy shadow-sm" : "text-gray-400 hover:text-navy"
                  )}
                >
                  <User size={14} />
                  Citizen
                </button>
                <button
                  onClick={() => setActiveTab('officer')}
                  className={cn(
                    "flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                    activeTab === 'officer' ? "bg-white text-navy shadow-sm" : "text-gray-400 hover:text-navy"
                  )}
                >
                  <ShieldCheck size={14} />
                  Officer
                </button>
              </div>

              {activeTab === 'citizen' ? (
                <div className="flex flex-col gap-6">
                  <div className="flex p-1 bg-bg rounded-xl mb-2">
                    <button
                      onClick={() => setLoginMethod('google')}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-bold rounded-lg transition-all",
                        loginMethod === 'google' ? "bg-white text-navy shadow-sm" : "text-gray-400"
                      )}
                    >
                      Google
                    </button>
                    <button
                      onClick={() => setLoginMethod('phone')}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-bold rounded-lg transition-all",
                        loginMethod === 'phone' ? "bg-white text-navy shadow-sm" : "text-gray-400"
                      )}
                    >
                      Phone OTP
                    </button>
                  </div>

                  {loginMethod === 'google' ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-8 font-medium">
                        Login securely with your Google account to report issues and earn rewards.
                      </p>
                      <button
                        onClick={handleGoogleLogin}
                        className="w-full btn-primary py-4 flex items-center justify-center gap-3"
                      >
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                        {t('loginWithGoogle')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {!showOtp ? (
                        <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-navy uppercase tracking-widest">Phone Number</label>
                            <div className="relative">
                              <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Enter 10 digit number"
                                className="input-field pl-12"
                                required
                              />
                            </div>
                          </div>
                          <button type="submit" className="btn-primary py-4 flex items-center justify-center gap-2">
                            Send OTP <ArrowRight size={16} />
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-navy uppercase tracking-widest">Enter OTP</label>
                            <input
                              type="text"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              placeholder="6-digit code (Use 123456)"
                              className="input-field text-center tracking-[1em] font-black text-xl"
                              maxLength={6}
                              required
                            />
                          </div>
                          <button type="submit" className="btn-primary py-4">
                            Verify & Login
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setShowOtp(false)}
                            className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                          >
                            Change Number
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleOfficerLogin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-widest">{t('officerId')}</label>
                    <input
                      type="text"
                      value={officerId}
                      onChange={(e) => setOfficerId(e.target.value)}
                      placeholder={t('enterId')}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-widest">{t('password')}</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field"
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary mt-4 py-4 bg-navy hover:bg-navy/90">
                    {t('loginAsOfficer')}
                  </button>
                  <p className="text-[10px] text-center text-gray-400 mt-4 leading-relaxed">
                    {t('authorizedPersonnelOnly')}
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const location = useLocation();
  const { addToast } = useToast();
  const { user, profile, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      // Listen for recent resolved complaints or status updates
      const q = query(
        collection(db, 'complaints'),
        orderBy('updatedAt', 'desc'),
        limit(5)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const updates = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((c: any) => c.uid === user.uid);
        setNotifications(updates);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const navLinks = [
    { name: t('home'), path: '/' },
    { name: t('explore'), path: '/explore' },
    { name: t('rewards'), path: '/rewards' },
  ];

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 py-4',
      isScrolled ? 'bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b border-white/20' : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-chakra rounded-2xl flex items-center justify-center text-white shadow-xl shadow-chakra/20 group-hover:scale-105 transition-transform duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/3 bg-saffron/20"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/3 bg-green/20"></div>
            <PlusCircle size={28} className="relative z-10" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black leading-none tracking-tighter">
              <span className="text-saffron">India</span>
              <span className="text-chakra">24</span>
              <span className="text-green">7</span>
            </span>
            <span className="text-[10px] text-gray-500 hidden md:block font-bold uppercase tracking-widest mt-1">
              {t('tagline')}
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'nav-link',
                  location.pathname === link.path && 'nav-link-active'
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="h-6 w-[1px] bg-navy/10"></div>

          <div className="flex items-center gap-6">
            {/* Language Toggle */}
            <button 
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-2 text-sm font-bold text-navy hover:text-primary transition-all bg-navy/5 px-4 py-2 rounded-xl"
            >
              <Globe size={16} />
              {language === 'en' ? 'English' : 'हिंदी'}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-navy hover:bg-navy/10 transition-all relative"
                  >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden z-[100]"
                      >
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                          <h4 className="font-black text-navy">{t('notifications')}</h4>
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">New</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((n) => (
                              <Link 
                                key={n.id} 
                                to={`/tracker/${n.id}`}
                                onClick={() => setShowNotifications(false)}
                                className="flex items-start gap-4 p-4 hover:bg-bg transition-colors border-b border-gray-50 last:border-none"
                              >
                                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success flex-shrink-0">
                                  <CheckCircle2 size={20} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-navy mb-1">{t('statusUpdated')}: {n.status}</p>
                                  <p className="text-[10px] text-gray-400 line-clamp-2">{n.description}</p>
                                  <p className="text-[9px] text-primary font-bold mt-2">{t('id')}: {n.id}</p>
                                </div>
                              </Link>
                            ))
                          ) : (
                            <div className="p-12 text-center">
                              <Bell size={32} className="mx-auto text-gray-200 mb-4" />
                              <p className="text-xs font-bold text-gray-400">{t('no_notifications')}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-3 bg-navy/5 p-1.5 pr-4 rounded-2xl hover:bg-navy/10 transition-all">
                    <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                      <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Profile" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] font-black text-navy leading-none truncate max-w-[80px]">{user.displayName?.split(' ')[0]}</span>
                      <span className="text-[9px] font-bold text-gold">⭐ {profile?.points || 0}</span>
                    </div>
                    <ChevronDown size={14} className="text-navy/40 group-hover:rotate-180 transition-transform" />
                  </button>
                  
                  <div className="absolute right-0 top-full mt-4 w-56 bg-white rounded-[2rem] shadow-2xl border border-gray-100 py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="px-6 py-3 border-b border-gray-50 mb-2">
                      <p className="text-xs font-black text-navy truncate">{user.displayName}</p>
                      <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link to="/rewards" className="flex items-center gap-3 px-6 py-3 text-xs font-bold text-navy hover:bg-bg transition-colors">
                      <Award size={16} className="text-gold" /> {t('rewards')}
                    </Link>
                    <Link to="/my-reports" className="flex items-center gap-3 px-6 py-3 text-xs font-bold text-navy hover:bg-bg transition-colors">
                      <LayoutGrid size={16} className="text-primary" /> {t('my_reports')}
                    </Link>
                    {profile?.role === 'officer' && (
                      <Link to="/officer" className="flex items-center gap-3 px-6 py-3 text-xs font-bold text-navy hover:bg-bg transition-colors">
                        <LayoutGrid size={16} className="text-primary" /> {t('officer')}
                      </Link>
                    )}
                    <button onClick={logout} className="w-full flex items-center gap-3 px-6 py-3 text-xs font-bold text-primary hover:bg-primary/5 transition-colors">
                      <LogOut size={16} /> {t('logout')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="btn-outline py-2.5 px-6 text-sm">
                <User size={18} />
                {t('login')}
              </button>
            )}

            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

            <Link to="/report" className="btn-primary py-2.5 px-6 text-sm shadow-primary/20">
              {t('report')}
            </Link>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <button className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-navy">
            <Bell size={20} />
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-navy">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 right-0 bg-white shadow-2xl border-t border-gray-100 overflow-hidden md:hidden"
          >
            <div className="p-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'text-xl font-black py-2 border-b border-gray-50 flex justify-between items-center',
                    location.pathname === link.path ? 'text-primary' : 'text-navy'
                  )}
                >
                  {link.name}
                  <ArrowRight size={20} className="opacity-20" />
                </Link>
              ))}
              <div className="flex gap-4 mt-4">
                <button 
                  onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                  className="flex-1 btn-outline py-4"
                >
                  <Globe size={20} />
                  {language === 'en' ? 'हिंदी' : 'English'}
                </button>
                {!user && (
                  <button onClick={() => { setIsLoginModalOpen(true); setIsOpen(false); }} className="flex-1 btn-outline py-4">
                    <User size={20} />
                    {t('login')}
                  </button>
                )}
              </div>
              <Link
                to="/report"
                onClick={() => setIsOpen(false)}
                className="btn-primary py-5 text-lg"
              >
                {t('report')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export const MobileBottomNav = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const navItems = [
    { name: t('home'), path: '/', icon: LayoutGrid },
    { name: t('explore'), path: '/explore', icon: Map },
    { name: t('report'), path: '/report', icon: PlusCircle },
    { name: t('rewards'), path: '/rewards', icon: Award },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 flex justify-around items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
              isActive ? 'text-primary' : 'text-gray-400'
            )}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
};

export const ComplaintCard = ({ complaint }: { complaint: any, key?: any }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [upvotes, setUpvotes] = useState(complaint.upvotes || 0);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && complaint.id) {
      const checkUpvote = async () => {
        try {
          const upvoteDoc = doc(db, 'complaints', complaint.id, 'upvotes', user.uid);
          const snap = await getDoc(upvoteDoc);
          setIsUpvoted(snap.exists());
        } catch (error) {
          console.error('Error checking upvote:', error);
        }
      };
      checkUpvote();
    }
  }, [user, complaint.id]);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      addToast('Please login to upvote', 'info');
      return;
    }

    if (loading) return;
    setLoading(true);

    const complaintRef = doc(db, 'complaints', complaint.id);
    const upvoteRef = doc(db, 'complaints', complaint.id, 'upvotes', user.uid);

    try {
      if (isUpvoted) {
        await deleteDoc(upvoteRef);
        await updateDoc(complaintRef, { upvotes: increment(-1) });
        setUpvotes((prev: number) => prev - 1);
        setIsUpvoted(false);
      } else {
        await setDoc(upvoteRef, { uid: user.uid, createdAt: new Date() });
        await updateDoc(complaintRef, { upvotes: increment(1) });
        setUpvotes((prev: number) => prev + 1);
        setIsUpvoted(true);
        addToast('Upvoted! This issue will get more attention.', 'success');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `complaints/${complaint.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card hover:shadow-2xl hover:shadow-navy/5 group cursor-pointer border-none bg-white/80 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-navy/5 rounded-2xl flex items-center justify-center text-navy font-black text-sm border border-white">
            {complaint.authorName?.charAt(0) || 'U'}
          </div>
          <div>
            <h4 className="text-sm font-black leading-none mb-1.5 text-navy">{complaint.authorName}</h4>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
              <Clock size={10} />
              {complaint.createdAt?.toDate ? complaint.createdAt.toDate().toLocaleDateString() : 'Just now'}
            </div>
          </div>
        </div>
        <StatusBadge status={complaint.status} />
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 px-3 py-1 rounded-lg">
            {complaint.category}
          </span>
        </div>
        <h3 className="text-xl font-black mb-3 group-hover:text-primary transition-colors leading-tight">
          {complaint.description?.length > 80 ? complaint.description.substring(0, 80) + '...' : complaint.description}
        </h3>
        {complaint.photoUrl && (
          <div className="relative aspect-[16/10] rounded-[2rem] overflow-hidden mb-4 shadow-inner bg-gray-100">
            <img
              src={complaint.photoUrl}
              alt="Complaint"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-400 text-[11px] font-bold">
          <Map size={14} className="text-primary" />
          <span className="truncate">{complaint.location}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
        <div className="flex items-center gap-6">
          <button
            onClick={handleUpvote}
            className={cn(
              'flex items-center gap-2 text-xs font-black transition-all active:scale-90',
              isUpvoted ? 'text-primary' : 'text-navy/40 hover:text-primary'
            )}
          >
            <TrendingUp size={18} className={cn(isUpvoted && 'animate-bounce')} />
            <span>{upvotes}</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-black text-navy/40">
            <Bell size={18} />
            <span>{complaint.commentsCount || 0}</span>
          </div>
        </div>
        <Link to={`/tracker/${complaint.id}`} className="text-[10px] font-black uppercase tracking-widest text-navy bg-navy/5 px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-all">
          {t('details')}
        </Link>
      </div>
    </div>
  );
};

export const ChatBubble = ({ message, isBot }: { message: any, isBot: boolean, key?: any }) => {
  return (
    <div className={cn('flex w-full mb-4', isBot ? 'justify-start' : 'justify-end')}>
      <div className={cn('flex gap-3 max-w-[85%]', !isBot && 'flex-row-reverse')}>
        {isBot && (
          <div className="w-8 h-8 bg-primary rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
            I247
          </div>
        )}
        <div className={cn(
          'p-4 rounded-2xl text-sm leading-relaxed shadow-sm',
          isBot ? 'bg-white text-navy rounded-tl-none' : 'bg-primary text-white rounded-tr-none'
        )}>
          {message}
        </div>
      </div>
    </div>
  );
};
