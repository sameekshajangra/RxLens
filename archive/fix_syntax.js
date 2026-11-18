const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// The Structured Medication Table block starts with:
// {(userMode === 'worker' || explanationLevel !== 'simple') && (
// <div className="glass-card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>

// And ends with:
//                   </div>
//
//
//                    {safeArray(result.data.schedule).length > 0 && (

// Let's replace the end:
content = content.replace(
  '                  </div>\n\n\n                    {safeArray(result.data.schedule)',
  '                  </div>\n                  )}\n\n                    {safeArray(result.data.schedule)'
);

fs.writeFileSync('frontend/src/App.jsx', content);
