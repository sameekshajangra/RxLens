import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import { FlaskConical, Database, Layers, ClipboardList, AlertTriangle, Zap } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
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

const SYSTEMS = [
  { key: 'RxLens',  color: '#6366f1', label: 'RxLens' },
  { key: 'August',  color: '#3b82f6', label: 'August AI' },
  { key: 'GPT',     color: '#93c5fd', label: 'GPT-5.5' },
  { key: 'Gemini',  color: '#bfdbfe', label: 'Gemini' },
];

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'charts',   label: 'Charts',           icon: <FlaskConical size={15} /> },
  { id: 'dataset',  label: 'Dataset',          icon: <Database size={15} /> },
  { id: 'systems',  label: 'Systems Compared', icon: <Layers size={15} /> },
  { id: 'rubric',   label: 'Scoring Rubric',   icon: <ClipboardList size={15} /> },
  { id: 'limits',   label: 'Limitations',      icon: <AlertTriangle size={15} /> },
  { id: 'headline', label: 'Headline Finding', icon: <Zap size={15} /> },
];

// ── Chart sub-tabs ────────────────────────────────────────────────────────────
const CHART_TABS = [
  { id: 'field',    label: 'Accuracy by Field' },
  { id: 'overall',  label: 'Overall Score' },
  { id: 'failures', label: 'Critical Failures' },
];

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

export default function Benchmarks() {
  const [activeTab, setActiveTab] = useState('charts');
  const [activeChart, setActiveChart] = useState('field');

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
    color: color,
    fontWeight: 700,
    fontSize: '0.78rem',
    marginRight: 6,
    marginBottom: 4,
  });

  return (
    <div style={{ marginTop: '2.5rem' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
          <FlaskConical size={22} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>Benchmarks</h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>N=20 · Pilot evaluation vs. August AI, GPT-5.5 & Gemini (direct)</p>
        </div>
      </div>

      {/* Main tab bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 600,
              background: activeTab === tab.id ? 'var(--primary)' : 'rgba(99,102,241,0.08)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.18s',
            }}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

          {/* ── CHARTS ── */}
          {activeTab === 'charts' && (
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
                {CHART_TABS.map(ct => (
                  <button key={ct.id} onClick={() => setActiveChart(ct.id)}
                    style={{
                      padding: '5px 14px', borderRadius: 16, border: '1px solid var(--border)', cursor: 'pointer',
                      fontSize: '0.8rem', fontWeight: 600,
                      background: activeChart === ct.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                      color: activeChart === ct.id ? 'var(--primary)' : 'var(--text-muted)',
                    }}
                  >{ct.label}</button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeChart} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  {/* Accuracy by Field */}
                  {activeChart === 'field' && (
                    <div style={cardStyle}>
                      <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>
                        Extraction Accuracy by Field <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(avg score / prescription, max 2)</span>
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={FIELD_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="field" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                          <YAxis domain={[0, 2]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                          {SYSTEMS.map(s => (
                            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Overall Score */}
                  {activeChart === 'overall' && (
                    <div style={cardStyle}>
                      <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>
                        Overall Performance: Total Score <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(avg, max 8)</span>
                      </h4>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={OVERALL_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="system" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                          <YAxis domain={[0, 8]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="score" name="Avg Total Score" radius={[6, 6, 0, 0]}>
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

                  {/* Critical Failures */}
                  {activeChart === 'failures' && (
                    <div style={cardStyle}>
                      <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>
                        Critical Failures <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(total over N=20)</span>
                      </h4>
                      <ResponsiveContainer width="100%" height={230}>
                        <BarChart data={FAIL_DATA} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                          <YAxis type="category" dataKey="system" width={80} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="failures" name="Critical Failures" radius={[0, 6, 6, 0]}>
                            {FAIL_DATA.map((entry, i) => (
                              <Cell key={i} fill={entry.failures > 0 ? '#ef4444' : '#10b981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '8px 0 0' }}>
                        🟢 RxLens, GPT-5.5, Gemini: 0 critical failures &nbsp;|&nbsp; 🔴 August AI: 3 critical failures
                      </p>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* ── DATASET ── */}
          {activeTab === 'dataset' && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <Database size={20} color="var(--primary)" />
                <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>Dataset</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: '1.25rem' }}>
                {[
                  { label: 'Prescriptions', value: 'N = 20' },
                  { label: 'Type', value: 'Real / Anonymized' },
                  { label: 'Language', value: 'Hindi + English' },
                  { label: 'Region', value: 'North India' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{s.value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
                20 real, anonymized Indian handwritten prescriptions collected from the author's personal network with verbal informed consent.
                All patient-identifying information — names, ages, phone numbers, addresses, doctor IDs, and clinic stamps — was redacted before analysis.
              </p>
            </div>
          )}

          {/* ── SYSTEMS COMPARED ── */}
          {activeTab === 'systems' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { name: 'RxLens (this work)', color: '#6366f1', desc: 'Hybrid VLM + deterministic safety layer + source-attributed clinical content. Built specifically for Indian handwritten prescriptions.' },
                { name: 'August AI', color: '#3b82f6', desc: 'Commercial consumer health AI (B2C chatbot, WhatsApp + mobile). Tested via screenshots.' },
                { name: 'GPT-5.5', color: '#f59e0b', desc: 'OpenAI frontier vision-language model — raw output, no dedicated safety layer applied.' },
                { name: 'Gemini (direct)', color: '#10b981', desc: 'Google\'s frontier VLM — same underlying model RxLens uses internally, but without the RxLens orchestration layer.' },
              ].map((s, i) => (
                <div key={i} style={{ ...cardStyle, marginBottom: 0, borderLeft: `4px solid ${s.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={badgeStyle(s.color)}>{i + 1}</span>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{s.name}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── SCORING RUBRIC ── */}
          {activeTab === 'rubric' && (
            <div style={cardStyle}>
              <h4 style={{ margin: '0 0 1rem', fontWeight: 700, color: 'var(--text-main)' }}>Scoring Rubric</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>Each system was scored on 5 dimensions per prescription:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { dim: 'Drug Name Accuracy', scores: '0 = wrong/missing · 1 = partial · 2 = all correct' },
                  { dim: 'Dose Extracted',     scores: '0 = absent · 1 = partial · 2 = complete & correct' },
                  { dim: 'Frequency Extracted',scores: '0 = absent · 1 = partial · 2 = complete & correct' },
                  { dim: 'Duration Extracted', scores: '0 = absent · 1 = partial · 2 = complete & correct' },
                  { dim: 'Critical Failure',   scores: '1 = hallucinated / refused / dangerous error · 0 = none', danger: true },
                ].map((r, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: r.danger ? 'rgba(239,68,68,0.05)' : 'rgba(99,102,241,0.05)', border: `1px solid ${r.danger ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.12)'}` }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: r.danger ? 'var(--danger)' : 'var(--primary)', marginBottom: 2 }}>{r.dim}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.scores}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem', padding: '12px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <strong>Total Score</strong> = (Drug + Dose + Freq + Duration) − (2 × CritFail) &nbsp;|&nbsp; <strong>Max = 8</strong>
              </div>
            </div>
          )}

          {/* ── LIMITATIONS ── */}
          {activeTab === 'limits' && (
            <div style={cardStyle}>
              <h4 style={{ margin: '0 0 1rem', fontWeight: 700, color: 'var(--text-main)' }}>Limitations</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { text: 'Small N (20). Adequate for arXiv preprint and scholarship applications; synthetic extension planned for journal version.' },
                  { text: 'Single annotator (the author). Inter-rater agreement not yet computed.' },
                  { text: 'Per-field scoring is coarse-grained. Fine-grained edit-distance analysis is planned.' },
                  { text: 'August AI was tested via screenshots (no API). Some output may have been truncated.' },
                  { text: 'Prescriptions are from one geographic region (North India). Generalisability across regions not yet established.' },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <span style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }}>⚠️</span>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{l.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── HEADLINE FINDING ── */}
          {activeTab === 'headline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ ...cardStyle, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Zap size={18} color="#ef4444" />
                  <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--danger)', fontSize: '1rem' }}>Critical Drug-Class Substitution (Prescription #8)</h4>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Patient', val: '85-year-old male' },
                    { label: 'Conditions', val: 'Bladder stones, BPH, UTI' },
                  ].map(b => (
                    <span key={b.label} style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
                      {b.label}: {b.val}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr', marginBottom: '1rem' }}>
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>AUGUST AI OUTPUT</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Rovex</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Rosuvastatin (cholesterol statin)</div>
                  </div>
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 700, marginBottom: 4 }}>ACTUAL PRESCRIPTION</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Rovcef</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Cefpodoxime (cephalosporin antibiotic)</div>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  Both are real, marketed drugs — not hallucinations. A patient searching "Rovex" online would find valid pharmacological information for an entirely wrong drug class with no error signal.
                </p>
              </div>

              <div style={{ ...cardStyle, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.1rem' }}>✅</span>
                  <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>RxLens Response on Same Prescription</h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  Correctly identified both <strong style={{ color: 'var(--text-main)' }}>Tamsulosin</strong> and <strong style={{ color: 'var(--text-main)' }}>Cefpodoxime</strong> with calibrated per-field confidence, and flagged the lowest-confidence field (duration, 60%) for pharmacist review. This is the central safety-engineering claim of the work.
                </p>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
