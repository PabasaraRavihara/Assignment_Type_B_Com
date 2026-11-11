import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';

export default function QRCodeView({ 
  value = 'ASHADI-WO', 
  size = 150, 
  fgColor = '#000000', 
  bgColor = '#ffffff',
  allowEnlarge = true 
}) {
  const [dataUrl, setDataUrl] = useState('');
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value || 'ASHADI-WO', {
      width: Math.max(size * 2, 280),
      margin: 1,
      color: {
        dark: fgColor,
        light: bgColor
      },
      errorCorrectionLevel: 'L'
    }).then(url => {
      if (isMounted) setDataUrl(url);
    }).catch(err => {
      console.error('QR generation error:', err);
    });

    return () => { isMounted = false; };
  }, [value, size, fgColor, bgColor]);

  if (!dataUrl) {
    return (
      <div style={{ width: size, height: size, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '9px', border: '1px dashed #cbd5e1' }}>
        Loading QR...
      </div>
    );
  }

  return (
    <>
      <div 
        onClick={(e) => {
          if (allowEnlarge) {
            e.stopPropagation();
            setIsEnlarged(true);
          }
        }}
        title={allowEnlarge ? "Click to enlarge for phone scanning" : undefined}
        style={{ 
          display: 'inline-block', 
          padding: '2px', 
          background: bgColor, 
          borderRadius: '4px', 
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          cursor: allowEnlarge ? 'zoom-in' : 'default'
        }}
      >
        <img
          src={dataUrl}
          width={size}
          height={size}
          alt="Bench Traveler QR Code"
          style={{ display: 'block', imageRendering: 'pixelated' }}
        />
      </div>

      {/* Enlarged Modal for Screen Scanning */}
      {isEnlarged && createPortal(
        <div 
          className="no-print"
          onClick={() => setIsEnlarged(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                  📱 Scan Traveler QR Code
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                  Point your phone camera here to scan instantly
                </p>
              </div>
              <button
                onClick={() => setIsEnlarged(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* High-res Enlarged QR */}
            <div style={{ display: 'inline-block', padding: '14px', background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '12px' }}>
              <img
                src={dataUrl}
                width={250}
                height={250}
                alt="Enlarged QR Code"
                style={{ display: 'block', imageRendering: 'pixelated' }}
              />
            </div>

            {/* Embedded Payload Preview */}
            <div style={{ 
              textAlign: 'left', 
              background: '#0f172a', 
              color: '#38bdf8', 
              border: '1px solid #1e293b', 
              borderRadius: '8px', 
              padding: '10px 12px', 
              maxHeight: '130px', 
              overflowY: 'auto', 
              marginBottom: '14px', 
              fontSize: '10.5px', 
              fontFamily: 'Consolas, monospace', 
              lineHeight: '1.45',
              whiteSpace: 'pre-wrap'
            }}>
              {value}
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(value);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  background: copied ? '#10b981' : '#f1f5f9',
                  color: copied ? '#ffffff' : '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {copied ? '✓ Copied Details!' : '📋 Copy All Details'}
              </button>
              <button
                onClick={() => setIsEnlarged(false)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
