import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, AlertTriangle, Pill, Loader2, X } from 'lucide-react';
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

  const resetState = () => {
    setResult(null);
    setError('');
  };

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
      // Ensure prescriptionData is passed as string
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

  return (
    <div className="pill-verification bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-slate-200 flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
          <Pill className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Pill Verification</h3>
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
              <span className="font-medium">Upload Photo</span>
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
            <p className="font-medium">Cross-checking with prescription...</p>
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
              className={`p-5 rounded-xl border ${result.match ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
            >
              <div className="flex items-start gap-4">
                {result.match ? (
                  <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                )}
                
                <div>
                  <h4 className={`text-lg font-bold mb-1 ${result.match ? 'text-green-800' : 'text-red-800'}`}>
                    {result.match ? 'Match Verified' : 'MISMATCH DETECTED'}
                  </h4>
                  
                  {!result.match && result.mismatch_reason && (
                    <p className="text-red-700 font-medium mb-3">{result.mismatch_reason}</p>
                  )}
                  
                  <div className={`text-sm ${result.match ? 'text-green-700' : 'text-red-700'} bg-white/50 p-3 rounded-lg border ${result.match ? 'border-green-100' : 'border-red-100'}`}>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="opacity-70 text-xs uppercase tracking-wider block mb-0.5">Detected Drug</span>
                        <span className="font-semibold">{result.detected_drug || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="opacity-70 text-xs uppercase tracking-wider block mb-0.5">Detected Strength</span>
                        <span className="font-semibold">{result.detected_strength || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PillVerification;
