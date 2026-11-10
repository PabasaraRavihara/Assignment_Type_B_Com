import React, { useMemo } from 'react';
import { renderQRSVG } from '../utils/qrGenerator';

export default function QRCodeView({ value = 'ASHADI-WO', size = 150, fgColor = '#000000', bgColor = '#ffffff' }) {
  const qrData = useMemo(() => {
    try {
      return renderQRSVG(value || 'ASHADI-WO', size);
    } catch (e) {
      console.error('QR code generation error:', e);
      return null;
    }
  }, [value, size]);

  if (!qrData) {
    return (
      <div style={{ width: size, height: size, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '11px', border: '1px dashed #cbd5e1' }}>
        QR Error
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-block', padding: '6px', background: bgColor, borderRadius: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        shapeRendering="crispEdges"
        style={{ display: 'block' }}
      >
        <rect width={size} height={size} fill={bgColor} />
        <path d={qrData.pathD} fill={fgColor} />
      </svg>
    </div>
  );
}
