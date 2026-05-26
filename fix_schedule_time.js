const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Replace item.time.toLowerCase().includes('morning')
// with (item.time || '').toLowerCase().includes('morning')

content = content.replace(
  "item.time.toLowerCase().includes('morning')",
  "(item.time || '').toLowerCase().includes('morning')"
);

content = content.replace(
  "item.time.toLowerCase().includes('night')",
  "(item.time || '').toLowerCase().includes('night')"
);

fs.writeFileSync('frontend/src/App.jsx', content);
