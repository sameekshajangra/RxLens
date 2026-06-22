import React, { useRef, useState, useCallback } from 'react';
import { Upload, Camera, Timer, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import Webcam from 'react-webcam';

export default function UploadCard({ 
  onImageCapture, 
  loading, 
  retryCountdown, 
  t 
}) {
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "scan_capture.jpg", { type: "image/jpeg" });
            processAndCompressImage(file);
            setShowCamera(false);
          });
      }
    }
  }, [webcamRef]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndCompressImage(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processAndCompressImage(e.target.files[0]);
    }
  };

  const processAndCompressImage = async (file) => {
    if (!file.type.startsWith('image/')) {
      onImageCapture(file);
      return;
    }
    
    try {
      const options = {
        maxSizeMB: 3.5, // Keep under Vercel's 4.5MB limit
        maxWidthOrHeight: 2000, // Large enough to read text clearly
        useWebWorker: true,
        // browser-image-compression preserves EXIF orientation automatically!
      };
      
      const compressedBlob = await imageCompression(file, options);
      const compressedFile = new File([compressedBlob], file.name, { type: compressedBlob.type, lastModified: Date.now() });
      onImageCapture(compressedFile);
    } catch (error) {
      console.error("Image compression failed, falling back to original", error);
      onImageCapture(file);
    }
  };

  if (retryCountdown > 0) {
    return (
      <div className="bg-teal-50 border border-teal-500 rounded-3xl p-8 text-center shadow-sm">
        <Timer size={48} className="mx-auto mb-4 text-teal-600 animate-[spin_3s_linear_infinite]" />
        <h3 className="text-xl font-bold text-teal-600 mb-2">{t.limit_reached || "Daily Limit Reached"}</h3>
        <p className="text-4xl font-extrabold text-teal-700 my-4">{retryCountdown}s</p>
        <p className="text-sm text-slate-500">{t.limit_desc || "The AI is recharging. Please try again when the timer hits zero or tomorrow."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-10 tracking-tight">
          {t.hero_title || "Making healthcare instructions"}{" "}
          <span className="text-teal-600">{t.hero_title_accent || "easy to understand"}</span>
        </h2>
        {/* Smaller tagline font */}
        <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          {t.hero_subtitle || "Upload any prescription, discharge summary, or medical document to get an accessible, plain-language breakdown instantly."}
        </p>
      </div>

      {/* Workflow Illustration */}
      <div className="flex items-center justify-center gap-2 mb-8 px-2">
        {/* Step 1 */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-2xl shadow-sm">📄</div>
          <span className="text-xs font-semibold text-slate-500 text-center leading-tight">
            {t.step_upload || "Upload Document"}
          </span>
        </div>
        {/* Arrow */}
        <div className="flex items-center justify-center text-teal-300 flex-shrink-0 mb-5">
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><path d="M0 6h20M14 1l6 5-6 5" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        {/* Step 2 */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-2xl shadow-sm">🤖</div>
          <span className="text-xs font-semibold text-slate-500 text-center leading-tight">
            {t.step_analyze || "AI Analyzes"}
          </span>
        </div>
        {/* Arrow */}
        <div className="flex items-center justify-center text-teal-300 flex-shrink-0 mb-5">
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><path d="M0 6h20M14 1l6 5-6 5" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        {/* Step 3 */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-2xl shadow-sm">✅</div>
          <span className="text-xs font-semibold text-slate-500 text-center leading-tight">
            {t.step_safety || "Safety Check"}
          </span>
        </div>
        {/* Arrow */}
        <div className="flex items-center justify-center text-teal-300 flex-shrink-0 mb-5">
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><path d="M0 6h20M14 1l6 5-6 5" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        {/* Step 4 */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-2xl shadow-sm">💊</div>
          <span className="text-xs font-semibold text-slate-500 text-center leading-tight">
            {t.step_breakdown || "Plain-Language Breakdown"}
          </span>
        </div>
      </div>

      <div 
        className={`relative bg-white rounded-3xl p-6 md:p-10 text-center shadow-[0_4px_20px_0_rgba(0,0,0,0.03)] border-2 transition-all duration-300 ${dragActive ? 'border-teal-500 bg-teal-50' : 'border-slate-100 border-dashed hover:border-teal-400 hover:bg-slate-50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Enforced with an explicit inline style style={{ marginBottom: '3rem' }} to guarantee perfect, tight spacing regardless of CSS cache/overrides */}
        <div className="mb-12" style={{ marginBottom: '3rem' }}>
          <Upload size={56} className="mx-auto text-teal-600 opacity-90" style={{ marginBottom: '1.5rem' }} />
          {/* Made the text smaller (text-xl md:text-2xl) and adjusted margin bottom */}
          <h3 className="text-xl md:text-2xl font-bold text-slate-800" style={{ marginBottom: '0.75rem' }}>
            {t.add_doc || "Add Clinical Document"}
          </h3>
          {/* Centered it cleanly and aligned max-width with top tagline */}
          <p className="text-slate-500 text-xs md:text-sm max-w-xl mx-auto leading-relaxed text-center">
            {t.upload_desc || "Upload a prescription or take a photo instantly"}
          </p>
        </div>

        {/* Action buttons */}
        {!showCamera ? (
          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-16">
            <button 
              onClick={() => setShowCamera(true)}
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 px-10 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-95 text-lg"
            >
              <Camera size={22} />
              <span>{t.take_photo || "Take Photo"}</span>
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="bg-white border-2 border-slate-200 hover:border-teal-600 hover:bg-slate-50 text-slate-700 hover:text-teal-700 font-semibold py-4 px-10 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95 text-lg"
            >
              <Upload size={22} />
              <span>{t.upload_file || "Upload File"}</span>
            </button>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden bg-black mb-16 max-w-md mx-auto">
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

        {/* Trust Indicators — more vertical spacing between rows */}
        <div className="flex flex-col gap-4 items-center justify-center text-xs md:text-sm text-slate-400 font-medium pt-8 border-t border-slate-100">
          <p>{t.supported_formats || "Supported formats: JPG, PNG, WEBP, PDF"}</p>
          <p className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 opacity-80"></span>{" "}
            {t.privacy_note || "Your data is analyzed securely and not stored permanently."}
          </p>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,.pdf"
          onChange={handleChange} 
        />
      </div>
    </div>
  );
}
