import React from 'react';

const SLOT_CONFIG = [
  { label: 'Morning',   emoji: '🌅', color: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  textColor: '#d97706' },
  { label: 'Afternoon', emoji: '☀️',  color: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.3)',  textColor: 'var(--primary)' },
  { label: 'Evening',   emoji: '🌆', color: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.3)',   textColor: '#ef4444' },
  { label: 'Night',     emoji: '🌙', color: 'rgba(30,41,59,0.15)',    border: 'rgba(100,116,139,0.3)', textColor: 'var(--text-muted)' },
];

function guessSlot(time = '') {
  const lower = time.toLowerCase();
  if (lower.includes('am') || lower.includes('morning') || lower.includes('breakfast')) return 'Morning';
  if (lower.includes('afternoon') || lower.includes('lunch') || lower.includes('noon')) return 'Afternoon';
  if (lower.includes('evening') || lower.includes('dinner')) return 'Evening';
  if (lower.includes('pm') || lower.includes('night') || lower.includes('bedtime') || lower.includes('sleep')) return 'Night';
  // Hour-based guess
  const match = time.match(/(\d{1,2})/);
  if (match) {
    const hour = parseInt(match[1], 10);
    if (hour >= 6 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 20) return 'Evening';
    return 'Night';
  }
  return 'Morning';
}

export default function MedicineTimeline({ schedule }) {
  if (!Array.isArray(schedule) || schedule.length === 0) return null;

  // Group by slot
  const grouped = {};
  SLOT_CONFIG.forEach(s => { grouped[s.label] = []; });
  schedule.forEach(item => {
    if (!item) return;
    const isString = typeof item === 'string';
    const timeStr = isString ? item : (item.time || '');
    const slot = guessSlot(timeStr);
    grouped[slot].push(item);
  });

  return (
    <div className="glass-card" style={{ marginTop: '1.5rem' }}>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        🗓️ Medication Schedule
      </h3>
      <div className="medicine-timeline">
        {SLOT_CONFIG.map(slot => {
          const items = grouped[slot.label];
          if (!items || items.length === 0) return null;
          return (
            <div key={slot.label} className="timeline-slot">
              <div
                className="timeline-icon"
                style={{ background: slot.color, border: `1.5px solid ${slot.border}` }}
                title={slot.label}
              >
                {slot.emoji}
              </div>
              <div className="timeline-content">
                <div className="timeline-time" style={{ color: slot.textColor }}>{slot.label}</div>
                {items.map((item, idx) => {
                  if (!item) return null;
                  const isString = typeof item === 'string';
                  const timeText = isString ? '' : (item.time || '');
                  const taskText = isString ? item : (item.task || item.drug || 'Take medication');
                  return (
                    <div key={idx} className="timeline-task">
                      {timeText && <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginRight: 6 }}>{timeText}</span>}
                      {taskText}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
