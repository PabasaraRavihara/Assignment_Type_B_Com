import React, { useState, useEffect } from 'react';
import { Printer, X, Scissors, Layers, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import QRCodeView from './QRCodeView';
import { getMetalScrapCeiling } from './AllocationsView';
import { formatMinutesToTime, calculateDynamicETA, timeStringToMinutes } from './LiveFloorMonitor';

export default function BatchPrintSlipsModal({
  isOpen,
  onClose,
  allocations = [],
  selectedDate
}) {
  if (!isOpen) return null;

  // Layout mode: '8_PER_PAGE' (default, high density) or '4_PER_PAGE' (classic quarter card)
  const [layoutMode, setLayoutMode] = useState('8_PER_PAGE');

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

  // Filter valid allocations
  const activeOrders = (allocations || []).filter(a => a && (a.workOrder || a.id));
  const totalCards = activeOrders.length;
  
  const cardsPerPage = layoutMode === '8_PER_PAGE' ? 8 : 4;
  const totalPages = Math.ceil(totalCards / cardsPerPage) || 1;
  const singleSheetTotal = totalCards;
  const paperSavedSheets = Math.max(0, singleSheetTotal - totalPages);

  // Group into pages of 8 or 4
  const pages = [];
  for (let i = 0; i < totalCards; i += cardsPerPage) {
    pages.push(activeOrders.slice(i, i + cardsPerPage));
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop-luxury" onClick={onClose}>
      {/* Isolated Print Stylesheet for 8-Per-A4 or 4-Per-A4 Grids */}
      <style>{`
        @media print {
          /* Hide all application UI */
          .app-shell,
          .top-nav,
          .page-container,
          .no-print {
            display: none !important;
          }

          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .modal-backdrop-luxury {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            overflow: visible !important;
          }

          .modal-window-luxury {
            position: static !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          @page {
            size: A4 portrait;
            margin: 4mm;
          }

          /* 8-per-page A4 sheet container (2 columns x 4 rows) */
          .print-a4-sheet-8 {
            page-break-after: always !important;
            break-after: page !important;
            height: 288mm !important;
            box-sizing: border-box !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: repeat(4, 1fr) !important;
            gap: 2.5mm !important;
            padding: 0 !important;
            margin: 0 auto !important;
          }

          /* 8-per-page compact card */
          .batch-octa-card {
            border: 1px dashed #475569 !important;
            border-radius: 4px !important;
            padding: 5px 8px !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            height: 69mm !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }

          /* 4-per-page A4 sheet container (2 columns x 2 rows) */
          .print-a4-sheet-4 {
            page-break-after: always !important;
            break-after: page !important;
            height: 286mm !important;
            box-sizing: border-box !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: 1fr 1fr !important;
            gap: 4mm !important;
            padding: 0 !important;
            margin: 0 auto !important;
          }

          /* 4-per-page quarter card */
          .batch-quarter-card {
            border: 1.5px dashed #475569 !important;
            border-radius: 4px !important;
            padding: 8px 10px !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            height: 139mm !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      <div 
        className="modal-window-luxury" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1020px', width: '96vw', maxHeight: '94vh', display: 'flex', flexDirection: 'column', background: '#0a0f1d', border: '1px solid rgba(212, 175, 55, 0.4)', padding: 0, overflow: 'hidden' }}
      >
        
        {/* Header Bar (Hidden during print) */}
        <div className="no-print" style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d4af37', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <Scissors size={14} />
              <span>BATCH BENCH TRAVELER PRINT MATRIX</span>
            </div>
            <h2 style={{ fontSize: '18px', color: '#fff', margin: '4px 0 0 0', fontFamily: 'var(--font-serif)' }}>
              Batch Print Job Slips ({totalCards} Traveler Slips)
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
              Optimized for A4 paper savings with precision scissor cutting guidelines. Sized for jewellery pouches and gold trays.
            </p>
          </div>

          {/* Layout Mode Selector + Stats + Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {/* 8 vs 4 Toggle */}
            <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', padding: '3px' }}>
              <button
                type="button"
                onClick={() => setLayoutMode('8_PER_PAGE')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: layoutMode === '8_PER_PAGE' ? 'bold' : 'normal',
                  background: layoutMode === '8_PER_PAGE' ? 'linear-gradient(135deg, #d4af37, #b8860b)' : 'transparent',
                  color: layoutMode === '8_PER_PAGE' ? '#0a0f1d' : '#94a3b8',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Sparkles size={13} />
                <span>8 Per A4 (High Density)</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('4_PER_PAGE')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: layoutMode === '4_PER_PAGE' ? 'bold' : 'normal',
                  background: layoutMode === '4_PER_PAGE' ? 'linear-gradient(135deg, #d4af37, #b8860b)' : 'transparent',
                  color: layoutMode === '4_PER_PAGE' ? '#0a0f1d' : '#94a3b8',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FileText size={13} />
                <span>4 Per A4 (Quarter)</span>
              </button>
            </div>

            {/* Paper Saved Pill */}
            <div style={{ background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '6px', padding: '5px 12px', textAlign: 'right' }}>
              <div style={{ fontSize: '9.5px', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Paper Efficiency
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399' }}>
                {totalPages} A4 Sheet{totalPages > 1 ? 's' : ''} (Saves {paperSavedSheets}!)
              </div>
            </div>

            {/* Print / Save as PDF Button */}
            <button 
              type="button" 
              onClick={handlePrint}
              className="btn-gold-primary"
              style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Print directly or save as a PDF file"
            >
              <Printer size={16} />
              <span>Print / Save as PDF ({totalPages} Sheet{totalPages > 1 ? 's' : ''})</span>
            </button>

            {/* Close Button */}
            <button 
              type="button" 
              onClick={onClose}
              className="btn-ghost-secondary"
              style={{ 
                padding: '8px 14px', 
                fontSize: '13px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                color: '#f87171', 
                borderColor: 'rgba(239, 68, 68, 0.4)', 
                background: 'rgba(239, 68, 68, 0.12)' 
              }}
              title="Close modal (or press Esc)"
            >
              <X size={16} />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Preview Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'rgba(10, 15, 29, 0.7)' }}>
          {/* Helpful PDF Saving Guidance Banner */}
          <div className="no-print" style={{
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#bae6fd'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={16} color="#38bdf8" />
              <span>
                <strong>💡 PDF File ekak widihata save karaganna:</strong> Print window eka open unama <strong>"Destination" (Printer)</strong> dropdown eken <strong>"Save as PDF"</strong> select karala <strong>Save</strong> click karanna.
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Layout: {layoutMode === '8_PER_PAGE' ? '8 Per A4 (50% Paper Saved)' : '4 Per A4'}
            </span>
          </div>

          {pages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              No active work orders dispatched yet for {selectedDate}.
            </div>
          ) : (
            pages.map((pageGroup, pIdx) => (
              <div 
                key={`page-${pIdx}`} 
                className={layoutMode === '8_PER_PAGE' ? 'print-a4-sheet-8' : 'print-a4-sheet-4'}
                style={{ 
                  background: '#ffffff', 
                  color: '#0f172a',
                  borderRadius: '6px',
                  padding: layoutMode === '8_PER_PAGE' ? '8px' : '12px',
                  marginBottom: '24px',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gridTemplateRows: layoutMode === '8_PER_PAGE' ? 'repeat(4, 1fr)' : '1fr 1fr',
                  gap: layoutMode === '8_PER_PAGE' ? '8px' : '12px'
                }}
              >
                {pageGroup.map((order, cIdx) => {
                  const startMin = timeStringToMinutes(order.dispatchTime, 510);
                  const budgetedSMT = order.budgetedSMT || (order.assumedHours ? order.assumedHours * 60 : 240);
                  const eta = calculateDynamicETA(startMin, budgetedSMT, order.skillTier || 'Grade B');
                  const ceiling = getMetalScrapCeiling(order.metalType);
                  const cardIndex = pIdx * cardsPerPage + cIdx + 1;

                  // 8-PER-PAGE COMPACT SLIP (Ultra space-saving, crisp 66px QR)
                  if (layoutMode === '8_PER_PAGE') {
                    return (
                      <div 
                        key={order.id || `card-${cIdx}`}
                        className="batch-octa-card"
                        style={{
                          border: '1px dashed #475569',
                          borderRadius: '5px',
                          padding: '6px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          background: '#ffffff',
                          minHeight: '135px'
                        }}
                      >
                        {/* Scissor Cut Line Header */}
                        <div style={{ fontSize: '7.5px', color: '#64748b', textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '2px', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                          <Scissors size={9} color="#64748b" />
                          <span>Cut line • Tray #{cardIndex} of {totalCards}</span>
                        </div>

                        {/* Top Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0f172a', paddingBottom: '3px', marginBottom: '4px' }}>
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '0.3px', color: '#0f172a' }}>
                              ASHADI JEWELLERS
                            </span>
                            <span style={{ fontSize: '7.5px', color: '#64748b', marginLeft: '5px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              Traveler
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '11px', fontWeight: '900', color: '#b45309' }}>
                              {order.workOrder || order.id}
                            </span>
                            <span style={{ fontSize: '7.5px', color: '#64748b', marginLeft: '4px' }}>
                              {order.date || selectedDate}
                            </span>
                          </div>
                        </div>

                        {/* Middle: Details (Left) + Compact 66px QR (Right) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px', gap: '6px', alignItems: 'center' }}>
                          <div style={{ fontSize: '9px', lineHeight: 1.25 }}>
                            {/* Craftsman */}
                            <div style={{ marginBottom: '3px' }}>
                              <div style={{ fontSize: '7px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                Craftsman:
                              </div>
                              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {order.craftsmanName}
                              </div>
                              <div style={{ fontSize: '8px', color: '#0369a1', fontWeight: 'bold' }}>
                                {order.craftsmanId} • {order.skillTier || 'Grade B'}
                              </div>
                            </div>

                            {/* Design & Qty */}
                            <div style={{ marginBottom: '3px' }}>
                              <div style={{ fontSize: '7px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                Design & Qty:
                              </div>
                              <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {order.designCode} ({order.qtyAllocated || 1} pcs)
                              </div>
                              <div style={{ fontSize: '7.5px', color: '#475569' }}>
                                SMT: {budgetedSMT}m • Allowable: {ceiling}%
                              </div>
                            </div>

                            {/* Metal & Issued Gold */}
                            <div style={{ background: '#fef3c7', padding: '2px 5px', borderRadius: '3px', border: '1px solid #fde68a', display: 'inline-block' }}>
                              <span style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#78350f' }}>
                                {order.metalType || 'Gold 22K'} {order.goldIssuedGrams ? `(${order.goldIssuedGrams}g)` : ''}
                              </span>
                            </div>
                          </div>

                          {/* 66px Crisp QR Code */}
                          <div style={{ textAlign: 'center' }}>
                            <QRCodeView value={order.workOrder || order.id} size={66} />
                            <div style={{ fontSize: '6.5px', fontWeight: 'bold', color: '#475569', marginTop: '1px', textTransform: 'uppercase' }}>
                              ⚡ Scan Kiosk
                            </div>
                          </div>
                        </div>

                        {/* Bottom Timing Strip */}
                        <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '2px 5px', marginTop: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '7.5px' }}>
                          <div>
                            <span style={{ color: '#64748b' }}>In: </span>
                            <strong style={{ color: '#0f172a' }}>{formatMinutesToTime(startMin)}</strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>Break: </span>
                            <strong style={{ color: '#0284c7' }}>+{eta.totalBreakMinutesEncountered}m</strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>Target ETA: </span>
                            <strong style={{ color: '#15803d', fontSize: '8.5px' }}>{eta.targetETATime}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 4-PER-PAGE CLASSIC QUARTER CARD
                  return (
                    <div 
                      key={order.id || `card-${cIdx}`}
                      className="batch-quarter-card"
                      style={{
                        border: '1.5px dashed #475569',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        background: '#ffffff'
                      }}
                    >
                      {/* Scissor Cut Line Header */}
                      <div style={{ fontSize: '8.5px', color: '#64748b', textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '3px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                        <Scissors size={10} color="#64748b" />
                        <span>Cut line • Tray card #{cardIndex} of {totalCards}</span>
                      </div>

                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #0f172a', paddingBottom: '4px', marginBottom: '6px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '0.3px', color: '#0f172a' }}>
                            ASHADI JEWELLERS
                          </div>
                          <div style={{ fontSize: '8px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold' }}>
                            Bench Job Traveler
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', fontWeight: '900', color: '#b45309' }}>
                            {order.workOrder || order.id}
                          </div>
                          <div style={{ fontSize: '8px', color: '#64748b' }}>
                            Date: {order.date || selectedDate}
                          </div>
                        </div>
                      </div>

                      {/* Main Details + QR Code */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <div>
                          <div style={{ marginBottom: '4px' }}>
                            <div style={{ fontSize: '7.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              Craftsman
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', lineHeight: '1.1' }}>
                              {order.craftsmanName}
                            </div>
                            <div style={{ fontSize: '9px', color: '#0369a1', fontWeight: 'bold' }}>
                              {order.craftsmanId} • {order.skillTier || 'Grade B'}
                            </div>
                          </div>

                          <div style={{ marginBottom: '4px' }}>
                            <div style={{ fontSize: '7.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              Design & Qty
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a', lineHeight: '1.1' }}>
                              {order.designCode} — {order.designName}
                            </div>
                            <div style={{ fontSize: '9px', color: '#0f172a', fontWeight: 'bold' }}>
                              Qty: {order.qtyAllocated || 1} pcs • SMT: {budgetedSMT}m
                            </div>
                          </div>

                          <div style={{ background: '#fef3c7', padding: '3px 6px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                            <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#78350f' }}>
                              {order.metalType || 'Gold 22K'} ({order.goldIssuedGrams ? `${order.goldIssuedGrams}g` : 'Alloy'})
                            </div>
                            <div style={{ fontSize: '8px', color: '#92400e' }}>
                              Max Loss: <strong>{ceiling}%</strong>
                            </div>
                          </div>
                        </div>

                        {/* QR Code */}
                        <div style={{ textAlign: 'center' }}>
                          <QRCodeView value={order.workOrder || order.id} size={92} />
                          <div style={{ fontSize: '7.5px', fontWeight: 'bold', color: '#475569', marginTop: '2px', textTransform: 'uppercase' }}>
                            ⚡ Scan at Kiosk
                          </div>
                        </div>
                      </div>

                      {/* ETA Box */}
                      <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 6px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '7.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            Clock-In
                          </div>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a' }}>
                            {formatMinutesToTime(startMin)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '7.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            Breaks
                          </div>
                          <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#0284c7' }}>
                            +{eta.totalBreakMinutesEncountered}m
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '7.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            🎯 Target ETA
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: '900', color: '#15803d' }}>
                            {eta.targetETATime}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Instruction */}
                      <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '3px', fontSize: '7.5px', color: '#475569', textAlign: 'center' }}>
                        Scan at Floor Kiosk to Start/Pause • Return with gold scrap to Vault
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer Bar (Hidden during print) */}
        <div className="no-print" style={{ padding: '12px 22px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#070b16' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            💡 Tip: Select <strong>8 Per A4</strong> for maximum paper savings or <strong>4 Per A4</strong> for larger badges. Press <kbd style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', color: '#cbd5e1' }}>Esc</kbd> to close.
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-ghost-secondary"
              style={{ padding: '8px 16px', fontSize: '13px', color: '#cbd5e1' }}
            >
              Close Preview
            </button>
            <button 
              type="button" 
              onClick={handlePrint}
              className="btn-gold-primary"
              style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={16} />
              <span>Print {totalPages} Sheet{totalPages > 1 ? 's' : ''} ({layoutMode === '8_PER_PAGE' ? '8' : '4'}/Page)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
