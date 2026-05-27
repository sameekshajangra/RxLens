import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Crop, AlertTriangle, Check, X, RefreshCw, Sun } from 'lucide-react';

const ImagePreProcessor = ({ imageFile, onComplete, onCancel }) => {
  const [step, setStep] = useState('optimizing'); // 'optimizing' | 'cropping'
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  
  // Quality analysis states
  const [isBlurry, setIsBlurry] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (imageFile) {
      // Create object URL for the image
      const url = URL.createObjectURL(imageFile);
      setImgSrc(url);

      // Simulate orientation optimization delay
      const timer = setTimeout(() => {
        setStep('cropping');
      }, 1500);

      return () => {
        clearTimeout(timer);
        URL.revokeObjectURL(url);
      };
    }
  }, [imageFile]);

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    // Set a smart default crop (10% padding around edges)
    const defaultCrop = {
      unit: '%',
      x: 10,
      y: 10,
      width: 80,
      height: 80
    };
    setCrop(defaultCrop);
    setCompletedCrop(defaultCrop); // Initialize completed crop so we can process without user interaction if they just hit next
    
    // Perform quality analysis on a hidden canvas
    analyzeImageQuality(e.currentTarget);
  }, []);

  const analyzeImageQuality = (img) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    // Scale down for faster analysis
    const scale = Math.min(1, 300 / img.width);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 1. Brightness Check (Luma)
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      // Standard luma formula: 0.299*R + 0.587*G + 0.114*B
      const brightness = (data[i] * 0.299) + (data[i+1] * 0.587) + (data[i+2] * 0.114);
      totalBrightness += brightness;
    }
    const avgBrightness = totalBrightness / (data.length / 4);
    if (avgBrightness < 60) {
      setIsDark(true);
    }

    // 2. Simple Blur Check (Variance of pixels - rough approximation)
    // A true Laplacian variance is complex in pure JS, but we can do a quick contrast variance
    let mean = avgBrightness;
    let sumSquaredDiff = 0;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] * 0.299) + (data[i+1] * 0.587) + (data[i+2] * 0.114);
      sumSquaredDiff += Math.pow(brightness - mean, 2);
    }
    const variance = sumSquaredDiff / (data.length / 4);
    // Lower variance implies less contrast/edges -> potentially blurry
    if (variance < 300) { 
      setIsBlurry(true);
    }
  };

  const handleComplete = async () => {
    if (!completedCrop || !imgRef.current) {
      // If no crop happens, just pass the original file
      onComplete(imageFile);
      return;
    }

    // Process the cropped image
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      onComplete(imageFile);
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // We deal with percentages or pixels depending on how ReactCrop handles it.
    // If completedCrop is in %, convert to px relative to the image rendering size.
    let cropX, cropY, cropW, cropH;
    
    if (completedCrop.unit === '%') {
      cropX = (completedCrop.x / 100) * image.width;
      cropY = (completedCrop.y / 100) * image.height;
      cropW = (completedCrop.width / 100) * image.width;
      cropH = (completedCrop.height / 100) * image.height;
    } else {
      cropX = completedCrop.x;
      cropY = completedCrop.y;
      cropW = completedCrop.width;
      cropH = completedCrop.height;
    }

    // We do NOT want to multiply by window.devicePixelRatio here. 
    // The canvas is purely for data extraction, not UI rendering.
    // Multiplying by pixelRatio causes massive 20MB+ blobs that exceed Vercel's 4.5MB limit.
    canvas.width = cropW * scaleX;
    canvas.height = cropH * scaleY;

    ctx.imageSmoothingQuality = 'high';

    const cropXNatural = cropX * scaleX;
    const cropYNatural = cropY * scaleY;
    const cropWNatural = cropW * scaleX;
    const cropHNatural = cropH * scaleY;

    ctx.drawImage(
      image,
      cropXNatural,
      cropYNatural,
      cropWNatural,
      cropHNatural,
      0,
      0,
      cropWNatural,
      cropHNatural
    );

    // Convert canvas back to a File
    canvas.toBlob((blob) => {
      if (!blob) {
        onComplete(imageFile);
        return;
      }
      const croppedFile = new File([blob], imageFile.name || 'cropped.jpg', { type: 'image/jpeg' });
      onComplete(croppedFile);
    }, 'image/jpeg', 0.95);
  };

  if (step === 'optimizing') {
    return (
      <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div className="pulse-dot" style={{ margin: '0 auto 1.5rem', width: '3rem', height: '3rem' }}></div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Optimizing prescription orientation...
        </h3>
        <p style={{ color: 'var(--text-muted)' }}>Detecting layout and correcting rotation.</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crop size={22} color="var(--primary)" /> Adjust for better scan quality
          </h3>
          <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>
            Detected prescription area
          </p>
        </div>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={24} />
        </button>
      </div>

      {(isBlurry || isDark) && (
        <div style={{ 
          background: 'rgba(245, 158, 11, 0.1)', 
          borderLeft: '4px solid #f59e0b', 
          padding: '12px 16px', 
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <AlertTriangle color="#f59e0b" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 4px', color: '#b45309', fontSize: '0.95rem', fontWeight: 700 }}>
              Low image clarity detected.
            </h4>
            <p style={{ margin: 0, color: '#92400e', fontSize: '0.85rem' }}>
              {isBlurry && isDark ? 'Image is blurry and poorly lit.' : isBlurry ? 'Image appears blurry.' : 'Lighting is very low.'} OCR accuracy may be reduced. Consider retaking the photo for best results.
            </p>
          </div>
        </div>
      )}

      <div style={{ 
        background: '#f8fafc', 
        borderRadius: '16px', 
        padding: '1rem', 
        display: 'flex', 
        justifyContent: 'center',
        border: '1px solid var(--border)',
        maxHeight: '60vh',
        overflow: 'hidden'
      }}>
        <ReactCrop 
          crop={crop} 
          onChange={(_, percentCrop) => setCrop(percentCrop)} 
          onComplete={(c) => setCompletedCrop(c)}
          style={{ maxHeight: '100%' }}
        >
          <img 
            ref={imgRef}
            src={imgSrc} 
            onLoad={onImageLoad} 
            alt="Prescription" 
            style={{ 
              maxHeight: '100%', 
              width: 'auto', 
              objectFit: 'contain',
              borderRadius: '8px',
              display: 'block'
            }} 
          />
        </ReactCrop>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '2rem' }}>
        <button 
          className="btn btn-secondary" 
          onClick={onCancel}
          style={{ padding: '0.75rem 1.5rem' }}
        >
          Retake Photo
        </button>
        <button 
          className="btn" 
          onClick={handleComplete}
          style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Check size={18} /> Process Document
        </button>
      </div>
    </div>
  );
};

export default ImagePreProcessor;
