const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const targetPDF = `  const downloadPDF = useCallback(async () => {
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

const newPDF = `  const generatePDFHTML = (data) => {
    if (!data) return '';
    const safeArray = (arr) => Array.isArray(arr) ? arr : [];
    
    let html = \`<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background: #ffffff; padding: 40px; max-width: 800px; margin: 0 auto;">
      <div style="border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="color: #4f46e5; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">RxLens</h1>
          <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Clinical Analysis Report</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Patient:</strong> \${patientProfile.name || 'Anonymous'}</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #475569;"><strong>Date:</strong> \${new Date().toLocaleDateString()}</p>
        </div>
      </div>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
        <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 24px;">\${data.drug || data.drug_name || 'Unknown Medication'}</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 20px;">
          <div style="flex: 1; min-width: 200px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 700;">Dosage</p>
            <p style="margin: 0; font-size: 16px; color: #334155; font-weight: 500;">\${data.dosage || 'N/A'}</p>
          </div>
          <div style="flex: 1; min-width: 200px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 700;">Frequency</p>
            <p style="margin: 0; font-size: 16px; color: #334155; font-weight: 500;">\${data.frequency || 'N/A'}</p>
          </div>
        </div>
      </div>\`;

    if (data.purpose) {
      html += \`<div style="margin-bottom: 30px;">
        <h3 style="color: #334155; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">Primary Purpose</h3>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">\${data.purpose}</p>
      </div>\`;
    }

    const alerts = safeArray(data.safety_alerts);
    if (alerts.length > 0) {
      html += \`<div style="margin-bottom: 30px;">
        <h3 style="color: #ef4444; font-size: 18px; border-bottom: 2px solid #fee2e2; padding-bottom: 8px; margin-bottom: 16px;">Safety Alerts (\${alerts.length})</h3>\`;
      alerts.forEach(alert => {
        const color = alert.severity === 'Critical' ? '#ef4444' : '#f59e0b';
        const bg = alert.severity === 'Critical' ? '#fef2f2' : '#fffbeb';
        const border = alert.severity === 'Critical' ? '#fecaca' : '#fde68a';
        html += \`<div style="background: \${bg}; border: 1px solid \${border}; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <strong style="color: \${color}; font-size: 15px;">\${alert.issue}</strong>
            <span style="background: \${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">\${alert.severity}</span>
          </div>
          <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">\${alert.recommendation}</p>
        </div>\`;
      });
      html += \`</div>\`;
    }

    const sideEffects = safeArray(data.side_effects);
    if (sideEffects.length > 0) {
      html += \`<div style="margin-bottom: 30px;">
        <h3 style="color: #334155; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">Side Effects & Management</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 12px; text-align: left; font-size: 13px; color: #475569; border: 1px solid #e2e8f0;">Effect</th>
              <th style="padding: 12px; text-align: left; font-size: 13px; color: #475569; border: 1px solid #e2e8f0;">Management</th>
            </tr>
          </thead>
          <tbody>\`;
      sideEffects.forEach(effect => {
        html += \`<tr>
          <td style="padding: 12px; border: 1px solid #e2e8f0; font-size: 14px; color: #334155;"><strong>\${effect.effect}</strong></td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; font-size: 14px; color: #475569;">\${effect.management}</td>
        </tr>\`;
      });
      html += \`</tbody></table></div>\`;
    }

    if (data.environmental && safeArray(data.environmental.drug_impacts).length > 0) {
      html += \`<div style="margin-bottom: 30px;">
        <h3 style="color: #10b981; font-size: 18px; border-bottom: 2px solid #d1fae5; padding-bottom: 8px; margin-bottom: 16px;">Green Pharmacy Impact</h3>
        <p style="color: #475569; font-size: 14px; margin-bottom: 12px;">Overall Impact: <strong>\${data.environmental.overall_impact}</strong></p>
        <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">\`;
      safeArray(data.environmental.drug_impacts).forEach(env => {
        html += \`<li><strong>\${env.drug}:</strong> \${env.handling_instructions}</li>\`;
      });
      html += \`</ul></div>\`;
    }

    html += \`<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
      <p>This report is generated by RxLens AI. Always consult a certified pharmacist or your primary doctor before changing any medication routines.</p>
    </div>
    </div>\`;
    
    return html;
  };

  const downloadPDF = useCallback(async (dataOverride = null) => {
    try {
      const dataToPrint = dataOverride || result?.data;
      if (!dataToPrint) {
        console.error("No data to print");
        return;
      }
      
      const htmlString = generatePDFHTML(dataToPrint);
      
      const opt = {
        margin: 0,
        filename: \`RxLens_Report_\${dataToPrint.drug || 'Medication'}.pdf\`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(htmlString).save();
    } catch (e) {
      console.error("PDF generation failed", e);
    }
  }, [result, patientProfile]);`;

app = app.replace(targetPDF, newPDF);

// Now fix the history button onClick to call downloadPDF directly without switching tabs
const historyButtonTarget = `onClick={(e) => { e.stopPropagation(); setResult(item.data); setActiveTab('scanner'); setTimeout(() => downloadPDF(), 500); }}`;
const newHistoryButton = `onClick={(e) => { e.stopPropagation(); downloadPDF(item.data.data); }}`;

app = app.replace(historyButtonTarget, newHistoryButton);
fs.writeFileSync('frontend/src/App.jsx', app);
console.log('Template PDF logic added');
