const fs = require('fs');
let content = fs.readFileSync('frontend/src/i18n.js', 'utf8');

// Ensure advice panel and comprehension check are in english
if (!content.includes('advice_explainability_panel:')) {
  content = content.replace('header_title: "Making Prescriptions Understandable",', 'header_title: "Making Prescriptions Understandable",\n    advice_explainability_panel: "Advice Explainability Panel",\n    comprehension_title: "Did you understand when to take this medicine?",\n    yes_understood: "Yes, I understand",\n    no_review_again: "No, let\'s review again",\n    comprehension_yes_msg: "Great! You understand when and how to take this medication.",');
}

// Ensure advice panel and comprehension check are in hindi
if (!content.includes('advice_explainability_panel: "सलाह')) {
  content = content.replace('header_title: "प्रिस्क्रिप्शन को समझने योग्य बनाना",', 'header_title: "प्रिस्क्रिप्शन को समझने योग्य बनाना",\n    advice_explainability_panel: "सलाह स्पष्टीकरण",\n    comprehension_title: "क्या आप समझ गए कि यह दवा कब लेनी है?",\n    yes_understood: "हाँ, मैं समझ गया",\n    no_review_again: "नहीं, कृपया फिर से समझाएं",\n    comprehension_yes_msg: "बहुत बढ़िया! आप समझ गए कि यह दवा कब और कैसे लेनी है।",');
}

fs.writeFileSync('frontend/src/i18n.js', content);
