
import React, { useRef } from 'react';

interface Props {
  isFormed: boolean;
  userPhotos: string[];
  onPhotoUpload: (urls: string[]) => void;
  onRemovePhoto: (index: number) => void;
}

export const UIOverlay: React.FC<Props> = ({ isFormed, userPhotos, onPhotoUpload, onRemovePhoto }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const urls = files.map(file => URL.createObjectURL(file as Blob));
      onPhotoUpload(urls);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-12 text-[#D4AF37]">
      <header className="flex justify-between items-start animate-fade-in">
        <div>
          <h1 className="text-5xl md:text-8xl font-luxury font-black tracking-tighter leading-none mb-2 drop-shadow-2xl">
            圣诞快乐
          </h1>
          <p className="text-sm md:text-lg uppercase tracking-[0.4em] font-luxury opacity-80">
            Merry Christmas Experience
          </p>
        </div>
        {/* Status 框已移除 */}
      </header>

      <div className="flex flex-col items-start gap-4 pointer-events-auto">
        {userPhotos.length > 0 && (
          <div className="flex flex-wrap gap-3 max-w-full overflow-x-auto pb-4 custom-scrollbar">
            {userPhotos.map((url, idx) => (
              <div key={idx} className="relative group w-16 h-16 border border-[#D4AF37]/40 overflow-hidden bg-black/50 shadow-lg">
                <img src={url} alt={`photo-${idx}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <button 
                  onClick={() => onRemovePhoto(idx)}
                  className="absolute top-0 right-0 bg-red-600/80 text-white w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-6">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#D4AF37] text-black px-10 py-5 font-luxury font-bold uppercase tracking-widest hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(212,175,55,0.3)] border-2 border-transparent active:scale-95"
          >
            上传照片
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            multiple 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1.5s ease-out forwards; }
        
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #D4AF37;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};
