const fs = require('fs');
let content = fs.readFileSync('src/i18n.js', 'utf8');

content = content.replace('export const i18n = {', 'const i18n = {');
content += '\nexport default i18n;\n';

fs.writeFileSync('src/i18n.js', content);
console.log("Fixed export default");
