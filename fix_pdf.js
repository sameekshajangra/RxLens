const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const targetPDF = `  const downloadPDF = useCallback(async () => {
    const element = document.querySelector('.result-container');
    if (!element) return;
    const clone = element.cloneNode(true);
    const hideElements = clone.querySelectorAll('.hide-on-print');
    hideElements.forEach(el => el.style.display = 'none');
    const opt = {
      margin: 0.5,
      filename: 'Clinical_Report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(clone).save();
  }, []);`;

const newPDF = `  const downloadPDF = useCallback(async () => {
    try {
      const element = document.querySelector('.result-container');
      if (!element) {
        console.error("Result container not found");
        return;
      }
      
      // We must use the actual DOM element for html2canvas to compute styles properly
      const hideElements = element.querySelectorAll('.hide-on-print');
      const originalDisplays = [];
      
      hideElements.forEach((el, index) => {
        originalDisplays[index] = el.style.display;
        el.style.display = 'none';
      });
      
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: 'Clinical_Report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
      
      // Restore elements
      hideElements.forEach((el, index) => {
        el.style.display = originalDisplays[index];
      });
    } catch (e) {
      console.error("PDF generation failed", e);
    }
  }, []);`;

app = app.replace(targetPDF, newPDF);
fs.writeFileSync('frontend/src/App.jsx', app);
console.log('PDF logic replaced');
