const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Remove the inline ErrorBoundary class definition:
const ebStart = content.indexOf('// ─── ErrorBoundary');
const ebEnd = content.indexOf('// Helper to ensure a value is an array before mapping');
if (ebStart !== -1 && ebEnd !== -1) {
  content = content.substring(0, ebStart) + content.substring(ebEnd);
}

// Remove <ErrorBoundary> wraps
content = content.replace(/<ErrorBoundary>/g, '');
content = content.replace(/<\/ErrorBoundary>/g, '');

fs.writeFileSync('frontend/src/App.jsx', content);
