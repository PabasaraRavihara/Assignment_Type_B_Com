import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move
} from 'lucide-react';
import { getLuxuryJewellerySvg } from '../utils/designImages';

export default function JewelleryPhotoZoomModal({
  isOpen,
  onClose,
  data
}) {
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 });
  const containerRef = useRef(null);

  // Reset zoom & pan when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setZoomScale(1);
      setPan({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen, data?.url]);

  // Non-passive wheel event listener to handle mouse scroll zoom smoothly without page scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setZoomScale((prev) => {
        const next = Math.min(5, Math.max(1, +(prev + delta).toFixed(2)));
        if (next === 1) {
          setPan({ x: 0, y: 0 });
        }
        return next;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  // Keyboard navigation (+, -, 0, Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoomScale(prev => Math.min(5, +(prev + 0.35).toFixed(2)));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoomScale(prev => {
          const next = Math.max(1, +(prev - 0.35).toFixed(2));
          if (next === 1) setPan({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === '0') {
        e.preventDefault();
        setZoomScale(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (zoomScale <= 1) return;
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: pan.x,
      panY: pan.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (zoomScale > 1) {
      setZoomScale(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoomScale(2.5);
    }
  };

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(5, +(prev + 0.5).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoomScale(prev => {
      const next = Math.max(1, +(prev - 0.5).toFixed(2));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
  };

  if (!isOpen || !data) return null;

  return (
    <div 
      className="modal-backdrop-luxury"
      onClick={onClose}
      style={{ zIndex: 12000 }}
    >
      <div 
        className="modal-window-luxury jewellery-zoom-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '840px',
          width: '95vw',
          maxHeight: '92vh',
          padding: '0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card, #0f172a)',
          border: '1.5px solid #d4af37',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.92)'
        }}
      >
        {/* Modal Top Bar */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '800',
              color: '#d4af37',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid rgba(212, 175, 55, 0.4)'
            }}>
              {data.code}
            </span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #fff)', fontFamily: 'var(--font-serif)' }}>
              {data.title}
            </h3>
            {data.metal && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                color: '#fef08a',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {data.metal}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-ghost-secondary"
            style={{
              padding: '6px',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close Zoom View (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* High-Resolution Interactive Zoom Viewport */}
        <div 
          ref={containerRef}
          className="design-modal-photo-preview"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'relative',
            width: '100%',
            height: '480px',
            maxHeight: '56vh',
            background: 'radial-gradient(circle at center, #111827 0%, #030712 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            userSelect: 'none',
            touchAction: 'none'
          }}
        >
          {/* Jewellery Image */}
          <img 
            src={data.url} 
            alt={data.title}
            draggable={false}
            onDoubleClick={handleDoubleClick}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getLuxuryJewellerySvg(data.category, data.metal);
            }}
            style={{
              maxWidth: '92%',
              maxHeight: '92%',
              objectFit: 'contain',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0, 0.2, 1)',
              pointerEvents: 'auto',
              boxShadow: zoomScale > 1.2 ? '0 10px 40px rgba(0, 0, 0, 0.7)' : 'none'
            }}
          />

          {/* Floating Zoom Control Bar */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: 'rgba(10, 15, 29, 0.88)',
            border: '1.5px solid rgba(212, 175, 55, 0.55)',
            borderRadius: '30px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
            zIndex: 10
          }}>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomScale <= 1}
              style={{
                background: 'transparent',
                border: 'none',
                color: zoomScale <= 1 ? '#475569' : '#fef08a',
                cursor: zoomScale <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '50%'
              }}
              title="Zoom Out (-)"
            >
              <ZoomOut size={16} />
            </button>

            {/* Percentage Badge */}
            <span 
              onClick={handleResetZoom}
              style={{
                fontSize: '12px',
                fontWeight: '800',
                color: zoomScale > 1 ? '#38bdf8' : '#e2e8f0',
                padding: '2px 8px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                minWidth: '55px',
                textAlign: 'center',
                cursor: 'pointer',
                letterSpacing: '0.5px'
              }}
              title="Click to reset to 100%"
            >
              {Math.round(zoomScale * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomScale >= 5}
              style={{
                background: 'transparent',
                border: 'none',
                color: zoomScale >= 5 ? '#475569' : '#fef08a',
                cursor: zoomScale >= 5 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '50%'
              }}
              title="Zoom In (+)"
            >
              <ZoomIn size={16} />
            </button>

            <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.15)', margin: '0 2px' }} />

            <button
              type="button"
              onClick={handleResetZoom}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '2px 6px'
              }}
              title="Reset Zoom to 100% (Key: 0)"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          {/* Pan / Move Indicator Pill when zoomed in */}
          {zoomScale > 1 && (
            <div style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              background: 'rgba(16, 185, 129, 0.25)',
              border: '1px solid rgba(16, 185, 129, 0.6)',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#34d399',
              zIndex: 10,
              backdropFilter: 'blur(6px)'
            }}>
              <Move size={12} />
              <span>Drag to Pan Photo</span>
            </div>
          )}

          {/* Mouse Scroll Tip Top Right */}
          <div style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            padding: '3px 9px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '15px',
            fontSize: '10.5px',
            color: '#94a3b8',
            zIndex: 10,
            backdropFilter: 'blur(6px)'
          }}>
            🖱️ Scroll wheel to zoom
          </div>
        </div>

        {/* Modal Info Footer */}
        <div style={{
          padding: '16px 22px',
          background: 'var(--bg-card, #0f172a)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary, #cbd5e1)', margin: 0, flex: 1, lineHeight: '1.4' }}>
              {data.desc || 'High precision handcrafted jewellery piece with detailed filigree and prong setting.'}
            </p>

            {data.totalSMT && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Standard Time</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fef08a' }}>{data.totalSMT} min</div>
                </div>
                {data.labourCost && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Labour Cost</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399' }}>Rs. {data.labourCost.toLocaleString()}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              💡 <strong>Shortcuts:</strong> Mouse Wheel = Zoom In/Out • Click & Drag = Pan Details • Double-click = 2.5x Toggle • [Esc] = Close
            </span>
            <button
              type="button"
              className="btn-gold-primary"
              onClick={onClose}
              style={{ padding: '6px 18px', fontSize: '12px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
