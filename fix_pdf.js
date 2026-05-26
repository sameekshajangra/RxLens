const fs = require('fs');
let appContent = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// The replacement logic:
const startIndex = appContent.indexOf('const downloadPDF = useCallback(async');
const endIndex = appContent.indexOf('}, [result]);', startIndex) + 13;

if (startIndex !== -1 && endIndex !== -1) {
  const before = appContent.substring(0, startIndex);
  const after = appContent.substring(endIndex);
  
  const newFunc = `const downloadPDF = useCallback(async () => {
    window.print();
  }, []);`;
  
  appContent = before + newFunc + after;
  fs.writeFileSync('frontend/src/App.jsx', appContent);
  console.log("Fixed downloadPDF");
} else {
  console.log("Could not find downloadPDF");
}
