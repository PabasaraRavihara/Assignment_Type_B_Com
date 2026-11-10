import React, { useState, useEffect, useRef } from 'react';
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
  Scale
} from 'lucide-react';
import { formatMinutesToTime } from './LiveFloorMonitor';

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

  // Continuous Camera QR Code Scanner via native BarcodeDetector API
  useEffect(() => {
    let scanInterval;
    if (isCameraActive && videoRef.current && 'BarcodeDetector' in window) {
      try {
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39']
        });

        scanInterval = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                handleProcessCode(barcodes[0].rawValue);
              }
            } catch (err) {
              // Ignore frame decode errors
            }
          }
        }, 350);
      } catch (e) {
        console.warn('BarcodeDetector API initialization notice:', e);
      }
    }
    return () => {
      if (scanInterval) clearInterval(scanInterval);
    };
  }, [isCameraActive, allocations]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera access not granted or unavailable:', err);
      setCameraError('Camera access unavailable. Use USB barcode gun, typing, or select from active orders below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
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

    // Search in allocations
    const found = allocations.find(a => 
      (a.workOrder && a.workOrder.toLowerCase() === trimmed.toLowerCase()) ||
      (a.id && a.id.toLowerCase() === trimmed.toLowerCase()) ||
      (a.craftsmanId && a.craftsmanId.toLowerCase() === trimmed.toLowerCase())
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
                borderColor: isCameraActive ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
                color: isCameraActive ? '#fca5a5' : '#cbd5e1'
              }}
              title="Toggle device camera scanner"
            >
              <Camera size={16} />
              <span>{isCameraActive ? 'Stop Camera' : 'Camera'}</span>
            </button>
          </div>

          {/* Camera Viewport (When active) */}
          {isCameraActive && (
            <div style={{ position: 'relative', width: '100%', height: '220px', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '160px',
                height: '160px',
                border: '2px dashed #38bdf8',
                borderRadius: '8px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
              }} />
              <div style={{ position: 'absolute', bottom: '8px', width: '100%', textAlign: 'center', color: '#fff', fontSize: '11px', textShadow: '0 1px 3px #000' }}>
                Align craftsman's printed QR card within square
              </div>
            </div>
          )}

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  {scannedOrder.craftsmanId}
                </span>
                <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px' }}>
                  {scannedOrder.craftsmanName}
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                  {scannedOrder.workOrder} • <strong>{scannedOrder.designCode}</strong> ({scannedOrder.metalType || 'Gold 22K'})
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  background: isCompleted ? 'rgba(148, 163, 184, 0.2)' : isPaused ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: isCompleted ? '#cbd5e1' : isPaused ? '#fbbf24' : '#4ade80',
                  border: `1px solid ${isCompleted ? '#94a3b8' : isPaused ? '#f59e0b' : '#10b981'}`
                }}>
                  Status: {scannedOrder.status || 'Active'}
                </span>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Started at: <strong style={{ color: '#fef08a' }}>{scannedOrder.dispatchTime || '08:00 AM'}</strong>
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
