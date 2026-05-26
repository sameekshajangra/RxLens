const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Fix missing translations for Adherence tab
app = app.replace('{t.dose_history}', '{t.dose_history || "Dose History"}');
app = app.replace('{t.no_doses}', '{t.no_doses || "No doses recorded today."}');
app = app.replace('{t.caregiver_notif}', '{t.caregiver_notif || "Caregiver Notifications"}');
app = app.replace('{t.share_report}', '{t.share_report || "Share adherence report with doctor or family"}');
app = app.replace('{t.share_btn}', '{t.share_btn || "Share Report"}');

// 2. Fix the history download button
const oldBtn = 'onClick={() => downloadPDF(item)}';
const newBtn = 'onClick={(e) => { e.stopPropagation(); setResult({ data: item.data }); setActiveTab(\\\'scanner\\\'); setTimeout(() => downloadPDF(), 500); }}';
app = app.replace(oldBtn, newBtn.replace(/\\'/g, "'"));

// 3. Ensure 'lang' is sent to backend for analysis
const oldAppend = "formData.append('explanation_level', explanationLevel);";
const newAppend = "formData.append('explanation_level', explanationLevel);\n    formData.append('lang', language);";
app = app.replace(oldAppend, newAppend);

fs.writeFileSync('frontend/src/App.jsx', app);
console.log("Bugs fixed in App.jsx");
