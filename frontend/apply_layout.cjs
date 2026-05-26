const fs = require('fs');

const appContent = fs.readFileSync('src/App.jsx', 'utf8');

const startIndex = appContent.indexOf('                <motion.div className="result-container"');
const endIndex = appContent.indexOf('              ) : error ? (');

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find boundaries");
  process.exit(1);
}

const beforeBlock = appContent.substring(0, startIndex);
const afterBlock = appContent.substring(endIndex);

const newResultBlock = `                <motion.div className="result-container" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}}>
                  {/* Section 1: Summary */}
                  <div className="glass-card accordion-section" style={{ marginBottom: '1.5rem', cursor: 'pointer', border: expandedSection === 'summary' ? '1px solid var(--primary)' : '1px solid var(--border)' }} onClick={() => setExpandedSection('summary')}>
                    <h2 className="card-title" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={20} style={{ color: 'var(--success)' }} /> {t.clinical_summary}</span>
                    </h2>
                    
                    <AnimatePresence>
                      {expandedSection === 'summary' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: '1.5rem' }}>
                          <p style={{ lineHeight: '1.6', color: 'var(--text-main)', fontSize: explanationLevel === 'simple' ? '1.15rem' : '1.05rem', fontWeight: 500, margin: 0 }}>
                            {result.summary}
                          </p>
                          
                          {audioUrl && (
                            <div className="premium-audio-player" style={{ marginTop: '20px', padding: '15px', background: 'rgba(13, 148, 136, 0.05)', borderRadius: '16px', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Volume2 size={18} color="var(--primary)" /> 🎧 {t.audio_guide || "Patient Voice Playback"}
                                </p>
                              </div>
                              <AudioPlayer
                                ref={audioRef}
                                autoPlay={false}
                                src={audioUrl}
                                showJumpControls={false}
                                customAdditionalControls={[]}
                                customVolumeControls={[]}
                                style={{ boxShadow: 'none', background: 'transparent' }}
                              />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Section 2: Schedule & Timing */}
                  <div className="glass-card accordion-section" style={{ marginBottom: '1.5rem', cursor: 'pointer', border: expandedSection === 'schedule' ? '1px solid var(--primary)' : '1px solid var(--border)' }} onClick={() => setExpandedSection(expandedSection === 'schedule' ? '' : 'schedule')}>
                    <h2 className="card-title" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CalendarCheck size={20} style={{ color: 'var(--primary)' }} /> {t.schedule_title}</span>
                      {expandedSection === 'schedule' ? <span style={{fontSize:'0.8rem'}}>▼</span> : <span style={{fontSize:'0.8rem'}}>▶</span>}
                    </h2>
                    
                    <AnimatePresence>
                      {expandedSection === 'schedule' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: '1.5rem' }}>
                          {safeArray(result.data.drugs_list).length > 0 && (
                            <div className="visual-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                              {safeArray(result.data.drugs_list).map((drug, idx) => {
                                const dLower = drug.toLowerCase();
                                let icon = "💊";
                                if (dLower.includes('syrup') || dLower.includes('liquid')) icon = "🥄";
                                else if (dLower.includes('inhaler') || dLower.includes('spray')) icon = "💨";
                                else if (dLower.includes('drop')) icon = "💧";
                                else if (dLower.includes('cream') || dLower.includes('ointment')) icon = "🧴";
                                else if (dLower.includes('injection') || dLower.includes('pen')) icon = "💉";

                                return (
                                  <div key={idx} style={{ background: 'var(--card-bg)', border: '2px solid var(--border)', borderRadius: '16px', padding: '1.5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>{icon}</div>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)', wordBreak: 'break-word' }}>{drug}</div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {safeArray(result.data.schedule).length > 0 && (
                            <>
                              <MedicineTimeline schedule={result.data.schedule} />
                              <div style={{display:'flex', flexDirection:'column', gap:'0', position:'relative', paddingLeft:'30px', marginTop: '1.5rem'}}>
                                <div style={{position:'absolute', left:'14px', top:'8px', bottom:'8px', width:'2px', background:'linear-gradient(180deg, var(--primary), rgba(13, 148, 136, 0.3))', borderRadius:'2px'}}></div>
                                {safeArray(result.data.schedule).map((item, idx) => (
                                  <div key={idx} style={{ display:'flex', alignItems:'center', gap:'16px', padding:'14px 18px', margin:'4px 0', background:'rgba(13, 148, 136, 0.03)', borderRadius:'12px', border:'1px solid rgba(13, 148, 136, 0.1)', position:'relative' }}>
                                    <div style={{ position:'absolute', left:'-24px', width:'12px', height:'12px', borderRadius:'50%', background:'var(--primary)', boxShadow:'0 0 12px rgba(13, 148, 136, 0.4)', border:'2px solid #fff' }}></div>
                                    <div style={{ minWidth:'90px', fontWeight:700, fontSize:'0.95rem', color:'var(--primary)', display:'flex', alignItems:'center', gap:'6px' }}>
                                      <Clock size={14}/> {item.time || item.times?.join(', ') || '—'}
                                    </div>
                                    <div style={{flex:1, fontSize:'0.9rem', color:'var(--text-main)', fontWeight:500}}>
                                      {item.task || item.drug || '—'}
                                    </div>
                                    {item.duration && (
                                      <div style={{fontSize:'0.75rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'4px'}}>
                                        <Timer size={12}/> {item.duration}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Section 3: Instructions & Warnings */}
                  <div className="glass-card accordion-section" style={{ marginBottom: '1.5rem', cursor: 'pointer', border: expandedSection === 'instructions' ? '1px solid var(--primary)' : '1px solid var(--border)' }} onClick={() => setExpandedSection(expandedSection === 'instructions' ? '' : 'instructions')}>
                    <h2 className="card-title" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShieldAlert size={20} style={{ color: safeArray(result.data.safety_alerts).length > 0 ? 'var(--danger)' : 'var(--warning)' }} /> 
                        Instructions & Warnings
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {safeArray(result.data.safety_alerts).length > 0 && (
                          <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>{safeArray(result.data.safety_alerts).length} Alerts</span>
                        )}
                        {expandedSection === 'instructions' ? <span style={{fontSize:'0.8rem'}}>▼</span> : <span style={{fontSize:'0.8rem'}}>▶</span>}
                      </div>
                    </h2>
                    
                    <AnimatePresence>
                      {expandedSection === 'instructions' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: '1.5rem' }}>
                          
                          {/* Instructions box */}
                          {result.data.instructions && (
                            <div style={{ padding: '16px', background: 'rgba(13, 148, 136, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--primary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                              <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Info size={16} /> Important Instructions</h4>
                              {result.data.instructions}
                            </div>
                          )}

                          {safeArray(result.data.safety_alerts).length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
                              {safeArray(result.data.safety_alerts).map((alert, idx) => (
                                <div key={idx} style={{ padding: '16px', borderRadius: '12px', background: alert.severity === 'Critical' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)', borderLeft: \`4px solid \${alert.severity === 'Critical' ? 'var(--danger)' : 'var(--warning)'}\`, display: 'flex', gap: '12px' }}>
                                  <AlertTriangle size={20} color={alert.severity === 'Critical' ? 'var(--danger)' : 'var(--warning)'} style={{ flexShrink: 0, marginTop: '2px' }} />
                                  <div>
                                    <strong style={{ display: 'block', color: alert.severity === 'Critical' ? 'var(--danger)' : 'var(--warning)', marginBottom: '4px' }}>{alert.issue}</strong>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5' }}>{alert.message || alert.recommendation}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Pharmacist Consult */}
                          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.05)', borderLeft: '4px solid var(--info)' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0', color: 'var(--info)' }}><Stethoscope size={16} /> Pharmacist Consultation Recommended</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5' }}>{t.pharmacist_desc || "Always consult a certified pharmacist or your primary doctor before changing any medication routines based on these results."}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Section 4: How Easy Is This To Understand? */}
                  {userMode === 'patient' && explanationLevel !== 'simple' && (
                    <div className="glass-card accordion-section" style={{ marginBottom: '1.5rem', cursor: 'pointer', border: expandedSection === 'accessibility' ? '1px solid var(--primary)' : '1px solid var(--border)' }} onClick={() => setExpandedSection(expandedSection === 'accessibility' ? '' : 'accessibility')}>
                      <h2 className="card-title" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Gauge size={20} style={{ color: 'var(--info)' }} /> How Easy Is This To Understand?</span>
                        {expandedSection === 'accessibility' ? <span style={{fontSize:'0.8rem'}}>▼</span> : <span style={{fontSize:'0.8rem'}}>▶</span>}
                      </h2>
                      
                      <AnimatePresence>
                        {expandedSection === 'accessibility' && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: '1.5rem' }}>
                            {result.data.accessibility_analysis && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'stretch', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '130px', padding: '20px', borderRadius: '16px', background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Difficulty</span>
                                  <span className={\`difficulty-badge \${(result.data.accessibility_analysis.score || 'Medium').toLowerCase()}\`} style={{ fontSize: '1.2rem', fontWeight: 800, padding: '6px 16px', borderRadius: '10px', color: 'white', textTransform: 'uppercase', background: result.data.accessibility_analysis.score === 'High' ? 'var(--danger)' : result.data.accessibility_analysis.score === 'Medium' ? 'var(--warning)' : 'var(--success)' }}>
                                    {result.data.accessibility_analysis.score}
                                  </span>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{t.jargon_density}:</span>
                                    <span style={{ fontWeight: 700, color: result.data.accessibility_analysis.jargon_density === 'High' ? 'var(--danger)' : result.data.accessibility_analysis.jargon_density === 'Medium' ? 'var(--warning)' : 'var(--success)' }}>
                                      {result.data.accessibility_analysis.jargon_density}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{t.readability_level}:</span>
                                    <span style={{ fontWeight: 700, color: 'var(--info)' }}>{result.data.accessibility_analysis.readability}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', background: '#fffbeb', color: '#b45309', padding: '10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                                    <span>Patients unfamiliar with medical abbreviations may misunderstand medication timing or dosage instructions.</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {safeArray(result.data.confusing_terms).length > 0 && (
                              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--info)', margin: 0, marginBottom: '12px' }}>
                                  <Info size={16} /> {t.clinical_terms_simplified}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {safeArray(result.data.confusing_terms).map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                      <span style={{ fontWeight: 700, color: 'var(--info)', background: 'rgba(59,130,246,0.1)', padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                        {item.term}
                                      </span>
                                      <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
                                        ➔ <strong>{item.simplified}</strong>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Section 5: Advanced Analysis */}
                  {(userMode === 'worker' || explanationLevel === 'detailed') && (
                    <div className="glass-card accordion-section" style={{ marginBottom: '1.5rem', cursor: 'pointer', border: expandedSection === 'advanced' ? '1px solid var(--primary)' : '1px solid var(--border)' }} onClick={() => setExpandedSection(expandedSection === 'advanced' ? '' : 'advanced')}>
                      <h2 className="card-title" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={20} style={{ color: 'var(--primary)' }} /> Advanced Analysis</span>
                        {expandedSection === 'advanced' ? <span style={{fontSize:'0.8rem'}}>▼</span> : <span style={{fontSize:'0.8rem'}}>▶</span>}
                      </h2>
                      
                      <AnimatePresence>
                        {expandedSection === 'advanced' && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 700 }}>Structured Extraction</h3>
                            <div className="desktop-table-container">
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1.5px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    <th style={{ padding: '12px' }}>{t.medication_name}</th>
                                    <th style={{ padding: '12px' }}>Dosage</th>
                                    <th style={{ padding: '12px' }}>Frequency</th>
                                    <th style={{ padding: '12px' }}>Duration</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>{t.confidence}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {safeArray(result.data.drugs_list).map((drug, idx) => {
                                    const dose = result.data.drugs_dosage?.[drug] || result.data.dosage || 'As directed';
                                    const individualConf = result.data.confidence?.[drug] != null 
                                      ? result.data.confidence[drug] 
                                      : (result.data.confidence?.drug || 0.9);
                                    const level = getConfidenceLevel(individualConf);
                                    
                                    const renderValue = (val) => {
                                      if (typeof val !== 'string') return val;
                                      const isAssumed = val.toLowerCase().includes('assumed') || val.toLowerCase().includes('inferred');
                                      if (isAssumed) {
                                        return (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.5px', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={10} /> INFERRED VALUE</span>
                                            <span style={{ color: '#b45309', fontWeight: 600, fontSize: '0.85rem' }}>{val}</span>
                                          </div>
                                        );
                                      }
                                      return val;
                                    };

                                    return (
                                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '14px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <Pill size={16} color="var(--primary)" /> {drug}
                                        </td>
                                        <td style={{ padding: '14px 12px' }}>{renderValue(dose)}</td>
                                        <td style={{ padding: '14px 12px' }}>{renderValue(result.data.frequency || 'As directed')}</td>
                                        <td style={{ padding: '14px 12px' }}>{renderValue(result.data.duration || 'N/A')}</td>
                                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, color: level === 'high' ? 'var(--success)' : level === 'medium' ? 'var(--warning)' : 'var(--danger)' }}>
                                          {Math.round(individualConf * 100)}%
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {result.data.confidence && Object.keys(result.data.confidence).length > 0 && (
                              <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 700 }}>Data Confidence</h3>
                                <div className="confidence-bar-group">
                                  {Object.entries(result.data.confidence).map(([field, score]) => {
                                    const s = typeof score === 'object' ? score.score : score;
                                    const level = getConfidenceLevel(s);
                                    const isLowestAndCritical = s <= 0.7; // highlight anything <= 70%
                                    
                                    return (
                                      <div key={field} style={{ marginBottom: isLowestAndCritical ? '12px' : '0' }}>
                                        <div className="confidence-bar-item">
                                          <span className="confidence-bar-label">{field}</span>
                                          <div className="confidence-bar-track">
                                            <motion.div 
                                              className={\`confidence-bar-fill \${level}\`}
                                              initial={{ width: 0 }}
                                              animate={{ width: \`\${s * 100}%\` }}
                                            />
                                          </div>
                                          <span className="confidence-bar-score" style={{ color: level === 'high' ? 'var(--success)' : level === 'medium' ? 'var(--warning)' : 'var(--danger)' }}>
                                            {Math.round(s * 100)}%
                                          </span>
                                        </div>
                                        {isLowestAndCritical && (
                                          <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--danger-glow)', borderLeft: '3px solid var(--danger)', borderRadius: '0 8px 8px 0', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'var(--danger)' }}>
                                            <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <div>
                                              <strong style={{ display: 'block', marginBottom: '2px' }}>Critical Action Required</strong>
                                              Confirm {field.toLowerCase()} with pharmacist before starting.
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '25px' }} className="hide-on-print">
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                      <button className="btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--primary)' }} onClick={() => downloadPDF()}>
                        <Download size={16} /> {t.pdf_report}
                      </button>
                      <button className="btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25D366', borderColor: '#25D366' }} onClick={() => window.open(getWhatsAppShareLink(), '_blank')}>
                        <Share2 size={16} /> {t.share_whatsapp}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                      <button className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => window.print()}>
                        <Printer size={16} /> {t.print_instructions}
                      </button>
                      <button className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => setShowChat(true)}>
                        <MessageCircle size={16} /> {t.chat_assistant || "Chat Assistant"}
                      </button>
                    </div>
                  </div>
                  
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
`;

const finalApp = beforeBlock + newResultBlock + afterBlock;
fs.writeFileSync('src/App.jsx', finalApp);
console.log("Success");
