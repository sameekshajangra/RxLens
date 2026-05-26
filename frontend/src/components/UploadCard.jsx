import React, { useRef, useState } from 'react';
import { Upload, Camera, Timer } from 'lucide-react';

export default function UploadCard({ 
  onImageCapture, 
  loading, 
  retryCountdown, 
  t 
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

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

  const processAndCompressImage = (file) => {
    if (!file.type.startsWith('image/')) {
      onImageCapture(file);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
          onImageCapture(compressedFile);
        }, 'image/jpeg', 0.8);
      };
    };
  };

  if (retryCountdown > 0) {
    return (
      <div className="bg-teal-50 border border-teal-500 rounded-3xl p-8 text-center shadow-sm">
        <Timer size={48} className="mx-auto mb-4 text-teal-600 animate-[spin_3s_linear_infinite]" />
        <h3 className="text-xl font-bold text-teal-600 mb-2">Daily Limit Reached</h3>
        <p className="text-4xl font-extrabold text-teal-700 my-4">{retryCountdown}s</p>
        <p className="text-sm text-slate-500">The AI is recharging. Please try again when the timer hits zero or tomorrow.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">
          Making healthcare instructions <span className="text-teal-600">easy to understand</span>
        </h2>
        {/* Smaller tagline font */}
        <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          Upload any prescription, discharge summary, or medical document to get an accessible, plain-language breakdown instantly.
        </p>
      </div>

      {/* Workflow Illustration */}
      <div className="flex items-center justify-center gap-2 mb-8 px-2">
        {/* Step 1 */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-2xl shadow-sm">📄</div>
          <span className="text-xs font-semibold text-slate-500 text-center leading-tight">Upload Document</span>
        </div>
        {/* Arrow */}
        <div className="flex items-center justify-center text-teal-300 flex-shrink-0 mb-5">
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><path d="M0 6h20M14 1l6 5-6 5" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        {/* Step 2 */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-2xl shadow-sm">🤖</div>
          <span className="text-xs font-semibold text-slate-500 text-center leading-tight">AI Analyzes</span>
        </div>
        {/* Arrow */}
        <div className="flex items-center justify-center text-teal-300 flex-shrink-0 mb-5">
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><path d="M0 6h20M14 1l6 5-6 5" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        {/* Step 3 */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-2xl shadow-sm">✅</div>
          <span className="text-xs font-semibold text-slate-500 text-center leading-tight">Safety Check</span>
        </div>
        {/* Arrow */}
        <div className="flex items-center justify-center text-teal-300 flex-shrink-0 mb-5">
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><path d="M0 6h20M14 1l6 5-6 5" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        {/* Step 4 */}
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-2xl shadow-sm">💊</div>
          <span className="text-xs font-semibold text-slate-500 text-center leading-tight">Plain-Language Breakdown</span>
        </div>
      </div>

      <div 
        className={`relative bg-white rounded-3xl p-6 md:p-10 text-center shadow-[0_4px_20px_0_rgba(0,0,0,0.03)] border-2 transition-all duration-300 ${dragActive ? 'border-teal-500 bg-teal-50' : 'border-slate-100 border-dashed hover:border-teal-400 hover:bg-slate-50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="mb-10">
          <Upload size={56} className="mx-auto text-teal-600 mb-6 opacity-90" />
          <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">{t.add_doc || "Add Clinical Document"}</h3>
          <p className="text-slate-500 text-base">{t.upload_desc || "Upload a prescription or take a photo instantly"}</p>
        </div>

        {/* Action buttons — increased gap between rows */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-10">
          {/* Mobile Camera Input */}
          <label className="cursor-pointer bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-95 text-lg">
            <Camera size={22} />
            <span>{t.take_photo || "Take Photo"}</span>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden"
              onChange={handleChange}
              disabled={loading}
            />
          </label>
          
          {/* Standard File Upload */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="bg-white border-2 border-slate-200 hover:border-teal-600 hover:bg-slate-50 text-slate-700 hover:text-teal-700 font-semibold py-4 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95 text-lg"
          >
            <Upload size={22} />
            <span>{t.upload_file || "Upload File"}</span>
          </button>
        </div>

        {/* Trust Indicators — more vertical spacing between rows */}
        <div className="flex flex-col gap-3 items-center justify-center text-xs md:text-sm text-slate-400 font-medium pt-6 border-t border-slate-100">
          <p>Supported formats: JPG, PNG, WEBP, PDF</p>
          <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500 opacity-80"></span> Your data is analyzed securely and not stored permanently.</p>
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
