import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import Webcam from "react-webcam";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Upload, Camera, FileText, Activity, ShieldCheck, ShieldAlert,
  Download, PlayCircle, Loader2, AlertTriangle, Info,
  CheckCircle2, Settings, Key, Globe, History, 
  LayoutDashboard, Trash2, Calendar, Pill, Moon, Sun, TrendingUp, Share2, MessageCircle, Send, X, Languages, Timer, User, Clock, CalendarCheck, HeartPulse, Stethoscope, Eye, EyeOff, Gauge, Bell, BellRing, Save, Check, Target, BriefcaseMedical, Leaf, Recycle
} from 'lucide-react';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [elderlyMode, setElderlyMode] = useState(localStorage.getItem('rxlens_elderly_mode') === 'true');
  const [language, setLanguage] = useState('English');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [isApiKeySetInEnv, setIsApiKeySetInEnv] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Analyzing...');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [history, setHistory] = useState([]);
  const [patientProfile, setPatientProfile] = useState(() => {
    const saved = localStorage.getItem('rxlens_patient_profile');
    return saved ? JSON.parse(saved) : { name: '', age: '', weight: '', allergies: '', conditions: '' };
  });
  const [showProfile, setShowProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Adherence System State
  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem('rxlens_reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [adherenceLog, setAdherenceLog] = useState(() => {
    const saved = localStorage.getItem('rxlens_adherence_log');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Rate Limit Countdown
  const [retryCountdown, setRetryCountdown] = useState(0);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Explainability State
  const [expandedReasons, setExpandedReasons] = useState({});

  const toggleReason = (idx) => {
    setExpandedReasons(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getConfidenceLevel = (score) => {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  };

  const translations = {
    English: {
      scanner: 'Scanner',
      history: 'History',
      insights: 'Insights',
      header_title: 'Clinical Hub',
      patient_profile: 'Patient Profile',
      input_doc: 'Input Document',
      upload_file: 'Upload File',
      take_photo: 'Take Photo',
      digitize: 'Digitize',
      analyzing: 'Analyzing...',
      clinical_extraction: 'Clinical Extraction',
      medication: 'Medication',
      dosage: 'Dosage Plan',
      frequency: 'Frequency',
      duration: 'Duration',
      clinical_summary: 'Clinical Summary',
      audio_guide: 'Audio Guide',
      download_report: 'Download Report',
      chat_assistant: 'Chat Assistant',
      reset_profile: 'Reset Profile',
      clinical_profile: 'Patient Clinical Profile',
      full_name: 'Full Name',
      age: 'Age (Years)',
      weight: 'Weight (kg)',
      allergies: 'Known Allergies',
      guard_active: 'Safety Guard Active: AI is monitoring conflicts.',
      ask_meds: 'Ask about your meds...',
      safety_warning: 'Safety Alert Found',
      safety_intel: 'Clinical Safety Intelligence',
      severity_critical: 'CRITICAL',
      severity_warning: 'WARNING',
      severity_info: 'INFO',
      schedule_title: 'Treatment Schedule',
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      night: 'Night',
      today: 'Today',
      conditions: 'Medical Conditions',
      conditions_placeholder: 'e.g. Asthma, Diabetes, Pregnancy'
    },
    Hindi: {
      scanner: 'स्कैनर',
      history: 'इतिहास',
      insights: 'इनसाइट्स',
      header_title: 'क्लिनिकल हब',
      patient_profile: 'रोगी प्रोफ़ाइल',
      input_doc: 'दस्तावेज़ जोड़ें',
      upload_file: 'फ़ाइल अपलोड करें',
      take_photo: 'फोटो लें',
      digitize: 'डिजिटाइज़ करें',
      analyzing: 'विश्लेषण हो रहा है...',
      clinical_extraction: 'दवा विवरण',
      medication: 'दवा का नाम',
      dosage: 'खुराक की योजना',
      frequency: 'कितनी बार',
      duration: 'अवधि',
      clinical_summary: 'क्लिनिकल सारांश',
      audio_guide: 'ऑडियो गाइड',
      download_report: 'रिपोर्ट डाउनलोड करें',
      chat_assistant: 'चैट सहायक',
      reset_profile: 'प्रोफ़ाइल रीसेट करें',
      clinical_profile: 'रोगी क्लिनिकल प्रोफ़ाइल',
      full_name: 'पूरा नाम',
      age: 'उम्र (वर्ष)',
      weight: 'वजन (किलो)',
      allergies: 'ज्ञात एलर्जी',
      guard_active: 'सुरक्षा गार्ड सक्रिय: AI खतरों की निगरानी कर रहा है।',
      ask_meds: 'अपनी दवाओं के बारे में पूछें...',
      safety_warning: 'सुरक्षा चेतावनी मिली',
      safety_intel: 'क्लिनिकल सुरक्षा इंटेलिजेंस',
      severity_critical: 'गंभीर',
      severity_warning: 'चेतावनी',
      severity_info: 'जानकारी',
      schedule_title: 'उपचार की समय सारणी',
      morning: 'सुबह',
      afternoon: 'दोपहर',
      evening: 'शाम',
      night: 'रात',
      today: 'आज',
      conditions: 'चिकित्सा स्थितियां',
      conditions_placeholder: 'जैसे अस्थमा, मधुमेह, गर्भावस्था'
    }
  };

  const t = translations[language];

  // Update Greeting when Language changes
  useEffect(() => {
    const greeting = language === 'Hindi' 
      ? 'नमस्ते! मैं RxLens AI हूँ। मैं आज आपकी कैसे मदद कर सकता हूँ?' 
      : 'Hello! I am RxLens AI. How can I help you today?';
    setChatHistory([{ role: 'ai', text: greeting }]);
  }, [language]);

  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const res = await axios.get('/api/config');
        const configured = res.data.api_key_configured;
        setIsApiKeySetInEnv(configured);
        if (configured) {
          setApiKey('');
          localStorage.removeItem('gemini_api_key');
        }
      } catch (err) { console.error(err); }
    };
    checkConfig();
    fetchHistory();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('elderly-mode', elderlyMode);
    localStorage.setItem('rxlens_elderly_mode', elderlyMode);
  }, [elderlyMode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Countdown Logic
  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => setRetryCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCountdown]);

  const getDrugFrequencyData = () => {
    const counts = {};
    if (!Array.isArray(history)) return [];
    history.forEach(item => {
      if (!item || !item.drug_name) return;
      const drugs = item.drug_name.split(',');
      drugs.forEach(d => {
        const name = d.trim();
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);
  };

  const getTimelineData = () => {
    const dailyCounts = {};
    if (!Array.isArray(history)) return [];
    history.forEach(item => {
      if (!item || !item.date) return;
      const date = item.date.split(' ')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return Object.entries(dailyCounts).map(([name, count]) => ({ name, count })).slice(-7);
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/history');
      setHistory(res.data);
    } catch (err) { console.error("History fetch failed", err); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      resetState();
    }
  };

  const resetState = () => {
    setResult(null);
    setError('');
    setAudioUrl(null);
    setShowCamera(false);
    setRetryCountdown(0);
  };

  const processImage = useCallback(async () => {
    if (!imageFile) return;
    setLoading(true);
    setError('');
    setLoadingStatus('Fast-tracking VLM Engine...');
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('lang', language);
    formData.append('patient_profile', JSON.stringify(patientProfile));

    try {
      const res = await axios.post('/api/extract', formData, { timeout: 120000 });
      setResult(res.data);
      if (res.data.audio_url) {
        setAudioUrl(`/api/audio/${res.data.audio_url}`);
      }

      // Auto-generate reminders from schedule
      if (res.data.data?.schedule) {
        const newReminders = res.data.data.schedule.map((item, idx) => ({
          id: Date.now() + idx,
          time: item.time,
          task: item.task || item.drug,
          drug: res.data.data.drug,
          enabled: true,
          createdAt: new Date().toISOString()
        }));
        setReminders(prev => {
          const updated = [...prev, ...newReminders];
          localStorage.setItem('rxlens_reminders', JSON.stringify(updated));
          return updated;
        });
      }
      fetchHistory();
    } catch (err) {
      if (err.response?.status === 429 || (err.response?.data?.detail && (err.response.data.detail.includes('Quota') || err.response.data.detail.includes('exhausted')))) {
        setError(err.response.data.detail || 'Daily Quota Reached.');
        setRetryCountdown(60);
      } else {
        setError(err.response?.data?.detail || 'Failed to parse prescription.');
      }
    } finally {
      setLoading(false);
    }
  }, [imageFile, language, patientProfile]);

  const handleChatSend = useCallback(async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    const context = result?.data ? `Drug: ${result.data.drug}, Dosage: ${result.data.dosage}` : "No prescription scanned yet.";
    const formData = new FormData();
    formData.append('question', userMsg);
    formData.append('context', context);
    formData.append('lang', language);

    try {
      const res = await axios.post('/api/chat', formData);
      setChatHistory(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "I'm currently overloaded. Please try again in a moment." }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatMessage, result, language]);

  const downloadPDF = useCallback(async (data = result?.data, summaryText = result?.summary) => {
    if (!data) return;
    const pdfForm = new FormData();
    pdfForm.append('drug', data.drug || data.drug_name || '');
    pdfForm.append('dosage', data.dosage || '');
    pdfForm.append('frequency', data.frequency || '');
    pdfForm.append('duration', data.duration || '');
    pdfForm.append('summary', summaryText || data.summary || '');
    pdfForm.append('safety_alerts', JSON.stringify(data.safety_alerts || []));
    try {
      const res = await axios.post('/api/pdf', pdfForm, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Clinical_Report.pdf');
      link.click();
    } catch (err) { console.error(err); }
  }, [result]);

  const isEngineReady = isApiKeySetInEnv || apiKey.length > 10 || apiKey === "DEMO_MODE";

  return (
    <div className="app-container">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="header-content">
          <h1>🩺 RxLens <span>{t.header_title}</span></h1>
        </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <button 
              className={`btn ${showProfile ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setShowProfile(!showProfile)} 
              style={{padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem'}}
            >
              <User size={16} /> {patientProfile.name || t.patient_profile}
            </button>
            <div className="settings-toggle">
              <div className={`status-dot ${isEngineReady ? 'active' : ''}`}></div>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                style={{background: 'none', border: 'none', color: 'inherit', font: 'inherit', outline: 'none', cursor: 'pointer', fontWeight: 600}}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
              <div className="theme-toggle" onClick={() => setElderlyMode(!elderlyMode)} title="Elderly Accessibility Mode">
                <span style={{ fontSize: '1.2rem', fontWeight: elderlyMode ? 'bold' : 'normal', color: elderlyMode ? 'var(--primary)' : 'inherit' }}>A+</span>
              </div>
              <div className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </div>
            </div>
          </div>
      </motion.header>

      <div className="nav-bar">
        <div className={`nav-item ${activeTab === 'scanner' ? 'active' : ''}`} onClick={() => setActiveTab('scanner')}>
          <LayoutDashboard size={18} /> {t.scanner}
        </div>
        <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <History size={18} /> {t.history}
        </div>
        <div className={`nav-item ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
          <TrendingUp size={18} /> {t.insights}
        </div>
        <div className={`nav-item ${activeTab === 'adherence' ? 'active' : ''}`} onClick={() => setActiveTab('adherence')}>
          <BellRing size={18} /> Adherence
        </div>
      </div>

      <AnimatePresence>
        {showProfile && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ padding: '0 2rem 2.5rem', overflow: 'hidden' }}
          >
            <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid var(--primary)', background: 'rgba(99, 102, 241, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem', fontWeight: 700 }}>
                  <ShieldCheck size={24} color="var(--primary)" /> {t.clinical_profile}
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn" 
                    onClick={() => {
                      localStorage.setItem('rxlens_patient_profile', JSON.stringify(patientProfile));
                      setProfileSaved(true);
                      setTimeout(() => setProfileSaved(false), 2000);
                    }}
                    style={{ padding: '8px 18px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {profileSaved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Profile</>}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      const empty = { name: '', age: '', weight: '', allergies: '', conditions: '' };
                      setPatientProfile(empty);
                      localStorage.removeItem('rxlens_patient_profile');
                    }}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', opacity: 0.7 }}
                  >
                    {t.reset_profile}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>{t.full_name}</label>
                  <div className="profile-input-wrapper">
                    <User className="input-icon" size={18} />
                    <input type="text" className="input-field" placeholder="e.g. John Doe" value={patientProfile.name} onChange={(e)=>setPatientProfile({...patientProfile, name: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>{t.age}</label>
                  <div className="profile-input-wrapper">
                    <Calendar className="input-icon" size={18} />
                    <input type="number" className="input-field" placeholder="Years" value={patientProfile.age} onChange={(e)=>setPatientProfile({...patientProfile, age: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>{t.weight}</label>
                  <div className="profile-input-wrapper">
                    <Activity className="input-icon" size={18} />
                    <input type="number" className="input-field" placeholder="kg" value={patientProfile.weight} onChange={(e)=>setPatientProfile({...patientProfile, weight: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>{t.allergies}</label>
                  <div className="profile-input-wrapper">
                    <AlertTriangle className="input-icon" size={18} />
                    <input type="text" className="input-field" placeholder="e.g. Penicillin, Peanuts" value={patientProfile.allergies} onChange={(e)=>setPatientProfile({...patientProfile, allergies: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>{t.conditions}</label>
                  <div className="profile-input-wrapper">
                    <Stethoscope className="input-icon" size={18} />
                    <input type="text" className="input-field" placeholder={t.conditions_placeholder} value={patientProfile.conditions} onChange={(e)=>setPatientProfile({...patientProfile, conditions: e.target.value})} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '12px 20px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <div className="pulse-dot"></div>
                <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 500 }}>
                  {t.guard_active}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === 'scanner' && (
          <motion.div key="scanner" className="main-grid" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div className="left-col">
              <div className="glass-card">
                <h2 className="card-title"><FileText size={20} /> {t.input_doc}</h2>
                {retryCountdown > 0 ? (
                  <div className="glass-card" style={{textAlign: 'center', borderColor: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)'}}>
                    <Timer size={48} style={{margin: '0 auto 1rem', color: 'var(--primary)'}} className="spin-slow" />
                    <h3 style={{color: 'var(--primary)'}}>Daily Limit Reached</h3>
                    <p style={{fontSize: '2rem', fontWeight: 700, margin: '1rem 0'}}>{retryCountdown}s</p>
                    <p style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>The AI is recharging. Please try again when the timer hits zero or tomorrow.</p>
                  </div>
                ) : !imagePreview && !showCamera ? (
                  <div className="upload-area" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); const file = e.dataTransfer.files[0]; if(file){setImageFile(file); setImagePreview(URL.createObjectURL(file)); resetState();}}}>
                    <Upload size={48} className="upload-icon" style={{marginBottom: '1rem', color: 'var(--primary)'}} />
                    <h3 style={{marginBottom: '1.5rem'}}>Add Clinical Document</h3>
                    <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
                      <button className="btn" onClick={() => fileInputRef.current.click()} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <Upload size={18} /> {t.upload_file}
                      </button>
                      <button className="btn btn-secondary" onClick={() => setShowCamera(true)} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <Camera size={18} /> {t.take_photo}
                      </button>
                    </div>
                  </div>
                ) : showCamera ? (
                  <div style={{textAlign: 'center'}}>
                    <div style={{borderRadius: '20px', overflow: 'hidden', border: '4px solid var(--primary)', marginBottom: '20px', position: 'relative'}}>
                      <Webcam ref={webcamRef} screenshotFormat="image/jpeg" style={{width: '100%', display: 'block'}} />
                      <div className="scanning-line"></div>
                    </div>
                    <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                      <button className="btn btn-secondary" onClick={() => setShowCamera(false)}>Cancel</button>
                      <button className="btn" onClick={() => { const img = webcamRef.current.getScreenshot(); setImagePreview(img); fetch(img).then(res => res.blob()).then(blob => setImageFile(new File([blob], "camera.jpg", {type:"image/jpeg"}))); setShowCamera(false); }}>Capture</button>
                    </div>
                  </div>
                ) : (
                  <div style={{textAlign: 'center'}}>
                    <div className="scanner-frame" style={{position: 'relative', overflow: 'hidden', borderRadius: '16px', border: loading ? '2px solid var(--primary)' : '2px solid rgba(99,102,241,0.15)', transition: 'border-color 0.3s'}}>
                      {loading && <div className="scanning-line"></div>}
                      {loading && (
                        <>
                          <div className="scanner-corner top-left"></div>
                          <div className="scanner-corner top-right"></div>
                          <div className="scanner-corner bottom-left"></div>
                          <div className="scanner-corner bottom-right"></div>
                        </>
                      )}
                      <img src={imagePreview} className="img-preview" style={{display:'block', width:'100%', maxHeight:'400px', objectFit:'contain', borderRadius:'14px'}} />
                    </div>
                    <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '25px'}}>
                      <button className="btn btn-secondary" onClick={() => { setImagePreview(null); setImageFile(null); resetState(); }}>Clear</button>
                      <button className="btn" onClick={processImage} disabled={loading}>{loading ? t.analyzing : t.digitize}</button>
                    </div>
                  </div>
                )}
                <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileChange} />
              </div>
            </div>

            <div className="right-col">
              {loading ? (
                <div className="glass-card loader-container" style={{textAlign:'center', padding:'4rem'}}>
                  <div className="spinner" style={{margin:'0 auto 1rem'}}></div>
                  <p>{loadingStatus}</p>
                </div>
              ) : result ? (
                <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}}>
                  {/* AI Hallucination Safeguard Banner */}
                  <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid var(--danger)' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                      <AlertTriangle size={16} /> AI Hallucination Safeguard
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                      This report was generated by an AI vision model. AI outputs may contain inaccuracies. All medication details <strong>MUST</strong> be verified by a licensed pharmacist or physician before use.
                    </p>
                  </div>
                  
                  {/* Structured Clinical Safety Intelligence */}
                  {(result.data.safety_alerts && result.data.safety_alerts.length > 0) && (
                    <div className={`glass-card safety-section ${result.data.safety_alerts.some(a => a.severity === 'Critical') ? 'safety-section-critical' : 'safety-section-warning'}`} style={{ padding: '1.5rem' }}>
                      <div className="safety-header">
                        <div className="safety-header-left">
                          <ShieldAlert size={24} color="var(--danger)" />
                          <h3 style={{ color: result.data.safety_alerts.some(a => a.severity === 'Critical') ? 'var(--danger)' : 'var(--warning)' }}>{t.safety_intel}</h3>
                        </div>
                        <span className={`safety-count-badge ${result.data.safety_alerts.some(a => a.severity === 'Critical') ? 'critical' : 'warning'}`}>
                          {result.data.safety_alerts.length} {result.data.safety_alerts.length === 1 ? 'Alert' : 'Alerts'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {result.data.safety_alerts.map((alert, idx) => (
                          <motion.div 
                            key={idx} 
                            className={`safety-alert-card ${(alert.severity || 'info').toLowerCase()}`}
                            initial={{ opacity: 0, x: -15 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ delay: idx * 0.08, type: 'spring', stiffness: 200 }}
                          >
                            <div className="safety-alert-top">
                              <span className={`severity-badge ${(alert.severity || 'info').toLowerCase()}`}>
                                {alert.severity === 'Critical' ? t.severity_critical : alert.severity === 'Warning' ? t.severity_warning : t.severity_info}
                              </span>
                              <span className="alert-type-label">
                                {alert.type === 'Drug-Drug Interaction' && <HeartPulse size={12} />}
                                {alert.type === 'Allergy Conflict' && <AlertTriangle size={12} />}
                                {alert.type === 'Contraindication' && <ShieldAlert size={12} />}
                                {alert.type === 'Duplicate Medication' && <Pill size={12} />}
                                {alert.type}
                              </span>
                            </div>
                            <p className="alert-message">{alert.message}</p>
                            {alert.involved_drugs && (
                              <div className="alert-drugs">
                                {alert.involved_drugs.map((d, i) => (
                                  <span key={i} className="alert-drug-tag">{d}</span>
                                ))}
                              </div>
                            )}
                            {alert.reason && (
                              <div>
                                <span className="alert-reason-toggle" onClick={() => toggleReason(idx)}>
                                  {expandedReasons[idx] ? <EyeOff size={11} /> : <Eye size={11} />}
                                  {expandedReasons[idx] ? 'Hide' : 'Why this alert?'}
                                </span>
                                {expandedReasons[idx] && (
                                  <div className="alert-reason-text">{alert.reason}</div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Polypharmacy De-prescribing Assistant */}
                  {(result.data.polypharmacy_notes && result.data.polypharmacy_notes.length > 0) && (
                    <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(139, 92, 246, 0.05)', borderLeft: '4px solid #8b5cf6' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 700, color: '#8b5cf6', marginBottom: '12px' }}>
                        <BriefcaseMedical size={20} /> Polypharmacy Review (Provider Notes)
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {result.data.polypharmacy_notes.map((note, idx) => (
                          <div key={idx} style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#6d28d9', marginBottom: '4px' }}>{note.topic}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{note.note}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Green Pharmacy Environmental Impact */}
                  {(result.data.environmental && result.data.environmental.drug_impacts && result.data.environmental.drug_impacts.length > 0) && (
                    <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(34, 197, 94, 0.05)', borderLeft: '4px solid #22c55e' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 700, color: '#16a34a', margin: 0 }}>
                          <Leaf size={20} /> Green Pharmacy Impact
                        </h3>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', borderRadius: '12px', 
                          background: result.data.environmental.overall_impact === 'Critical' ? '#fee2e2' : result.data.environmental.overall_impact === 'High' ? '#ffedd5' : '#dcfce3',
                          color: result.data.environmental.overall_impact === 'Critical' ? '#ef4444' : result.data.environmental.overall_impact === 'High' ? '#f97316' : '#22c55e'
                        }}>
                          {result.data.environmental.overall_impact} Impact
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {result.data.environmental.drug_impacts.map((env, idx) => (
                          <div key={idx} style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#15803d' }}>{env.drug}</span>
                              <span style={{ fontSize: '0.75rem', color: env.impact === 'Critical' ? '#ef4444' : env.impact === 'High' ? '#f97316' : '#22c55e', fontWeight: 600 }}>{env.impact}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '6px' }}>{env.reason}</div>
                            <div style={{ fontSize: '0.75rem', color: '#166534', display: 'flex', alignItems: 'flex-start', gap: '4px', background: '#f0fdf4', padding: '6px', borderRadius: '4px' }}>
                              <Recycle size={12} style={{ marginTop: '2px', flexShrink: 0 }} /> {env.disposal}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Confidence & Explainability */}
                  {result.data.confidence && Object.keys(result.data.confidence).length > 0 && (
                    <div className="glass-card confidence-section" style={{ marginBottom: '1.5rem' }}>
                      <div className="confidence-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 700 }}>
                          <Gauge size={20} color="var(--primary)" /> AI Confidence Score
                        </h3>
                        {result.data.overall_confidence != null && (
                          <div className="confidence-overall">
                            <div 
                              className={`confidence-ring ${getConfidenceLevel(result.data.overall_confidence)}`}
                              style={{ '--ring-pct': `${result.data.overall_confidence * 100}%` }}
                            >
                              {Math.round(result.data.overall_confidence * 100)}%
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="confidence-bar-group">
                        {Object.entries(result.data.confidence).map(([field, score]) => {
                          const s = typeof score === 'object' ? score.score : score;
                          const level = getConfidenceLevel(s);
                          return (
                            <div key={field} className="confidence-bar-item">
                              <span className="confidence-bar-label">{field}</span>
                              <div className="confidence-bar-track">
                                <motion.div 
                                  className={`confidence-bar-fill ${level}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${s * 100}%` }}
                                  transition={{ duration: 1, delay: 0.2 }}
                                />
                              </div>
                              <span className={`confidence-bar-score`} style={{ color: level === 'high' ? 'var(--success)' : level === 'medium' ? 'var(--warning)' : 'var(--danger)' }}>
                                {Math.round(s * 100)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Uncertainty Warnings */}
                      {result.data.uncertainty_warnings && result.data.uncertainty_warnings.length > 0 && (
                        <div className="uncertainty-warnings">
                          {result.data.uncertainty_warnings.map((w, i) => (
                            <div key={i} className={`uncertainty-chip ${w.level}`}>
                              <AlertTriangle size={14} className="unc-icon" />
                              <span>{w.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Safety Observations */}
                  {result.data.ai_safety_observations && (
                    <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', borderLeft: '4px solid var(--primary)' }}>
                       <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <Activity size={16} /> AI Observation
                       </h4>
                       <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{result.data.ai_safety_observations}</p>
                    </div>
                  )}
                  <div className="glass-card" style={{marginBottom: '1.5rem'}}>
                    <h2 className="card-title"><Activity size={20} style={{color: 'var(--primary)'}}/> {t.clinical_extraction}</h2>
                    <div className="metrics-grid">
                      {['drug', 'dosage', 'frequency', 'duration'].map((field) => {
                        const isUncertain = (result.data.uncertain_fields || []).includes(field) || 
                          (result.data.confidence && result.data.confidence[field] != null && 
                           (typeof result.data.confidence[field] === 'number' ? result.data.confidence[field] : result.data.confidence[field]?.score) < 0.7);
                        const labels = { drug: t.medication, dosage: t.dosage, frequency: t.frequency, duration: t.duration };
                        const values = { 
                          drug: result.data.drug, 
                          dosage: result.data.dosage, 
                          frequency: result.data.frequency || 'As directed', 
                          duration: result.data.duration || 'N/A' 
                        };
                        return (
                          <div key={field} className={`metric-box ${isUncertain ? 'field-uncertain' : ''}`}>
                            <div className="metric-label">
                              {labels[field]}
                              {isUncertain && <span className="uncertain-badge"><AlertTriangle size={9} /> Verify</span>}
                            </div>
                            <div className="metric-value" style={field === 'drug' ? {fontSize: '1.2rem'} : {}}>{values[field]}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {result.data.schedule && result.data.schedule.length > 0 && (
                    <div className="glass-card" style={{marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(168,85,247,0.04))'}}>
                      <h2 className="card-title"><CalendarCheck size={20} style={{color: 'var(--primary)'}}/> {t.schedule_title}</h2>
                      <div style={{display:'flex', flexDirection:'column', gap:'0', position:'relative', paddingLeft:'30px'}}>
                        <div style={{position:'absolute', left:'14px', top:'8px', bottom:'8px', width:'2px', background:'linear-gradient(180deg, var(--primary), rgba(168,85,247,0.3))', borderRadius:'2px'}}></div>
                        {result.data.schedule.map((item, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{opacity:0, x:-20}} 
                            animate={{opacity:1, x:0}} 
                            transition={{delay: idx * 0.1}}
                            style={{
                              display:'flex', alignItems:'center', gap:'16px', 
                              padding:'14px 18px', margin:'4px 0',
                              background:'rgba(255,255,255,0.03)', 
                              borderRadius:'12px',
                              border:'1px solid rgba(99,102,241,0.08)',
                              position:'relative',
                              transition:'all 0.3s ease'
                            }}
                            whileHover={{x: 4, backgroundColor: 'rgba(99,102,241,0.06)'}}
                          >
                            <div style={{
                              position:'absolute', left:'-24px',
                              width:'12px', height:'12px', borderRadius:'50%',
                              background:'var(--primary)', 
                              boxShadow:'0 0 12px rgba(99,102,241,0.4)',
                              border:'2px solid var(--bg-main)'
                            }}></div>
                            <div style={{
                              minWidth:'90px', fontWeight:700, fontSize:'0.95rem',
                              color:'var(--primary)', 
                              display:'flex', alignItems:'center', gap:'6px'
                            }}>
                              <Clock size={14}/> {item.time || item.times?.join(', ') || '—'}
                            </div>
                            <div style={{flex:1, fontSize:'0.9rem', color:'var(--text-main)', fontWeight:500}}>
                              {item.task || item.drug || '—'}
                            </div>
                            {item.duration && (
                              <div style={{fontSize:'0.75rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'4px'}}>
                                <Timer size={12}/> {item.duration}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="glass-card" style={{marginBottom: '1.5rem'}}>
                    <h2 className="card-title"><CheckCircle2 size={20} style={{color: 'var(--success)'}}/> {t.clinical_summary}</h2>
                    <p style={{lineHeight: '1.6', color: 'var(--text-muted)'}}>{result.summary}</p>
                    
                    {audioUrl && (
                      <div style={{marginTop: '20px', padding: '15px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '15px'}}>
                        <p style={{fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <PlayCircle size={16} color="var(--primary)" /> {t.audio_guide}
                        </p>
                        <audio controls src={audioUrl} style={{width: '100%', height: '35px'}} />
                      </div>
                    )}
                  </div>

                  {/* Pharmacist Consultation Prompt */}
                  <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '4px solid #3b82f6' }}>
                    <h4 style={{ fontSize: '0.85rem', color: '#3b82f6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                      <Stethoscope size={16} /> Pharmacist Consultation Recommended
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                      Please consult a licensed pharmacist to verify drug interactions, correct dosages for your age/weight, and any contraindications with your existing conditions or allergies.
                    </p>
                  </div>

                  <div style={{display: 'flex', gap: '15px', marginTop: '20px'}}>
                    <button className="btn" style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}} onClick={() => downloadPDF()}>
                      <Download size={18} /> {t.download_report}
                    </button>
                    <button className="btn btn-secondary" style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}} onClick={() => setShowChat(true)}>
                      <MessageCircle size={18} /> {t.chat_assistant}
                    </button>
                  </div>
                </motion.div>
              ) : error ? (
                <div className="glass-card" style={{textAlign:'center', padding:'4rem', borderColor: 'var(--danger)'}}>
                  <AlertTriangle size={48} style={{margin:'0 auto 1rem', color: 'var(--danger)'}} />
                  <p style={{color: 'var(--danger)', fontWeight: 600}}>{error}</p>
                  <p style={{fontSize: '0.85rem', marginTop: '1rem'}}>Check your internet or wait for the quota to reset.</p>
                </div>
              ) : (
                <div className="glass-card" style={{textAlign:'center', opacity:0.5, padding:'4rem'}}>
                  <Activity size={48} style={{margin:'0 auto 1rem'}} />
                  <p>Awaiting scan results...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div key="history" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div className="glass-card">
              <h2 className="card-title"><History size={20} /> Past Scans</h2>
              <div className="history-list">
                {history.map((item, idx) => (
                  <div key={idx} className="history-item">
                    <div className="history-info">
                      <h4>{item.drug_name}</h4>
                      <p>{item.date} • {item.dosage}</p>
                    </div>
                    <div style={{display:'flex', gap:'8px'}}>
                      <button className="btn btn-secondary" style={{padding:'0.5rem'}} onClick={() => downloadPDF(item)}><Download size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div key="insights" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="insights-layout">
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-icon"><Activity size={24}/></div>
                <div className="stat-value">{history.length}</div>
                <div className="stat-label">Total Scans</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{background:'rgba(239, 68, 68, 0.1)', color:'var(--danger)'}}><AlertTriangle size={24}/></div>
                <div className="stat-value" style={{color: 'var(--danger)'}}>
                  {history.reduce((sum, h) => sum + (h.safety_alert_count || 0), 0)}
                </div>
                <div className="stat-label">Safety Alerts</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{background:'rgba(34, 197, 94, 0.1)', color:'var(--success)'}}><Calendar size={24}/></div>
                <div className="stat-value">
                  {history.length > 0
                    ? (() => {
                        const allDurations = history.flatMap(h =>
                          typeof h.duration === 'string'
                            ? (h.duration.match(/\d+/) || [])
                            : []
                        ).map(Number).filter(n => n > 0);
                        return allDurations.length > 0
                          ? (allDurations.reduce((a, b) => a + b, 0) / allDurations.length).toFixed(1)
                          : '—';
                      })()
                    : '—'
                  }
                </div>
                <div className="stat-label">Avg. Days</div>
              </div>
            </div>

            <div className="charts-row">
              <div className="glass-card">
                <h3 className="card-title"><TrendingUp size={18}/> Medication Frequency</h3>
                <div style={{height: 300}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getDrugFrequencyData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} />
                      <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
                      <Tooltip contentStyle={{background: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px'}} />
                      <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-card">
                <h3 className="card-title"><TrendingUp size={18}/> Scan Activity</h3>
                <div style={{height: 300}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getTimelineData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} />
                      <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
                      <Tooltip contentStyle={{background: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px'}} />
                      <Area type="monotone" dataKey="count" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'adherence' && (
          <motion.div key="adherence" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div className="stats-row" style={{marginBottom: '25px'}}>
              <div className="stat-card">
                <div className="stat-icon" style={{background:'rgba(99,102,241,0.1)'}}><Bell size={24} color="var(--primary)"/></div>
                <div className="stat-value">{reminders.filter(r => r.enabled).length}</div>
                <div className="stat-label">Active Reminders</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{background:'rgba(34,197,94,0.1)',color:'var(--success)'}}><Check size={24}/></div>
                <div className="stat-value" style={{color:'var(--success)'}}>{adherenceLog.filter(l => l.taken).length}</div>
                <div className="stat-label">Doses Taken</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{background:'rgba(239,68,68,0.1)',color:'var(--danger)'}}><X size={24}/></div>
                <div className="stat-value" style={{color:'var(--danger)'}}>{adherenceLog.filter(l => !l.taken).length}</div>
                <div className="stat-label">Doses Missed</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{background:'rgba(245,158,11,0.1)',color:'var(--warning)'}}><Target size={24}/></div>
                <div className="stat-value">{adherenceLog.length > 0 ? Math.round((adherenceLog.filter(l => l.taken).length / adherenceLog.length) * 100) : 0}%</div>
                <div className="stat-label">Adherence Score</div>
              </div>
            </div>

            <div className="glass-card" style={{marginBottom:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
                <h2 className="card-title" style={{margin:0}}><BellRing size={20}/> Medication Reminders</h2>
                <button className="btn btn-secondary" style={{padding:'6px 14px',fontSize:'0.8rem'}} onClick={() => {setReminders([]); localStorage.removeItem('rxlens_reminders');}}>Clear All</button>
              </div>
              {reminders.length === 0 ? (
                <div style={{textAlign:'center',padding:'3rem',opacity:0.5}}>
                  <Bell size={48} style={{margin:'0 auto 1rem'}}/>
                  <p>Scan a prescription to auto-generate reminders</p>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  {reminders.map((rem) => (
                    <motion.div key={rem.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}}
                      style={{display:'flex',alignItems:'center',gap:'15px',padding:'16px 20px',
                        background:rem.enabled?'rgba(99,102,241,0.06)':'rgba(255,255,255,0.02)',
                        border:`1px solid ${rem.enabled?'rgba(99,102,241,0.2)':'var(--border)'}`,
                        borderRadius:'14px',transition:'all 0.3s ease'}}>
                      <div onClick={() => {setReminders(prev => {const u=prev.map(r=>r.id===rem.id?{...r,enabled:!r.enabled}:r); localStorage.setItem('rxlens_reminders',JSON.stringify(u)); return u;});}} style={{cursor:'pointer'}}>
                        {rem.enabled ? <BellRing size={22} color="var(--primary)"/> : <Bell size={22} color="var(--text-muted)" style={{opacity:0.4}}/>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:'0.95rem'}}>{rem.task}</div>
                        <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'3px'}}>{rem.drug}</div>
                      </div>
                      <div style={{fontWeight:700,color:'var(--primary)',fontSize:'0.95rem',minWidth:'80px',textAlign:'right'}}>{rem.time}</div>
                      <div style={{display:'flex',gap:'6px'}}>
                        <button className="btn" style={{padding:'6px 12px',fontSize:'0.75rem',background:'var(--success)',borderColor:'var(--success)'}}
                          onClick={() => {const e={id:Date.now(),reminderId:rem.id,taken:true,timestamp:new Date().toISOString(),drug:rem.drug}; setAdherenceLog(p=>{const u=[...p,e];localStorage.setItem('rxlens_adherence_log',JSON.stringify(u));return u;});}}><Check size={14}/> Taken</button>
                        <button className="btn btn-secondary" style={{padding:'6px 12px',fontSize:'0.75rem',color:'var(--danger)',borderColor:'var(--danger)'}}
                          onClick={() => {const e={id:Date.now(),reminderId:rem.id,taken:false,timestamp:new Date().toISOString(),drug:rem.drug}; setAdherenceLog(p=>{const u=[...p,e];localStorage.setItem('rxlens_adherence_log',JSON.stringify(u));return u;});}}><X size={14}/> Missed</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card" style={{marginBottom:'20px'}}>
              <h2 className="card-title"><Activity size={20}/> Dose History</h2>
              {adherenceLog.length === 0 ? (
                <p style={{textAlign:'center',padding:'2rem',opacity:0.5}}>No doses logged yet</p>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'8px',maxHeight:'300px',overflowY:'auto'}}>
                  {[...adherenceLog].reverse().slice(0,20).map((log) => (
                    <div key={log.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 16px',
                      background:log.taken?'rgba(34,197,94,0.06)':'rgba(239,68,68,0.06)',
                      border:`1px solid ${log.taken?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)'}`,
                      borderRadius:'10px',fontSize:'0.85rem'}}>
                      {log.taken ? <CheckCircle2 size={16} color="var(--success)"/> : <AlertTriangle size={16} color="var(--danger)"/>}
                      <span style={{flex:1,fontWeight:500}}>{log.drug}</span>
                      <span style={{color:log.taken?'var(--success)':'var(--danger)',fontWeight:600,fontSize:'0.8rem'}}>{log.taken?'TAKEN':'MISSED'}</span>
                      <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card">
              <h2 className="card-title"><Share2 size={20}/> Caregiver Notification</h2>
              <p style={{fontSize:'0.9rem',color:'var(--text-muted)',marginBottom:'15px'}}>Share your adherence report with a caregiver or family member.</p>
              <button className="btn" style={{display:'flex',alignItems:'center',gap:'8px'}} onClick={() => {
                const sc=adherenceLog.length>0?Math.round((adherenceLog.filter(l=>l.taken).length/adherenceLog.length)*100):0;
                const msg=`RxLens Adherence Report for ${patientProfile.name||'Patient'}:
Adherence Score: ${sc}%
Doses Taken: ${adherenceLog.filter(l=>l.taken).length}
Doses Missed: ${adherenceLog.filter(l=>!l.taken).length}
Generated: ${new Date().toLocaleString()}`;
                if(navigator.share){navigator.share({title:'RxLens Adherence Report',text:msg});}
                else{navigator.clipboard.writeText(msg);alert('Report copied to clipboard!');}
              }}><Share2 size={16}/> Share Report</button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <div className="chat-fab" onClick={() => setShowChat(!showChat)}>
        <MessageCircle size={28} />
      </div>

      <AnimatePresence>
        {showChat && (
          <motion.div className="chat-window" initial={{opacity:0, y:20, scale:0.95}} animate={{opacity:1, y:0, scale:1}} exit={{opacity:0, y:20, scale:0.95}}>
            <div className="chat-header">
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <div className={`status-dot ${isEngineReady ? 'active' : ''}`}></div>
                <h3 style={{fontSize:'1rem', fontWeight:700}}>Ask AI Assistant</h3>
              </div>
              <X size={18} style={{cursor:'pointer'}} onClick={() => setShowChat(false)} />
            </div>
            <div className="chat-messages">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  {msg.text}
                </div>
              ))}
              {chatLoading && <div className="message ai">Thinking...</div>}
              {retryCountdown > 0 && <div className="message ai" style={{color: 'var(--primary)'}}>Waiting for quota: {retryCountdown}s</div>}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input-area">
              <input 
                className="chat-input" 
                placeholder={language === 'Hindi' ? "अपनी दवाओं के बारे में पूछें..." : "Ask about your meds..."} 
                value={chatMessage} 
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSend()}
                disabled={retryCountdown > 0}
              />
              <button className="btn" style={{padding:'0.5rem'}} onClick={handleChatSend} disabled={chatLoading || retryCountdown > 0}>
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
