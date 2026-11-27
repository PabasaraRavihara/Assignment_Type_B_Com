import React, { useState } from 'react';
import { Calendar, BarChart3, Printer } from 'lucide-react';
import DailyReportView from './DailyReportView';
import MonthlyReportView from './MonthlyReportView';

export default function ReportHubView({
  allocations = [],
  craftsmen = [],
  designs = [],
  leaves = [],
  selectedDate,
  onNavigateTab,
  adminUser
}) {
  const [reportMode, setReportMode] = useState('DAILY'); // 'DAILY' | 'MONTHLY'

  return (
    <div className="report-hub-print-root">
      {/* Global Print Auto-Fit Styling (Forces A4 Landscape & prevents right-side column clipping) */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm 8mm 10mm 8mm;
          }
          html, body {
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .page-container,
          .report-hub-print-root,
          .report-hub-print-root > div {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .table-luxury-wrap,
          .report-hub-print-root table {
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            table-layout: auto !important;
            border-collapse: collapse !important;
          }
          .report-hub-print-root th,
          .report-hub-print-root td {
            font-size: 8.5pt !important;
            padding: 4px 5px !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
          .report-hub-print-root tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Report Sub-Tabs Switcher */}
      <div className="no-print" style={{
        maxWidth: '1440px',
        margin: '0 auto 16px auto',
        padding: '12px 20px 0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.85)', padding: '5px', borderRadius: '12px', border: '1.5px solid rgba(212, 175, 55, 0.35)' }}>
          <button
            type="button"
            onClick={() => setReportMode('DAILY')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              border: 'none',
              background: reportMode === 'DAILY' ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.35) 0%, rgba(180, 130, 20, 0.2) 100%)' : 'transparent',
              color: reportMode === 'DAILY' ? '#fef08a' : '#94a3b8',
              boxShadow: reportMode === 'DAILY' ? '0 0 14px rgba(212, 175, 55, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Calendar size={14} color={reportMode === 'DAILY' ? '#fef08a' : '#94a3b8'} />
            <span>Daily Shift & Gold Report (Workshop Floor)</span>
          </button>

          <button
            type="button"
            onClick={() => setReportMode('MONTHLY')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              border: 'none',
              background: reportMode === 'MONTHLY' ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.35) 0%, rgba(180, 130, 20, 0.2) 100%)' : 'transparent',
              color: reportMode === 'MONTHLY' ? '#fef08a' : '#94a3b8',
              boxShadow: reportMode === 'MONTHLY' ? '0 0 14px rgba(212, 175, 55, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <BarChart3 size={14} color={reportMode === 'MONTHLY' ? '#fef08a' : '#94a3b8'} />
            <span>Monthly Executive Audit Report (Boss / Owner)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="btn-gold-primary"
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Printer size={14} />
          <span>Print / Save {reportMode === 'DAILY' ? 'Daily' : 'Monthly'} PDF (A4 Full Width)</span>
        </button>
      </div>

      {/* Render Selected Report View */}
      {reportMode === 'DAILY' ? (
        <DailyReportView
          allocations={allocations}
          craftsmen={craftsmen}
          designs={designs}
          leaves={leaves}
          initialDate={selectedDate}
          onNavigateTab={onNavigateTab}
        />
      ) : (
        <MonthlyReportView
          allocations={allocations}
          craftsmen={craftsmen}
          designs={designs}
          leaves={leaves}
          onNavigateTab={onNavigateTab}
        />
      )}
    </div>
  );
}
