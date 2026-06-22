import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, CheckCircle2, AlertTriangle, Pill, Loader2, X, HelpCircle } from 'lucide-react';
import Webcam from 'react-webcam';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'framer-motion';

const PillVerification = ({ prescriptionData, language = 'English', apiKey = '' }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);

  const resetState = () => {
    setResult(null);
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      resetState();
    }
  };

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "pill_capture.jpg", { type: "image/jpeg" });
            setImageFile(file);
            setImagePreview(imageSrc);
            setShowCamera(false);
            resetState();
          });
      }
    }
  }, [webcamRef]);



  const verifyPill = async () => {
    if (!imageFile || !prescriptionData) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      let payloadFile = imageFile;
      if (payloadFile.size > 1.5 * 1024 * 1024) {
        const compressedBlob = await imageCompression(payloadFile, {
          maxSizeMB: 0.4,
          maxWidthOrHeight: 1200,
          useWebWorker: false
        });
        payloadFile = new File([compressedBlob], payloadFile.name || 'pill.jpg', { type: compressedBlob.type });
      }

      const formData = new FormData();
      formData.append('file', payloadFile);
      formData.append('prescription_data', typeof prescriptionData === 'string' ? prescriptionData : JSON.stringify(prescriptionData));
      formData.append('lang', language);
      if (apiKey) {
        formData.append('api_key', apiKey);
      }

      const res = await axios.post('/api/verify_pill', formData);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || 'Failed to verify pill bottle.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    if (status === 'match') {
      return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, label: 'MATCH' };
    }
    if (status === 'mismatch') {
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: <AlertTriangle className="w-5 h-5 text-red-600" />, label: 'MISMATCH' };
    }
    return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', icon: <HelpCircle className="w-5 h-5 text-slate-400" />, label: 'NOT FOUND' };
  };

  return (
    <div className="pill-verification bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-slate-200 flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
          <Pill className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Verify What Pharmacy Gave You</h3>
          <p className="text-sm text-slate-600">Cross-check dispensed meds with the prescription.</p>
        </div>
      </div>

      <div className="p-6">
        {!imagePreview && !showCamera && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-6 px-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-slate-600"
            >
              <Upload className="w-8 h-8 text-blue-500" />
              <span className="font-medium">Upload Bottle/Strip</span>
              <span className="text-xs text-slate-400">JPG, PNG</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            
            <button
              onClick={() => setShowCamera(true)}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-6 px-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-slate-600"
            >
              <Camera className="w-8 h-8 text-blue-500" />
              <span className="font-medium">Take Photo</span>
              <span className="text-xs text-slate-400">Use Camera</span>
            </button>
          </div>
        )}

        {showCamera && (
          <div className="relative rounded-xl overflow-hidden bg-black mb-6">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-auto max-h-[400px] object-cover"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <button 
                onClick={capturePhoto} 
                className="bg-white text-black rounded-full p-4 shadow-lg hover:scale-105 transition-transform"
              >
                <Camera className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setShowCamera(false)} 
                className="bg-slate-800 text-white rounded-full p-4 shadow-lg hover:scale-105 transition-transform opacity-80"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {imagePreview && (
          <div className="mb-6 flex flex-col items-center">
            <div className="relative w-48 h-48 rounded-xl overflow-hidden border border-slate-200 shadow-sm mb-4">
              <img src={imagePreview} alt="Pill bottle" className="w-full h-full object-cover" />
              <button 
                onClick={() => { setImagePreview(null); setImageFile(null); resetState(); }}
                className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 backdrop-blur-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {!result && !loading && (
              <button
                onClick={verifyPill}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Verify Match
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 text-indigo-600">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="font-medium">Comparing label against prescription...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {['drug', 'strength', 'quantity'].map((fieldKey) => {
                const fieldData = result[fieldKey];
                if (!fieldData) return null;
                const config = getStatusConfig(fieldData.status);
                
                return (
                  <div key={fieldKey} className={`p-4 rounded-xl border flex items-start gap-4 ${config.bg} ${config.border}`}>
                    <div className="mt-1">{config.icon}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {fieldKey === 'drug' ? 'Drug Name' : fieldKey}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${config.text} bg-white/60`}>
                          {config.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-semibold mb-0.5">Prescribed</p>
                          <p className="font-medium text-slate-800">{fieldData.prescribed_value || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-semibold mb-0.5">On Bottle</p>
                          <p className={`font-medium ${fieldData.status === 'mismatch' ? 'text-red-700' : 'text-slate-800'}`}>
                            {fieldData.bottle_value || 'Not listed'}
                          </p>
                        </div>
                      </div>
                      
                      {fieldData.status === 'not-found' && (
                        <p className="text-xs text-slate-500 mt-2">
                          * Couldn't verify this from the label. Often normal for quantities.
                        </p>
                      )}
                      {fieldData.status === 'mismatch' && (
                        <p className="text-xs font-bold text-red-600 mt-2">
                          ⚠ Mismatch: prescription says {fieldData.prescribed_value}, bottle says {fieldData.bottle_value}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PillVerification;
