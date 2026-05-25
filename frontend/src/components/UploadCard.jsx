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

  // Compression before upload using Canvas
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
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to 80% JPEG quality
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          onImageCapture(compressedFile);
        }, 'image/jpeg', 0.8);
      };
    };
  };

  if (retryCountdown > 0) {
    return (
      <div className="bg-indigo-50 border border-indigo-500 rounded-3xl p-8 text-center shadow-sm">
        <Timer size={48} className="mx-auto mb-4 text-indigo-600 animate-[spin_3s_linear_infinite]" />
        <h3 className="text-xl font-bold text-indigo-600 mb-2">Daily Limit Reached</h3>
        <p className="text-4xl font-extrabold text-indigo-700 my-4">{retryCountdown}s</p>
        <p className="text-sm text-slate-500">The AI is recharging. Please try again when the timer hits zero or tomorrow.</p>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-white rounded-3xl p-6 md:p-10 text-center shadow-lg border-2 border-dashed transition-all duration-300 ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="mb-6">
        <Upload size={56} className="mx-auto text-indigo-500 mb-4" />
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">{t.add_doc || "Add Clinical Document"}</h3>
        <p className="text-slate-500 text-sm">Upload a prescription or take a photo instantly</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {/* Mobile Camera Input */}
        <label className="relative cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95">
          <Camera size={20} />
          <span>{t.take_photo || "Take Photo"}</span>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            disabled={loading}
          />
        </label>
        
        {/* Standard File Upload */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <Upload size={20} />
          <span>{t.upload_file || "Upload File"}</span>
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleChange} 
      />
    </div>
  );
}
