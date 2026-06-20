import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Edit2, Check, ShieldAlert } from 'lucide-react';

const ConfidenceVerification = ({ draftResult, onConfirm }) => {
  // We need to initialize state from draftResult's drugs_list, drugs_dosage, drugs_frequency, drugs_duration
  const initialDrugs = (draftResult?.drugs_list || []).map((d) => {
    // some fallback in case it's still a string
    if (typeof d === 'string') return { value: d, confidence: 'MEDIUM' };
    return d;
  });

  const [drugs, setDrugs] = useState(initialDrugs);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Check if any drug is LOW or MEDIUM confidence and not user corrected
  const hasUnconfirmed = drugs.some(d => (d.confidence === 'LOW' || d.confidence === 'MEDIUM') && !d.user_corrected);

  const handleEditStart = (idx, value) => {
    setEditingIdx(idx);
    setEditValue(value);
  };

  const handleEditSave = (idx) => {
    const newDrugs = [...drugs];
    newDrugs[idx] = {
      ...newDrugs[idx],
      value: editValue,
      confidence: 'HIGH',
      user_corrected: true
    };
    setDrugs(newDrugs);
    setEditingIdx(null);
  };

  const handleConfirmAll = () => {
    // Construct the finalized result
    const finalResult = { ...draftResult };
    finalResult.drugs_list = drugs;
    onConfirm(finalResult);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6 mb-6">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 border-b border-orange-200 flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Verification Required</h3>
          <p className="text-sm text-slate-600">Please review low-confidence extractions before proceeding.</p>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {drugs.map((drug, idx) => {
            const isWarning = (drug.confidence === 'LOW' || drug.confidence === 'MEDIUM') && !drug.user_corrected;
            
            return (
              <div key={idx} className={`p-4 rounded-lg border ${isWarning ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'} flex items-center justify-between`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Extracted Drug</span>
                    {isWarning ? (
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-3 h-3" /> {drug.confidence} CONFIDENCE
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3 h-3" /> VERIFIED
                      </span>
                    )}
                  </div>
                  
                  {editingIdx === idx ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input 
                        type="text" 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleEditSave(idx)}
                        className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg text-slate-800">{drug.value}</span>
                      <button 
                        onClick={() => handleEditStart(idx, drug.value)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 font-medium bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleConfirmAll}
            disabled={hasUnconfirmed}
            className={`px-6 py-3 rounded-lg font-bold shadow-sm transition-all flex items-center gap-2 ${
              hasUnconfirmed 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
            }`}
          >
            {hasUnconfirmed ? 'Confirm Low Confidence Fields to Proceed' : 'Proceed to Safety Analysis'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceVerification;
