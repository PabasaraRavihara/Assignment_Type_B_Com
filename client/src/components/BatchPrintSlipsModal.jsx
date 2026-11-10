import React, { useState, useEffect } from 'react';
import { Printer, X, Scissors, Layers, CheckCircle2 } from 'lucide-react';
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
  const cardsPerPage = 4; // 2x2 grid on standard A4
  const totalPages = Math.ceil(totalCards / cardsPerPage) || 1;
  const paperSavedSheets = Math.max(0, totalCards - totalPages);

  // Group into pages of 4
  const pages = [];
  for (let i = 0; i < totalCards; i += cardsPerPage) {
    pages.push(activeOrders.slice(i, i + cardsPerPage));
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop-luxury" onClick={onClose}>
      {/* Isolated Print Stylesheet for 4-Per-A4-Page Grid */}
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
            margin: 6mm;
          }

          /* 4-per-page A4 sheet container */
          .print-a4-sheet {
            page-break-after: always !important;
            break-after: page !important;
            height: 284mm !important;
            box-sizing: border-box !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: 1fr 1fr !important;
            gap: 4mm !important;
            padding: 0 !important;
            margin: 0 auto !important;
          }

          /* Quarter card */
          .batch-quarter-card {
            border: 1.5px dashed #475569 !important;
            border-radius: 4px !important;
            padding: 8px 10px !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            height: 138mm !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      <div 
        className="modal-window-luxury" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '980px', width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#0a0f1d', border: '1px solid rgba(212, 175, 55, 0.4)', padding: 0, overflow: 'hidden' }}
      >
        
        {/* Header Bar (Hidden during print) */}
        <div className="no-print" style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d4af37', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <Scissors size={14} />
              <span>4-PER-PAGE BATCH PRINT MATRIX</span>
            </div>
            <h2 style={{ fontSize: '18px', color: '#fff', margin: '4px 0 0 0', fontFamily: 'var(--font-serif)' }}>
              Batch Print Bench Traveler Slips ({totalCards} Cards)
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
              Prints 4 compact pocket slips per A4 sheet with cutting guidelines. Sized for jewelry trays and gold boxes.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '6px', padding: '6px 12px', textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Paper Efficiency
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399' }}>
                {totalPages} A4 Sheets (Saves {paperSavedSheets} sheets!)
              </div>
            </div>

            <button 
              type="button" 
              onClick={handlePrint}
              className="btn-gold-primary"
              style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={16} />
              <span>Print All {totalPages} Sheets</span>
            </button>

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
          {pages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              No active work orders dispatched yet for {selectedDate}.
            </div>
          ) : (
            pages.map((pageGroup, pIdx) => (
              <div 
                key={`page-${pIdx}`} 
                className="print-a4-sheet"
                style={{ 
                  background: '#ffffff', 
                  color: '#0f172a',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '24px',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gridTemplateRows: '1fr 1fr',
                  gap: '12px'
                }}
              >
                {pageGroup.map((order, cIdx) => {
                  const startMin = timeStringToMinutes(order.dispatchTime, 510);
                  const budgetedSMT = order.budgetedSMT || (order.assumedHours ? order.assumedHours * 60 : 240);
                  const eta = calculateDynamicETA(startMin, budgetedSMT, order.skillTier || 'Grade B');
                  const ceiling = getMetalScrapCeiling(order.metalType);

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
                        <span>Cut line • Tray card #{pIdx * 4 + cIdx + 1} of {totalCards}</span>
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
            💡 Tip: Press <kbd style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', color: '#cbd5e1' }}>Esc</kbd> key or click outside the card to close.
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
              <span>Print All {totalPages} Sheets</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
