import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import { FlaskConical, Database, Layers, ClipboardList, AlertTriangle, Zap } from 'lucide-react';

// ── Chart Data (same regardless of language) ──────────────────────────────────
const FIELD_DATA = [
  { field: 'Drug Name', RxLens: 1.90, August: 1.25, GPT: 1.30, Gemini: 1.75 },
  { field: 'Dose',      RxLens: 1.65, August: 0.00, GPT: 0.95, Gemini: 0.75 },
  { field: 'Frequency', RxLens: 1.70, August: 0.60, GPT: 0.85, Gemini: 1.60 },
  { field: 'Duration',  RxLens: 1.50, August: 0.10, GPT: 0.75, Gemini: 1.15 },
];

const OVERALL_DATA = [
  { system: 'RxLens',    score: 6.75, color: '#6366f1' },
  { system: 'August AI', score: 1.65, color: '#ef4444' },
  { system: 'GPT-5.5',  score: 3.85, color: '#f59e0b' },
  { system: 'Gemini',   score: 5.25, color: '#10b981' },
];

const FAIL_DATA = [
  { system: 'RxLens',    failures: 0 },
  { system: 'August AI', failures: 3 },
  { system: 'GPT-5.5',  failures: 0 },
  { system: 'Gemini',   failures: 0 },
];

const SYSTEMS_COLOR = [
  { key: 'RxLens', color: '#6366f1', label: 'RxLens' },
  { key: 'August', color: '#3b82f6', label: 'August AI' },
  { key: 'GPT',    color: '#93c5fd', label: 'GPT-5.5' },
  { key: 'Gemini', color: '#bfdbfe', label: 'Gemini' },
];

// ── i18n strings ──────────────────────────────────────────────────────────────
const STRINGS = {
  English: {
    tabs: ['Charts', 'Dataset', 'Systems Compared', 'Scoring Rubric', 'Limitations', 'Headline Finding'],
    chartTabs: ['Accuracy by Field', 'Overall Score', 'Critical Failures'],
    chart1Title: 'Extraction Accuracy by Field',
    chart1Sub: '(avg score / prescription, max 2)',
    chart2Title: 'Overall Performance: Total Score',
    chart2Sub: '(avg, max 8)',
    chart3Title: 'Critical Failures',
    chart3Sub: '(total over N=20)',
    chart3Footer: '🟢 RxLens, GPT-5.5, Gemini: 0 critical failures  |  🔴 August AI: 3 critical failures',
    datasetTitle: 'Dataset',
    stats: [
      { label: 'Prescriptions', value: 'N = 20' },
      { label: 'Type', value: 'Real / Anonymized' },
      { label: 'Language', value: 'Hindi + English' },
      { label: 'Region', value: 'North India' },
    ],
    datasetDesc: "20 real, anonymized Indian handwritten prescriptions collected from the author's personal network with verbal informed consent. All patient-identifying information — names, ages, phone numbers, addresses, doctor IDs, and clinic stamps — was redacted before analysis.",
    systemsTitle: 'Systems Compared',
    systems: [
      { name: 'RxLens (this work)', desc: 'Hybrid VLM + deterministic safety layer + source-attributed clinical content. Built specifically for Indian handwritten prescriptions.' },
      { name: 'August AI',          desc: 'Commercial consumer health AI (B2C chatbot, WhatsApp + mobile). Tested via screenshots.' },
      { name: 'GPT-5.5',            desc: 'OpenAI frontier vision-language model — raw output, no dedicated safety layer applied.' },
      { name: 'Gemini (direct)',     desc: "Google's frontier VLM — same underlying model RxLens uses internally, but without the RxLens orchestration layer." },
    ],
    rubricTitle: 'Scoring Rubric',
    rubricIntro: 'Each system was scored on 5 dimensions per prescription:',
    rubric: [
      { dim: 'Drug Name Accuracy',  scores: '0 = wrong/missing · 1 = partial · 2 = all correct' },
      { dim: 'Dose Extracted',      scores: '0 = absent · 1 = partial · 2 = complete & correct' },
      { dim: 'Frequency Extracted', scores: '0 = absent · 1 = partial · 2 = complete & correct' },
      { dim: 'Duration Extracted',  scores: '0 = absent · 1 = partial · 2 = complete & correct' },
      { dim: 'Critical Failure',    scores: '1 = hallucinated / refused / dangerous error · 0 = none', danger: true },
    ],
    rubricFormula: 'Total Score = (Drug + Dose + Freq + Duration) − (2 × CritFail)',
    rubricMax: 'Max = 8',
    limitsTitle: 'Limitations',
    limits: [
      'Small N (20). Adequate for arXiv preprint and scholarship applications; synthetic extension planned for journal version.',
      'Single annotator (the author). Inter-rater agreement not yet computed.',
      'Per-field scoring is coarse-grained. Fine-grained edit-distance analysis is planned.',
      'August AI was tested via screenshots (no API). Some output may have been truncated.',
      'Prescriptions are from one geographic region (North India). Generalisability across regions not yet established.',
    ],
    headlineTitle: 'Critical Drug-Class Substitution (Prescription #8)',
    patient: 'Patient',
    patientVal: '85-year-old male',
    conditions: 'Conditions',
    conditionsVal: 'Bladder stones, BPH, UTI',
    augustLabel: 'AUGUST AI OUTPUT',
    actualLabel: 'ACTUAL PRESCRIPTION',
    augustDrug: 'Rovex',
    augustClass: 'Rosuvastatin (cholesterol statin)',
    actualDrug: 'Rovcef',
    actualClass: 'Cefpodoxime (cephalosporin antibiotic)',
    headlineBody: 'Both are real, marketed drugs — not hallucinations. A patient searching "Rovex" online would find valid pharmacological information for an entirely wrong drug class with no error signal.',
    rxlensTitle: 'RxLens Response on Same Prescription',
    rxlensBody: 'Correctly identified both Tamsulosin and Cefpodoxime with calibrated per-field confidence, and flagged the lowest-confidence field (duration, 60%) for pharmacist review. This is the central safety-engineering claim of the work.',
    fieldBarName: 'Avg Score',
    totalBarName: 'Avg Total Score',
    failBarName: 'Critical Failures',
  },
  Hindi: {
    tabs: ['चार्ट', 'डेटासेट', 'तुलना किए गए सिस्टम', 'स्कोरिंग रूब्रिक', 'सीमाएं', 'मुख्य निष्कर्ष'],
    chartTabs: ['क्षेत्र अनुसार सटीकता', 'कुल स्कोर', 'गंभीर विफलताएं'],
    chart1Title: 'क्षेत्र अनुसार निष्कर्षण सटीकता',
    chart1Sub: '(औसत स्कोर / नुस्खा, अधिकतम 2)',
    chart2Title: 'समग्र प्रदर्शन: कुल स्कोर',
    chart2Sub: '(औसत, अधिकतम 8)',
    chart3Title: 'गंभीर विफलताएं',
    chart3Sub: '(N=20 पर कुल)',
    chart3Footer: '🟢 RxLens, GPT-5.5, Gemini: 0 गंभीर विफलता  |  🔴 August AI: 3 गंभीर विफलताएं',
    datasetTitle: 'डेटासेट',
    stats: [
      { label: 'नुस्खे', value: 'N = 20' },
      { label: 'प्रकार', value: 'वास्तविक / गुमनाम' },
      { label: 'भाषा', value: 'हिंदी + अंग्रेज़ी' },
      { label: 'क्षेत्र', value: 'उत्तर भारत' },
    ],
    datasetDesc: 'मौखिक सूचित सहमति के साथ लेखक के व्यक्तिगत नेटवर्क से एकत्र किए गए 20 वास्तविक, गुमनाम भारतीय हस्तलिखित नुस्खे। विश्लेषण से पहले सभी रोगी-पहचान जानकारी — नाम, आयु, फ़ोन नंबर, पते, डॉक्टर आईडी और क्लिनिक स्टैम्प — को हटा दिया गया था।',
    systemsTitle: 'तुलना किए गए सिस्टम',
    systems: [
      { name: 'RxLens (यह कार्य)', desc: 'हाइब्रिड VLM + नियतात्मक सुरक्षा परत + स्रोत-आधारित नैदानिक सामग्री। विशेष रूप से भारतीय हस्तलिखित नुस्खों के लिए बनाया गया।' },
      { name: 'August AI',          desc: 'व्यावसायिक उपभोक्ता स्वास्थ्य AI (B2C चैटबॉट, WhatsApp + मोबाइल)। स्क्रीनशॉट के माध्यम से परीक्षण किया गया।' },
      { name: 'GPT-5.5',            desc: 'OpenAI फ्रंटियर विज़न-लैंग्वेज मॉडल — कच्चा आउटपुट, कोई समर्पित सुरक्षा परत लागू नहीं।' },
      { name: 'Gemini (सीधे)',      desc: 'Google का फ्रंटियर VLM — वही अंतर्निहित मॉडल जो RxLens आंतरिक रूप से उपयोग करता है, लेकिन RxLens ऑर्केस्ट्रेशन परत के बिना।' },
    ],
    rubricTitle: 'स्कोरिंग रूब्रिक',
    rubricIntro: 'प्रत्येक सिस्टम को प्रति नुस्खे 5 आयामों पर स्कोर किया गया:',
    rubric: [
      { dim: 'दवा नाम सटीकता',     scores: '0 = गलत/अनुपस्थित · 1 = आंशिक · 2 = सभी सही' },
      { dim: 'खुराक निष्कर्षण',    scores: '0 = अनुपस्थित · 1 = आंशिक · 2 = पूर्ण और सही' },
      { dim: 'आवृत्ति निष्कर्षण',  scores: '0 = अनुपस्थित · 1 = आंशिक · 2 = पूर्ण और सही' },
      { dim: 'अवधि निष्कर्षण',     scores: '0 = अनुपस्थित · 1 = आंशिक · 2 = पूर्ण और सही' },
      { dim: 'गंभीर विफलता',       scores: '1 = मतिभ्रम / अस्वीकार / खतरनाक त्रुटि · 0 = कोई नहीं', danger: true },
    ],
    rubricFormula: 'कुल स्कोर = (दवा + खुराक + आवृत्ति + अवधि) − (2 × गंभीर विफलता)',
    rubricMax: 'अधिकतम = 8',
    limitsTitle: 'सीमाएं',
    limits: [
      'छोटा N (20)। arXiv प्रीप्रिंट और छात्रवृत्ति आवेदनों के लिए पर्याप्त; जर्नल संस्करण के लिए कृत्रिम विस्तार की योजना है।',
      'एकल एनोटेटर (लेखक)। अंतर-रेटर समझौता अभी तक नहीं किया गया।',
      'प्रति-क्षेत्र स्कोरिंग मोटे अनाज वाली है। सूक्ष्म संपादन-दूरी विश्लेषण की योजना है।',
      'August AI का परीक्षण स्क्रीनशॉट (API नहीं) के माध्यम से किया गया। कुछ आउटपुट छोटा हो सकता था।',
      'नुस्खे एक भौगोलिक क्षेत्र (उत्तर भारत) से हैं। क्षेत्रों में सामान्यीकरण अभी तक स्थापित नहीं हुआ।',
    ],
    headlineTitle: 'गंभीर दवा-वर्ग प्रतिस्थापन (नुस्खा #8)',
    patient: 'मरीज',
    patientVal: '85 वर्षीय पुरुष',
    conditions: 'स्थितियां',
    conditionsVal: 'मूत्राशय की पथरी, BPH, UTI',
    augustLabel: 'AUGUST AI आउटपुट',
    actualLabel: 'वास्तविक नुस्खा',
    augustDrug: 'Rovex',
    augustClass: 'Rosuvastatin (कोलेस्ट्रॉल स्टैटिन)',
    actualDrug: 'Rovcef',
    actualClass: 'Cefpodoxime (सेफलोस्पोरिन एंटीबायोटिक)',
    headlineBody: 'दोनों वास्तविक, विपणन की गई दवाएं हैं — मतिभ्रम नहीं। "Rovex" खोजने वाले मरीज को एक पूरी तरह गलत दवा वर्ग की वैध जानकारी मिलेगी, बिना किसी त्रुटि संकेत के।',
    rxlensTitle: 'उसी नुस्खे पर RxLens की प्रतिक्रिया',
    rxlensBody: 'Tamsulosin और Cefpodoxime दोनों को कैलिब्रेटेड प्रति-क्षेत्र विश्वास के साथ सही ढंग से पहचाना, और सबसे कम-विश्वास वाले क्षेत्र (अवधि, 60%) को फार्मासिस्ट समीक्षा के लिए चिह्नित किया। यह कार्य का केंद्रीय सुरक्षा-इंजीनियरिंग दावा है।',
    fieldBarName: 'औसत स्कोर',
    totalBarName: 'औसत कुल स्कोर',
    failBarName: 'गंभीर विफलताएं',
  },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem' }}>
      <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--text-main)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function Benchmarks({ language = 'English' }) {
  const [activeTab, setActiveTab] = useState(0);
  const [activeChart, setActiveChart] = useState(0);

  const s = STRINGS[language] || STRINGS.English;

  const cardStyle = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '1.5rem',
    marginBottom: '1rem',
  };

  const badgeStyle = (color) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 20,
    background: color + '22',
    color,
    fontWeight: 700,
    fontSize: '0.78rem',
    marginRight: 6,
    marginBottom: 4,
  });

  const TAB_ICONS = [<FlaskConical size={15}/>, <Database size={15}/>, <Layers size={15}/>, <ClipboardList size={15}/>, <AlertTriangle size={15}/>, <Zap size={15}/>];

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {/* Main tab bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {s.tabs.map((label, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 600,
              background: activeTab === i ? 'var(--primary)' : 'rgba(99,102,241,0.08)',
              color: activeTab === i ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.18s',
            }}
          >{TAB_ICONS[i]}{label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

          {/* ── CHARTS ── */}
          {activeTab === 0 && (
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
                {s.chartTabs.map((label, i) => (
                  <button key={i} onClick={() => setActiveChart(i)}
                    style={{
                      padding: '5px 14px', borderRadius: 16, border: '1px solid var(--border)', cursor: 'pointer',
                      fontSize: '0.8rem', fontWeight: 600,
                      background: activeChart === i ? 'rgba(99,102,241,0.15)' : 'transparent',
                      color: activeChart === i ? 'var(--primary)' : 'var(--text-muted)',
                    }}
                  >{label}</button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeChart} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  {activeChart === 0 && (
                    <div style={cardStyle}>
                      <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>
                        {s.chart1Title} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{s.chart1Sub}</span>
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={FIELD_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="field" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                          <YAxis domain={[0, 2]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                          {SYSTEMS_COLOR.map(sc => (
                            <Bar key={sc.key} dataKey={sc.key} name={sc.label} fill={sc.color} radius={[4, 4, 0, 0]} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {activeChart === 1 && (
                    <div style={cardStyle}>
                      <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>
                        {s.chart2Title} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{s.chart2Sub}</span>
                      </h4>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={OVERALL_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="system" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                          <YAxis domain={[0, 8]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="score" name={s.totalBarName} radius={[6, 6, 0, 0]}>
                            {OVERALL_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                        {OVERALL_DATA.map(d => (
                          <span key={d.system} style={badgeStyle(d.color)}>{d.system}: {d.score}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeChart === 2 && (
                    <div style={cardStyle}>
                      <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>
                        {s.chart3Title} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{s.chart3Sub}</span>
                      </h4>
                      <ResponsiveContainer width="100%" height={230}>
                        <BarChart data={FAIL_DATA} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                          <YAxis type="category" dataKey="system" width={80} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="failures" name={s.failBarName} radius={[0, 6, 6, 0]}>
                            {FAIL_DATA.map((entry, i) => (
                              <Cell key={i} fill={entry.failures > 0 ? '#ef4444' : '#10b981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '8px 0 0' }}>{s.chart3Footer}</p>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* ── DATASET ── */}
          {activeTab === 1 && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <Database size={20} color="var(--primary)" />
                <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>{s.datasetTitle}</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: '1.25rem' }}>
                {s.stats.map(stat => (
                  <div key={stat.label} style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{s.datasetDesc}</p>
            </div>
          )}

          {/* ── SYSTEMS COMPARED ── */}
          {activeTab === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4 style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--text-main)' }}>{s.systemsTitle}</h4>
              {s.systems.map((sys, i) => {
                const colors = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981'];
                return (
                  <div key={i} style={{ ...cardStyle, marginBottom: 0, borderLeft: `4px solid ${colors[i]}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={badgeStyle(colors[i])}>{i + 1}</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{sys.name}</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{sys.desc}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SCORING RUBRIC ── */}
          {activeTab === 3 && (
            <div style={cardStyle}>
              <h4 style={{ margin: '0 0 0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{s.rubricTitle}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>{s.rubricIntro}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.rubric.map((r, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: r.danger ? 'rgba(239,68,68,0.05)' : 'rgba(99,102,241,0.05)', border: `1px solid ${r.danger ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.12)'}` }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: r.danger ? 'var(--danger)' : 'var(--primary)', marginBottom: 2 }}>{r.dim}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.scores}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem', padding: '12px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <strong>{s.rubricFormula}</strong> &nbsp;|&nbsp; <strong>{s.rubricMax}</strong>
              </div>
            </div>
          )}

          {/* ── LIMITATIONS ── */}
          {activeTab === 4 && (
            <div style={cardStyle}>
              <h4 style={{ margin: '0 0 1rem', fontWeight: 700, color: 'var(--text-main)' }}>{s.limitsTitle}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.limits.map((l, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <span style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }}>⚠️</span>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── HEADLINE FINDING ── */}
          {activeTab === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ ...cardStyle, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Zap size={18} color="#ef4444" />
                  <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--danger)', fontSize: '1rem' }}>{s.headlineTitle}</h4>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {[
                    { label: s.patient, val: s.patientVal },
                    { label: s.conditions, val: s.conditionsVal },
                  ].map(b => (
                    <span key={b.label} style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
                      {b.label}: {b.val}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr', marginBottom: '1rem' }}>
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>{s.augustLabel}</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.augustDrug}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.augustClass}</div>
                  </div>
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 700, marginBottom: 4 }}>{s.actualLabel}</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.actualDrug}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.actualClass}</div>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{s.headlineBody}</p>
              </div>

              <div style={{ ...cardStyle, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.1rem' }}>✅</span>
                  <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>{s.rxlensTitle}</h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{s.rxlensBody}</p>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
