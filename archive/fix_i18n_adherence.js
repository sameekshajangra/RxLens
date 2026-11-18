const fs = require('fs');
let content = fs.readFileSync('frontend/src/i18n.js', 'utf8');

const engTarget = 'audio_guide: "Patient Voice Playback",';
const engAdditions = `dose_history: "Dose History",
    no_doses: "No doses recorded today.",
    caregiver_notif: "Caregiver Notifications",
    share_report: "Share adherence report with doctor or family",
    share_btn: "Share Report",
    share_title: "RxLens Report",
    share_msg_gen: "Report generated at",`;

if (!content.includes('dose_history: "Dose History"')) {
  content = content.replace(engTarget, engTarget + '\n    ' + engAdditions);
}

const hinTarget = 'audio_guide: "ऑडियो गाइड",';
const hinAdditions = `dose_history: "खुराक का इतिहास",
    no_doses: "आज कोई खुराक दर्ज नहीं की गई।",
    caregiver_notif: "देखभालकर्ता सूचनाएं",
    share_report: "डॉक्टर या परिवार के साथ रिपोर्ट साझा करें",
    share_btn: "रिपोर्ट साझा करें",
    share_title: "RxLens रिपोर्ट",
    share_msg_gen: "रिपोर्ट उत्पन्न की गई",`;

if (!content.includes('dose_history: "खुराक का इतिहास"')) {
  content = content.replace(hinTarget, hinTarget + '\n    ' + hinAdditions);
}

// Add these to both if they don't exist
const engT2 = 'upload_prescription: "Upload Prescription",';
const engA2 = `scanner: "Scanner",
    history: "History",
    insights: "Insights & Reminders",
    adherence_tab: "Medication Adherence",`;
if (!content.includes('scanner: "Scanner"')) {
  content = content.replace(engT2, engT2 + '\n    ' + engA2);
}

const hinT2 = 'upload_prescription: "प्रिस्क्रिप्शन अपलोड करें",';
const hinA2 = `scanner: "स्कैनर",
    history: "इतिहास",
    insights: "अंतर्दृष्टि और अनुस्मारक",
    adherence_tab: "दवा अनुपालन",`;
if (!content.includes('scanner: "स्कैनर"')) {
  content = content.replace(hinT2, hinT2 + '\n    ' + hinA2);
}

fs.writeFileSync('frontend/src/i18n.js', content);
console.log("i18n updated with adherence strings");
