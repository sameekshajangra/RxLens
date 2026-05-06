import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import Webcam from "react-webcam";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Upload, Camera, FileText, Activity, ShieldCheck, 
  Download, PlayCircle, Loader2, AlertTriangle, 
  CheckCircle2, Settings, Key, Globe, History, 
  LayoutDashboard, Trash2, Calendar, Pill, Moon, Sun, TrendingUp, Share2, MessageCircle, Send, X, Languages, Timer, User, Clock, CalendarCheck
} from 'lucide-react';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
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
  const [patientProfile, setPatientProfile] = useState({ name: '', age: '', weight: '', allergies: '' });
  const [showProfile, setShowProfile] = useState(false);
  
  // Rate Limit Countdown
  const [retryCountdown, setRetryCountdown] = useState(0);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

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
      schedule_title: 'Treatment Schedule',
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      night: 'Night',
      today: 'Today'
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
      schedule_title: 'उपचार की समय सारणी',
      morning: 'सुबह',
      afternoon: 'दोपहर',
      evening: 'शाम',
      night: 'रात',
      today: 'आज'
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

  const processImage = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError('');
    setLoadingStatus('Fast-tracking VLM Engine...');
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('lang', language);
    formData.append('patient_profile', JSON.stringify(patientProfile));
    if (apiKey) formData.append('api_key', apiKey);

    try {
      const res = await axios.post('/api/extract', formData, { timeout: 120000 });
      setResult(res.data);
      if (res.data.summary) {
        setLoadingStatus(`Synthesizing ${language} audio...`);
        const audioForm = new FormData();
        audioForm.append('text', res.data.summary);
        audioForm.append('lang', language);
        const audioRes = await axios.post('/api/audio', audioForm, { responseType: 'blob' });
        setAudioUrl(URL.createObjectURL(audioRes.data));
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
  };

  const handleChatSend = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    const context = result ? `Drug: ${result.data.drug}, Dosage: ${result.data.dosage}` : "No prescription scanned yet.";
    const formData = new FormData();
    formData.append('question', userMsg);
    formData.append('context', context);
    formData.append('lang', language);
    if (apiKey) formData.append('api_key', apiKey);

    try {
      const res = await axios.post('/api/chat', formData);
      setChatHistory(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "I'm currently overloaded. Please try again in a moment." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const downloadPDF = async (data = result?.data, summaryText = result?.summary) => {
    if (!data) return;
    const pdfForm = new FormData();
    pdfForm.append('drug', data.drug || data.drug_name || '');
    pdfForm.append('dosage', data.dosage || '');
    pdfForm.append('frequency', data.frequency || '');
    pdfForm.append('duration', data.duration || '');
    pdfForm.append('summary', summaryText || data.summary || '');
    try {
      const res = await axios.post('/api/pdf', pdfForm, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Clinical_Report.pdf');
      link.click();
    } catch (err) { console.error(err); }
  };

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
          <div className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
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
      </div>

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
              <button 
                className="btn btn-secondary" 
                onClick={() => setPatientProfile({ name: '', age: '', weight: '', allergies: '' })}
                style={{ padding: '6px 12px', fontSize: '0.75rem', opacity: 0.7 }}
              >
                {t.reset_profile}
              </button>
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
                  <div style={{textAlign: 'center', position: 'relative', overflow: 'hidden', borderRadius: '16px'}}>
                    {loading && <div className="scanning-line"></div>}
                    <img src={imagePreview} className="img-preview" />
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
                  {result.data.safety_alerts && (
                    <div className="glass-card" style={{marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', borderLeftWidth: '5px'}}>
                      <h3 style={{color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontSize: '1rem'}}>
                        <AlertTriangle size={18} /> {t.safety_warning}
                      </h3>
                      <p style={{fontSize: '0.9rem', color: 'var(--text)', fontWeight: 500}}>{result.data.safety_alerts}</p>
                    </div>
                  )}
                  <div className="glass-card" style={{marginBottom: '1.5rem'}}>
                    <h2 className="card-title"><Activity size={20} style={{color: 'var(--primary)'}}/> {t.clinical_extraction}</h2>
                    <div className="metrics-grid">
                      <div className="metric-box">
                        <div className="metric-label">{t.medication}</div>
                        <div className="metric-value" style={{fontSize: '1.2rem'}}>{result.data.drug}</div>
                      </div>
                      <div className="metric-box">
                        <div className="metric-label">{t.dosage}</div>
                        <div className="metric-value">{result.data.dosage}</div>
                      </div>
                      <div className="metric-box">
                        <div className="metric-label">{t.frequency}</div>
                        <div className="metric-value">{result.data.frequency || 'As directed'}</div>
                      </div>
                      <div className="metric-box">
                        <div className="metric-label">{t.duration}</div>
                        <div className="metric-value">{result.data.duration || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {result.data.schedule && (
                    <div className="glass-card" style={{marginBottom: '1.5rem'}}>
                      <h2 className="card-title"><CalendarCheck size={20} style={{color: 'var(--primary)'}}/> {t.schedule_title}</h2>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                        {result.data.schedule.map((item, idx) => (
                          <div key={idx} style={{background: 'rgba(255,255,255,0.03)', borderRadius: '15px', padding: '15px', border: '1px solid var(--border)'}}>
                            <div style={{fontWeight: 600, color: 'var(--primary)', marginBottom: '10px', fontSize: '0.95rem'}}>{item.drug}</div>
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px'}}>
                              {['Morning', 'Afternoon', 'Evening', 'Night'].map(time => {
                                const isActive = item.times?.includes(time);
                                const localizedTime = t[time.toLowerCase()];
                                return (
                                  <div key={time} style={{
                                    textAlign: 'center', 
                                    padding: '8px', 
                                    borderRadius: '10px', 
                                    background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: isActive ? 'white' : 'var(--text-muted)',
                                    fontSize: '0.75rem',
                                    fontWeight: isActive ? 600 : 400,
                                    border: isActive ? 'none' : '1px solid var(--border)',
                                    opacity: isActive ? 1 : 0.4
                                  }}>
                                    <Clock size={12} style={{marginBottom: '4px'}} />
                                    <div>{localizedTime}</div>
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{marginTop: '10px', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px'}}>
                              <Timer size={12} /> {item.duration}
                            </div>
                          </div>
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

                  <div style={{display: 'flex', gap: '15px'}}>
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
                  {history.filter(h => h.summary && (h.summary.includes('Warning') || h.summary.includes('interaction'))).length}
                </div>
                <div className="stat-label">Safety Alerts</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{background:'rgba(34, 197, 94, 0.1)', color:'var(--success)'}}><Calendar size={24}/></div>
                <div className="stat-value">5.2</div>
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
                onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
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
