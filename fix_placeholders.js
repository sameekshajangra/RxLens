const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

app = app.replace('{t.full_name}', '{t.name || "Full Name"}');
app = app.replace('placeholder="e.g. John Doe"', 'placeholder={t.name_placeholder || "e.g. John Doe"}');
app = app.replace('placeholder="e.g. Penicillin, Peanuts"', 'placeholder={t.allergies_placeholder || "e.g. Penicillin, Peanuts"}');
app = app.replace('{t.weight}', '{t.weight || "Weight"}');
app = app.replace('placeholder="kg"', 'placeholder={t.weight_placeholder || "kg"}');
app = app.replace('{t.allergies}', '{t.allergies || "Allergies"}');
app = app.replace('{t.age}', '{t.age || "Age"}');
app = app.replace('{t.conditions}', '{t.conditions || "Conditions"}');

fs.writeFileSync('frontend/src/App.jsx', app);
console.log("Placeholders patched");
