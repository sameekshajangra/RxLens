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
  LayoutDashboard, Trash2, Calendar, Pill, Moon, Sun, TrendingUp, Share2, MessageCircle, Send, X
} from 'lucide-react';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
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
  
  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello! I am RxLens AI. You can ask me anything about your current prescription.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

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

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
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
  };

  const captureCamera = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setImagePreview(imageSrc);
      const arr = imageSrc.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while(n--) u8arr[n] = bstr.charCodeAt(n);
      setImageFile(new File([u8arr], "capture.jpg", {type:mime}));
      resetState();
    }
  }, [webcamRef]);

  const processImage = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError('');
    setLoadingStatus('Processing VLM Engine...');
    const formData = new FormData();
    formData.append('file', imageFile);
    if (apiKey) formData.append('api_key', apiKey);

    try {
      const res = await axios.post('/api/extract', formData, { timeout: 120000 });
      setResult(res.data);
      if (res.data.summary) {
        setLoadingStatus('Generating audio summary...');
        const audioForm = new FormData();
        audioForm.append('text', res.data.summary);
        const audioRes = await axios.post('/api/audio', audioForm, { responseType: 'blob' });
        setAudioUrl(URL.createObjectURL(audioRes.data));
      }
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.detail || 'AI Quota Exceeded. Please wait 60s.');
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
    if (apiKey) formData.append('api_key', apiKey);

    try {
      const res = await axios.post('/api/chat', formData);
      setChatHistory(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting to the brain." }]);
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

  const shareReport = (item) => {
    const shareText = `Prescription for ${item.drug_name}: ${item.summary}`;
    if (navigator.share) {
      navigator.share({ title: 'RxLens Report', text: shareText, url: window.location.href });
    } else {
      alert("Sharing link: " + window.location.href);
    }
  };

  const getDrugFrequencyData = () => {
    const counts = {};
    history.forEach(item => {
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
    history.forEach(item => {
      const date = item.date.split(' ')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return Object.entries(dailyCounts).map(([name, count]) => ({ name, count })).slice(-7);
  };

  const isEngineReady = isApiKeySetInEnv || apiKey.length > 10 || apiKey === "DEMO_MODE";

  return (
    <div className="app-container">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="header-content">
          <h1>🩺 RxLens <span>Clinical Hub</span></h1>
        </div>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div className="settings-toggle" onClick={() => setShowSettings(!showSettings)}>
            <div className={`status-dot ${isEngineReady ? 'active' : ''}`}></div>
            <Settings size={16} />
            {isApiKeySetInEnv ? 'Ready' : 'Setup'}
          </div>
          <div className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </div>
        </div>
      </motion.header>

      <div className="nav-bar">
        <div className={`nav-item ${activeTab === 'scanner' ? 'active' : ''}`} onClick={() => setActiveTab('scanner')}>
          <LayoutDashboard size={18} /> Scanner
        </div>
        <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <History size={18} /> History
        </div>
        <div className={`nav-item ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
          <TrendingUp size={18} /> Insights
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'scanner' && (
          <motion.div key="scanner" className="main-grid" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div className="left-col">
              <div className="glass-card">
                <h2 className="card-title"><FileText size={20} /> Input Document</h2>
                {!imagePreview && !showCamera ? (
                  <div className="upload-area" onClick={() => fileInputRef.current.click()} onDragOver={(e)=>e.preventDefault()} onDrop={handleDrop}>
                    <Upload size={48} className="upload-icon" />
                    <h3>Drag & Drop Prescription</h3>
                    <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px'}}>
                      <button className="btn">Upload</button>
                      <button className="btn btn-secondary" onClick={(e)=>{e.stopPropagation(); setShowCamera(true)}}><Camera size={18}/> Camera</button>
                    </div>
                  </div>
                ) : showCamera ? (
                  <div style={{textAlign: 'center'}}>
                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width="100%" />
                    <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px'}}>
                      <button className="btn btn-secondary" onClick={()=>setShowCamera(false)}>Cancel</button>
                      <button className="btn" onClick={captureCamera}><Camera size={18}/> Capture</button>
                    </div>
                  </div>
                ) : (
                  <div style={{textAlign: 'center'}}>
                    <img src={imagePreview} className="img-preview" />
                    <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '25px'}}>
                      <button className="btn btn-secondary" onClick={() => { setImagePreview(null); setImageFile(null); resetState(); }}>Clear</button>
                      <button className="btn" onClick={processImage} disabled={loading}>{loading ? 'Analyzing...' : 'Digitize'}</button>
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
                  <div className="glass-card" style={{marginBottom: '1rem'}}>
                    <h2 className="card-title"><Activity size={20}/> Results</h2>
                    <div className="metrics-grid">
                      <div className="metric-box"><div className="metric-label">Drug</div><div className="metric-value">{result.data.drug}</div></div>
                      <div className="metric-box"><div className="metric-label">Dosage</div><div className="metric-value">{result.data.dosage}</div></div>
                    </div>
                  </div>
                  <div className="glass-card">
                    <h2 className="card-title"><PlayCircle size={20}/> Export</h2>
                    {audioUrl && <audio controls src={audioUrl} style={{width:'100%', marginBottom:'1rem'}}></audio>}
                    <button className="btn" style={{width:'100%'}} onClick={()=>downloadPDF()}><Download size={18}/> Download Clinical PDF</button>
                  </div>
                </motion.div>
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
                      <button className="btn btn-secondary" style={{padding:'0.5rem'}} onClick={() => shareReport(item)}><Share2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div key="insights" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="main-grid">
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
                    <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <Tooltip contentStyle={{background: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px'}} />
                    <Area type="monotone" dataKey="count" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat UI */}
      <div className="chat-fab" onClick={() => setShowChat(!showChat)}>
        <MessageCircle size={28} />
      </div>

      <AnimatePresence>
        {showChat && (
          <motion.div className="chat-window" initial={{opacity:0, y:20, scale:0.95}} animate={{opacity:1, y:0, scale:1}} exit={{opacity:0, y:20, scale:0.95}}>
            <div className="chat-header">
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <div className="status-dot active"></div>
                <h3 style={{fontSize:'1rem', fontWeight:700}}>Ask RxLens AI</h3>
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
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input-area">
              <input 
                className="chat-input" 
                placeholder="Ask about your meds..." 
                value={chatMessage} 
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
              />
              <button className="btn" style={{padding:'0.5rem'}} onClick={handleChatSend} disabled={chatLoading}>
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
