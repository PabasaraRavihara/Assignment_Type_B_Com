import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Gem, CheckCircle2, QrCode, Scissors, Tag, FileText } from 'lucide-react';
import QRCodeView from './QRCodeView';
import { getMetalScrapCeiling } from './AllocationsView';
import { formatMinutesToTime, calculateDynamicETA, timeStringToMinutes, formatOrderQRDetails } from '../utils/floorTiming';

export default function PrintableJobSlipModal({
  isOpen,
  onClose,
  order
}) {
  if (!isOpen || !order) return null;

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

  const [printFormat, setPrintFormat] = useState('COMPACT'); // 'COMPACT' (A6 Pocket Tag) | 'THERMAL' (80mm Roll) | 'A5' (Standard)

  const handlePrint = () => {
    window.print();
  };

  const startMin = timeStringToMinutes(order.dispatchTime, 510);
  const budgetedSMT = order.budgetedSMT || (order.assumedHours ? order.assumedHours * 60 : 240);
  const eta = calculateDynamicETA(startMin, budgetedSMT, order.skillTier || 'Grade B');
  const ceiling = getMetalScrapCeiling(order.metalType);

  const modalContent = (
    <div className="modal-backdrop-luxury" onClick={onClose}>
      {/* Isolated Print Stylesheet to guarantee compact print and zero A4 waste */}
      <style>{`
        @media print {
          /* Hide the web application shell */
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

          .printable-slip-wrapper {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            overflow: visible !important;
          }

          /* 1. COMPACT POCKET TAG (Default - Fits 1/4 A4, velvet tray or gold box) */
          #printable-slip.format-compact {
            width: 98mm !important;
            max-width: 98mm !important;
            border: 1.5px dashed #000000 !important;
            border-radius: 4px !important;
            margin: 4mm auto !important;
            padding: 10px 12px !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* 2. 80mm THERMAL STICKER / ROLL */
          #printable-slip.format-thermal {
            width: 72mm !important;
            max-width: 72mm !important;
            border: none !important;
            border-bottom: 2px dashed #000000 !important;
            margin: 0 auto !important;
            padding: 6px 4px !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* 3. STANDARD A5 */
          #printable-slip.format-a5 {
            width: 135mm !important;
            max-width: 135mm !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 6px !important;
            margin: 4mm auto !important;
            padding: 16px 20px !important;
            box-shadow: none !important;
          }

          @page {
            size: auto;
            margin: 4mm;
          }
        }
      `}</style>

      <div 
        className="modal-window-luxury" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: printFormat === 'THERMAL' ? '380px' : printFormat === 'COMPACT' ? '460px' : '580px', 
          padding: '0', 
          background: '#0a0f1d', 
          border: '1px solid rgba(212, 175, 55, 0.4)',
          transition: 'all 0.2s ease',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Actions (Hidden when printing) */}
        <div className="no-print" style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scissors size={16} color="#d4af37" />
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fef08a' }}>
                Compact Bench Traveler QR Slip
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                onClick={handlePrint}
                className="btn-gold-primary"
                style={{ fontSize: '12px', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Print directly or save as a PDF file"
              >
                <Printer size={14} />
                <span>Print / Save as PDF</span>
              </button>
              <button 
                type="button"
                onClick={onClose} 
                className="btn-ghost-secondary"
                style={{ 
                  padding: '5px 10px', 
                  fontSize: '12px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  color: '#f87171', 
                  borderColor: 'rgba(239, 68, 68, 0.4)', 
                  background: 'rgba(239, 68, 68, 0.12)' 
                }}
                title="Close modal (or press Esc)"
              >
                <X size={15} />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Print Format Switcher */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(15, 23, 42, 0.8)', padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', marginRight: '4px' }}>Print Size:</span>
            {[
              { id: 'COMPACT', label: '✂️ Pocket Tag (A6 / 1/4 A4)', desc: 'Saves 75% paper' },
              { id: 'THERMAL', label: '🏷️ 80mm Thermal Sticker', desc: 'Roll printer' },
              { id: 'A5', label: '📄 A5 Standard', desc: 'Medium size' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPrintFormat(f.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  border: printFormat === f.id ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: printFormat === f.id ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
                  color: printFormat === f.id ? '#fef08a' : '#cbd5e1'
                }}
                title={f.desc}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Printable Paper Slip Container */}
        <div className="printable-slip-wrapper" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(10, 15, 29, 0.5)' }}>
          {/* Tip Banner */}
          <div className="no-print" style={{
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '6px',
            padding: '8px 14px',
            marginBottom: '14px',
            fontSize: '11.5px',
            color: '#bae6fd',
            textAlign: 'center',
            maxWidth: '480px',
            width: '100%'
          }}>
            💡 <strong>How to Save as a PDF File:</strong> In the print preview window, change the <strong>"Destination" (Printer)</strong> dropdown to <strong>"Save as PDF"</strong>, then click <strong>Save</strong>.
          </div>
          <div 
            id="printable-slip"
            className={`format-${printFormat.toLowerCase()}`}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              padding: printFormat === 'THERMAL' ? '10px 8px' : printFormat === 'COMPACT' ? '12px 14px' : '20px',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              width: printFormat === 'THERMAL' ? '280px' : printFormat === 'COMPACT' ? '370px' : '480px',
              border: printFormat === 'COMPACT' ? '2px dashed #475569' : printFormat === 'THERMAL' ? '1px dashed #cbd5e1' : '1px solid #cbd5e1',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Scissor Cut Line Indicator */}
            {printFormat === 'COMPACT' && (
              <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Scissors size={11} color="#64748b" />
                <span>Cut along dashed line • Fits velvet bench tray or gold job box</span>
              </div>
            )}

            {/* Slip Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '6px', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: printFormat === 'THERMAL' ? '13px' : '15px', fontWeight: '900', letterSpacing: '0.5px', color: '#0f172a' }}>
                  ASHADI JEWELLERS
                </div>
                <div style={{ fontSize: '8.5px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#64748b', fontWeight: 'bold' }}>
                  Bench Job Traveler • QR Clocking
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', border: '1px solid #d97706', padding: '2px 8px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#92400e', textTransform: 'uppercase' }}>ORDER ID:</span>
                  <span style={{ fontSize: printFormat === 'THERMAL' ? '12px' : '14px', fontWeight: '900', color: '#92400e', letterSpacing: '0.3px' }}>
                    {order.workOrder || order.id}
                  </span>
                </div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px' }}>
                  Shift Date: <strong>{order.date || new Date().toISOString().split('T')[0]}</strong>
                </div>
              </div>
            </div>

            {/* Main Slip Body: Details + QR Code */}
            <div style={{ 
              display: printFormat === 'THERMAL' ? 'flex' : 'grid',
              flexDirection: printFormat === 'THERMAL' ? 'column' : undefined,
              gridTemplateColumns: printFormat === 'THERMAL' ? undefined : '1fr 125px', 
              gap: '10px', 
              alignItems: 'center', 
              marginBottom: '10px' 
            }}>
              <div>
                {/* Craftsman & Bench */}
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '8.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Assigned Craftsman:
                  </div>
                  <div style={{ fontSize: printFormat === 'THERMAL' ? '15px' : '17px', fontWeight: '900', color: '#0f172a', lineHeight: '1.2' }}>
                    {order.craftsmanName}
                  </div>
                  <div style={{ fontSize: '10px', color: '#0369a1', fontWeight: 'bold', marginTop: '1px' }}>
                    {order.craftsmanId} • {order.skillTier || 'Grade B'}
                  </div>
                </div>

                {/* Order Channel & Destination */}
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '8.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Order Channel / Destination:
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                    <span style={{ 
                      background: order.channel === 'EXTERNAL_SHOP' ? '#fef3c7' : order.channel === 'OWNER_SPECIAL' ? '#f3e8ff' : order.channel === 'FACTORY_STOCK' ? '#f1f5f9' : '#e0f2fe',
                      color: order.channel === 'EXTERNAL_SHOP' ? '#92400e' : order.channel === 'OWNER_SPECIAL' ? '#6b21a8' : order.channel === 'FACTORY_STOCK' ? '#334155' : '#0369a1',
                      padding: '1.5px 6px',
                      borderRadius: '3px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      border: '1px solid currentColor'
                    }}>
                      {order.channel === 'EXTERNAL_SHOP' ? '🏢 B2B External Jeweller' : order.channel === 'OWNER_SPECIAL' ? '👑 Owner VIP Commission' : order.channel === 'FACTORY_STOCK' ? '📦 Factory Central Stock' : '🏬 Ashadi Showroom'}
                    </span>
                    <span>{order.channelName || ''}</span>
                  </div>
                </div>

                {/* Jewellery Design & SMT */}
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '8.5px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Design & Target Qty:
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', lineHeight: '1.2' }}>
                    {order.designCode} — {order.designName}
                  </div>
                  <div style={{ fontSize: '10px', color: '#0f172a', fontWeight: 'bold' }}>
                    Qty: {order.qtyAllocated || 1} pcs • SMT: {budgetedSMT}m ({(budgetedSMT / 60).toFixed(1)}h)
                  </div>
                </div>

                {/* Precious Metal & Issued Grams */}
                <div style={{ background: '#fef3c7', padding: '5px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '8.5px', color: '#92400e', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Precious Metal & Scrap Ceiling
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#78350f' }}>
                    {order.metalType || 'Gold 22K'} • {order.goldIssuedGrams ? `${order.goldIssuedGrams}g Issued` : 'Alloy Issued'}
                  </div>
                  <div style={{ fontSize: '9px', color: '#92400e' }}>
                    Allowable Scrap Ceiling: <strong>max {ceiling}%</strong>
                  </div>
                </div>
              </div>

              {/* QR Code Module */}
              <div style={{ textAlign: 'center', marginTop: printFormat === 'THERMAL' ? '8px' : 0 }}>
                <QRCodeView value={formatOrderQRDetails(order, order.date)} size={printFormat === 'THERMAL' ? 120 : 105} />
                <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#475569', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚡ Scan / Click Zoom
                </div>
              </div>
            </div>

            {/* Shift Schedule & Target ETA Box (Highlighted & Enlarged) */}
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)', border: '1.5px solid #86efac', borderRadius: '5px', padding: '6px 10px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Dispatched
                </div>
                <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>
                  {formatMinutesToTime(startMin)}
                </div>
              </div>

              <div style={{ textAlign: 'center', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '0 12px' }}>
                <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Breaks
                </div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7' }}>
                  +{eta.totalBreakMinutesEncountered}m
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '8.5px', color: '#166534', textTransform: 'uppercase', fontWeight: '900' }}>
                  🎯 TARGET FINISH (ETA)
                </div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#14532d', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bbf7d0', display: 'inline-block' }}>
                  {eta.targetETATime}
                </div>
              </div>
            </div>

            {/* Craftsman Scan Instructions Footer */}
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '6px', fontSize: '8.5px', color: '#475569', lineHeight: '1.3' }}>
              <strong>Scan Instructions:</strong> Hold card to Floor Kiosk to start timer. Scan when leaving for Breakfast / Tea / Lunch to pause. Return with scrap gold filings to Vault.
            </div>
          </div>
        </div>

        {/* Footer Bar (Hidden when printing) */}
        <div className="no-print" style={{ padding: '10px 18px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#070b16' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Press <kbd style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', padding: '1px 5px', color: '#cbd5e1' }}>Esc</kbd> or click outside to exit
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-ghost-secondary"
            style={{ padding: '5px 14px', fontSize: '12px', color: '#cbd5e1' }}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
