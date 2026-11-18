const fs = require('fs');
let appContent = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Imports
const importsToAdd = `import html2pdf from 'html2pdf.js';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';`;
appContent = appContent.replace("import i18n from './i18n';", "import i18n from './i18n';\n" + importsToAdd);

// 2. Audio Player Replacement
const customAudioRegex = /\{\/\* Custom Premium Audio Player with Equalizer Soundwaves \*\/\}[\s\S]*?\{audioUrl && \([\s\S]*?<div className="premium-audio-player"[\s\S]*?<\/div>\s*\)\}/;
const newAudioPlayer = `{/* Premium Audio Player */}
                    {audioUrl && (
                      <div className="premium-audio-player" style={{ marginTop: '20px', padding: '15px', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.06))', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Volume2 size={18} color="var(--primary)" /> 🎧 {t.audio_guide || "Patient Voice Playback"}
                        </p>
                        <AudioPlayer
                          autoPlay={false}
                          src={audioUrl}
                          onPlay={e => console.log("onPlay")}
                          showJumpControls={false}
                          customAdditionalControls={[]}
                          customVolumeControls={[]}
                          layout="horizontal-reverse"
                          style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}
                        />
                      </div>
                    )}`;
appContent = appContent.replace(customAudioRegex, newAudioPlayer);

// 3. Fix downloadPDF
const oldDownloadPDF = `const downloadPDF = useCallback(async () => {
    window.print();
  }, []);`;
const newDownloadPDF = `const downloadPDF = useCallback(async () => {
    const element = document.querySelector('.result-container');
    if (!element) return;
    
    // Create clone to hide buttons during PDF generation
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
appContent = appContent.replace(oldDownloadPDF, newDownloadPDF);

// 4. Advice Explainability Section Fix
const adviceRegex = /\{\/\* Advice Explainability \*\/\}\s*\{result\.data\.explainability_sources && \(\s*<div style=\{\{ marginTop: '1\.25rem'.*?<\/div>\s*\)\}/s;
const newAdvice = `{/* Advice Explainability */}
                    {result.data.explainability_sources && (result.data.explainability_sources.instructions || safeArray(result.data.explainability_sources.side_effects).length > 0 || safeArray(result.data.explainability_sources.precautions).length > 0) && (
                      <div style={{ marginTop: '1.25rem', padding: '12px 16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', fontSize: '0.85rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary)', margin: 0, marginBottom: '8px' }}>
                          <Stethoscope size={16} /> {t.advice_explainability_panel || "Advice Explainability Panel"}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {result.data.explainability_sources.instructions && (
                            <div>💡 Intake instructions came from: <strong>{result.data.explainability_sources.instructions}</strong></div>
                          )}
                          {safeArray(result.data.explainability_sources.side_effects).length > 0 && (
                            <div>⚠ Side effects profile belongs to: <strong>{safeArray(result.data.explainability_sources.side_effects).join(', ')}</strong></div>
                          )}
                          {safeArray(result.data.explainability_sources.precautions).length > 0 && (
                            <div>🛡 Precautions list belongs to: <strong>{safeArray(result.data.explainability_sources.precautions).join(', ')}</strong></div>
                          )}
                        </div>
                      </div>
                    )}`;
appContent = appContent.replace(adviceRegex, newAdvice);

// 5. Comprehension Check Component
const exportLine = 'export default App;';
const comprehensionComponent = `
const ComprehensionCheck = ({ t, onReview }) => {
  const [status, setStatus] = useState(null);
  
  if (status === 'yes') {
    return (
      <div className="glass-card" style={{ marginTop: '2rem', textAlign: 'center', padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
        <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 10px' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#059669', margin: 0 }}>
          {t.comprehension_yes_msg || "Great! You understand when and how to take this medication."}
        </h3>
      </div>
    );
  }

  return (
    <div className="glass-card hide-on-print" style={{ marginTop: '2rem', textAlign: 'center', padding: '2rem', background: 'linear-gradient(to bottom, var(--card-bg), rgba(99, 102, 241, 0.05))' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem' }}>
        🧠 {t.comprehension_title || "Did you understand when to take this medicine?"}
      </h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="btn" style={{ padding: '0.75rem 2.5rem', background: '#10b981' }} onClick={() => setStatus('yes')}>
          👍 {t.yes_understood || "Yes"}
        </button>
        <button className="btn btn-secondary" style={{ padding: '0.75rem 2.5rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => {
          setStatus('no');
          onReview();
        }}>
          👎 {t.no_review_again || "No, let's review again"}
        </button>
      </div>
    </div>
  );
};

export default App;
`;
appContent = appContent.replace(exportLine, comprehensionComponent);

// 6. Add ComprehensionCheck to App.jsx render
const closingMotionDiv = `                    </div>
                  </motion.div>
                )}
              </div>`;
const replacementHTML = `                    </div>
                    {userMode === 'patient' && (
                      <ComprehensionCheck t={t} onReview={() => {
                        setShowChat(true);
                        setExplanationLevel('simple');
                        const question = language === 'Hindi' 
                          ? "मुझे यह समझ नहीं आया कि यह दवा कब लेनी है। कृपया बहुत सरल शब्दों में फिर से समझाएं।"
                          : "I didn't understand when to take this medicine. Please explain it to me very simply.";
                        setChatMessage(question);
                        setTimeout(() => handleChatSend(question), 500);
                      }} />
                    )}
                  </motion.div>
                )}
              </div>`;
appContent = appContent.replace(closingMotionDiv, replacementHTML);

fs.writeFileSync('frontend/src/App.jsx', appContent);
console.log("App.jsx fixed successfully");
