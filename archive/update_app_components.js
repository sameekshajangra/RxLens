const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Add state for Comprehension Check
if (!content.includes('const [comprehensionStatus, setComprehensionStatus] = useState(null);')) {
  content = content.replace(
    "const [history, setHistory] = useState(() => {",
    "const [comprehensionStatus, setComprehensionStatus] = useState(null);\n  const [history, setHistory] = useState(() => {"
  );
}

// 2. Reset comprehension status when scanning new image
if (content.includes('setLoading(true);')) {
  content = content.replace('setLoading(true);', "setLoading(true);\n    setComprehensionStatus(null);");
}

// 3. Add Comprehension Component Render
const comprehensionBlock = `
                    {/* Comprehension Check */}
                    <div className="glass-card" style={{ marginTop: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))', border: '2px solid var(--primary)', textAlign: 'center' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
                        🧠 {t.comprehension_title}
                      </h3>
                      
                      {comprehensionStatus === null ? (
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => setComprehensionStatus('yes')}
                            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'var(--success)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', flex: '1', minWidth: '150px' }}
                          >
                            👍 {t.comprehension_yes}
                          </button>
                          <button 
                            onClick={() => setComprehensionStatus('no')}
                            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'var(--danger)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', flex: '1', minWidth: '150px' }}
                          >
                            🤔 {t.comprehension_no}
                          </button>
                        </div>
                      ) : comprehensionStatus === 'yes' ? (
                        <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', color: 'var(--success)', fontWeight: 700 }}>
                          🎉 {t.comprehension_thanks}
                        </div>
                      ) : (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: 'var(--danger)', fontWeight: 700 }}>
                          🩺 {t.comprehension_review}
                          <div style={{ marginTop: '1rem' }}>
                            <button 
                              onClick={() => setComprehensionStatus(null)}
                              style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', cursor: 'pointer' }}
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
`;

// Insert the comprehension block right before the closing tag of the result section
content = content.replace(
  '                  </div>\n\n\n                    {safeArray(result.data.schedule).length > 0',
  comprehensionBlock + '\n                  </div>\n\n\n                    {safeArray(result.data.schedule).length > 0'
);

// 4. Add Visual Medication Cards before the timeline
const visualCardsBlock = `
                    {/* Visual Medication Cards */}
                    {safeArray(result.data.drugs_list).length > 0 && (
                      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                        <h2 className="card-title"><Pill size={20} style={{ color: 'var(--primary)' }} /> {t.visual_cards_title || "Your Medications"}</h2>
                        <div className="visual-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                          {safeArray(result.data.drugs_list).map((drug, idx) => {
                            const dLower = drug.toLowerCase();
                            let icon = "💊"; // default pill
                            if (dLower.includes('syrup') || dLower.includes('liquid')) icon = "🥄";
                            else if (dLower.includes('inhaler') || dLower.includes('spray')) icon = "💨";
                            else if (dLower.includes('drop')) icon = "💧";
                            else if (dLower.includes('cream') || dLower.includes('ointment')) icon = "🧴";
                            else if (dLower.includes('injection') || dLower.includes('pen')) icon = "💉";

                            return (
                              <motion.div 
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{ 
                                  background: 'var(--bg-card)', 
                                  border: '2px solid var(--border)', 
                                  borderRadius: '16px', 
                                  padding: '1.5rem 1rem', 
                                  textAlign: 'center',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px'
                                }}
                              >
                                <div style={{ fontSize: '3rem', lineHeight: 1 }}>{icon}</div>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', wordBreak: 'break-word' }}>{drug}</div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
`;

// Insert Visual Cards before the Schedule timeline
content = content.replace(
  '{safeArray(result.data.schedule).length > 0 && (',
  visualCardsBlock + '\n                    {safeArray(result.data.schedule).length > 0 && ('
);

fs.writeFileSync('frontend/src/App.jsx', content);
console.log("App.jsx updated with Comprehension Check and Visual Cards.");
