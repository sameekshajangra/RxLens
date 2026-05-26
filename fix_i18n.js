const fs = require('fs');

let content = fs.readFileSync('frontend/src/i18n.js', 'utf8');

// Find the English translations block
const enStart = content.indexOf('English: {');
if (enStart !== -1) {
    const enInsert = `
    comprehension_title: "Did you understand when to take this medicine?",
    comprehension_yes: "Yes, I understand",
    comprehension_no: "No, let's review again",
    comprehension_thanks: "Great! Stay safe and healthy.",
    comprehension_review: "Please ask a pharmacist or doctor for more clarification.",
    visual_cards_title: "Your Medications",
`;
    content = content.replace('English: {', 'English: {' + enInsert);
}

// Find the Hindi translations block
const hiStart = content.indexOf('Hindi: {');
if (hiStart !== -1) {
    const hiInsert = `
    comprehension_title: "क्या आप समझ गए कि यह दवा कब लेनी है?",
    comprehension_yes: "हाँ, मैं समझ गया",
    comprehension_no: "नहीं, कृपया फिर से समझाएं",
    comprehension_thanks: "बहुत बढ़िया! सुरक्षित और स्वस्थ रहें।",
    comprehension_review: "कृपया अधिक जानकारी के लिए फार्मासिस्ट या डॉक्टर से पूछें।",
    visual_cards_title: "आपकी दवाइयाँ",
`;
    content = content.replace('Hindi: {', 'Hindi: {' + hiInsert);
}

// Find the Spanish translations block
const esStart = content.indexOf('Spanish: {');
if (esStart !== -1) {
    const esInsert = `
    comprehension_title: "¿Entendió cuándo debe tomar este medicamento?",
    comprehension_yes: "Sí, entiendo",
    comprehension_no: "No, revisemos de nuevo",
    comprehension_thanks: "¡Genial! Manténgase seguro y saludable.",
    comprehension_review: "Por favor, pida más aclaraciones a un farmacéutico o médico.",
    visual_cards_title: "Sus Medicamentos",
`;
    content = content.replace('Spanish: {', 'Spanish: {' + esInsert);
}

fs.writeFileSync('frontend/src/i18n.js', content);
console.log("Updated i18n.js with comprehension and card translations.");
