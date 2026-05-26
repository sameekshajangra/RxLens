const fs = require('fs');
let appContent = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const targetImport = "import i18n from './i18n';";
const replacementImport = `import i18n from './i18n';
import html2pdf from 'html2pdf.js';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';`;
appContent = appContent.replace(targetImport, replacementImport);
fs.writeFileSync('frontend/src/App.jsx', appContent);
console.log("Imports added");
