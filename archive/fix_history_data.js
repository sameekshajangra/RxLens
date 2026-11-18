const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const targetSave = `      // Store scan into local history
      const entry = {
        drug_name: safeResult.data.drug || safeResult.data.drug_name || '',
        dosage: safeResult.data.dosage || '',
        date: new Date().toLocaleString(),
        safety_alert_count: safeArray(safeResult.data.safety_alerts).length,
      };`;

const newSave = `      // Store scan into local history
      const entry = {
        drug_name: safeResult.data.drug || safeResult.data.drug_name || '',
        dosage: safeResult.data.dosage || '',
        date: new Date().toLocaleString(),
        safety_alert_count: safeArray(safeResult.data.safety_alerts).length,
        data: safeResult // Save the complete payload for viewing and downloading
      };`;

app = app.replace(targetSave, newSave);

const targetItem = `                  <div key={idx} className="history-item">
                    <div className="history-info">
                      <h4>{item.drug_name}</h4>
                      <p>{item.date} • {item.dosage}</p>
                    </div>
                    <div style={{display:'flex', gap:'8px'}}>
                      <button className="btn btn-secondary" style={{padding:'0.5rem'}} onClick={(e) => { e.stopPropagation(); downloadPDF(item.data.data); }}><Download size={16}/></button>
                    </div>
                  </div>`;

const newItem = `                  <div key={idx} className="history-item" style={{cursor: 'pointer'}} onClick={() => { 
                      if(item.data) { 
                        setResult(item.data); 
                        setActiveTab('scanner'); 
                      } else {
                        alert("Full report data is missing for this old scan. Please rescan.");
                      }
                    }}>
                    <div className="history-info">
                      <h4>{item.drug_name}</h4>
                      <p>{item.date} • {item.dosage}</p>
                    </div>
                    <div style={{display:'flex', gap:'8px'}}>
                      <button className="btn btn-secondary" style={{padding:'0.5rem'}} onClick={(e) => { 
                        e.stopPropagation(); 
                        if (item.data) {
                          downloadPDF(item.data.data);
                        } else {
                          alert("Full report data is missing for this old scan. Please rescan.");
                        }
                      }}><Download size={16}/></button>
                    </div>
                  </div>`;

app = app.replace(targetItem, newItem);
fs.writeFileSync('frontend/src/App.jsx', app);
console.log('History logic fixed');
