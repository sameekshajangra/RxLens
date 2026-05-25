import React from 'react';

export default function ExplanationLevelSelector({ value, onChange }) {
  return (
    <div className="explanation-level-selector glass-card" style={{ marginBottom: '1.5rem' }}>
      <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>{t.explanation_level || "Explanation Level"}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--card-bg)',
          color: 'var(--text)',
        }}
      >
        <option value="simple">{t.mode_simple || "Simple"} (low literacy / elderly)</option>
        <option value="standard">{t.mode_standard || "Standard"} (regular patients)</option>
        <option value="detailed">{t.mode_detailed || "Detailed"} (medically curious)</option>
      </select>
    </div>
  );
}
