
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  onGestureUpdate: (isFormed: boolean, x: number, y: number) => void;
}

export const VisionHandler: React.FC<Props> = ({ onGestureUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 160, height: 120, frameRate: 15 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsActive(true);
        }
      } catch (err) {
        console.error("Camera access denied", err);
        setError("Camera needed for gesture control");
      }
    }
    setupCamera();
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, 160, 120);
      const imageData = ctx.getImageData(0, 0, 160, 120);
      const data = imageData.data;

      let totalX = 0, totalY = 0, count = 0;
      let minX = 160, maxX = 0, minY = 120, maxY = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const brightness = (r + g + b) / 3;
        if (brightness > 180) {
          const x = (i / 4) % 160;
          const y = Math.floor((i / 4) / 160);
          totalX += x;
          totalY += y;
          count++;
          
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }

      if (count > 50) {
        const avgX = 1 - (totalX / count) / 160; 
        const avgY = (totalY / count) / 120;
        
        const spreadX = maxX - minX;
        const spreadY = maxY - minY;
        const area = spreadX * spreadY;
        
        const isOpen = area > 1800; 
        onGestureUpdate(!isOpen, avgX, avgY);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, onGestureUpdate]);

  return (
    <div className="fixed top-8 right-8 z-50 flex flex-col items-end gap-2">
      <div className="relative w-40 h-28 border-2 border-[#D4AF37]/60 rounded overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)] bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1] opacity-70" />
        <canvas ref={canvasRef} width={160} height={120} className="hidden" />
        <div className="absolute inset-0 flex items-center justify-center text-[8px] text-[#D4AF37] font-luxury bg-black/40 pointer-events-none">
          {isActive ? '' : error || 'CAMERA STARTING...'}
        </div>
      </div>
      <p className="text-[9px] text-[#D4AF37]/40 font-luxury uppercase tracking-widest text-right max-w-[140px]">
        Gesture Tracking Active
      </p>
    </div>
  );
};
