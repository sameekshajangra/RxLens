const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Fix avgDurationDays
const oldAvg = `const avgDurationDays = (historyArr) => {
  const nums = safeArray(historyArr).flatMap(h => {
    const raw = typeof h.duration === 'string' ? h.duration : String(h.duration || '');
    const m = raw.match(/[0-9]+/);
    return m ? [parseInt(m[0], 10)] : [];
  }).filter(n => n > 0);
  if (!nums.length) return '\\u2014';
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
};`;

const newAvg = `const avgDurationDays = (historyArr) => {
  const nums = safeArray(historyArr).flatMap(h => {
    const durStr = h.duration || (h.data && h.data.data && h.data.data.duration) || '';
    const raw = typeof durStr === 'string' ? durStr : String(durStr);
    const m = raw.match(/[0-9]+/);
    return m ? [parseInt(m[0], 10)] : [];
  }).filter(n => n > 0);
  if (!nums.length) return '\\u2014';
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
};`;

app = app.replace(oldAvg, newAvg);

// 2. Fix getDrugFrequencyData
const oldFreq = `  const getDrugFrequencyData = () => {
    const counts = {};
    if (!Array.isArray(history)) return [];
    history.forEach(item => {
      if (!item || !item.drug_name) return;
      const drugs = item.drug_name.split(',');
      drugs.forEach(d => {
        const name = d.trim();
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };`;

const newFreq = `  const getDrugFrequencyData = () => {
    const counts = {};
    if (!Array.isArray(history)) return [];
    history.forEach(item => {
      if (!item) return;
      // Prefer clean drugs_list from detailed data if available
      let drugs = [];
      if (item.data && item.data.data && item.data.data.drugs_list && item.data.data.drugs_list.length > 0) {
        drugs = item.data.data.drugs_list;
      } else if (item.drug_name) {
        drugs = item.drug_name.split(',');
      }
      
      drugs.forEach(d => {
        // Normalize names so variations like "Dolo" and "dolo 650" might group better if they share the first word
        let name = String(d).trim().toLowerCase();
        // Capitalize first letter
        name = name.charAt(0).toUpperCase() + name.slice(1);
        if (name) {
          counts[name] = (counts[name] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.length > 15 ? name.substring(0, 15) + '...' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };`;

app = app.replace(oldFreq, newFreq);

// 3. Ensure Y-axis scales properly by explicitly setting allowDecimals={false} on YAxis
app = app.replace(
  `<YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />`,
  `<YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} allowDecimals={false} />`
);

fs.writeFileSync('frontend/src/App.jsx', app);
console.log('Stats logic fixed');
