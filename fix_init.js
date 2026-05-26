const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

content = content.replace(
  "return stored ? JSON.parse(stored) : [];",
  "try { return stored ? JSON.parse(stored) : []; } catch(e) { return []; }"
);

content = content.replace(
  "return saved ? JSON.parse(saved) : { name: '', age: '', weight: '', allergies: '', conditions: '' };",
  "try { return saved ? JSON.parse(saved) : { name: '', age: '', weight: '', allergies: '', conditions: '' }; } catch(e) { return { name: '', age: '', weight: '', allergies: '', conditions: '' }; }"
);

fs.writeFileSync('frontend/src/App.jsx', content);
