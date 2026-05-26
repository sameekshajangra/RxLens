const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

content = content.replace(
  "localStorage.setItem('rxlens_history', JSON.stringify(updated));",
  "try { localStorage.setItem('rxlens_history', JSON.stringify(updated)); } catch (e) { console.error('Storage full', e); }"
);

content = content.replace(
  "localStorage.setItem('rxlens_reminders', JSON.stringify(updated));",
  "try { localStorage.setItem('rxlens_reminders', JSON.stringify(updated)); } catch (e) { console.error('Storage full', e); }"
);

fs.writeFileSync('frontend/src/App.jsx', content);
