const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Add expandedSection state
if (!content.includes('const [expandedSection, setExpandedSection]')) {
  content = content.replace(
    /const \[userMode, setUserMode\] = useState\('patient'\);.*?\n/,
    `$&  const [expandedSection, setExpandedSection] = useState('summary'); // 'summary', 'schedule', 'instructions', 'accessibility', 'advanced'\n`
  );
}

// Add AnimatePresence to imports
if (!content.includes('AnimatePresence')) {
  content = content.replace(
    /import \{ motion \} from 'framer-motion';/,
    `import { motion, AnimatePresence } from 'framer-motion';`
  );
}

// Ensure setExpandedSection works with userMode
if (!content.includes('setExpandedSection(\'advanced\')')) {
  content = content.replace(
    /useEffect\(\(\) => \{\n    document\.body\.classList\.toggle\('patient-mode', userMode === 'patient'\);\n  \}, \[userMode\]\);/,
    `useEffect(() => {\n    document.body.classList.toggle('patient-mode', userMode === 'patient');\n    if (userMode === 'worker') setExpandedSection('advanced');\n    else setExpandedSection('summary');\n  }, [userMode]);`
  );
}

fs.writeFileSync('src/App_updated.jsx', content);
console.log('Done script 1');
