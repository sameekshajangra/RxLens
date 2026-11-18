const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const targetItem = `                  <div key={idx} className="history-item" style={{cursor: 'pointer'}} onClick={() => { 
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

const newItem = `                  <div key={idx} className="history-item" style={{cursor: 'pointer'}} onClick={() => { 
                      let scanData = item.data;
                      if (!scanData) {
                        scanData = {
                          data: {
                            drug: item.drug_name || 'Unknown',
                            drugs_list: [item.drug_name || 'Unknown'],
                            dosage: item.dosage || 'Unknown',
                            frequency: 'N/A',
                            duration: 'N/A',
                            instructions: 'Historical scan. Full data was not retained.',
                            safety_alerts: [],
                            side_effects: []
                          }
                        };
                      }
                      setResult(scanData); 
                      setActiveTab('scanner'); 
                    }}>
                    <div className="history-info">
                      <h4>{item.drug_name}</h4>
                      <p>{item.date} • {item.dosage}</p>
                    </div>
                    <div style={{display:'flex', gap:'8px'}}>
                      <button className="btn btn-secondary" style={{padding:'0.5rem'}} onClick={(e) => { 
                        e.stopPropagation(); 
                        let scanData = item.data ? item.data.data : {
                          drug: item.drug_name || 'Unknown',
                          drugs_list: [item.drug_name || 'Unknown'],
                          dosage: item.dosage || 'Unknown',
                          frequency: 'N/A',
                          duration: 'N/A',
                          instructions: 'Historical scan. Full data was not retained.',
                          safety_alerts: [],
                          side_effects: []
                        };
                        downloadPDF(scanData);
                      }}><Download size={16}/></button>
                    </div>
                  </div>`;

app = app.replace(targetItem, newItem);
fs.writeFileSync('frontend/src/App.jsx', app);
console.log('History fallback logic added');
