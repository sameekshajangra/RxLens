const fs = require('fs');

// 1. Fix i18n.js
let i18nContent = fs.readFileSync('frontend/src/i18n.js', 'utf8');

// Replace header_title
i18nContent = i18nContent.replace(/header_title: "Intelligent Prescription Decoder",/g, 'header_title: "Making Prescriptions Understandable",');
i18nContent = i18nContent.replace(/header_title: "बुद्धिमान प्रिस्क्रिप्शन डिकोडर",/g, 'header_title: "प्रिस्क्रिप्शन को समझने योग्य बनाना",');

// Add clear and digitize
i18nContent = i18nContent.replace(
  'meds_found: "Medications Found",',
  'meds_found: "Medications Found",\n    clear: "Clear",\n    digitize: "Digitize",'
);
i18nContent = i18nContent.replace(
  'meds_found: "मिली हुई दवाइयाँ",',
  'meds_found: "मिली हुई दवाइयाँ",\n    clear: "साफ़ करें",\n    digitize: "डिजिटाइज़ करें",'
);
fs.writeFileSync('frontend/src/i18n.js', i18nContent);

// 2. Fix App.jsx
let appContent = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Remove top print button
const printBtnRegex = /<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1\.5rem' }}>\s*<button className="print-btn" onClick={\(\) => window\.print\(\)} title="Print this report">\s*<Printer size={16} \/> \{t\.print_report\}\s*<\/button>\s*<\/div>/;
appContent = appContent.replace(printBtnRegex, '');

// Fix audio player by removing the first flex 1 column with the fake progress bar
// It starts at `<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>`
// and ends at `</div>` before the seek slider.
const fakeProgressRegex = /<div style=\{\{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' \}\}>\s*<div style=\{\{ height: '6px', background: 'var\(--border\)', borderRadius: '4px', overflow: 'hidden', position: 'relative' \}\}>\s*<div style=\{\{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var\(--primary\)', width: `\$\{audioDuration \? \(audioCurrentTime \/ audioDuration\) \* 100 : 0\}%`, transition: 'width 0\.1s linear' \}\} \/>\s*<\/div>\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between', fontSize: '0\.7rem', color: 'var\(--text-muted\)' \}\}>\s*<span>\{Math\.floor\(audioCurrentTime\)\}s<\/span>\s*<span>\{Math\.floor\(audioDuration \|\| 0\)\}s<\/span>\s*<\/div>\s*<\/div>/;
appContent = appContent.replace(fakeProgressRegex, '');

// Fix downloadPDF function to just call window.print()
const oldDownloadPDF = `  const downloadPDF = useCallback(async (data = result?.data, summaryText = result?.summary) => {
    if (!data) return;
    const pdfForm = new FormData();
    pdfForm.append('drug', data.drug || data.drug_name || '');
    pdfForm.append('dosage', data.dosage || '');
    pdfForm.append('frequency', data.frequency || '');
    pdfForm.append('instructions', data.instructions || '');
    pdfForm.append('side_effects', safeArray(data.side_effects).join(', '));
    pdfForm.append('summary', summaryText || '');
    try {
      const res = await axios.post('/api/pdf', pdfForm, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Clinical_Report.pdf');
      link.click();
    } catch (err) { console.error(err); }
  }, [result]);`;

const newDownloadPDF = `  const downloadPDF = useCallback(async () => {
    window.print();
  }, []);`;
appContent = appContent.replace(oldDownloadPDF, newDownloadPDF);

fs.writeFileSync('frontend/src/App.jsx', appContent);

// 3. Fix api/index.py to include explainability_sources
let apiContent = fs.readFileSync('api/index.py', 'utf8');
apiContent = apiContent.replace(
  '"accessibility_analysis": {{"score": "Medium", "jargon_density": "Low", "readability": "6th Grade Level", "reason": ""}}',
  '"accessibility_analysis": {{"score": "Medium", "jargon_density": "Low", "readability": "6th Grade Level", "reason": ""}},\n  "explainability_sources": {{"instructions": "source of instructions", "side_effects": ["source 1"], "precautions": ["source 2"]}}'
);
fs.writeFileSync('api/index.py', apiContent);

console.log("Done fixes");
