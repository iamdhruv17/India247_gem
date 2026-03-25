import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Send, CheckCircle2, User, ShieldCheck, Loader2, Image as ImageIcon, X, PlusCircle, Construction, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatBubble, useToast, useLanguage } from '../components/Common';
import { getGeminiResponse } from '../services/gemini';
import { CATEGORIES } from '../data/mockData';
import { db, auth, useAuth } from '../firebase';
import { collection, addDoc, setDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

type Step = 'welcome' | 'description' | 'photo' | 'verification' | 'location' | 'anonymous' | 'confirmation';

export default function ReportPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [messages, setMessages] = useState<{ text: string | React.ReactNode, isBot: boolean }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState<boolean | null>(null);
  const [complaintId, setComplaintId] = useState(`IND-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeminiThinking, setIsGeminiThinking] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const { user, profile, signIn, loading } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    }
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addBotMessage = async (text: string | React.ReactNode, delay = 1000, useGemini = false) => {
    setIsTyping(true);
    
    let finalContent = text;
    if (useGemini && typeof text === 'string') {
      setIsGeminiThinking(true);
      finalContent = await getGeminiResponse(text);
      setIsGeminiThinking(false);
    }

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { text: finalContent, isBot: true }]);
    }, delay);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { text, isBot: false }]);
  };

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addBotMessage(t('welcomeMsg'));
    }
  }, [t]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    addUserMessage(cat);
    setStep('description');
    const geminiPrompt = `User selected the category "${cat}". Ask them to describe the issue in detail. Be helpful and encouraging.`;
    addBotMessage(geminiPrompt, 1000, true);
  };

  const handleDescriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const desc = inputValue;
    setDescription(desc);
    addUserMessage(desc);
    setInputValue('');
    setStep('photo');
    
    const geminiPrompt = `User described the issue as: "${desc}". Acknowledge this and ask them to upload a photo for verification. Mention that our AI will analyze the photo.`;
    addBotMessage(geminiPrompt, 1000, true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
      addUserMessage(t('photoUploaded'));
      setStep('verification');
      setIsVerifying(true);
      
      // Start AI verification animation
      setTimeout(() => {
        setIsVerifying(false);
        setStep('location');
        const geminiPrompt = `AI has verified the photo of the "${selectedCategory}" issue. Description: "${description}". Now ask the user for their location to assign the report to the correct ward.`;
        addBotMessage(geminiPrompt, 1000, true);
      }, 5000);
    };
    reader.readAsDataURL(file);
  };

  const handleLocationSelect = (loc: string) => {
    if (loc === 'current') {
      setIsLocating(true);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const locStr = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
            setLocation(locStr);
            addUserMessage(`${t('currentLocationShared')}: ${locStr}`);
            setIsLocating(false);
            setStep('anonymous');
            addBotMessage(t('anonMsg'));
          },
          (error) => {
            console.error("Error getting location:", error);
            addToast("Could not get your location. Please type it manually.", "error");
            setIsLocating(false);
          }
        );
      } else {
        addToast("Geolocation is not supported by your browser.", "error");
        setIsLocating(false);
      }
      return;
    }

    if (!loc || loc.trim() === '') return;
    setLocation(loc);
    addUserMessage(loc);
    setStep('anonymous');
    addBotMessage(t('anonMsg'));
    setInputValue(''); // Clear input after use
  };

  const handleAnonymousSelect = async (anon: boolean) => {
    setIsAnonymous(anon);
    addUserMessage(anon ? t('keepAnonymous') : t('useMyName'));
    
    if (!user) {
      setStep('confirmation');
      addBotMessage(
        <div className="flex flex-col gap-4">
          <p>{t('loginToSecurelyFile')}</p>
          <button onClick={signIn} className="btn-primary py-3 flex items-center justify-center gap-2">
            <LogIn size={18} /> {t('loginWithGoogle')}
          </button>
        </div>
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const complaintData = {
        id: complaintId,
        authorUid: anon ? 'anonymous' : user.uid,
        reportedByUid: user.uid, // Always store the real UID for tracking
        authorName: anon ? t('anonymousCitizen') : user.displayName,
        isAnonymous: anon,
        category: selectedCategory,
        description: description,
        location: location || t('unknownLocation'),
        lat: 28.6139,
        lng: 77.2090,
        status: 'Pending',
        upvotes: 0,
        commentsCount: 0,
        photoUrl: photo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        timeline: [
          {
            status: 'Pending',
            timestamp: new Date().toISOString(),
            message: 'Complaint filed successfully'
          }
        ]
      };

      await setDoc(doc(db, 'complaints', complaintId), complaintData).catch(e => handleFirestoreError(e, OperationType.WRITE, `complaints/${complaintId}`));
      
      // Award points and record history
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, {
        points: increment(10)
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`));

      // Record point history
      const historyRef = collection(db, 'users', user.uid, 'points_history');
      await addDoc(historyRef, {
        amount: 10,
        type: 'earn',
        reason: `Reported issue: ${selectedCategory}`,
        complaintId: complaintId,
        createdAt: serverTimestamp()
      }).catch(e => handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/points_history`));

      setStep('confirmation');
      addBotMessage(`${t('complaintSuccessPrefix')} ${complaintId}. ${t('earnedPointsSuffix')}`);
      addToast(t('complaintFiledSuccessToast'), 'success');
    } catch (error) {
      console.error('Error filing complaint:', error);
      addToast(t('complaintFiledErrorToast'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 'welcome', label: t('selectIssue'), status: selectedCategory ? 'completed' : 'active' },
    { id: 'description', label: t('describeIssue'), status: description ? 'completed' : step === 'description' ? 'active' : 'pending' },
    { id: 'photo', label: t('uploadPhoto'), status: photo ? 'completed' : step === 'photo' ? 'active' : 'pending' },
    { id: 'verification', label: t('aiVerification'), status: step === 'location' || step === 'anonymous' || step === 'confirmation' ? 'completed' : step === 'verification' ? 'active' : 'pending' },
    { id: 'location', label: t('addLocation'), status: location ? 'completed' : step === 'location' ? 'active' : 'pending' },
    { id: 'confirmation', label: t('confirmSubmit'), status: step === 'confirmation' ? 'completed' : 'pending' },
  ];

  if (!user && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-chakra/5 rounded-full flex items-center justify-center text-chakra/20 mb-8">
          <LogIn size={48} />
        </div>
        <h2 className="text-4xl font-black text-navy mb-4">{t('loginRequired')}</h2>
        <p className="text-xl text-gray-500 mb-12 max-w-md">
          {t('loginToSecurelyFile')}
        </p>
        <button 
          onClick={signIn}
          className="btn-primary px-12 py-6 text-xl bg-chakra hover:bg-chakra/90 shadow-2xl shadow-chakra/20"
        >
          <LogIn size={24} />
          {t('loginWithGoogle')}
        </button>
        <button 
          onClick={() => navigate('/')}
          className="mt-8 text-gray-400 font-bold hover:text-navy transition-colors"
        >
          {t('backToHome')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-[280px_1fr] gap-8 h-[calc(100vh-120px)]">
      {/* Sidebar Steps */}
      <div className="hidden md:flex flex-col gap-6 pt-4">
        <h3 className="text-lg font-bold mb-4">{t('filingProgress')}</h3>
        <div className="flex flex-col gap-4">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                s.status === 'completed' ? 'bg-success text-white' :
                s.status === 'active' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {s.status === 'completed' ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${
                s.status === 'active' ? 'text-navy font-bold' : 'text-gray-400'
              }`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-auto p-4 bg-navy/5 rounded-2xl border border-navy/10">
          <p className="text-xs text-navy font-bold flex items-center gap-2 mb-2">
            <ShieldCheck size={14} className="text-success" />
            {t('privacyGuaranteed')}
          </p>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            {t('privacyDesc')}
          </p>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-md">
              <PlusCircle size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-navy">{t('assistantName')}</h4>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-[10px] text-gray-500 font-medium">{t('onlineAI')}</span>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-navy transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2 scroll-smooth">
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg.text} isBot={msg.isBot} />
          ))}
          
          {isSubmitting && (
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-pulse">
                <Loader2 className="animate-spin" size={16} />
                {t('submitting')}...
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
                  I247
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm flex flex-col gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  {isGeminiThinking && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-70 animate-pulse">
                      Gemini Thinking...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Step Components */}
          <AnimatePresence>
            {step === 'welcome' && !isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3 mt-2"
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.name)}
                    className="p-3 bg-bg border border-gray-100 rounded-xl text-xs font-bold text-navy hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-2"
                  >
                    <span className="text-lg">{cat.icon === 'Road' ? '🕳️' : cat.icon === 'Trash2' ? '🗑️' : cat.icon === 'Droplets' ? '💧' : cat.icon === 'Zap' ? '💡' : cat.icon === 'Trees' ? '🌳' : '✏️'}</span>
                    {cat.name}
                  </button>
                ))}
              </motion.div>
            )}

            {step === 'photo' && !isTyping && !photo && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                    <Camera size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-navy">{t('clickToUpload')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('uploadFormat')}</p>
                  </div>
                </button>
              </motion.div>
            )}

            {step === 'verification' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-6 bg-white border border-gray-100 rounded-2xl shadow-lg"
              >
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-sm font-bold text-navy">{t('verifyingMsg')}</h4>
                  <Loader2 size={18} className="text-primary animate-spin" />
                </div>
                <div className="space-y-4">
                  {[
                    { label: t('analyzingImg'), delay: 0 },
                    { label: t('detectingCat'), delay: 1.5 },
                    { label: t('verifyingLoc'), delay: 2.5 },
                    { label: t('verifiedSuccess'), delay: 3.5 },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: s.delay }}
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${i === 3 ? 'bg-success text-white' : 'bg-primary/10 text-primary'}`}
                      >
                        {i === 3 ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></div>}
                      </motion.div>
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: s.delay }}
                        className={`text-xs font-medium ${i === 3 ? 'text-success font-bold' : 'text-gray-500'}`}
                      >
                        {s.label}
                      </motion.span>
                    </div>
                  ))}
                </div>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 4, ease: 'linear' }}
                  className="h-1 bg-primary rounded-full mt-6"
                />
              </motion.div>
            )}

            {step === 'location' && !isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 mt-2"
              >
                <button
                  onClick={() => handleLocationSelect('current')}
                  disabled={isLocating}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLocating ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                  {isLocating ? 'Locating...' : t('useCurrentLocation')}
                </button>
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t('typeAddress')}
                    className="input-field pr-12"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLocationSelect(inputValue);
                    }}
                  />
                  <button 
                    onClick={() => handleLocationSelect(inputValue)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'anonymous' && !isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3 mt-2"
              >
                <button
                  onClick={() => handleAnonymousSelect(true)}
                  className="p-4 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-2"
                >
                  <ShieldCheck size={24} className="text-success" />
                  {t('keepAnonymous')}
                </button>
                <button
                  onClick={() => handleAnonymousSelect(false)}
                  className="p-4 bg-white border border-gray-100 rounded-xl text-xs font-bold text-navy hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-2"
                >
                  <User size={24} className="text-primary" />
                  {t('useMyName')}
                </button>
              </motion.div>
            )}

            {step === 'confirmation' && !isTyping && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-8 bg-white border border-gray-100 rounded-3xl shadow-2xl text-center"
              >
                <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-bold text-navy mb-2">{t('complaintFiled')}</h3>
                <p className="text-gray-500 mb-8">{t('complaintSuccessDesc')}</p>
                
                <div className="bg-bg rounded-2xl p-4 mb-8 text-left space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t('track_id')}</span>
                    <span className="text-sm font-bold text-navy">{complaintId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t('category')}</span>
                    <span className="text-sm font-bold text-navy">{selectedCategory}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t('status')}</span>
                    <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">{t('pending')}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => navigate(`/tracker/${complaintId}`)}
                    className="btn-primary w-full"
                  >
                    {t('trackMyComplaint')}
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    className="btn-outline w-full"
                  >
                    {t('reportAnother')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        {step === 'description' && (
          <form onSubmit={handleDescriptionSubmit} className="p-4 bg-white border-t border-gray-50 flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('typeMessage')}
              className="input-field"
            />
            <button type="submit" className="btn-primary px-4">
              <Send size={20} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
