
import React, { useState, useRef } from 'react';
import { LucideX, LucideDownload, LucideMousePointer2, LucideMove, LucideImage } from 'lucide-react';

interface ImageZoomModalProps {
  url: string;
  label: string;
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ url, label, onClose }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.5, scale + delta), 6);
    setScale(newScale);
    if (newScale <= 1) setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX - offset.x, y: clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setOffset({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y
    });
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `${label.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    link.click();
  };

  return (
    <div 
      className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-2xl flex flex-col animate-fadeIn select-none touch-none"
      onClick={onClose}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={handleMouseMove}
      onTouchEnd={() => setIsDragging(false)}
    >
      <div className="p-8 flex justify-between items-center bg-white/5 border-b border-white/10 relative z-[2001]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><LucideImage size={24}/></div>
          <div>
            <h4 className="text-white font-black uppercase italic tracking-tighter text-xl">{label}</h4>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">FleetPro Advanced Imaging</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-6 text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-2"><LucideMousePointer2 size={14} className="text-blue-500"/> Zoom: {Math.round(scale * 100)}%</span>
            <span className="flex items-center gap-2"><LucideMove size={14} className="text-emerald-500"/> Arrastrar para mover</span>
          </div>
          <button onClick={handleDownload} className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-all shadow-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
            <LucideDownload size={20}/> Descargar
          </button>
          <button onClick={onClose} className="p-4 bg-white/10 text-white rounded-2xl hover:bg-rose-600 transition-colors shadow-2xl">
            <LucideX size={24}/>
          </button>
        </div>
      </div>
      
      <div 
        className={`flex-1 relative flex items-center justify-center overflow-hidden ${scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div 
          className="transition-transform duration-75 ease-out will-change-transform"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          onClick={e => e.stopPropagation()}
        >
          <img 
            src={url} 
            className="max-w-[85vw] max-h-[75vh] object-contain shadow-[0_0_100px_rgba(0,0,0,0.4)] rounded-lg pointer-events-none"
            alt="Zoom"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
};
