const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const targetStart = `<div className="app-container">`;
const targetEnd = `<AnimatePresence>`;

const startIndex = app.indexOf(targetStart);
const endIndex = app.indexOf(targetEnd);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find start or end target");
  process.exit(1);
}

const originalBlock = app.substring(startIndex, endIndex);

const newLayout = `<div className="app-wrapper">
      {/* Sidebar */}
      <div className="sidebar hide-on-print">
        <div className="sidebar-header">
          <h1><span style={{ fontSize: '2rem' }}>🩺</span> RxLens</h1>
        </div>
        <div className="sidebar-nav">
          <button className={\`sidebar-item \${activeTab === 'scanner' ? 'active' : ''}\`} onClick={() => setActiveTab('scanner')}>
            <LayoutDashboard size={20} /> {t.scanner || "Scanner"}
          </button>
          <button className={\`sidebar-item \${activeTab === 'adherence' ? 'active' : ''}\`} onClick={() => setActiveTab('adherence')}>
            <CheckCircle2 size={20} /> {t.adherence_tab || "Medication Adherence"}
          </button>
          <button className={\`sidebar-item \${activeTab === 'history' ? 'active' : ''}\`} onClick={() => setActiveTab('history')}>
            <History size={20} /> {t.history || "History"}
          </button>
          <button className={\`sidebar-item \${activeTab === 'insights' ? 'active' : ''}\`} onClick={() => setActiveTab('insights')}>
            <TrendingUp size={20} /> {t.insights || "Reminders & Insights"}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Redesigned Header */}
        <header className="top-header hide-on-print">
          <div className="top-header-row1">
            <h2>{t.header_title}</h2>
          </div>
          <div className="top-header-row2">
            <div className="header-left-controls">
              <button className={\`btn \${showProfile ? 'btn-primary' : 'btn-secondary'}\`} onClick={() => setShowProfile(!showProfile)} style={{padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem'}}>
                <User size={16} /> {patientProfile.name || t.patient_profile || "Patient Profile"}
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Languages size={16} color="var(--text-muted)" />
                <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{background: 'none', border: 'none', color: 'inherit', font: 'inherit', outline: 'none', cursor: 'pointer', fontWeight: 600}}>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <span className={\`mode-badge \${userMode === 'patient' ? 'patient' : 'worker'}\`}>
                   {userMode === 'patient' ? '🧑‍⚕️' : '🏥'}
                 </span>
                 <select value={userMode} onChange={(e) => setUserMode(e.target.value)} style={{background: 'none', border: 'none', color: 'inherit', font: 'inherit', outline: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'}}>
                   <option value="patient">{t.mode_patient || "Patient Mode"}</option>
                   <option value="worker">{t.mode_worker || "Healthcare Worker"}</option>
                 </select>
              </div>
            </div>

            <div className="header-right-controls">
              <button className="btn btn-secondary" onClick={() => setElderlyMode(!elderlyMode)} title="Large Font Mode" style={{ padding: '8px 12px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: elderlyMode ? 'bold' : 'normal', color: elderlyMode ? 'var(--primary)' : 'inherit' }}>A+</span>
              </button>
              <button className="btn btn-secondary" onClick={() => setDarkMode(!darkMode)} style={{ padding: '8px 12px' }}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        <div className="app-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <AnimatePresence>
`;

app = app.replace(originalBlock + '<AnimatePresence>', newLayout);

// Also we need to close the two new wrapper divs at the very bottom of the file
const finalCloseIndex = app.lastIndexOf('</div>');
app = app.substring(0, finalCloseIndex) + '\n        </div>\n      </div>\n' + app.substring(finalCloseIndex);

fs.writeFileSync('frontend/src/App.jsx', app);
console.log("Layout rewritten");
