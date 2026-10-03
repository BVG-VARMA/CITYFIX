import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  X, 
  ExternalLink
} from 'lucide-react';

export default function ImageZoomModal({ 
  src, 
  alt = 'Inspection Image', 
  title = 'Complaint Photo Inspection',
  subtitle = null,
  badge = null,
  badgeColor = 'cyan', // 'cyan' | 'emerald' | 'amber' | 'rose'
  onClose 
}) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 5.0;
  const STEP = 0.25;

  const handleZoomIn = () => {
    setScale(prev => Math.min(MAX_SCALE, Math.round((prev + STEP) * 100) / 100));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const next = Math.max(MIN_SCALE, Math.round((prev - STEP) * 100) / 100);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Double click quick-zoom toggle
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (scale > 1.2) {
      handleReset();
    } else {
      setScale(2.2);
    }
  };

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setScale(prev => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta));
      if (newScale <= 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Pan / Drag handlers
  const handleMouseDown = (e) => {
    if (scale <= 1) return; // Only drag when zoomed in
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || scale <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0' || e.key.toLowerCase() === 'r') {
        handleReset();
      } else if (e.key === 'ArrowRight' && scale > 1) {
        setPosition(p => ({ ...p, x: p.x - 40 }));
      } else if (e.key === 'ArrowLeft' && scale > 1) {
        setPosition(p => ({ ...p, x: p.x + 40 }));
      } else if (e.key === 'ArrowUp' && scale > 1) {
        setPosition(p => ({ ...p, y: p.y + 40 }));
      } else if (e.key === 'ArrowDown' && scale > 1) {
        setPosition(p => ({ ...p, y: p.y - 40 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, scale]);

  const badgeStyles = {
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  };

  return (
    <div 
      className="fixed inset-0 z-[3000] flex flex-col items-center justify-between bg-slate-950/94 backdrop-blur-xl select-none"
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Top Navigation Bar */}
      <div className="w-full z-20 px-4 sm:px-6 py-4 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent border-b border-cyan-500/20">
        
        {/* Title and Metadata */}
        <div className="flex items-center gap-3 min-w-0">
          {badge && (
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border shadow-sm ${badgeStyles[badgeColor] || badgeStyles.cyan}`}>
              {badge}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-100 truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Action: Close */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-[#0f2438]/80 border border-[#1e3857] text-xs font-mono text-cyan-400">
            <span>{Math.round(scale * 100)}%</span>
            {scale > 1 && <span className="text-[10px] text-slate-400">• Drag to pan</span>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-500 text-slate-300 hover:text-white transition-all border border-slate-700 hover:border-rose-400 active:scale-95 shadow-lg"
            title="Close Lightbox (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Main Image Stage */}
      <div 
        ref={containerRef}
        className={`relative flex-1 w-full h-full flex items-center justify-center overflow-hidden ${
          scale > 1 
            ? isDragging ? 'cursor-grabbing' : 'cursor-grab' 
            : 'cursor-zoom-in'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onDoubleClick={handleDoubleClick}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0, 0, 1)',
            transformOrigin: 'center center'
          }}
          className="flex items-center justify-center p-4 max-w-full max-h-full"
        >
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            draggable={false}
            className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl ring-1 ring-cyan-500/30 pointer-events-none"
          />
        </div>

        {/* Floating Hint Overlay on first load */}
        {scale === 1 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 text-[11px] text-slate-300 pointer-events-none hidden sm:flex items-center gap-2 shadow-xl animate-bounce">
            <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
            <span>Scroll or click +/- to zoom • Double-click to magnify</span>
          </div>
        )}
      </div>

      {/* Bottom Floating Controls Toolbar */}
      <div className="w-full z-20 pb-6 px-4 flex justify-center bg-gradient-to-t from-slate-950/90 to-transparent">
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-[#0a192f]/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl ring-1 ring-cyan-500/20">
          
          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= MIN_SCALE}
            className="p-2 sm:p-2.5 rounded-xl bg-[#0f2438] hover:bg-cyan-500/20 disabled:opacity-40 text-slate-200 hover:text-cyan-300 border border-[#1e3857] transition-all active:scale-95"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Current Scale Display & Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-[#0f2438] hover:bg-[#163558] text-xs font-mono font-bold text-cyan-400 hover:text-white border border-[#1e3857] transition-all"
            title="Reset Zoom & Rotation (0 / R)"
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= MAX_SCALE}
            className="p-2 sm:p-2.5 rounded-xl bg-[#0f2438] hover:bg-cyan-500/20 disabled:opacity-40 text-slate-200 hover:text-cyan-300 border border-[#1e3857] transition-all active:scale-95"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="w-px h-6 bg-[#1e3857] mx-1 sm:mx-1.5" />

          {/* Rotate */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 sm:p-2.5 rounded-xl bg-[#0f2438] hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-[#1e3857] transition-all active:scale-95"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Open Original in New Tab */}
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:p-2.5 rounded-xl bg-[#0f2438] hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-[#1e3857] transition-all active:scale-95 hidden sm:block"
            title="Open Original Image"
          >
            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>

          {/* Close Button on Dock */}
          <button
            type="button"
            onClick={onClose}
            className="px-3 sm:px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95 ml-1"
          >
            Done
          </button>

        </div>
      </div>

    </div>
  );
}
