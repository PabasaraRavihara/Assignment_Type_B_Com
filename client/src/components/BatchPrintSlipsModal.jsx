import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  const modalContent = (
    <div className="modal-backdrop-luxury" onClick={onClose}>
      {/* Isolated Print Stylesheet for 8-Per-A4 or 4-Per-A4 Grids */}
      <style>{`
        @media print {
          /* Hide the web application shell and non-print items */
          #root,
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
            min-height: 100% !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .modal-backdrop-luxury {
            position: static !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
          }

          .modal-window-luxury {
            position: static !important;
            background: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            max-height: none !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            display: block !important;
          }

          .batch-sheets-scroll-container {
            overflow: visible !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            display: block !important;
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
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          .print-a4-sheet-8:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
            margin-bottom: 0 !important;
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
            break-inside: avoid !important;
            page-break-inside: avoid !important;
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
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          .print-a4-sheet-4:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
            margin-bottom: 0 !important;
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
            break-inside: avoid !important;
            page-break-inside: avoid !important;
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
        <div className="batch-sheets-scroll-container" style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'rgba(10, 15, 29, 0.7)' }}>
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
                <strong>💡 How to Save as a PDF File:</strong> In the print preview window, change the <strong>"Destination" (Printer)</strong> dropdown to <strong>"Save as PDF"</strong>, then click <strong>Save</strong>.
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #0f172a', paddingBottom: '4px', marginBottom: '4px' }}>
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '0.3px', color: '#0f172a' }}>
                              ASHADI JEWELLERS
                            </span>
                            <span style={{ fontSize: '7.5px', color: '#64748b', marginLeft: '5px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              Traveler
                            </span>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#fef3c7', border: '1px solid #d97706', padding: '1px 5px', borderRadius: '3px' }}>
                              <span style={{ fontSize: '7.5px', fontWeight: 'bold', color: '#92400e', textTransform: 'uppercase' }}>ORDER ID:</span>
                              <span style={{ fontSize: '11px', fontWeight: '900', color: '#92400e', letterSpacing: '0.2px' }}>
                                {order.workOrder || order.id}
                              </span>
                            </div>
                            <span style={{ fontSize: '7px', color: '#64748b', marginTop: '1px' }}>
                              Date: {order.date || selectedDate}
                            </span>
                          </div>
                        </div>

                        {/* Middle: Details (Left) + Compact 66px QR (Right) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px', gap: '6px', alignItems: 'center' }}>
                          <div style={{ fontSize: '9px', lineHeight: 1.25 }}>
                            {/* Craftsman */}
                            <div style={{ marginBottom: '2.5px' }}>
                              <div style={{ fontSize: '7px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                Craftsman:
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.15' }}>
                                {order.craftsmanName}
                              </div>
                              <div style={{ fontSize: '8.5px', color: '#0369a1', fontWeight: 'bold', marginTop: '1px' }}>
                                {order.craftsmanId} • {order.skillTier || 'Grade B'}
                              </div>
                            </div>

                            {/* Order Channel */}
                            <div style={{ marginBottom: '2.5px' }}>
                              <div style={{ fontSize: '6.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                Order Channel:
                              </div>
                              <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <span style={{
                                  background: order.channel === 'EXTERNAL_SHOP' ? '#fef3c7' : order.channel === 'OWNER_SPECIAL' ? '#f3e8ff' : order.channel === 'FACTORY_STOCK' ? '#f1f5f9' : '#e0f2fe',
                                  color: order.channel === 'EXTERNAL_SHOP' ? '#92400e' : order.channel === 'OWNER_SPECIAL' ? '#6b21a8' : order.channel === 'FACTORY_STOCK' ? '#334155' : '#0369a1',
                                  padding: '0.5px 3.5px',
                                  borderRadius: '2px',
                                  fontSize: '7.5px',
                                  marginRight: '3px'
                                }}>
                                  {order.channel === 'EXTERNAL_SHOP' ? '🏢 B2B' : order.channel === 'OWNER_SPECIAL' ? '👑 VIP' : order.channel === 'FACTORY_STOCK' ? '📦 Stock' : '🏬 Showroom'}
                                </span>
                                {order.channelName || (order.channel === 'EXTERNAL_SHOP' ? 'External Jeweller' : order.channel === 'OWN_SHOWROOM' ? 'Ashadi Showroom' : 'Factory')}
                              </div>
                            </div>

                            {/* Design & Qty */}
                            <div style={{ marginBottom: '3px' }}>
                              <div style={{ fontSize: '7px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                Design & Qty:
                              </div>
                              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

                        {/* Bottom Timing Strip (Highlighted & Enlarged) */}
                        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)', border: '1.5px solid #86efac', borderRadius: '4px', padding: '3px 6px', marginTop: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '7px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Start: </span>
                            <strong style={{ color: '#0f172a', fontSize: '9.5px', fontWeight: '900' }}>{formatMinutesToTime(startMin)}</strong>
                          </div>
                          <div style={{ textAlign: 'center', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '0 5px' }}>
                            <span style={{ fontSize: '7px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Break: </span>
                            <strong style={{ color: '#0284c7', fontSize: '9px', fontWeight: '800' }}>+{eta.totalBreakMinutesEncountered}m</strong>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '7.5px', color: '#166534', textTransform: 'uppercase', fontWeight: '900' }}>TARGET ETA: </span>
                            <strong style={{ color: '#14532d', fontSize: '12px', fontWeight: '900', background: '#dcfce7', padding: '1px 5px', borderRadius: '3px', border: '1px solid #bbf7d0', display: 'inline-block' }}>
                              {eta.targetETATime}
                            </strong>
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
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', border: '1px solid #d97706', padding: '2px 7px', borderRadius: '4px' }}>
                            <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#92400e', textTransform: 'uppercase' }}>ORDER ID:</span>
                            <span style={{ fontSize: '13px', fontWeight: '900', color: '#92400e', letterSpacing: '0.3px' }}>
                              {order.workOrder || order.id}
                            </span>
                          </div>
                          <div style={{ fontSize: '8px', color: '#64748b', marginTop: '2px' }}>
                            Shift Date: {order.date || selectedDate}
                          </div>
                        </div>
                      </div>

                      {/* Main Details + QR Code */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <div>
                          <div style={{ marginBottom: '4px' }}>
                            <div style={{ fontSize: '7.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              Craftsman:
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', lineHeight: '1.15' }}>
                              {order.craftsmanName}
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#0369a1', fontWeight: 'bold', marginTop: '1px' }}>
                              {order.craftsmanId} • {order.skillTier || 'Grade B'}
                            </div>
                          </div>

                          <div style={{ marginBottom: '4px' }}>
                            <div style={{ fontSize: '7.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              Order Channel / Destination:
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ 
                                background: order.channel === 'EXTERNAL_SHOP' ? '#fef3c7' : order.channel === 'OWNER_SPECIAL' ? '#f3e8ff' : order.channel === 'FACTORY_STOCK' ? '#f1f5f9' : '#e0f2fe',
                                color: order.channel === 'EXTERNAL_SHOP' ? '#92400e' : order.channel === 'OWNER_SPECIAL' ? '#6b21a8' : order.channel === 'FACTORY_STOCK' ? '#334155' : '#0369a1',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                fontSize: '8.5px',
                                fontWeight: 'bold'
                              }}>
                                {order.channel === 'EXTERNAL_SHOP' ? '🏢 B2B External' : order.channel === 'OWNER_SPECIAL' ? '👑 VIP Order' : order.channel === 'FACTORY_STOCK' ? '📦 Stock' : '🏬 Showroom'}
                              </span>
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {order.channelName || (order.channel === 'EXTERNAL_SHOP' ? 'External Jeweller' : order.channel === 'OWN_SHOWROOM' ? 'Ashadi Showroom' : 'Factory Buffer')}
                              </span>
                            </div>
                          </div>

                          <div style={{ marginBottom: '4px' }}>
                            <div style={{ fontSize: '7.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              Design & Qty:
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

                      {/* ETA Box (Enlarged & Highlighted) */}
                      <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)', border: '1.5px solid #86efac', borderRadius: '5px', padding: '5px 8px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '7.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            Clock-In
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>
                            {formatMinutesToTime(startMin)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '0 10px' }}>
                          <div style={{ fontSize: '7.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            Breaks Added
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7' }}>
                            +{eta.totalBreakMinutesEncountered}m
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '8px', color: '#166534', textTransform: 'uppercase', fontWeight: '900' }}>
                            TARGET FINISH (ETA)
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '900', color: '#14532d', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bbf7d0', display: 'inline-block' }}>
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
              <span>Print / Save as PDF ({totalPages} Sheet{totalPages > 1 ? 's' : ''})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
