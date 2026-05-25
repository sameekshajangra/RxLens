const fs = require('fs');

// 1. Fix ExplanationLevelSelector.jsx
let expContent = fs.readFileSync('src/components/ExplanationLevelSelector.jsx', 'utf8');
expContent = expContent.replace(
  'export default function ExplanationLevelSelector({ value, onChange }) {',
  'export default function ExplanationLevelSelector({ value, onChange, t = {} }) {'
);
fs.writeFileSync('src/components/ExplanationLevelSelector.jsx', expContent);

// 2. Fix App.jsx
let appContent = fs.readFileSync('src/App.jsx', 'utf8');

// Pass t to ExplanationLevelSelector
appContent = appContent.replace(
  '<ExplanationLevelSelector\n                     value={explanationLevel}\n                     onChange={setExplanationLevel}\n                   />',
  '<ExplanationLevelSelector\n                     value={explanationLevel}\n                     onChange={setExplanationLevel}\n                     t={t}\n                   />'
);

// Pass t to UploadCard
appContent = appContent.replace(
  '<UploadCard retryCountdown={retryCountdown} />',
  '<UploadCard retryCountdown={retryCountdown} t={t} />'
);

fs.writeFileSync('src/App.jsx', appContent);

console.log("Fixed ExplanationLevelSelector and UploadCard props");
