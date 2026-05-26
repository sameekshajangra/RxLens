const fs = require('fs');
const content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const regex = /setError\((.*?)\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(match[0]);
}
