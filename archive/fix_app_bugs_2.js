const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Translations in App.jsx
app = app.replace("setLoadingStatus('Fast-tracking VLM Engine...');", "setLoadingStatus(t.loading_status || 'Fast-tracking VLM Engine...');");
app = app.replace("<p>Awaiting scan results...</p>", "<p>{t.awaiting_scan || 'Awaiting scan results...'}</p>");

// 2. Playback speed feature
const audioPlayerTarget = `<AudioPlayer
                          autoPlay={false}`;
                          
const audioPlayerReplacement = `const audioRef = React.useRef(null);
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                          <select 
                            className="input-field" 
                            style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto', background: 'var(--card-bg)' }}
                            onChange={(e) => {
                              if (audioRef.current && audioRef.current.audio.current) {
                                audioRef.current.audio.current.playbackRate = parseFloat(e.target.value);
                              }
                            }}
                          >
                            <option value="1">{t.speed || 'Speed'}: 1x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2">2x</option>
                          </select>
                        </div>
                        <AudioPlayer
                          ref={audioRef}
                          autoPlay={false}`;
// Wait, I can't put `const audioRef` directly in JSX. 
// I need to add `const audioRef = useRef(null);` at the top of App.jsx.
