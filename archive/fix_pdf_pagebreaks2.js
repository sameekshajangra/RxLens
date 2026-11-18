const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Add pagebreak config to opt
app = app.replace(
  "html2canvas: { scale: 2, useCORS: true, letterRendering: true },",
  "html2canvas: { scale: 2, useCORS: true, letterRendering: true },\n        pagebreak: { mode: ['css', 'legacy'] },"
);

// Add break-inside: avoid to clinical summary
app = app.replace(
  '<div style="background-color: #eff6ff; border: 2px solid #6366f1; border-left-width: 6px; padding: 20px; color: #1e293b; line-height: 1.6; font-size: 15px;">',
  '<div style="background-color: #eff6ff; border: 2px solid #6366f1; border-left-width: 6px; padding: 20px; color: #1e293b; line-height: 1.6; font-size: 15px; page-break-inside: avoid; break-inside: avoid;">'
);

// Add break-inside: avoid to the Safeguard banner
app = app.replace(
  '<div style="border: 2px solid #ef4444; background-color: #fef2f2; padding: 16px; margin-bottom: 30px;">',
  '<div style="border: 2px solid #ef4444; background-color: #fef2f2; padding: 16px; margin-bottom: 30px; page-break-inside: avoid; break-inside: avoid;">'
);

// Add break-inside: avoid to the Meta table and Medication table
app = app.replace(
  '<table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">',
  '<table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; page-break-inside: avoid; break-inside: avoid;">'
);

app = app.replace(
  '<table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; border: 1px solid #6366f1;">',
  '<table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; border: 1px solid #6366f1; page-break-inside: avoid; break-inside: avoid;">'
);

// Since I removed safety alerts and side effects previously, let me append them back inside the HTML if they exist!
// Let's replace the end of generatePDFHTML to include safety alerts and side effects again.
const targetEnd = `      <!-- Clinical Summary -->
      <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">Clinical Summary</h2>
      <div style="background-color: #eff6ff; border: 2px solid #6366f1; border-left-width: 6px; padding: 20px; color: #1e293b; line-height: 1.6; font-size: 15px; page-break-inside: avoid; break-inside: avoid;">
        \${clinicalSummary}
      </div>
    </div>
    \`;
    
    return html;
  };`;

const newEnd = `      <!-- Clinical Summary -->
      <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">Clinical Summary</h2>
      <div style="background-color: #eff6ff; border: 2px solid #6366f1; border-left-width: 6px; padding: 20px; color: #1e293b; line-height: 1.6; font-size: 15px; page-break-inside: avoid; break-inside: avoid;">
        \${clinicalSummary}
      </div>\`;

    const alerts = safeArray(data.safety_alerts);
    if (alerts.length > 0) {
      html += \`<div style="margin-top: 40px; page-break-inside: avoid; break-inside: avoid;">
        <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">Safety Alerts (\${alerts.length})</h2>\`;
      alerts.forEach(alert => {
        const color = alert.severity === 'Critical' ? '#ef4444' : '#f59e0b';
        const bg = alert.severity === 'Critical' ? '#fef2f2' : '#fffbeb';
        const border = alert.severity === 'Critical' ? '#fecaca' : '#fde68a';
        html += \`<div style="background: \${bg}; border: 1px solid \${border}; padding: 16px; border-radius: 8px; margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <strong style="color: \${color}; font-size: 15px;">\${alert.issue || alert.message || 'Safety Warning'}</strong>
            <span style="background: \${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">\${alert.severity}</span>
          </div>
          <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">\${alert.recommendation || ''}</p>
        </div>\`;
      });
      html += \`</div>\`;
    }

    const sideEffects = safeArray(data.side_effects);
    if (sideEffects.length > 0) {
      html += \`<div style="margin-top: 40px; page-break-inside: avoid; break-inside: avoid;">
        <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">Side Effects & Management</h2>
        <table style="width: 100%; border-collapse: collapse; page-break-inside: avoid; break-inside: avoid;">
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

    html += \`</div>\`;
    return html;
  };`;

app = app.replace(targetEnd, newEnd);
fs.writeFileSync('frontend/src/App.jsx', app);
console.log('Pagebreaks logic added');
