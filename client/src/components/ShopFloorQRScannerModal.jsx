import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  Pause, 
  Play, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Coffee, 
  Utensils, 
  ArrowRight, 
  ShieldCheck, 
  Scale,
  Building2,
  Calendar,
  Gem,
  Scissors
} from 'lucide-react';
import { 
  formatMinutesToTime, 
  calculateDynamicETA, 
  timeStringToMinutes, 
  getMetalScrapCeiling 
} from '../utils/floorTiming';

export default function ShopFloorQRScannerModal({
  isOpen,
  onClose,
  allocations = [],
  onUpdateAllocation
}) {
  const [scanInput, setScanInput] = useState('');
  const [scannedOrder, setScannedOrder] = useState(null);
  const [scanMessage, setScanMessage] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isAutoMode, setIsAutoMode] = useState(true); // 1-Scan Instant Auto Mode by default
  const videoRef = useRef(null);
  const inputRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Auto-focus input for USB barcode scanner guns
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 300);
    }
  }, [isOpen]);

  // Clean up camera on close
  useEffect(() => {
    if (!isOpen && isCameraActive) {
      stopCamera();
    }
  }, [isOpen]);

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // High-performance Continuous Camera QR Code Scanner via jsQR + Native BarcodeDetector
  useEffect(() => {
    let animId;
    let isProcessing = false;
    let barcodeDetector = null;

    if ('BarcodeDetector' in window) {
      try {
        barcodeDetector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39']
        });
      } catch (e) {}
    }

    const scanFrame = async () => {
      if (!isCameraActive || !videoRef.current) return;
      const video = videoRef.current;

      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0 && !isProcessing) {
        let detected = null;

        // 1. Try native hardware BarcodeDetector if supported
        if (barcodeDetector) {
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              detected = barcodes[0].rawValue;
            }
          } catch (e) {}
        }

        // 2. High-speed jsQR fallback (100% universal across iOS, Android, Desktop)
        if (!detected) {
          try {
            if (!canvasRef.current) {
              canvasRef.current = document.createElement('canvas');
            }
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            // Optimal scale for fast QR decoding (480px max width)
            const scale = Math.min(1, 480 / video.videoWidth);
            canvas.width = Math.floor(video.videoWidth * scale);
            canvas.height = Math.floor(video.videoHeight * scale);

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qr = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            });

            if (qr && qr.data) {
              detected = qr.data;
            }
          } catch (e) {}
        }

        if (detected) {
          isProcessing = true;
          handleProcessCode(detected);
          // Pause slightly before next scan to prevent double triggering
          setTimeout(() => {
            isProcessing = false;
          }, 1500);
        }
      }

      if (isCameraActive) {
        animId = requestAnimationFrame(scanFrame);
      }
    };

    if (isCameraActive) {
      animId = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isCameraActive, allocations]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not supported on this device/browser.');
      }

      // First set camera active so viewport is ready
      setIsCameraActive(true);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play caught:', playErr);
        }
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      let errMsg = 'Camera access denied or unavailable.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = '⚠️ Camera permission was blocked. Please click the Lock icon or camera icon in your browser URL bar and set Camera to "Allow", then try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = '⚠️ No camera device was detected on this computer/phone.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = '⚠️ Camera is currently in use by another app or browser tab.';
      }
      setCameraError(errMsg);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Perform floor state transition directly on target order
  const executeAction = (targetOrder, actionType) => {
    if (!targetOrder || !onUpdateAllocation) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const formattedNow = formatMinutesToTime(now.getHours() * 60 + now.getMinutes());

    let updated = { ...targetOrder };
    let logText = '';

    if (actionType === 'START') {
      updated.dispatchTime = timeStr;
      updated.status = 'In Progress';
      logText = `▶ [${formattedNow}] Started bench for ${targetOrder.craftsmanName} (${targetOrder.workOrder})`;
    } else if (actionType === 'PAUSE_TEA') {
      updated.status = 'Paused (Tea Break)';
      logText = `☕ [${formattedNow}] Paused for Tea Break - ${targetOrder.craftsmanName} (${targetOrder.workOrder})`;
    } else if (actionType === 'PAUSE_LUNCH') {
      updated.status = 'Paused (Lunch Interval)';
      logText = `🍱 [${formattedNow}] Paused for Plant Lunch - ${targetOrder.craftsmanName} (${targetOrder.workOrder})`;
    } else if (actionType === 'RESUME') {
      updated.status = 'In Progress';
      logText = `▶ [${formattedNow}] Resumed bench work - ${targetOrder.craftsmanName} (${targetOrder.workOrder})`;
    } else if (actionType === 'COMPLETE') {
      const startParts = (targetOrder.dispatchTime || '08:00').split(':');
      const startMin = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
      const curMin = now.getHours() * 60 + now.getMinutes();
      const elapsedHours = Math.max(0.5, parseFloat(((curMin - startMin) / 60).toFixed(1)));
      
      updated.actualHours = elapsedHours;
      updated.status = 'Completed';
      const assumed = updated.assumedHours || (updated.budgetedSMT / 60);
      updated.varianceHours = parseFloat((elapsedHours - assumed).toFixed(2));
      updated.variancePct = assumed > 0 ? parseFloat(((updated.varianceHours / assumed) * 100).toFixed(1)) : 0;
      logText = `✅ [${formattedNow}] Completed & Vault Check-In: ${targetOrder.craftsmanName} (${elapsedHours} hrs)`;
    }

    const targetId = targetOrder.id || targetOrder._id;
    onUpdateAllocation(targetId, updated);
    setScannedOrder(updated);
    setScanHistory(prev => [logText, ...prev.slice(0, 7)]);
    setScanMessage({ type: 'SUCCESS', text: logText });
  };

  // Find order by Work Order # or Allocation ID
  const handleProcessCode = (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) return;

    // Check for Action Barcodes (e.g. from wall sticker barcodes)
    if (trimmed.startsWith('ACTION:')) {
      const act = trimmed.replace('ACTION:', '').toUpperCase();
      if (scannedOrder) {
        if (act === 'DINNER' || act === 'PAUSE_DINNER') executeAction(scannedOrder, 'PAUSE_DINNER');
        else if (act === 'BREAKFAST' || act === 'PAUSE_BREAKFAST') executeAction(scannedOrder, 'PAUSE_BREAKFAST');
        else if (act === 'TEA' || act === 'PAUSE_TEA') executeAction(scannedOrder, 'PAUSE_TEA');
        else if (act === 'LUNCH' || act === 'PAUSE_LUNCH') executeAction(scannedOrder, 'PAUSE_LUNCH');
        else if (act === 'RESUME') executeAction(scannedOrder, 'RESUME');
        else if (act === 'COMPLETE' || act === 'VAULT') executeAction(scannedOrder, 'COMPLETE');
      }
      setScanInput('');
      return;
    }

    // Extract Work Order code if a full traveler text or URL was scanned
    let targetCode = trimmed;
    const woMatch = trimmed.match(/ORDER ID:\s*([^\n\r]+)/i) || 
                    trimmed.match(/wo=([a-zA-Z0-9_-]+)/i) || 
                    trimmed.match(/(WO-[a-zA-Z0-9_-]+)/i) ||
                    trimmed.match(/(AL-[0-9]+)/i);
    if (woMatch && woMatch[1]) {
      targetCode = woMatch[1].trim();
    }

    // Search in allocations
    const found = allocations.find(a => 
      (a.workOrder && (a.workOrder.toLowerCase() === targetCode.toLowerCase() || trimmed.toLowerCase().includes(a.workOrder.toLowerCase()))) ||
      (a.id && (a.id.toLowerCase() === targetCode.toLowerCase() || trimmed.toLowerCase().includes(a.id.toLowerCase()))) ||
      (a.craftsmanId && a.craftsmanId.toLowerCase() === targetCode.toLowerCase())
    );

    if (found) {
      if (isAutoMode) {
        const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
        const isPaused = found.status && found.status.includes('Paused');
        const isCompleted = found.status === 'Completed' || (found.actualHours !== null && found.actualHours !== undefined);

        if (!isCompleted) {
          if (!found.dispatchTime || found.status === 'Standby') {
            // Auto Clock-in / Start Bench in the morning
            executeAction(found, 'START');
          } else if (isPaused) {
            // Returning from break: Auto-Resume!
            executeAction(found, 'RESUME');
          } else {
            // Stepping away from bench: Auto-Pause to Breakfast, Tea, or Lunch based on current hour!
            if (nowMin >= 8 * 60 + 15 && nowMin <= 9 * 60 + 15) {
              executeAction(found, 'PAUSE_BREAKFAST');
            } else if (nowMin >= 12 * 60 + 30 && nowMin <= 14 * 60 + 30) {
              executeAction(found, 'PAUSE_LUNCH');
            } else if (nowMin >= 19 * 60 && nowMin <= 20 * 60 + 15) {
              executeAction(found, 'PAUSE_DINNER');
            } else {
              executeAction(found, 'PAUSE_TEA');
            }
          }
          setScanInput('');
          return;
        }
      }

      setScannedOrder(found);
      setScanMessage({
        type: 'SUCCESS',
        text: `Identified ${found.workOrder} (${found.craftsmanName} • ${found.craftsmanId})`
      });
    } else {
      setScanMessage({
        type: 'ERROR',
        text: `No work order found matching "${trimmed}". Check work order code.`
      });
    }
    setScanInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleProcessCode(scanInput);
    }
  };

  const handleAction = (actionType) => {
    if (!scannedOrder) return;
    executeAction(scannedOrder, actionType);
  };

  if (!isOpen) return null;

  const isPaused = scannedOrder && (scannedOrder.status && scannedOrder.status.includes('Paused'));
  const isCompleted = scannedOrder && (scannedOrder.status === 'Completed' || scannedOrder.actualHours !== null);
  const isStarted = scannedOrder && scannedOrder.dispatchTime && scannedOrder.status !== 'Standby';

  const scannedStartMin = scannedOrder ? timeStringToMinutes(scannedOrder.dispatchTime, 510) : 510;
  const scannedBudgetedSMT = scannedOrder ? (scannedOrder.budgetedSMT || (scannedOrder.assumedHours ? scannedOrder.assumedHours * 60 : 240)) : 240;
  const scannedEta = scannedOrder ? calculateDynamicETA(scannedStartMin, scannedBudgetedSMT, scannedOrder.skillTier || 'Grade B') : null;
  const scannedCeiling = scannedOrder ? getMetalScrapCeiling(scannedOrder.metalType) : 3.5;

  // Smart Shift Clock Break Window Detection
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const isBreakfastWindow = (nowMin >= 8 * 60 + 15 && nowMin <= 9 * 60 + 15);
  const isTeaWindow = (nowMin >= 10 * 60 && nowMin <= 11 * 60 + 30) || (nowMin >= 15 * 60 + 45 && nowMin <= 17 * 60);
  const isLunchWindow = (nowMin >= 12 * 60 + 30 && nowMin <= 14 * 60 + 30);
  const isDinnerWindow = (nowMin >= 19 * 60 && nowMin <= 20 * 60 + 15);

  return (
    <div className="modal-backdrop-luxury" onClick={onClose}>
      <div className="modal-window-luxury" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(212, 175, 55, 0.2)', padding: '8px', borderRadius: '8px' }}>
              <QrCode size={22} color="#d4af37" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fef08a', fontSize: '18px', fontWeight: 'bold' }}>
                Shop Floor QR & Barcode Kiosk
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                Shared touchscreen or barcode scanner terminal for craftsmen without computers.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-luxury-close" 
            onClick={onClose}
            title="Close Kiosk (or press Esc)"
          >
            ✕
          </button>
        </div>

        {/* Scanner Input / Camera Area */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          {/* 1-Scan Instant Auto-Mode Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isAutoMode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isAutoMode ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
            padding: '8px 12px',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
              <input 
                type="checkbox"
                checked={isAutoMode}
                onChange={(e) => setIsAutoMode(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: isAutoMode ? '#4ade80' : '#cbd5e1' }}>
                ⚡ Instant 1-Scan Auto-Update (Beep & Done — No Clicks Needed)
              </span>
            </label>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {isAutoMode ? 'Auto Start / Pause / Resume on scan' : 'Manual button confirmation'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input 
              ref={inputRef}
              type="text"
              placeholder="Scan QR with gun or type Work Order (e.g. WO-EXT-9821)..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ flex: 1, fontSize: '14px', fontWeight: 'bold', color: '#38bdf8' }}
            />
            <button 
              type="button" 
              className="btn-gold-primary" 
              onClick={() => handleProcessCode(scanInput)}
              style={{ padding: '0 18px', fontSize: '13px' }}
            >
              Scan / Lookup
            </button>
            <button
              type="button"
              className="btn-ghost-secondary"
              onClick={() => isCameraActive ? stopCamera() : startCamera()}
              style={{
                borderColor: isCameraActive ? '#ef4444' : '#eab308',
                color: isCameraActive ? '#fca5a5' : '#fef08a',
                background: isCameraActive ? 'rgba(239, 68, 68, 0.18)' : 'rgba(234, 179, 8, 0.18)',
                fontWeight: 'bold',
                padding: '0 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Toggle smartphone or device camera scanner"
            >
              <Camera size={16} color={isCameraActive ? '#ef4444' : '#facc15'} />
              <span>{isCameraActive ? '⏹️ Stop Camera' : '📷 Start Camera'}</span>
            </button>
          </div>

          {/* Camera Viewport (Always in DOM so videoRef is never null) */}
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '240px', 
            background: '#090d16', 
            border: '1.5px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '10px', 
            overflow: 'hidden', 
            marginBottom: '14px',
            display: isCameraActive ? 'block' : 'none',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)'
          }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '170px',
              height: '170px',
              border: '2.5px solid #38bdf8',
              borderRadius: '12px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
              pointerEvents: 'none'
            }} />
            <div style={{ 
              position: 'absolute', 
              bottom: '10px', 
              left: 0, 
              right: 0, 
              textAlign: 'center', 
              color: '#f8fafc', 
              fontSize: '11px', 
              fontWeight: '700',
              textShadow: '0 1px 4px #000' 
            }}>
              📷 Hold craftsman's printed QR card within the square
            </div>
          </div>

          {cameraError && (
            <div style={{ fontSize: '11px', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 10px', borderRadius: '6px', marginBottom: '8px' }}>
              {cameraError}
            </div>
          )}

          {/* Toast / Message */}
          {scanMessage && (
            <div style={{
              background: scanMessage.type === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${scanMessage.type === 'SUCCESS' ? '#10b981' : '#ef4444'}`,
              color: scanMessage.type === 'SUCCESS' ? '#4ade80' : '#fca5a5',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {scanMessage.type === 'SUCCESS' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              <span>{scanMessage.text}</span>
            </div>
          )}
        </div>

        {/* Identified Order Action Screen */}
        {scannedOrder ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            {/* Header: ORDER ID Badge, Date, Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', paddingBottom: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fef3c7', border: '1px solid #d97706', padding: '3px 8px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#92400e', textTransform: 'uppercase' }}>ORDER ID:</span>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: '#92400e', letterSpacing: '0.4px' }}>
                    {scannedOrder.workOrder || scannedOrder.id}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
                  <Calendar size={13} color="#d4af37" />
                  <span>Shift Date: <strong style={{ color: '#cbd5e1' }}>{scannedOrder.date || 'Today'}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: isCompleted ? 'rgba(148, 163, 184, 0.2)' : isPaused ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: isCompleted ? '#cbd5e1' : isPaused ? '#fbbf24' : '#4ade80',
                  border: `1px solid ${isCompleted ? '#94a3b8' : isPaused ? '#f59e0b' : '#10b981'}`
                }}>
                  Status: {scannedOrder.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Order Channel & Destination Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '8px 12px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={15} color="#38bdf8" />
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Order Channel:</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: scannedOrder.channel === 'EXTERNAL_SHOP' ? 'rgba(245, 158, 11, 0.2)' :
                              scannedOrder.channel === 'OWNER_SPECIAL' ? 'rgba(192, 132, 252, 0.2)' :
                              scannedOrder.channel === 'FACTORY_STOCK' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                  color: scannedOrder.channel === 'EXTERNAL_SHOP' ? '#fbbf24' :
                         scannedOrder.channel === 'OWNER_SPECIAL' ? '#d8b4fe' :
                         scannedOrder.channel === 'FACTORY_STOCK' ? '#cbd5e1' : '#38bdf8',
                  border: `1px solid ${
                    scannedOrder.channel === 'EXTERNAL_SHOP' ? '#f59e0b' :
                    scannedOrder.channel === 'OWNER_SPECIAL' ? '#c084fc' :
                    scannedOrder.channel === 'FACTORY_STOCK' ? '#94a3b8' : '#0284c7'
                  }`
                }}>
                  {scannedOrder.channel === 'EXTERNAL_SHOP' ? '🏢 B2B External Retail Jeweller' :
                   scannedOrder.channel === 'OWNER_SPECIAL' ? '👑 Owner VIP Private Commission' :
                   scannedOrder.channel === 'FACTORY_STOCK' ? '📦 Central Factory Stock' : '🏬 Ashadi Branch Showroom'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 'bold' }}>
                <span style={{ color: '#94a3b8', fontWeight: 'normal', fontSize: '11px' }}>Destination: </span>
                {scannedOrder.channelName || (scannedOrder.channel === 'EXTERNAL_SHOP' ? 'External Jeweller Shop' : 'Ashadi Flagship Showroom')}
              </div>
            </div>

            {/* Craftsman, Design & Precious Metal Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '12px' }}>
              {/* Craftsman Info */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '2px' }}>
                  Assigned Craftsman:
                </div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#f8fafc', lineHeight: '1.2' }}>
                  {scannedOrder.craftsmanName}
                </div>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', marginTop: '2px' }}>
                  Bench {scannedOrder.craftsmanId} • {scannedOrder.skillTier || 'Grade B'} ({scannedOrder.skillTier === 'Grade A' ? '110% Speed' : scannedOrder.skillTier === 'Grade C' ? '85% Speed' : '100% Speed'})
                </div>
              </div>

              {/* Design Info */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '2px' }}>
                  Design & Target Quantity:
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f8fafc', lineHeight: '1.2' }}>
                  {scannedOrder.designCode} — {scannedOrder.designName || 'Handcrafted Design'}
                </div>
                <div style={{ fontSize: '11px', color: '#fef08a', fontWeight: 'bold', marginTop: '2px' }}>
                  Target Qty: {scannedOrder.qtyAllocated || 1} pcs • SMT: {scannedBudgetedSMT}m ({(scannedBudgetedSMT / 60).toFixed(1)} hrs)
                </div>
              </div>
            </div>

            {/* Precious Metal & Scrap Ceiling Banner */}
            <div style={{
              background: 'rgba(254, 243, 199, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '6px',
              padding: '8px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gem size={15} color="#f59e0b" />
                <span style={{ fontSize: '11px', color: '#fcd34d', fontWeight: 'bold' }}>
                  Precious Metal: <strong style={{ color: '#fff' }}>{scannedOrder.metalType || 'Gold 22K'}</strong>
                </span>
                <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                  • Gold Issued: <strong style={{ color: '#fef08a' }}>{scannedOrder.goldIssuedGrams ? `${scannedOrder.goldIssuedGrams}g` : 'Standard Weight'}</strong>
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 'bold' }}>
                Allowable Scrap Ceiling: <strong style={{ color: '#fef08a' }}>max {scannedCeiling}%</strong>
              </div>
            </div>

            {/* Shift Timing & Target ETA Strip */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(56, 189, 248, 0.12) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '6px',
              padding: '8px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '14px'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Dispatched / Start
                </div>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#f8fafc' }}>
                  {formatMinutesToTime(scannedStartMin)}
                </div>
              </div>

              <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', borderRight: '1px solid rgba(255, 255, 255, 0.1)', padding: '0 14px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Breaks Added
                </div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>
                  +{scannedEta?.totalBreakMinutesEncountered || 0}m
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#4ade80', textTransform: 'uppercase', fontWeight: '900' }}>
                  🎯 TARGET FINISH (ETA)
                </div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#4ade80', background: 'rgba(16, 185, 129, 0.25)', padding: '2px 10px', borderRadius: '4px', border: '1px solid #10b981', display: 'inline-block' }}>
                  {scannedEta?.targetETATime || '05:00 PM'}
                </div>
              </div>
            </div>

            {/* Quick Floor Action Buttons for Craftsman */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '14px' }}>
              {!isStarted && (
                <button
                  type="button"
                  onClick={() => handleAction('START')}
                  className="btn-gold-primary"
                  style={{ padding: '10px 8px', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                >
                  <Play size={18} />
                  <span>Clock-In / Start</span>
                </button>
              )}

              {isPaused ? (
                <button
                  type="button"
                  onClick={() => handleAction('RESUME')}
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10b981',
                    color: '#4ade80',
                    padding: '10px 8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Play size={18} />
                  <span>Resume Bench Work</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleAction('PAUSE_BREAKFAST')}
                    disabled={isCompleted}
                    style={{
                      background: isBreakfastWindow ? 'rgba(234, 179, 8, 0.28)' : 'rgba(234, 179, 8, 0.15)',
                      border: isBreakfastWindow ? '2px solid #facc15' : '1px solid rgba(234, 179, 8, 0.4)',
                      boxShadow: isBreakfastWindow ? '0 0 12px rgba(250, 204, 21, 0.35)' : 'none',
                      color: '#fef08a',
                      padding: '10px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🥣</span>
                    <span>Breakfast {isBreakfastWindow ? '⭐ (Now)' : ''}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('PAUSE_TEA')}
                    disabled={isCompleted}
                    style={{
                      background: isTeaWindow ? 'rgba(245, 158, 11, 0.28)' : 'rgba(245, 158, 11, 0.15)',
                      border: isTeaWindow ? '2px solid #fbbf24' : '1px solid rgba(245, 158, 11, 0.4)',
                      boxShadow: isTeaWindow ? '0 0 12px rgba(251, 191, 36, 0.35)' : 'none',
                      color: '#fbbf24',
                      padding: '10px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Coffee size={18} />
                    <span>☕ Tea Break {isTeaWindow ? '⭐ (Now)' : ''}</span>
                  </button>

                                    <button
                    type="button"
                    onClick={() => handleAction('PAUSE_DINNER')}
                    disabled={isCompleted}
                    style={{
                      background: isDinnerWindow ? 'rgba(217, 119, 6, 0.28)' : 'rgba(217, 119, 6, 0.15)',
                      border: isDinnerWindow ? '2px solid #f59e0b' : '1px solid rgba(217, 119, 6, 0.4)',
                      boxShadow: isDinnerWindow ? '0 0 12px rgba(245, 158, 11, 0.35)' : 'none',
                      color: '#fbbf24',
                      padding: '10px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🍛</span>
                    <span>Dinner {isDinnerWindow ? '⭐ (Now)' : ''}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('PAUSE_LUNCH')}
                    disabled={isCompleted}
                    style={{
                      background: isLunchWindow ? 'rgba(56, 189, 248, 0.28)' : 'rgba(56, 189, 248, 0.15)',
                      border: isLunchWindow ? '2px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.4)',
                      boxShadow: isLunchWindow ? '0 0 12px rgba(56, 189, 248, 0.35)' : 'none',
                      color: '#38bdf8',
                      padding: '10px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Utensils size={18} />
                    <span>🍱 Lunch Break {isLunchWindow ? '⭐ (Now)' : ''}</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => handleAction('COMPLETE')}
                disabled={isCompleted}
                style={{
                  background: isCompleted ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.2)',
                  border: `1px solid ${isCompleted ? 'rgba(255, 255, 255, 0.1)' : '#10b981'}`,
                  color: isCompleted ? '#64748b' : '#4ade80',
                  padding: '10px 8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: isCompleted ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CheckCircle2 size={18} />
                <span>Vault Return Done</span>
              </button>
            </div>
          </div>
        ) : (
          /* Quick Tap Order List for immediate demo */
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Active Benches on Floor (One-Tap Fast Select):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
              {(allocations || []).slice(0, 10).map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setScannedOrder(a)}
                  className="btn-ghost-secondary"
                  style={{
                    fontSize: '11px',
                    padding: '6px 8px',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <strong style={{ color: '#fef08a' }}>{a.craftsmanName}</strong>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>{a.workOrder} • {a.craftsmanId}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Scan Audit Trail */}
        {scanHistory.length > 0 && (
          <div style={{ background: 'rgba(10, 17, 40, 0.6)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '6px' }}>
              Recent Floor Kiosk Scans:
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {scanHistory.map((item, idx) => (
                <div key={idx}>{item}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
