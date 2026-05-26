import React, { useState, useRef, useCallback, useEffect, Component } from 'react';

// Helper to ensure a value is an array before mapping
const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

// Helper: compute average treatment duration across history items
const avgDurationDays = (historyArr) => {
  const nums = safeArray(historyArr).flatMap(h => {
    const raw = typeof h.duration === 'string' ? h.duration : String(h.duration || '');
    const m = raw.match(/[0-9]+/);
    return m ? [parseInt(m[0], 10)] : [];
  }).filter(n => n > 0);
  if (!nums.length) return '\u2014';
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
};

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
  LayoutDashboard, Trash2, Calendar, Pill, Moon, Sun, TrendingUp, Share2, MessageCircle, Send, X, Languages, Timer, User, Clock, CalendarCheck, HeartPulse, Stethoscope, Eye, EyeOff, Gauge, Bell, BellRing, Save, Check, Target, BriefcaseMedical, Leaf, Recycle, Play, Pause, Printer, Volume2
} from 'lucide-react';
import UploadCard from './components/UploadCard';
import ExplanationLevelSelector from './components/ExplanationLevelSelector';
import MedicineTimeline from './components/MedicineTimeline';
import './index.css';
import i18n from './i18n';
import html2pdf from 'html2pdf.js';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  
  // Bespoke Audio Player State & Effects
  const audioRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setAudioPlaying(true);
    const handlePause = () => setAudioPlaying(false);
    const handleTimeUpdate = () => setAudioCurrentTime(audio.currentTime);
    const handleDurationChange = () => setAudioDuration(audio.duration);
    const handleEnded = () => setAudioPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const changePlaybackRate = (rate) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [elderlyMode, setElderlyMode] = useState(localStorage.getItem('rxlens_elderly_mode') === 'true');
  const [language, setLanguage] = useState('English');
  const [userMode, setUserMode] = useState('patient'); // 'patient' | 'worker'
  const [explanationLevel, setExplanationLevel] = useState('standard'); // 'simple' | 'standard' | 'detailed'
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
  const [comprehensionStatus, setComprehensionStatus] = useState(null);
  const [history, setHistory] = useState(() => {
    const stored = localStorage.getItem('rxlens_history');
    try { return stored ? JSON.parse(stored) : []; } catch(e) { return []; }
  });
  const [patientProfile, setPatientProfile] = useState(() => {
    const saved = localStorage.getItem('rxlens_patient_profile');
    try { return saved ? JSON.parse(saved) : { name: '', age: '', weight: '', allergies: '', conditions: '' }; } catch(e) { return { name: '', age: '', weight: '', allergies: '', conditions: '' }; }
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

  const t = i18n[language];

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

  // Apply patient‑mode CSS class to body
  useEffect(() => {
    document.body.classList.toggle('patient-mode', userMode === 'patient');
  }, [userMode]);

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
      // Persist fetched history to localStorage for offline fallback
      localStorage.setItem('rxlens_history', JSON.stringify(res.data));
    } catch (err) {
      console.error("History fetch failed", err);
      // Fallback: load history from localStorage if available
      const stored = localStorage.getItem('rxlens_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    }
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
    setComprehensionStatus(null);
    setError('');
    setLoadingStatus(t.loading_status || 'Fast-tracking VLM Engine...');
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('lang', language);
    formData.append('patient_profile', JSON.stringify(patientProfile));
    formData.append('explanation_level', explanationLevel);
    formData.append('lang', language);

    try {
      const res = await axios.post('/api/extract', formData, { timeout: 120000 });

      // ── Validate response is proper JSON with expected shape ────────────
      // When backend isn't running (e.g. Firebase hosting without the Python API),
      // axios parses the HTML 404/index.html as a string → crash on result.data
      const raw = res.data;
      if (!raw || typeof raw !== 'object' || !raw.data) {
        // Backend not reachable or returned unexpected format
        throw new Error(
          'Backend API is not reachable. The live demo frontend is hosted on Firebase, ' +
          'but the Python backend needs to be running separately. ' +
          'To test locally: run the FastAPI backend and use npm run dev.'
        );
      }

      // ── Normalise so result.data is always a safe object ───────────────
      const safeResult = {
        ...raw,
        data: {
          drugs_list: [],
          safety_alerts: [],
          schedule: [],
          uncertainty_warnings: [],
          confusing_terms: [],
          polypharmacy_notes: [],
          ...(raw.data || {}),
        },
      };

      setResult(safeResult);

      // Store scan into local history
      const entry = {
        drug_name: safeResult.data.drug || safeResult.data.drug_name || '',
        dosage: safeResult.data.dosage || '',
        date: new Date().toLocaleString(),
        safety_alert_count: safeArray(safeResult.data.safety_alerts).length,
        data: safeResult // Save the complete payload for viewing and downloading
      };
      setHistory(prev => {
        const updated = [...prev, entry];
        try { localStorage.setItem('rxlens_history', JSON.stringify(updated)); } catch (e) { console.error('Storage full', e); }
        return updated;
      });

      if (safeResult.audio_base64) {
        setAudioUrl(`data:audio/mpeg;base64,${safeResult.audio_base64}`);
      }

      // Auto-generate reminders from schedule
      if (safeResult.data.schedule?.length) {
        const newReminders = safeArray(safeResult.data.schedule).map((item, idx) => ({
          id: Date.now() + idx,
          time: item.time,
          task: item.task || item.drug,
          drug: safeResult.data.drug,
          enabled: true,
          createdAt: new Date().toISOString(),
        }));
        setReminders(prev => {
          const updated = [...prev, ...newReminders];
          try { localStorage.setItem('rxlens_reminders', JSON.stringify(updated)); } catch (e) { console.error('Storage full', e); }
          return updated;
        });
      }

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
  }, [imageFile, language, patientProfile, explanationLevel]);

  const handleChatSend = useCallback(async (overrideMsg = null) => {
    const msgToSend = overrideMsg || chatMessage;
    if (!msgToSend.trim()) return;
    const userMsg = msgToSend;
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

  const generatePDFHTML = (data) => {
    if (!data) return '';
    const safeArray = (arr) => Array.isArray(arr) ? arr : [];
    
    // Parse individual drugs
    const drugs = safeArray(data.drugs_list);
    let drugRows = '';
    
    if (drugs.length > 0) {
      drugs.forEach((d, idx) => {
        const dosage = (data.drugs_dosage && data.drugs_dosage[d]) || data.dosage || 'N/A';
        const freq = data.frequency || 'N/A';
        const duration = data.duration || 'N/A';
        
        drugRows += `
          <tr>
            <td style="padding: 16px; border: 1px solid #c7d2fe; text-align: center; color: #334155;">${idx + 1}</td>
            <td style="padding: 16px; border: 1px solid #c7d2fe; color: #334155;">${d}</td>
            <td style="padding: 16px; border: 1px solid #c7d2fe; color: #334155;">${dosage}</td>
            <td style="padding: 16px; border: 1px solid #c7d2fe; color: #334155;">${freq}</td>
            <td style="padding: 16px; border: 1px solid #c7d2fe; color: #334155;">${duration}</td>
          </tr>
        `;
      });
    } else {
        drugRows = `
          <tr>
            <td style="padding: 16px; border: 1px solid #c7d2fe; text-align: center; color: #334155;">1</td>
            <td style="padding: 16px; border: 1px solid #c7d2fe; color: #334155;">${data.drug || 'Unknown'}</td>
            <td style="padding: 16px; border: 1px solid #c7d2fe; color: #334155;">${data.dosage || 'N/A'}</td>
            <td style="padding: 16px; border: 1px solid #c7d2fe; color: #334155;">${data.frequency || 'N/A'}</td>
            <td style="padding: 16px; border: 1px solid #c7d2fe; color: #334155;">${data.duration || 'N/A'}</td>
          </tr>
        `;
    }

    const clinicalSummary = `This prescription contains ${data.drug || 'the listed medications'}. ${data.instructions || ''} ${data.notes || ''}`;

    let html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background: #ffffff; padding: 40px; max-width: 900px; margin: 0 auto;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
        <div>
          <h1 style="color: #6366f1; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -0.5px;">RxLens</h1>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 16px;">AI-Powered Clinical Prescription Report</p>
        </div>
        <div style="text-align: right; color: #64748b; font-size: 14px; padding-top: 10px;">
          ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      <div style="height: 3px; background-color: #6366f1; margin-bottom: 24px; width: 100%;"></div>

      <!-- AI Hallucination Safeguard -->
      <div style="border: 2px solid #ef4444; background-color: #fef2f2; padding: 16px; margin-bottom: 30px; page-break-inside: avoid; break-inside: avoid;">
        <p style="color: #dc2626; margin: 0; font-size: 14px; font-style: italic; font-weight: 600; line-height: 1.5;">
          AI HALLUCINATION SAFEGUARD: This report was generated by an AI vision model. AI outputs may contain inaccuracies. All medication details MUST be verified by a licensed pharmacist or physician before use. Do not self-medicate based on this report alone.
        </p>
      </div>

      <!-- Meta Info Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; page-break-inside: avoid; break-inside: avoid;">
        <tbody>
          <tr>
            <td style="padding: 12px 0; font-weight: 700; color: #334155; width: 25%; border-bottom: 1px solid #f1f5f9;">AI Engine:</td>
            <td style="padding: 12px 0; color: #334155; border-bottom: 1px solid #f1f5f9;">Google Gemini Flash (Vision Language Model)</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 700; color: #334155; border-bottom: 1px solid #f1f5f9;">Report Type:</td>
            <td style="padding: 12px 0; color: #334155; border-bottom: 1px solid #f1f5f9;">Prescription Digitization & Clinical Safety</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 700; color: #334155; border-bottom: 1px solid #f1f5f9;">Confidence:</td>
            <td style="padding: 12px 0; color: #334155; border-bottom: 1px solid #f1f5f9;">Source grounding via multi-step pharmacist AI prompt</td>
          </tr>
        </tbody>
      </table>

      <!-- Prescribed Medication Regimen -->
      <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">Prescribed Medication Regimen</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; border: 1px solid #6366f1; page-break-inside: avoid; break-inside: avoid;">
        <thead>
          <tr style="background-color: #6366f1; color: #ffffff;">
            <th style="padding: 16px; text-align: center; font-weight: 600; border: 1px solid #c7d2fe; width: 5%;">#</th>
            <th style="padding: 16px; text-align: left; font-weight: 600; border: 1px solid #c7d2fe; width: 30%;">Drug / Medication</th>
            <th style="padding: 16px; text-align: left; font-weight: 600; border: 1px solid #c7d2fe; width: 20%;">Dosage</th>
            <th style="padding: 16px; text-align: left; font-weight: 600; border: 1px solid #c7d2fe; width: 25%;">Frequency</th>
            <th style="padding: 16px; text-align: left; font-weight: 600; border: 1px solid #c7d2fe; width: 20%;">Duration</th>
          </tr>
        </thead>
        <tbody>
          ${drugRows}
        </tbody>
      </table>

      <!-- Clinical Summary -->
      <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">Clinical Summary</h2>
      <div style="background-color: #eff6ff; border: 2px solid #6366f1; border-left-width: 6px; padding: 20px; color: #1e293b; line-height: 1.6; font-size: 15px; page-break-inside: avoid; break-inside: avoid;">
        ${clinicalSummary}
      </div>`;

    const alerts = safeArray(data.safety_alerts);
    if (alerts.length > 0) {
      html += `<div style="margin-top: 40px; page-break-inside: avoid; break-inside: avoid;">
        <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">Safety Alerts (${alerts.length})</h2>`;
      alerts.forEach(alert => {
        const color = alert.severity === 'Critical' ? '#ef4444' : '#f59e0b';
        const bg = alert.severity === 'Critical' ? '#fef2f2' : '#fffbeb';
        const border = alert.severity === 'Critical' ? '#fecaca' : '#fde68a';
        html += `<div style="background: ${bg}; border: 1px solid ${border}; padding: 16px; border-radius: 8px; margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <strong style="color: ${color}; font-size: 15px;">${alert.issue || alert.message || 'Safety Warning'}</strong>
            <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${alert.severity}</span>
          </div>
          <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">${alert.recommendation || ''}</p>
        </div>`;
      });
      html += `</div>`;
    }

    const sideEffects = safeArray(data.side_effects);
    if (sideEffects.length > 0) {
      html += `<div style="margin-top: 40px; page-break-inside: avoid; break-inside: avoid;">
        <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">Side Effects & Management</h2>
        <table style="width: 100%; border-collapse: collapse; page-break-inside: avoid; break-inside: avoid;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 12px; text-align: left; font-size: 13px; color: #475569; border: 1px solid #e2e8f0;">Effect</th>
              <th style="padding: 12px; text-align: left; font-size: 13px; color: #475569; border: 1px solid #e2e8f0;">Management</th>
            </tr>
          </thead>
          <tbody>`;
      sideEffects.forEach(effect => {
        html += `<tr>
          <td style="padding: 12px; border: 1px solid #e2e8f0; font-size: 14px; color: #334155;"><strong>${effect.effect}</strong></td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; font-size: 14px; color: #475569;">${effect.management}</td>
        </tr>`;
      });
      html += `</tbody></table></div>`;
    }

    html += `</div>`;
    return html;
  };
 const downloadPDF = useCallback(async (dataOverride = null) => {
    try {
      const dataToPrint = dataOverride || result?.data;
      if (!dataToPrint) {
        console.error("No data to print");
        return;
      }
      
      const htmlString = generatePDFHTML(dataToPrint);
      
      const opt = {
        margin: 0,
        filename: `RxLens_Report_${dataToPrint.drug || 'Medication'}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        pagebreak: { mode: ['css', 'legacy'] },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(htmlString).save();
    } catch (e) {
      console.error("PDF generation failed", e);
    }
  }, [result, patientProfile]);

  const getWhatsAppShareLink = useCallback(() => {
    if (!result?.data) return '';
    const drugName = result.data.drug || 'Unknown';
    const instructions = result.data.instructions || 'As directed';
    const scheduleStr = safeArray(result.data.schedule).map(item => `• ${item.time}: ${item.task}`).join('\n');
    const safetyStr = safeArray(result.data.safety_alerts).map(alert => `⚠ [${alert.severity}] ${alert.message}`).join('\n');
    
    const text = `🩺 *RxLens Prescription Summary*\n\n` +
                 `*Medication:* ${drugName}\n` +
                 `*Instructions:* ${instructions}\n\n` +
                 `*Intake Schedule:*\n${scheduleStr || 'None'}\n\n` +
                 (safetyStr ? `*Safety Warnings:*\n${safetyStr}\n\n` : '') +
                 `_Shared via RxLens Clinical App_`;
                 
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  }, [result]);

  const isEngineReady = isApiKeySetInEnv || apiKey.length > 10 || apiKey === "DEMO_MODE";

  return (
    
    <div className="app-wrapper">
      {/* Sidebar */}
      <div className="sidebar hide-on-print">
        <div className="sidebar-header">
          <h1><span style={{ fontSize: '2rem' }}>🩺</span> RxLens</h1>
        </div>
        <div className="sidebar-nav">
          <button className={`sidebar-item ${activeTab === 'scanner' ? 'active' : ''}`} onClick={() => setActiveTab('scanner')}>
            <LayoutDashboard size={20} /> {t.scanner || "Scanner"}
          </button>
          <button className={`sidebar-item ${activeTab === 'adherence' ? 'active' : ''}`} onClick={() => setActiveTab('adherence')}>
            <CheckCircle2 size={20} /> {t.adherence_tab || "Medication Adherence"}
          </button>
          <button className={`sidebar-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <History size={20} /> {t.history || "History"}
          </button>
          <button className={`sidebar-item ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
            <TrendingUp size={20} /> {t.insights || "Reminders & Insights"}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Redesigned Header */}
        <header className="top-header hide-on-print">
          <div className="top-header-row1">
            <h2>{t.header_title}</h2>
          </div>
          <div className="top-header-row2">
            <div className="header-left-controls">
              <button className={`btn ${showProfile ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShowProfile(!showProfile)} style={{padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem'}}>
                <User size={16} /> {patientProfile.name || t.patient_profile || "Patient Profile"}
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Languages size={16} color="var(--text-muted)" />
                <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{background: 'none', border: 'none', color: 'inherit', font: 'inherit', outline: 'none', cursor: 'pointer', fontWeight: 600}}>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <span className={`mode-badge ${userMode === 'patient' ? 'patient' : 'worker'}`}>
                   {userMode === 'patient' ? '🧑‍⚕️' : '🏥'}
                 </span>
                 <select value={userMode} onChange={(e) => setUserMode(e.target.value)} style={{background: 'none', border: 'none', color: 'inherit', font: 'inherit', outline: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'}}>
                   <option value="patient">{t.mode_patient || "Patient Mode"}</option>
                   <option value="worker">{t.mode_worker || "Healthcare Worker"}</option>
                 </select>
              </div>
            </div>

            <div className="header-right-controls">
              <button className="btn btn-secondary" onClick={() => setElderlyMode(!elderlyMode)} title="Large Font Mode" style={{ padding: '8px 12px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: elderlyMode ? 'bold' : 'normal', color: elderlyMode ? 'var(--primary)' : 'inherit' }}>A+</span>
              </button>
              <button className="btn btn-secondary" onClick={() => setDarkMode(!darkMode)} style={{ padding: '8px 12px' }}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        <div className="app-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
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
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>{t.name || "Full Name"}</label>
                  <div className="profile-input-wrapper">
                    <User className="input-icon" size={18} />
                    <input type="text" className="input-field" placeholder={t.name_placeholder || "e.g. John Doe"} value={patientProfile.name} onChange={(e)=>setPatientProfile({...patientProfile, name: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>{t.age || "Age"}</label>
                  <div className="profile-input-wrapper">
                    <Calendar className="input-icon" size={18} style={{ zIndex: 10 }} />
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <select 
                        className="input-field" 
                        value={patientProfile.age || ''} 
                        onChange={(e) => setPatientProfile({ ...patientProfile, age: e.target.value })}
                        style={{ flex: 1.5, paddingLeft: '45px', color: 'var(--text)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="">Age</option>
                        {Array.from({ length: 110 }, (_, i) => i + 1).map((val) => (
                          <option key={val} value={val} style={{ color: '#000' }}>{val}</option>
                        ))}
                      </select>
                      <select 
                        className="input-field" 
                        value={patientProfile.ageUnit || 'Years'} 
                        onChange={(e) => setPatientProfile({ ...patientProfile, ageUnit: e.target.value })}
                        style={{ flex: 1.2, color: 'var(--text)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="Years" style={{ color: '#000' }}>Years</option>
                        <option value="Months" style={{ color: '#000' }}>Months</option>
                        <option value="Weeks" style={{ color: '#000' }}>Weeks</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>{t.weight || "Weight"}</label>
                  <div className="profile-input-wrapper">
                    <Activity className="input-icon" size={18} />
                    <input type="number" className="input-field" placeholder={t.weight_placeholder || "kg"} value={patientProfile.weight} onChange={(e)=>setPatientProfile({...patientProfile, weight: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>{t.allergies || "Allergies"}</label>
                  <div className="profile-input-wrapper">
                    <AlertTriangle className="input-icon" size={18} />
                    <input type="text" className="input-field" placeholder={t.allergies_placeholder || "e.g. Penicillin, Peanuts"} value={patientProfile.allergies} onChange={(e)=>setPatientProfile({...patientProfile, allergies: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>{t.conditions || "Conditions"}</label>
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
                {/* Explanation Level — patient mode only */}
                {userMode === 'patient' && (
                  <ExplanationLevelSelector
                    value={explanationLevel}
                    onChange={setExplanationLevel}
                  />
                )}
                {retryCountdown > 0 ? (
                  <UploadCard retryCountdown={retryCountdown} t={t} />
                ) : !imagePreview ? (
                  <UploadCard 
                    loading={loading} 
                    t={t} 
                    onImageCapture={(file) => {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                      resetState();
                    }}
                  />
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
                      <button className="btn btn-secondary" onClick={() => { setImagePreview(null); setImageFile(null); resetState(); }}>{t.clear}</button>
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
                
                <motion.div className="result-container" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}}>
                  {/* Uncertainty Handling Banner */}
                  {(userMode === 'worker' || explanationLevel === 'detailed') && result?.data?.is_uncertain && (
                    <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.08)', border: '2px solid var(--danger)', borderRadius: '24px', padding: '2rem', textAlign: 'center' }}>
                      <AlertTriangle size={48} color="var(--danger)" style={{ margin: '0 auto 12px' }} className="pulse-danger" />
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--danger)', fontWeight: 700, marginBottom: '8px' }}>{t.unable_to_identify}</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.6', margin: 0 }}>
                        {t.unable_to_identify_desc}
                      </p>
                    </div>
                  )}

                  {/* Accessibility Complexity Scoring */}
                  {userMode === 'patient' && explanationLevel === 'detailed' && result.data.accessibility_analysis && (
                    <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(168,85,247,0.04))', border: '1px solid var(--border)' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 700, margin: 0, marginBottom: '1.25rem' }}>
                        <Gauge size={22} color="var(--primary)" /> {t.accessibility_complexity_score}
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '120px', padding: '15px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>{t.difficulty}</span>
                          <span className={`difficulty-badge ${(result.data.accessibility_analysis.score || 'Medium').toLowerCase()}`} style={{ fontSize: '1.2rem', fontWeight: 800, padding: '4px 14px', borderRadius: '10px', color: 'white', textTransform: 'uppercase', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                            {result.data.accessibility_analysis.score}
                          </span>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{t.jargon_density}:</span>
                            <span style={{ fontWeight: 700, color: result.data.accessibility_analysis.jargon_density === 'High' ? 'var(--danger)' : result.data.accessibility_analysis.jargon_density === 'Medium' ? 'var(--warning)' : 'var(--success)' }}>
                              {result.data.accessibility_analysis.jargon_density}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{t.readability_level}:</span>
                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{result.data.accessibility_analysis.readability}</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, marginTop: '4px', lineHeight: '1.4' }}>
                            {result.data.accessibility_analysis.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Hallucination Safeguard Banner */}
                  {(userMode === 'worker' || explanationLevel === 'detailed') && (
                  <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid var(--danger)' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                      <AlertTriangle size={16} /> AI Hallucination Safeguard
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                      {t.ai_hallucination_desc}
                    </p>
                  </div>
                  )}
                  
                  {/* Structured Clinical Safety Intelligence */}
                  {(result?.data?.safety_alerts ?? []).length > 0 && (
                    <div className={`glass-card safety-section ${result.data.safety_alerts.some(a => a.severity === 'Critical') ? 'safety-section-critical' : 'safety-section-warning'}`} style={{ padding: '1.5rem' }}>
                      <div className="safety-header">
                        <div className="safety-header-left">
                          <ShieldAlert size={24} color="var(--danger)" />
                          <h3 style={{ color: result.data.safety_alerts?.some(a => a.severity === 'Critical') ? 'var(--danger)' : 'var(--warning)' }}>{t.safety_intel}</h3>
                        </div>
                        <span className={`safety-count-badge ${result.data.safety_alerts?.some(a => a.severity === 'Critical') ? 'critical' : 'warning'}`}>
                          {result.data.safety_alerts?.length || 0} {result.data.safety_alerts?.length === 1 ? 'Alert' : 'Alerts'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {safeArray(result.data.safety_alerts).map((alert, idx) => (
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
                                {safeArray(alert.involved_drugs).map((d, i) => (
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
                  {(userMode === 'worker' || explanationLevel === 'detailed') && (result?.data?.polypharmacy_notes && result?.data?.polypharmacy_notes.length > 0) && (

                    <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(139, 92, 246, 0.05)', borderLeft: '4px solid #8b5cf6' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 700, color: '#8b5cf6', marginBottom: '12px' }}>
                        <BriefcaseMedical size={20} /> {t.polypharmacy_review_provider}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {safeArray(result.data.polypharmacy_notes).map((note, idx) => (
                          <div key={idx} style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#6d28d9', marginBottom: '4px' }}>{note.topic}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{note.note}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Green Pharmacy Environmental Impact */}
                  {safeArray(result.data.environmental?.drug_impacts).length > 0 && (
                    <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(34, 197, 94, 0.05)', borderLeft: '4px solid #22c55e' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 700, color: '#16a34a', margin: 0 }}>
                          <Leaf size={20} /> {t.green_pharmacy_impact}
                        </h3>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', borderRadius: '12px', 
                          background: result.data.environmental.overall_impact === 'Critical' ? '#fee2e2' : result.data.environmental.overall_impact === 'High' ? '#ffedd5' : '#dcfce3',
                          color: result.data.environmental.overall_impact === 'Critical' ? '#ef4444' : result.data.environmental.overall_impact === 'High' ? '#f97316' : '#22c55e'
                        }}>
                          {result.data.environmental.overall_impact} Impact
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {safeArray(result.data.environmental?.drug_impacts).map((env, idx) => (
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
                  {(userMode === 'worker' || explanationLevel !== 'simple') && (
                    <>
                  {result.data.confidence && Object.keys(result.data.confidence).length > 0 && (
                    <div className="glass-card confidence-section" style={{ marginBottom: '1.5rem' }}>
                      <div className="confidence-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 700 }}>
                          <Gauge size={20} color="var(--primary)" /> {t.ai_confidence_score}
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
                      {safeArray(result.data.uncertainty_warnings).length > 0 && (
                        <div className="uncertainty-warnings">
                          {safeArray(result.data.uncertainty_warnings).map((w, i) => (
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
                         <Activity size={16} /> {t.ai_observation}
                       </h4>
                       <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{result.data.ai_safety_observations}</p>
                    </div>
                  )}
                  </>
                  )}
                  
                  {/* Structured Medication Table */}
                  {(userMode === 'worker' || explanationLevel !== 'simple') && (
                  <div className="glass-card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <h2 className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={20} style={{ color: 'var(--primary)' }} /> {t.structured_medication_table}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{safeArray(result.data.drugs_list).length} {t.meds_found}</span>
                    </h2>
                    
                    {/* Desktop Table view */}
                    <div className="desktop-table-container">
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1.5px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600 }}>
                            <th style={{ padding: '12px' }}>{t.medication_name}</th>
                            <th style={{ padding: '12px' }}>Dosage</th>
                            <th style={{ padding: '12px' }}>Frequency</th>
                            <th style={{ padding: '12px' }}>Duration</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>{t.confidence}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {safeArray(result.data.drugs_list).map((drug, idx) => {
                            const dose = result.data.drugs_dosage?.[drug] || result.data.dosage || 'As directed';
                            const individualConf = result.data.confidence?.[drug] != null 
                              ? result.data.confidence[drug] 
                              : (result.data.confidence?.drug || 0.9);
                            const level = getConfidenceLevel(individualConf);
                            const isLowConf = individualConf < 0.7;

                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }} className={isLowConf ? 'row-low-confidence' : ''}>
                                <td style={{ padding: '14px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Pill size={16} color="var(--primary)" />
                                  {drug}
                                  {isLowConf && (
                                    <span className="uncertain-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--danger-glow)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.7rem' }}>
                                      <AlertTriangle size={10} /> {t.verify}
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '14px 12px' }}>{dose}</td>
                                <td style={{ padding: '14px 12px' }}>{result.data.frequency || 'As directed'}</td>
                                <td style={{ padding: '14px 12px' }}>{result.data.duration || 'N/A'}</td>
                                <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, color: level === 'high' ? 'var(--success)' : level === 'medium' ? 'var(--warning)' : 'var(--danger)' }}>
                                  {Math.round(individualConf * 100)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card view (Feature 1) */}
                    <div className="mobile-cards-container">
                      {safeArray(result.data.drugs_list).map((drug, idx) => {
                        const dose = result.data.drugs_dosage?.[drug] || result.data.dosage || 'As directed';
                        const individualConf = result.data.confidence?.[drug] != null 
                          ? result.data.confidence[drug] 
                          : (result.data.confidence?.drug || 0.9);
                        const level = getConfidenceLevel(individualConf);
                        const isLowConf = individualConf < 0.7;

                        return (
                          <div key={idx} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: isLowConf ? '1px solid var(--danger)' : '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Pill size={16} color="var(--primary)" /> {drug}
                              </span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: level === 'high' ? 'var(--success)' : level === 'medium' ? 'var(--warning)' : 'var(--danger)' }}>
                                {Math.round(individualConf * 100)}% Conf
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                              <div><span style={{ color: 'var(--text-muted)' }}>Dosage:</span> <strong style={{ display: 'block' }}>{dose}</strong></div>
                              <div><span style={{ color: 'var(--text-muted)' }}>Frequency:</span> <strong style={{ display: 'block' }}>{result.data.frequency || 'As directed'}</strong></div>
                              <div><span style={{ color: 'var(--text-muted)' }}>Duration:</span> <strong style={{ display: 'block' }}>{result.data.duration || 'N/A'}</strong></div>
                              {isLowConf && (
                                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', background: 'var(--danger-glow)', padding: '6px 12px', borderRadius: '8px', marginTop: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                  <AlertTriangle size={14} /> {t.please_verify}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* General prescription notes */}
                    {result.data.notes && (
                      <div style={{ marginTop: '1.25rem', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>📝 {t.patient_notes}:</span>
                        <p style={{ margin: 0, color: 'var(--text-main)' }}>{result.data.notes}</p>
                      </div>
                    )}

                    {/* Jargon Detector */}
                    {(userMode === 'patient' && explanationLevel === 'detailed') && safeArray(result.data.confusing_terms).length > 0 && (
                      <div style={{ marginTop: '1.25rem', padding: '12px 16px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', fontSize: '0.85rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700, color: 'var(--info)', margin: 0, marginBottom: '8px' }}>
                          <Info size={16} /> {t.clinical_terms_simplified}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {safeArray(result.data.confusing_terms).map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                              <span style={{ fontWeight: 700, color: 'var(--info)', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                                {item.term}
                              </span>
                              <span style={{ color: 'var(--text-main)', lineHeight: '1.4' }}>
                                {t.means} <strong>{item.simplified}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Advice Explainability */}
                    {result.data.explainability_sources && (result.data.explainability_sources.instructions || safeArray(result.data.explainability_sources.side_effects).length > 0 || safeArray(result.data.explainability_sources.precautions).length > 0) && (
                      <div style={{ marginTop: '1.25rem', padding: '12px 16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', fontSize: '0.85rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary)', margin: 0, marginBottom: '8px' }}>
                          <Stethoscope size={16} /> {t.advice_explainability_panel}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {result.data.explainability_sources.instructions && (
                            <div>💡 Intake instructions came from: <strong>{result.data.explainability_sources.instructions}</strong></div>
                          )}
                          {safeArray(result.data.explainability_sources.side_effects).length > 0 && (
                            <div>⚠ Side effects profile belongs to: <strong>{safeArray(result.data.explainability_sources.side_effects).join(', ')}</strong></div>
                          )}
                          {safeArray(result.data.explainability_sources.precautions).length > 0 && (
                            <div>🛡 Precautions list belongs to: <strong>{safeArray(result.data.explainability_sources.precautions).join(', ')}</strong></div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                    
                    {/* Visual Medication Cards */}
                    {safeArray(result.data.drugs_list).length > 0 && (
                      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                        <h2 className="card-title"><Pill size={20} style={{ color: 'var(--primary)' }} /> {t.visual_cards_title || "Your Medications"}</h2>
                        <div className="visual-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                          {safeArray(result.data.drugs_list).map((drug, idx) => {
                            const dLower = drug.toLowerCase();
                            let icon = "💊"; // default pill
                            if (dLower.includes('syrup') || dLower.includes('liquid')) icon = "🥄";
                            else if (dLower.includes('inhaler') || dLower.includes('spray')) icon = "💨";
                            else if (dLower.includes('drop')) icon = "💧";
                            else if (dLower.includes('cream') || dLower.includes('ointment')) icon = "🧴";
                            else if (dLower.includes('injection') || dLower.includes('pen')) icon = "💉";

                            return (
                              <motion.div 
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{ 
                                  background: 'var(--bg-card)', 
                                  border: '2px solid var(--border)', 
                                  borderRadius: '16px', 
                                  padding: '1.5rem 1rem', 
                                  textAlign: 'center',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px'
                                }}
                              >
                                <div style={{ fontSize: '3rem', lineHeight: 1 }}>{icon}</div>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', wordBreak: 'break-word' }}>{drug}</div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {safeArray(result.data.schedule).length > 0 && (
                      <div className="glass-card" style={{marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(168,85,247,0.04))'}}>
                        <h2 className="card-title"><CalendarCheck size={20} style={{color: 'var(--primary)'}}/> {t.schedule_title}</h2>
                      <div style={{display:'flex', flexDirection:'column', gap:'0', position:'relative', paddingLeft:'30px'}}>
                        <div style={{position:'absolute', left:'14px', top:'8px', bottom:'8px', width:'2px', background:'linear-gradient(180deg, var(--primary), rgba(168,85,247,0.3))', borderRadius:'2px'}}></div>
                        {safeArray(result.data.schedule).map((item, idx) => (
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

                  {/* Enhanced visual medicine timeline — all modes */}
                  {safeArray(result.data.schedule).length > 0 && (
                    <MedicineTimeline schedule={result.data.schedule} />
                  )}

                  {/* Print button — visible for both modes */}
                  

                  <div className="glass-card" style={{marginBottom: '1.5rem'}}>
                    <h2 className="card-title"><CheckCircle2 size={20} style={{color: 'var(--success)'}}/> {t.clinical_summary}</h2>
                    <p style={{lineHeight: '1.6', color: 'var(--text-muted)', fontSize: explanationLevel === 'simple' ? '1.25rem' : '1rem', fontWeight: explanationLevel === 'simple' ? 500 : 400}}>{result.summary}</p>
                    
                    {/* Premium Audio Player */}
                    {audioUrl && (
                      <div className="premium-audio-player" style={{ marginTop: '20px', padding: '15px', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.06))', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Volume2 size={18} color="var(--primary)" /> 🎧 {t.audio_guide || "Patient Voice Playback"}
                          </p>
                          <select 
                            className="input-field" 
                            style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto', background: 'var(--card-bg)' }}
                            onChange={(e) => {
                              if (audioRef.current && audioRef.current.audio.current) {
                                audioRef.current.audio.current.playbackRate = parseFloat(e.target.value);
                              }
                            }}
                          >
                            <option value="1">{t.speed || 'Speed'}: 1x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2">2x</option>
                          </select>
                        </div>
                        <AudioPlayer
                          ref={audioRef}
                          autoPlay={false}
                          src={audioUrl}
                          showJumpControls={false}
                          customAdditionalControls={[]}
                          customVolumeControls={[]}
                          style={{ boxShadow: 'none', background: 'transparent' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Pharmacist Consultation Prompt */}
                  <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '4px solid #3b82f6' }}>
                    <h4 style={{ fontSize: '0.85rem', color: '#3b82f6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                      <Stethoscope size={16} /> {t.pharmacist_consultation || "Pharmacist Consultation Recommended"}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                      {t.pharmacist_desc || "Always consult a certified pharmacist or your primary doctor before changing any medication routines based on these results."}
                    </p>
                  </div>

                  {/* Export & Sharing Suite */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '25px' }} className="hide-on-print">
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                      <button className="btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--primary)' }} onClick={() => downloadPDF()}>
                        <Download size={16} /> {t.pdf_report}
                      </button>
                      <button className="btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25D366', borderColor: '#25D366' }} onClick={() => window.open(getWhatsAppShareLink(), '_blank')}>
                        <Share2 size={16} /> {t.share_whatsapp}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                      <button className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => window.print()}>
                        <Printer size={16} /> {t.print_instructions}
                      </button>
                      <button className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => setShowChat(true)}>
                        <MessageCircle size={16} /> {t.chat_assistant || "Chat Assistant"}
                      </button>
                    </div>
                  </div>
                  
                  {userMode === 'patient' && (
                    <ComprehensionCheck t={t} onReview={() => {
                      setShowChat(true);
                      setExplanationLevel('simple');
                      const question = language === 'Hindi' 
                        ? "मुझे यह समझ नहीं आया कि यह दवा कब लेनी है। कृपया बहुत सरल शब्दों में फिर से समझाएं।"
                        : "I didn't understand when to take this medicine. Please explain it to me very simply.";
                      setChatMessage(question);
                      setTimeout(() => handleChatSend(question), 500);
                    }} />
                  )}
                  
                </motion.div>
                
              ) : error ? (
                <div className="glass-card" style={{textAlign:'center', padding:'4rem', borderColor: 'var(--danger)'}}>
                  <AlertTriangle size={48} style={{margin:'0 auto 1rem', color: 'var(--danger)'}} />
                  <p style={{color: 'var(--danger)', fontWeight: 600}}>{typeof error === 'string' ? error : JSON.stringify(error)}</p>
                  <p style={{fontSize: '0.85rem', marginTop: '1rem'}}>Check your internet or wait for the quota to reset.</p>
                </div>
              ) : (
                <div className="glass-card" style={{textAlign:'center', opacity:0.5, padding:'4rem'}}>
                  <Activity size={48} style={{margin:'0 auto 1rem'}} />
                  <p>{t.awaiting_scan || 'Awaiting scan results...'}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div key="history" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <div className="glass-card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                <h2 className="card-title" style={{margin: 0}}><History size={20} /> Past Scans</h2>
                <select 
                  className="select-input" 
                  style={{width: 'auto', padding: '0.4rem', fontSize: '14px'}}
                  value={historySortOrder} 
                  onChange={(e) => setHistorySortOrder(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
              <div className="history-list">
                {[...safeArray(history)].sort((a, b) => {
                  const dateA = new Date(a.date).getTime();
                  const dateB = new Date(b.date).getTime();
                  if (isNaN(dateA) || isNaN(dateB)) return historySortOrder === 'newest' ? -1 : 1;
                  return historySortOrder === 'newest' ? dateB - dateA : dateA - dateB;
                }).map((item, idx) => (
                  <div key={idx} className="history-item" style={{cursor: 'pointer'}} onClick={() => { 
                      let scanData = item.data;
                      if (!scanData) {
                        scanData = {
                          data: {
                            drug: item.drug_name || 'Unknown',
                            drugs_list: [item.drug_name || 'Unknown'],
                            dosage: item.dosage || 'Unknown',
                            frequency: 'N/A',
                            duration: 'N/A',
                            instructions: 'Historical scan. Full data was not retained.',
                            safety_alerts: [],
                            side_effects: []
                          }
                        };
                      }
                      setResult(scanData); 
                      setActiveTab('scanner'); 
                    }}>
                    <div className="history-info">
                      <h4>{item.drug_name}</h4>
                      <p>{item.date} • {item.dosage}</p>
                    </div>
                    <div style={{display:'flex', gap:'8px'}}>
                      <button className="btn btn-secondary" style={{padding:'0.5rem'}} onClick={(e) => { 
                        e.stopPropagation(); 
                        let scanData = item.data ? item.data.data : {
                          drug: item.drug_name || 'Unknown',
                          drugs_list: [item.drug_name || 'Unknown'],
                          dosage: item.dosage || 'Unknown',
                          frequency: 'N/A',
                          duration: 'N/A',
                          instructions: 'Historical scan. Full data was not retained.',
                          safety_alerts: [],
                          side_effects: []
                        };
                        downloadPDF(scanData);
                      }}><Download size={16}/></button>
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
                  {safeArray(history).reduce((sum, h) => sum + (h.safety_alert_count || 0), 0)}
                </div>
                <div className="stat-label">Safety Alerts</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{background:'rgba(34, 197, 94, 0.1)', color:'var(--success)'}}><Calendar size={24}/></div>
                <div className="stat-value">
                  {avgDurationDays(history)}
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
                <div className="stat-label">{t.active_reminders}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{background:'rgba(34,197,94,0.1)',color:'var(--success)'}}><Check size={24}/></div>
                <div className="stat-value" style={{color:'var(--success)'}}>{adherenceLog.filter(l => l.taken).length}</div>
                <div className="stat-label">{t.doses_taken}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{background:'rgba(239,68,68,0.1)',color:'var(--danger)'}}><X size={24}/></div>
                <div className="stat-value" style={{color:'var(--danger)'}}>{adherenceLog.filter(l => !l.taken).length}</div>
                <div className="stat-label">{t.doses_missed}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{background:'rgba(245,158,11,0.1)',color:'var(--warning)'}}><Target size={24}/></div>
                <div className="stat-value">{adherenceLog.length > 0 ? Math.round((adherenceLog.filter(l => l.taken).length / adherenceLog.length) * 100) : 0}%</div>
                <div className="stat-label">{t.adherence_score}</div>
              </div>
            </div>

            <div className="glass-card" style={{marginBottom:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
                <h2 className="card-title" style={{margin:0}}><BellRing size={20}/> {t.med_reminders}</h2>
                <button className="btn btn-secondary" style={{padding:'6px 14px',fontSize:'0.8rem'}} onClick={() => {setReminders([]); localStorage.removeItem('rxlens_reminders');}}>{t.clear_all}</button>
              </div>
              {reminders.length === 0 ? (
                <div style={{textAlign:'center',padding:'3rem',opacity:0.5}}>
                  <Bell size={48} style={{margin:'0 auto 1rem'}}/>
                  <p>{t.scan_to_generate}</p>
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
                          onClick={() => {const e={id:Date.now(),reminderId:rem.id,taken:true,timestamp:new Date().toISOString(),drug:rem.drug}; setAdherenceLog(p=>{const u=[...p,e];localStorage.setItem('rxlens_adherence_log',JSON.stringify(u));return u;});}}><Check size={14}/> {t.taken}</button>
                        <button className="btn btn-secondary" style={{padding:'6px 12px',fontSize:'0.75rem',color:'var(--danger)',borderColor:'var(--danger)'}}
                          onClick={() => {const e={id:Date.now(),reminderId:rem.id,taken:false,timestamp:new Date().toISOString(),drug:rem.drug}; setAdherenceLog(p=>{const u=[...p,e];localStorage.setItem('rxlens_adherence_log',JSON.stringify(u));return u;});}}><X size={14}/> {t.missed}</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card" style={{marginBottom:'20px'}}>
              <h2 className="card-title"><Activity size={20}/> {t.dose_history || "Dose History"}</h2>
              {adherenceLog.length === 0 ? (
                <p style={{textAlign:'center',padding:'2rem',opacity:0.5}}>{t.no_doses || "No doses recorded today."}</p>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'8px',maxHeight:'300px',overflowY:'auto'}}>
                  {[...adherenceLog].reverse().slice(0,20).map((log) => (
                    <div key={log.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 16px',
                      background:log.taken?'rgba(34,197,94,0.06)':'rgba(239,68,68,0.06)',
                      border:`1px solid ${log.taken?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)'}`,
                      borderRadius:'10px',fontSize:'0.85rem'}}>
                      {log.taken ? <CheckCircle2 size={16} color="var(--success)"/> : <AlertTriangle size={16} color="var(--danger)"/>}
                      <span style={{flex:1,fontWeight:500}}>{log.drug}</span>
                      <span style={{color:log.taken?'var(--success)':'var(--danger)',fontWeight:600,fontSize:'0.8rem'}}>{log.taken?t.taken_caps:t.missed_caps}</span>
                      <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card">
              <h2 className="card-title"><Share2 size={20}/> {t.caregiver_notif || "Caregiver Notifications"}</h2>
              <p style={{fontSize:'0.9rem',color:'var(--text-muted)',marginBottom:'15px'}}>{t.share_report || "Share adherence report with doctor or family"}</p>
              <button className="btn" style={{display:'flex',alignItems:'center',gap:'8px'}} onClick={() => {
                const sc=adherenceLog.length>0?Math.round((adherenceLog.filter(l=>l.taken).length/adherenceLog.length)*100):0;
                const msg=`${t.share_title} for ${patientProfile.name||(language === 'Hindi' ? 'रोगी' : 'Patient')}:
${t.share_msg_score}: ${sc}%
${t.share_msg_taken}: ${adherenceLog.filter(l=>l.taken).length}
${t.share_msg_missed}: ${adherenceLog.filter(l=>!l.taken).length}
${t.share_msg_gen}: ${new Date().toLocaleString()}`;
                if(navigator.share){navigator.share({title:t.share_title,text:msg});}
                else{navigator.clipboard.writeText(msg);alert(language === 'Hindi' ? 'रिपोर्ट क्लिपबोर्ड पर कॉपी की गई!' : 'Report copied to clipboard!');}
              }}><Share2 size={16}/> {t.share_btn || "Share Report"}</button>
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
              {safeArray(chatHistory).map((msg, i) => (
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
      </div>
    </div>
  );
}


const ComprehensionCheck = ({ t, onReview }) => {
  const [status, setStatus] = React.useState(null);
  
  if (status === 'yes') {
    return (
      <div className="glass-card" style={{ marginTop: '2rem', textAlign: 'center', padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
        <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 10px' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#059669', margin: 0 }}>
          {t.comprehension_yes_msg || "Great! You understand when and how to take this medication."}
        </h3>
      </div>
    );
  }

  return (
    <div className="glass-card hide-on-print" style={{ marginTop: '2rem', textAlign: 'center', padding: '2rem', background: 'linear-gradient(to bottom, var(--card-bg), rgba(99, 102, 241, 0.05))' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem' }}>
        🧠 {t.comprehension_title || "Did you understand when to take this medicine?"}
      </h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="btn" style={{ padding: '0.75rem 2.5rem', background: '#10b981' }} onClick={() => setStatus('yes')}>
          👍 {t.yes_understood || "Yes"}
        </button>
        <button className="btn btn-secondary" style={{ padding: '0.75rem 2.5rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => {
          setStatus('no');
          onReview();
        }}>
          👎 {t.no_review_again || "No, let's review again"}
        </button>
      </div>
    </div>
  );
};

export default App;

