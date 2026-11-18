const fs = require('fs');

// 1. Update ExplanationLevelSelector.jsx
let content = fs.readFileSync('frontend/src/components/ExplanationLevelSelector.jsx', 'utf8');

// Replace "Explanation Level" with {t.explanation_level || 'Explanation Level'}
// Wait, ExplanationLevelSelector needs access to `t` or `language` state!
// It currently has: export default function ExplanationLevelSelector({ explanationLevel, setExplanationLevel, disabled })
// I will need to pass `language` and `i18n` to it, or pass `t`. Let's pass `t`!
content = content.replace(
  'export default function ExplanationLevelSelector({ explanationLevel, setExplanationLevel, disabled }) {',
  'export default function ExplanationLevelSelector({ explanationLevel, setExplanationLevel, disabled, t = {} }) {'
);
content = content.replace(
  '<label style={{ fontWeight: 600, marginBottom: \'0.5rem\', display: \'block\' }}>Explanation Level</label>',
  '<label style={{ fontWeight: 600, marginBottom: \'0.5rem\', display: \'block\' }}>{t.explanation_level || "Explanation Level"}</label>'
);
content = content.replace('Simple', '{t.mode_simple || "Simple"}');
content = content.replace('Standard', '{t.mode_standard || "Standard"}');
content = content.replace('Detailed', '{t.mode_detailed || "Detailed"}');

fs.writeFileSync('frontend/src/components/ExplanationLevelSelector.jsx', content);

// 2. Update App.jsx to pass `t` to ExplanationLevelSelector
let appContent = fs.readFileSync('frontend/src/App.jsx', 'utf8');

appContent = appContent.replace(
  '<ExplanationLevelSelector explanationLevel={explanationLevel} setExplanationLevel={setExplanationLevel} disabled={loading} />',
  '<ExplanationLevelSelector explanationLevel={explanationLevel} setExplanationLevel={setExplanationLevel} disabled={loading} t={t} />'
);

// Update "Patient Mode" / "Healthcare Worker" labels in App.jsx
appContent = appContent.replace(
  'Patient Mode',
  '{t.mode_patient || "Patient Mode"}'
);
appContent = appContent.replace(
  'Healthcare Worker',
  '{t.mode_worker || "Healthcare Worker"}'
);

// Update Language dropdown to only have English and Hindi
appContent = appContent.replace(
  '<option value="Spanish">Spanish</option>',
  ''
);

// Fix Chat Assistant Button text
appContent = appContent.replace(
  '{chatOpen ? \'Close Chat\' : \'Chat Assistant\'}',
  '{chatOpen ? "✕" : (t.chat_assistant || "Chat Assistant")}'
);

fs.writeFileSync('frontend/src/App.jsx', appContent);
console.log("Updated App.jsx and ExplanationLevelSelector.jsx");
