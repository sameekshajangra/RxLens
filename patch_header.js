const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

app = app.replace(
  '<h1>🩺 RxLens <span>{t.header_title}</span></h1>',
  '<h1>🩺 RxLens <span style={{ whiteSpace: "nowrap" }}>{t.header_title}</span></h1>'
);

// Also add fallbacks for pharmacist
app = app.replace(
  '<Stethoscope size={16} /> {t.pharmacist_consultation}',
  '<Stethoscope size={16} /> {t.pharmacist_consultation || "Pharmacist Consultation Recommended"}'
);

app = app.replace(
  '{t.pharmacist_desc}',
  '{t.pharmacist_desc || "Always consult a certified pharmacist or your primary doctor before changing any medication routines based on these results."}'
);

fs.writeFileSync('frontend/src/App.jsx', app);
console.log("Header and fallbacks patched");
