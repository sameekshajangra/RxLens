const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const targetPDF = `  const downloadPDF = useCallback(async () => {
    try {
      const element = document.querySelector('.result-container');
      if (!element) {
        console.error("Result container not found");
        return;
      }
      
      // We must use the actual DOM element for html2canvas to compute styles properly
      const hideElements = element.querySelectorAll('.hide-on-print');`;

const newPDF = `  const downloadPDF = useCallback(async () => {
    try {
      let element = document.querySelector('.result-container');
      let retries = 0;
      
      while (!element && retries < 20) {
        await new Promise(r => setTimeout(r, 100));
        element = document.querySelector('.result-container');
        retries++;
      }
      
      if (!element) {
        console.error("Result container not found");
        return;
      }
      
      // We must use the actual DOM element for html2canvas to compute styles properly
      const hideElements = element.querySelectorAll('.hide-on-print');`;

app = app.replace(targetPDF, newPDF);
fs.writeFileSync('frontend/src/App.jsx', app);
console.log('PDF wait logic added');
