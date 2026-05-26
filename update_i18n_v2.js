const fs = require('fs');
let content = fs.readFileSync('frontend/src/i18n.js', 'utf8');

// English Additions
const engTarget = 'yes_understood: "Yes, I understand",';
const engAdditions = `conditions: "Pre-existing Conditions",
    conditions_placeholder: "e.g. Diabetes, Hypertension",
    pharmacist_consultation: "Pharmacist Consultation Recommended",
    pharmacist_desc: "Always consult a certified pharmacist or your primary doctor before changing any medication routines based on these results.",`;
if (!content.includes('conditions: "Pre-existing')) {
  content = content.replace(engTarget, engTarget + '\n    ' + engAdditions);
}

// Hindi Additions
const hinTarget = 'yes_understood: "हाँ, मैं समझ गया",';
const hinAdditions = `conditions: "पहले से मौजूद बीमारियाँ",
    conditions_placeholder: "उदा. मधुमेह, उच्च रक्तचाप",
    pharmacist_consultation: "फार्मासिस्ट से परामर्श अनुशंसित",
    pharmacist_desc: "इन परिणामों के आधार पर किसी भी दवा की दिनचर्या को बदलने से पहले हमेशा एक प्रमाणित फार्मासिस्ट या अपने प्राथमिक चिकित्सक से परामर्श लें।",`;
if (!content.includes('conditions: "पहले')) {
  content = content.replace(hinTarget, hinTarget + '\n    ' + hinAdditions);
}

fs.writeFileSync('frontend/src/i18n.js', content);
