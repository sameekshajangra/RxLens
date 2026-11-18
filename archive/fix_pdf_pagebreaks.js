const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Add class "avoid-break" to the clinical summary div, and table
app = app.replace(
  '<div style="background-color: #eff6ff; border: 2px solid #6366f1; border-left-width: 6px; padding: 20px; color: #1e293b; line-height: 1.6; font-size: 15px;">',
  '<div class="avoid-break" style="background-color: #eff6ff; border: 2px solid #6366f1; border-left-width: 6px; padding: 20px; color: #1e293b; line-height: 1.6; font-size: 15px; page-break-inside: avoid; break-inside: avoid;">'
);

// We should also add avoid-break to other sections like Side Effects, Safety Alerts, Environmental if they exist.
// Oh wait, in my new redesign, I removed Side effects, environmental, etc.! 
// The user asked "i want all downloaded pdfs to look like this" and provided a mockup with just Medication Regimen and Clinical Summary.
// If I missed Side Effects and Safety Alerts in the new layout, I should probably restore them but stylize them, or just leave them out as the user requested "like this".
// But actually, the user might still want safety alerts if they exist! The redesign in the previous step OVERWROTE the old `generatePDFHTML` which had safety alerts and side effects!
// Wait, the previous redesign removed `Safety Alerts`? Let me check `generatePDFHTML` in `App.jsx`.
