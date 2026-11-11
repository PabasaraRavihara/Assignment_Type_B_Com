import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function QRCodeView({ value = 'ASHADI-WO', size = 150, fgColor = '#000000', bgColor = '#ffffff' }) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value || 'ASHADI-WO', {
      width: Math.max(size * 2, 220),
      margin: 1,
      color: {
        dark: fgColor,
        light: bgColor
      },
      errorCorrectionLevel: 'M'
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
    <div style={{ display: 'inline-block', padding: '3px', background: bgColor, borderRadius: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
      <img
        src={dataUrl}
        width={size}
        height={size}
        alt="Bench Traveler QR Code"
        style={{ display: 'block', imageRendering: 'pixelated' }}
      />
    </div>
  );
}
