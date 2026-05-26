const fs = require('fs');

let appContent = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const audioPlayerStart = `{/* Custom Premium Audio Player with Equalizer Soundwaves */}`;
const oldAudioPlayer = `                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Volume2 size={18} color="var(--primary)" /> 🎧 {t.audio_guide || "Patient Voice Playback"}
                          </p>
                          {/* Animated equalizer waves when playing */}
                          <div style={{ display: 'flex', gap: '3px', height: '15px', alignItems: 'flex-end' }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className={\`eq-bar \${audioPlaying ? 'active' : ''}\`} style={{ width: '3px', background: 'var(--primary)', borderRadius: '2px', animationDelay: \`\${i * 0.15}s\` }} />
                            ))}
                          </div>
                        </div>

                        <audio ref={audioRef} src={audioUrl} preload="metadata" style={{ display: 'none' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <button onClick={togglePlayPause} style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', transition: 'all 0.2s' }} className="play-btn">
                            {audioPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" style={{ marginLeft: '3px' }} />}
                          </button>`;

const newAudioPlayer = `                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Volume2 size={18} color="var(--primary)" /> 🎧 {t.audio_guide || "Patient Voice Playback"}
                          </p>
                          <div style={{ display: 'flex', gap: '3px', height: '15px', alignItems: 'flex-end' }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className={\`eq-bar \${audioPlaying ? 'active' : ''}\`} style={{ width: '3px', background: 'var(--primary)', borderRadius: '2px', animationDelay: \`\${i * 0.15}s\` }} />
                            ))}
                          </div>
                        </div>

                        <audio ref={audioRef} src={audioUrl} preload="metadata" style={{ display: 'none' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <button onClick={togglePlayPause} style={{ minWidth: '48px', width: '48px', height: '48px', borderRadius: '50%', border: 'none', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', transition: 'all 0.2s' }} className="play-btn">
                            {audioPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" style={{ marginLeft: '3px' }} />}
                          </button>

                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ height: '6px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--primary)', width: \`\${audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0}%\`, transition: 'width 0.1s linear' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              <span>{Math.floor(audioCurrentTime)}s</span>
                              <span>{Math.floor(audioDuration || 0)}s</span>
                            </div>
                          </div>`;

appContent = appContent.replace(oldAudioPlayer, newAudioPlayer);
fs.writeFileSync('frontend/src/App.jsx', appContent);
console.log("Updated Audio Player");
