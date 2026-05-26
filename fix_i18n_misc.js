const fs = require('fs');
let content = fs.readFileSync('frontend/src/i18n.js', 'utf8');

const engTarget = 'audio_guide: "Patient Voice Playback",';
const engAdditions = `speed: "Speed",
    loading_status: "Fast-tracking VLM Engine...",
    awaiting_scan: "Awaiting scan results...",
    add_doc: "Add Clinical Document",
    upload_desc: "Upload a prescription or take a photo instantly",
    take_photo: "Take Photo",
    upload_file: "Upload File",`;

if (!content.includes('speed: "Speed"')) {
  content = content.replace(engTarget, engTarget + '\n    ' + engAdditions);
}

const hinTarget = 'audio_guide: "ऑडियो गाइड",';
const hinAdditions = `speed: "गति",
    loading_status: "VLM इंजन फ़ास्ट-ट्रैक हो रहा है...",
    awaiting_scan: "स्कैन परिणामों की प्रतीक्षा हो रही है...",
    add_doc: "क्लीनिकल दस्तावेज़ जोड़ें",
    upload_desc: "एक प्रिस्क्रिप्शन अपलोड करें या तुरंत फोटो लें",
    take_photo: "फोटो लें",
    upload_file: "फ़ाइल अपलोड करें",`;

if (!content.includes('speed: "गति"')) {
  content = content.replace(hinTarget, hinTarget + '\n    ' + hinAdditions);
}

fs.writeFileSync('frontend/src/i18n.js', content);
console.log("i18n updated with misc strings");
