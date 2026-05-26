const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Add state variable
if (!app.includes('const [historySortOrder')) {
  app = app.replace(
    "const [history, setHistory] = useState([]);",
    "const [history, setHistory] = useState([]);\n  const [historySortOrder, setHistorySortOrder] = useState('newest');"
  );
}

// 2. Add header and select dropdown
const oldHeader = `<h2 className="card-title"><History size={20} /> Past Scans</h2>`;
const newHeader = `<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                <h2 className="card-title" style={{margin: 0}}><History size={20} /> Past Scans</h2>
                <select 
                  className="select-input" 
                  style={{width: 'auto', padding: '0.4rem', fontSize: '14px'}}
                  value={historySortOrder} 
                  onChange={(e) => setHistorySortOrder(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>`;
app = app.replace(oldHeader, newHeader);

// 3. Update the mapping logic
const oldMap = `{safeArray(history).map((item, idx) => (`;
const newMap = `{[...safeArray(history)].sort((a, b) => {
                  const dateA = new Date(a.date).getTime();
                  const dateB = new Date(b.date).getTime();
                  if (isNaN(dateA) || isNaN(dateB)) return historySortOrder === 'newest' ? -1 : 1;
                  return historySortOrder === 'newest' ? dateB - dateA : dateA - dateB;
                }).map((item, idx) => (`;
app = app.replace(oldMap, newMap);

fs.writeFileSync('frontend/src/App.jsx', app);
console.log('History sort logic added');
