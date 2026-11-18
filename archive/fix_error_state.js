const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Replace <p style={{color: 'var(--danger)', fontWeight: 600}}>{error}</p>
// with <p style={{color: 'var(--danger)', fontWeight: 600}}>{typeof error === 'string' ? error : JSON.stringify(error)}</p>

content = content.replace(
  "<p style={{color: 'var(--danger)', fontWeight: 600}}>{error}</p>",
  "<p style={{color: 'var(--danger)', fontWeight: 600}}>{typeof error === 'string' ? error : JSON.stringify(error)}</p>"
);

fs.writeFileSync('frontend/src/App.jsx', content);
