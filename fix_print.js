const fs = require('fs');
let appContent = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const printHTML = `<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                    <button className="print-btn" onClick={() => window.print()} title="Print this report">
                      <Printer size={16} /> {t.print_report}
                    </button>
                  </div>`;
appContent = appContent.replace(printHTML, '');
fs.writeFileSync('frontend/src/App.jsx', appContent);
console.log("Removed print btn");
