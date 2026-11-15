import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Store, 
  Package, 
  Crown, 
  Users, 
  Sparkles,
  Calendar,
  Layers,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import api from '../api';

export default function MonthlyReportView({ onNavigateTab }) {
  const [reportMonth, setReportMonth] = useState('2026-11');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyReport();
  }, [reportMonth]);

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/monthly?month=${reportMonth}`);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load monthly report', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    window.open('http://localhost:5000/api/dashboard/download-excel', '_blank');
  };

  if (loading || !reportData) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#d4af37' }}>
        <Clock className="spin" size={32} />
        <p style={{ marginTop: '14px', fontSize: '15px' }}>Compiling Executive Month-End Report for the Boss...</p>
      </div>
    );
  }

  const { executiveSummary, channelBreakdown, monthlyCapacityWaterfall, executiveInsights, craftsmenRanking, preciousMetalsSummary } = reportData;

  return (
    <div className="printable-report">
      {/* Isolated Print & Landscape Layout Stylesheet */}
      <style>{`
        @page {
          size: A4 landscape;
          margin: 6mm 8mm;
        }

        /* Screen Styles for Pages & High-Contrast Typography */
        .report-print-page {
          margin-bottom: 28px;
          padding: 24px;
          background: linear-gradient(180deg, rgba(20, 26, 44, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%);
          border-radius: 12px;
          border: 1px solid rgba(212, 175, 55, 0.25);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          position: relative;
        }

        .report-page-ribbon {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
          padding-bottom: 10px;
          margin-bottom: 16px;
        }

        .report-page-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 10px;
          margin-top: 18px;
          font-size: 11px;
          color: #94a3b8;
        }

        .precious-metals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .waterfall-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .rec-card {
          background: rgba(212, 175, 55, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.25);
          border-radius: 10px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .executive-signoff-block {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 10px;
          padding: 18px;
          margin-top: 16px;
        }

        /* STRICT EXECUTIVE PRINT ENGINE (A4 Landscape, High-Contrast Black/Navy/Emerald) */
        @media print {
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 8pt !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print,
          .top-nav,
          .nav-pills-bar,
          .executive-header,
          button {
            display: none !important;
          }

          .printable-report {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          /* Force Each Logical Section Onto Exactly One Clean Landscape Page */
          .report-print-page {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #ffffff !important;
            border: 1.5px solid #cbd5e1 !important;
            border-radius: 6px !important;
            padding: 10px 14px !important;
            margin: 0 0 0 0 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            min-height: 186mm !important;
            max-height: 196mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }

          .report-page-4 {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Ribbon & Page Footers in Print */
          .report-page-ribbon {
            border-bottom: 2px solid #0f172a !important;
            padding-bottom: 6px !important;
            margin-bottom: 10px !important;
          }
          .ribbon-company {
            color: #0f172a !important;
            font-weight: 900 !important;
            font-size: 11pt !important;
            font-family: var(--font-serif) !important;
            letter-spacing: 0.05em !important;
          }
          .ribbon-doc {
            color: #475569 !important;
            font-weight: 700 !important;
            font-size: 8pt !important;
          }

          .report-page-footer {
            border-top: 1px solid #cbd5e1 !important;
            padding-top: 6px !important;
            margin-top: 8px !important;
            font-size: 7pt !important;
            color: #475569 !important;
            font-weight: 600 !important;
          }

          /* REPLACING WASHED-OUT PALE YELLOW WITH EXECUTIVE HIGH-CONTRAST COLORS */
          .brand-title-text {
            color: #0f172a !important;
            font-size: 19pt !important;
            font-weight: 900 !important;
          }

          .brand-sub-text {
            color: #475569 !important;
            font-size: 8pt !important;
          }

          .doc-badge-title {
            color: #0f172a !important;
            font-weight: 800 !important;
            font-size: 12pt !important;
          }

          .doc-badge-period {
            color: #854d0e !important;
            font-weight: 700 !important;
            font-size: 8.5pt !important;
          }

          .report-period-banner {
            background: #f1f5f9 !important;
            border: 1px solid #cbd5e1 !important;
            padding: 6px 10px !important;
            margin-bottom: 10px !important;
            border-radius: 4px !important;
          }

          .period-banner-text {
            color: #0f172a !important;
            font-size: 8pt !important;
          }

          /* KPI Dashboard Cards */
          .kpi-card-luxury {
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
            padding: 6px 8px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border-radius: 4px !important;
          }
          .kpi-label {
            color: #475569 !important;
            font-size: 6.5pt !important;
            font-weight: 700 !important;
          }
          .kpi-value {
            color: #0f172a !important;
            font-size: 13pt !important;
            font-weight: 900 !important;
          }
          .kpi-unit {
            color: #64748b !important;
            font-size: 7pt !important;
          }
          .kpi-caption {
            color: #64748b !important;
            font-size: 6.5pt !important;
          }

          /* Table Containers & Cells */
          .table-luxury-wrap {
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            border: 1.5px solid #cbd5e1 !important;
            margin-bottom: 8px !important;
            box-shadow: none !important;
            background: #ffffff !important;
            border-radius: 4px !important;
          }
          .table-luxury {
            width: 100% !important;
            table-layout: auto !important;
            font-size: 7.2pt !important;
            border-collapse: collapse !important;
          }
          .table-luxury th {
            background: #f1f5f9 !important;
            color: #0f172a !important;
            border-bottom: 2px solid #94a3b8 !important;
            border-right: 1px solid #e2e8f0 !important;
            padding: 3.5px 5px !important;
            font-size: 7pt !important;
            font-weight: 800 !important;
            white-space: normal !important;
            line-height: 1.15 !important;
          }
          .table-luxury td {
            border-bottom: 1px solid #e2e8f0 !important;
            border-right: 1px solid #f8fafc !important;
            color: #0f172a !important;
            padding: 3px 5px !important;
            font-size: 7pt !important;
            white-space: normal !important;
            word-break: break-word !important;
            line-height: 1.15 !important;
          }
          .table-luxury tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Precious Metal Cards */
          .precious-metals-grid {
            display: grid !important;
            grid-template-columns: repeat(5, 1fr) !important;
            gap: 8px !important;
          }
          .pm-card {
            background: #f8fafc !important;
            border: 1.5px solid #cbd5e1 !important;
            padding: 8px !important;
            border-radius: 6px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
          }
          .pm-name-high-gold {
            color: #92400e !important; /* Dark bronze gold bullion */
            font-weight: 800 !important;
            font-size: 8pt !important;
          }
          .pm-name-commercial {
            color: #b45309 !important;
            font-weight: 800 !important;
            font-size: 8pt !important;
          }
          .pm-name-platinum {
            color: #0369a1 !important;
            font-weight: 800 !important;
            font-size: 8pt !important;
          }
          .pm-name-silver {
            color: #334155 !important;
            font-weight: 800 !important;
            font-size: 8pt !important;
          }
          .pm-name-base {
            color: #6b21a8 !important;
            font-weight: 800 !important;
            font-size: 8pt !important;
          }
          .pm-inner-stats {
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            padding: 5px 6px !important;
            margin: 6px 0 !important;
            border-radius: 4px !important;
          }
          .pm-stat-num {
            color: #0f172a !important;
            font-size: 10pt !important;
            font-weight: 800 !important;
          }

          /* Capacity Waterfall Milestones (6 in a row) */
          .waterfall-grid {
            display: grid !important;
            grid-template-columns: repeat(6, 1fr) !important;
            gap: 6px !important;
          }
          .waterfall-box {
            background: #f8fafc !important;
            border: 1.5px solid #cbd5e1 !important;
            padding: 6px 8px !important;
            border-radius: 6px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .wf-title {
            font-size: 6.8pt !important;
            font-weight: 800 !important;
            color: #0f172a !important;
          }
          .wf-val {
            font-size: 11pt !important;
            font-weight: 900 !important;
            color: #0f172a !important;
            margin: 2px 0 !important;
          }
          .wf-sub {
            font-size: 6.2pt !important;
            color: #475569 !important;
            line-height: 1.15 !important;
          }

          /* Recommendations & Governance (Page 4) */
          .recommendations-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 12px !important;
          }
          .rec-card {
            background: #f8fafc !important;
            border: 1.5px solid #cbd5e1 !important;
            border-radius: 6px !important;
            padding: 10px 12px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
          }
          .rec-number {
            background: #0f172a !important;
            color: #ffffff !important;
            font-size: 7.5pt !important;
            font-weight: 800 !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
          }
          .rec-card-title {
            color: #0f172a !important;
            font-size: 9.5pt !important;
            font-weight: 800 !important;
            margin: 0 !important;
          }
          .rec-card-impact {
            color: #991b1b !important; /* Deep crimson */
            font-size: 7.8pt !important;
            font-weight: 800 !important;
            background: #fee2e2 !important;
            border: 1px solid #fecaca !important;
            padding: 2.5px 6px !important;
            border-radius: 4px !important;
            margin: 4px 0 !important;
          }
          .rec-card-body {
            color: #1e293b !important;
            font-size: 7.5pt !important;
            line-height: 1.35 !important;
          }

          /* Governance Sign-Off Block */
          .executive-signoff-block {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 12px !important;
            background: #ffffff !important;
            border: 1.5px solid #0f172a !important;
            border-radius: 6px !important;
            padding: 10px 14px !important;
            margin-top: 8px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .signoff-box {
            border: 1px dashed #94a3b8 !important;
            background: #f8fafc !important;
            border-radius: 4px !important;
            padding: 8px !important;
            text-align: center !important;
          }
          .signoff-title {
            color: #0f172a !important;
            font-size: 7pt !important;
            font-weight: 800 !important;
            letter-spacing: 0.05em !important;
          }
          .signoff-role {
            color: #475569 !important;
            font-size: 7.5pt !important;
            font-weight: 700 !important;
            margin-top: 2px !important;
          }
          .signoff-line {
            border-bottom: 1.5px solid #0f172a !important;
            margin: 22px 14px 4px 14px !important;
          }
          .signoff-meta {
            color: #64748b !important;
            font-size: 6.5pt !important;
          }

          /* Headings in Print */
          .section-heading {
            color: #0f172a !important;
            font-size: 9.5pt !important;
            font-weight: 800 !important;
          }
          .section-meta-text {
            color: #475569 !important;
            font-size: 7pt !important;
          }
        }
      `}</style>

      {/* Screen Interactive Header Bar */}
      <div className="executive-header no-print">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#d4af37', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            <FileText size={16} />
            <span>EXECUTIVE MANAGEMENT INTELLIGENCE</span>
          </div>
          <h1 className="executive-title">
            <span>Month-End Labour Cost & Production Variance Report</span>
          </h1>
          <p className="executive-subtitle">
            Prepared for the <strong>Managing Director & Owner</strong> • Full audit of 63 Benches, Assumed vs. Actual Hours, 4 Demand Channels, and Gold Scrap Recovery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={reportMonth} 
            onChange={(e) => setReportMonth(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(212, 175, 55, 0.3)', color: '#fff', fontWeight: 'bold' }}
          >
            <option value="2026-11">November 2026 (Active Month)</option>
            <option value="2026-10">October 2026 (Prior Month)</option>
            <option value="2026-09">September 2026 (Historical)</option>
          </select>

          <button className="btn-ghost-secondary" onClick={handlePrint} title="Print or Save PDF Briefing">
            <Printer size={16} />
            <span>Print / PDF (4 Clean Pages)</span>
          </button>

          <button className="btn-gold-primary" onClick={handleDownloadExcel} title="Download Complete Excel Sheet">
            <Download size={16} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          PAGE 1: Executive Overview & Multi-Channel Attribution
          ======================================================== */}
      <div className="report-print-page report-page-1">
        <div>
          {/* Official Branded Paper Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px', marginBottom: '16px' }}>
            <div>
              <div className="brand-title-text" style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b', letterSpacing: '0.05em', fontFamily: 'var(--font-serif)' }}>
                ASHADI JEWELLERS (PVT) LTD
              </div>
              <div className="brand-sub-text" style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                Central Jewellery Manufacturing Workshop • Colombo, Sri Lanka
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="doc-badge-title" style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                MONTHLY LABOUR COST & AUDIT
              </div>
              <div className="doc-badge-period" style={{ fontSize: '13px', color: '#d4af37', fontWeight: 'bold' }}>
                Reporting Period: {reportData.period} (26 Working Days)
              </div>
            </div>
          </div>

          {/* Period Context & Action Banner */}
          <div className="report-period-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div className="period-banner-text" style={{ fontSize: '13px', color: '#f59e0b' }}>
              📌 <strong>Active Period: {reportData.period}</strong> — Auditing <strong>{executiveSummary.totalOrders} Logged Orders</strong>, <strong>{executiveSummary.totalPiecesProduced} Finished Pieces</strong> across 4 channels, and <strong>63 Verified Benches</strong>.
            </div>
            <button 
              className="btn-ghost-secondary no-print" 
              onClick={() => onNavigateTab && onNavigateTab('allocations')}
              style={{ fontSize: '12px', padding: '4px 10px', color: '#f59e0b' }}
            >
              + Add / Log More Orders for {reportData.period}
            </button>
          </div>

          {/* 1. Executive Summary KPI Dashboard Cards (7 KPIs) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div className="kpi-card-luxury">
              <div className="kpi-header">
                <span className="kpi-label">GROSS PLANT CAPACITY</span>
                <Clock size={15} color="#d4af37" />
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value">{executiveSummary.monthlyGrossCapacityHours.toLocaleString()}</span>
                <span className="kpi-unit">Hrs</span>
              </div>
              <div className="kpi-caption">63 benches × 26 days × 13h</div>
            </div>

            <div className="kpi-card-luxury">
              <div className="kpi-header">
                <span className="kpi-label">LEAVES DEDUCTED</span>
                <Users size={15} color="#f87171" />
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value" style={{ color: '#f87171' }}>-{executiveSummary.monthLeaveHoursLost}</span>
                <span className="kpi-unit">Hrs</span>
              </div>
              <div className="kpi-caption">Approved craftsman leave impact</div>
            </div>

            <div className="kpi-card-luxury">
              <div className="kpi-header">
                <span className="kpi-label">ASSUMED (EST.) HOURS</span>
                <TrendingDown size={15} color="#93c5fd" />
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value" style={{ color: '#93c5fd' }}>{executiveSummary.totalAssumedHours.toLocaleString()}</span>
                <span className="kpi-unit">Hrs</span>
              </div>
              <div className="kpi-caption">Standard budget before dispatch</div>
            </div>

            <div className="kpi-card-luxury">
              <div className="kpi-header">
                <span className="kpi-label">ACTUAL HOURS TAKEN</span>
                <TrendingUp size={15} color="#fbbf24" />
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value" style={{ color: '#fbbf24' }}>{executiveSummary.totalActualHours.toLocaleString()}</span>
                <span className="kpi-unit">Hrs</span>
              </div>
              <div className="kpi-caption">Shopfloor clock time recorded</div>
            </div>

            <div className="kpi-card-luxury">
              <div className="kpi-header">
                <span className="kpi-label">HOURS VARIANCE (+/-)</span>
                <AlertTriangle size={15} color="#f87171" />
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value" style={{ color: '#f87171' }}>+{executiveSummary.varianceHours}</span>
                <span className="kpi-unit">Hrs</span>
              </div>
              <div className="kpi-caption" style={{ color: '#fca5a5' }}>
                +{executiveSummary.variancePct}% over standard time
              </div>
            </div>

            <div className="kpi-card-luxury">
              <div className="kpi-header">
                <span className="kpi-label">TOTAL LABOUR COST</span>
                <Sparkles size={15} color="#34d399" />
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value" style={{ color: '#34d399', fontSize: '18px' }}>
                  Rs. {(executiveSummary.totalMonthlyLabourCost / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="kpi-caption">Piece-rate wages + efficiency bonuses</div>
            </div>

            <div className="kpi-card-luxury">
              <div className="kpi-header">
                <span className="kpi-label">AVG GOLD SCRAP LOSS</span>
                <ShieldCheck size={15} color="#f59e0b" />
              </div>
              <div className="kpi-value-row">
                <span className="kpi-value" style={{ color: '#f59e0b' }}>{executiveSummary.avgGoldLossPct}%</span>
              </div>
              <div className="kpi-caption">Target ceiling: &lt; 3.5% gold loss</div>
            </div>
          </div>

          {/* 2. Multi-Channel Performance Matrix (Comparison Table & Breakdown) */}
          <div className="print-avoid-break">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 className="section-heading" style={{ fontSize: '16px', color: '#fff', margin: 0, fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={17} color="#d4af37" />
                <span>Multi-Channel Production & Cost Attribution (The 4 Channels)</span>
              </h3>
              <span className="section-meta-text" style={{ fontSize: '12px', color: '#94a3b8' }}>
                Total Orders: <strong>{executiveSummary.totalOrders}</strong> • Total Output: <strong>{executiveSummary.totalPiecesProduced} pcs</strong>
              </span>
            </div>

            <div className="table-luxury-wrap">
              <table className="table-luxury">
                <thead>
                  <tr>
                    <th>Demand Channel</th>
                    <th>Client / Destination</th>
                    <th>Orders</th>
                    <th>Pieces</th>
                    <th>Assumed Hrs</th>
                    <th>Actual Hrs</th>
                    <th>Variance (+/-)</th>
                    <th>Direct Labour Cost</th>
                    <th>Gold Scrap %</th>
                    <th>Billing / Costing Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(channelBreakdown).map((ch) => (
                    <tr key={ch.channelCode}>
                      <td>
                        <strong style={{ 
                          color: ch.channelCode === 'EXTERNAL_SHOP' ? '#fbbf24' :
                                 ch.channelCode === 'OWN_SHOWROOM' ? '#93c5fd' :
                                 ch.channelCode === 'FACTORY_STOCK' ? '#cbd5e1' : '#e9d5ff'
                        }}>
                          {ch.channelName}
                        </strong>
                      </td>
                      <td style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'normal', maxWidth: '240px', lineHeight: '1.25' }}>{ch.description}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{ch.ordersCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#fff' }}>{ch.piecesCount} pcs</td>
                      <td style={{ textAlign: 'right', color: '#93c5fd', fontWeight: 'bold' }}>{ch.assumedHours} h</td>
                      <td style={{ textAlign: 'right', color: '#fbbf24', fontWeight: 'bold' }}>{ch.actualHours} h</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ 
                          background: ch.varianceHours > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                          color: ch.varianceHours > 0 ? '#fca5a5' : '#34d399',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          fontSize: '11px'
                        }}>
                          +{ch.varianceHours}h (+{ch.variancePct}%)
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: '#34d399' }}>
                        Rs. {ch.labourCostLkr.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: ch.avgScrapLossPct > 3.4 ? '#f87171' : '#34d399' }}>
                        {ch.avgScrapLossPct}%
                      </td>
                      <td style={{ fontSize: '11px', color: '#cbd5e1', whiteSpace: 'normal', maxWidth: '160px', lineHeight: '1.25' }}>{ch.billingModel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Page 1 Footer */}
        <div className="report-page-footer">
          <span>Page 1 of 4 • Executive Summary & Demand Channel Economics</span>
          <span>Ashadi Jewellers Workshop Production & Labour Costing System</span>
        </div>
      </div>

      {/* ========================================================
          PAGE 2: Precious Metals Scrap Matrix & Capacity Leak Waterfall
          ======================================================== */}
      <div className="report-print-page report-page-2">
        <div>
          {/* Page 2 Ribbon Header */}
          <div className="report-page-ribbon">
            <span className="ribbon-company">ASHADI JEWELLERS (PVT) LTD</span>
            <span className="ribbon-doc">MATERIAL AUDIT & WORKSHOP CAPACITY UTILIZATION • {reportData.period}</span>
          </div>

          {/* Precious Metals Performance & Scrap Recovery Matrix (Gold, Silver, Platinum) */}
          {preciousMetalsSummary && preciousMetalsSummary.length > 0 && (
            <div className="print-avoid-break" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 className="section-heading" style={{ fontSize: '16px', color: '#fff', margin: 0, fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={17} color="#d4af37" />
                  <span>Precious Metals Production & Scrap Recovery Matrix (Gold • Silver • Platinum)</span>
                </h3>
                <span className="section-meta-text" style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Multi-Metal Audit Across 63 Verified Benches
                </span>
              </div>

              <div className="precious-metals-grid">
                {preciousMetalsSummary.map((pm, idx) => {
                  const titleClass = idx === 0 ? 'pm-name-high-gold' :
                                     idx === 1 ? 'pm-name-commercial' :
                                     idx === 2 ? 'pm-name-platinum' :
                                     idx === 3 ? 'pm-name-silver' : 'pm-name-base';
                  return (
                    <div key={pm.metal} className="pm-card" style={{
                      background: '#0a0f1d',
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${pm.color}40`,
                      boxShadow: `0 4px 14px ${pm.color}10`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '16px' }}>{pm.icon}</span>
                          <div>
                            <div className={titleClass} style={{ fontSize: '13px', fontWeight: 'bold', color: pm.color }}>
                              {pm.metal}
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                              Symbol: <strong>{pm.symbol}</strong> • Ceiling: <strong>{pm.allowableScrapCeiling}%</strong>
                            </div>
                          </div>
                        </div>
                        <span style={{
                          background: pm.isWithinAllowance ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: pm.isWithinAllowance ? '#34d399' : '#f87171',
                          border: `1px solid ${pm.isWithinAllowance ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          {pm.isWithinAllowance ? '✓ Ceiling OK' : '⚠️ Exceeded'}
                        </span>
                      </div>

                      <div className="pm-inner-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: 'rgba(15, 23, 42, 0.7)', padding: '8px 10px', borderRadius: '6px', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Metal Issued</div>
                          <div className="pm-stat-num" style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                            {pm.issuedGrams} g
                          </div>
                          <div style={{ fontSize: '9px', color: '#64748b' }}>{pm.ordersCount} ord • {pm.piecesCount} pcs</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Scrap Loss %</div>
                          <div className="pm-stat-num" style={{ fontSize: '14px', fontWeight: 'bold', color: pm.isWithinAllowance ? '#34d399' : '#f87171' }}>
                            {pm.scrapLossPct}%
                          </div>
                          <div style={{ fontSize: '9px', color: '#64748b' }}>Max: {pm.allowableScrapCeiling}%</div>
                        </div>
                      </div>

                      <div style={{ fontSize: '10px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px' }}>
                        <span>Returned: <strong>{pm.returnedGrams} g</strong></span>
                        <span>Scrap: <strong>{pm.scrapGrams} g</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. The 19,656h Monthly Capacity Leak Waterfall */}
          <div className="print-avoid-break">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 className="section-heading" style={{ fontSize: '16px', color: '#fff', margin: 0, fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={17} color="#d4af37" />
                  <span>The Monthly Capacity Leak Waterfall (Where the Missing Hours Went)</span>
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0 0' }}>
                  Full breakdown of 19,656 Gross Available Plant Hours across the 26-day working month for 63 benches.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Plant Net Efficiency: </span>
                <strong style={{ fontSize: '18px', color: '#34d399' }}>{monthlyCapacityWaterfall.netPlantEfficiency}%</strong>
              </div>
            </div>

            <div className="waterfall-grid">
              <div className="waterfall-box" style={{ background: '#0a0f1d', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                <div className="wf-title" style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 'bold' }}>1. CRAFTSMAN LEAVES</div>
                <div className="wf-val" style={{ fontSize: '18px', fontWeight: '900', color: '#fff', marginTop: '4px' }}>
                  {monthlyCapacityWaterfall.approvedLeavesHours} hrs
                </div>
                <div className="wf-sub" style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                  Approved sick, medical & casual leaves
                </div>
              </div>

              <div className="waterfall-box" style={{ background: '#0a0f1d', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #64748b' }}>
                <div className="wf-title" style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold' }}>2. MEAL & TEA INTERVALS</div>
                <div className="wf-val" style={{ fontSize: '18px', fontWeight: '900', color: '#fff', marginTop: '4px' }}>
                  {monthlyCapacityWaterfall.mealAndTeaBreaks.toLocaleString()} hrs
                </div>
                <div className="wf-sub" style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                  1.5 hours daily break per craftsman
                </div>
              </div>

              <div className="waterfall-box" style={{ background: '#0a0f1d', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                <div className="wf-title" style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 'bold' }}>3. MELTING & ROLLING DELAYS</div>
                <div className="wf-val" style={{ fontSize: '18px', fontWeight: '900', color: '#f87171', marginTop: '4px' }}>
                  {monthlyCapacityWaterfall.benchWaitingDelay.toLocaleString()} hrs
                </div>
                <div className="wf-sub" style={{ fontSize: '10px', color: '#fca5a5', marginTop: '2px' }}>
                  #1 BOTTLENECK: Queue for melting & rolling
                </div>
              </div>

              <div className="waterfall-box" style={{ background: '#0a0f1d', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                <div className="wf-title" style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 'bold' }}>4. 13-HR FATIGUE SPEED GAP</div>
                <div className="wf-val" style={{ fontSize: '18px', fontWeight: '900', color: '#fbbf24', marginTop: '4px' }}>
                  {monthlyCapacityWaterfall.fatigueSpeedLoss.toLocaleString()} hrs
                </div>
                <div className="wf-sub" style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                  Pace rating drops in 10th-13th hours
                </div>
              </div>

              <div className="waterfall-box" style={{ background: '#0a0f1d', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #a855f7' }}>
                <div className="wf-title" style={{ fontSize: '11px', color: '#e9d5ff', fontWeight: 'bold' }}>5. UNLOGGED REWORK DEFECTS</div>
                <div className="wf-val" style={{ fontSize: '18px', fontWeight: '900', color: '#c084fc', marginTop: '4px' }}>
                  {monthlyCapacityWaterfall.unloggedRework.toLocaleString()} hrs
                </div>
                <div className="wf-sub" style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                  Porosity & solder seam touchups
                </div>
              </div>

              <div className="waterfall-box" style={{ background: '#0a0f1d', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                <div className="wf-title" style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 'bold' }}>6. EARNED PRODUCTIVE OUTPUT</div>
                <div className="wf-val" style={{ fontSize: '18px', fontWeight: '900', color: '#34d399', marginTop: '4px' }}>
                  {monthlyCapacityWaterfall.earnedStandardOutputHours.toLocaleString()} hrs
                </div>
                <div className="wf-sub" style={{ fontSize: '10px', color: '#34d399', marginTop: '2px' }}>
                  Actual delivered standard output
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2 Footer */}
        <div className="report-page-footer">
          <span>Page 2 of 4 • Material Scrap Recovery & Capacity Leak Analysis</span>
          <span>Ashadi Jewellers Workshop Production & Labour Costing System</span>
        </div>
      </div>

      {/* ========================================================
          PAGE 3: Craftsmen Leaderboard & Wage Audit (Top 20 Table)
          ======================================================== */}
      <div className="report-print-page report-page-3">
        <div>
          {/* Page 3 Ribbon Header */}
          <div className="report-page-ribbon">
            <span className="ribbon-company">ASHADI JEWELLERS (PVT) LTD</span>
            <span className="ribbon-doc">CRAFTSMEN ATTENDANCE, EFFICIENCY & REMUNERATION AUDIT • {reportData.period}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 className="section-heading" style={{ fontSize: '16px', color: '#fff', margin: 0, fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={17} color="#d4af37" />
              <span>Craftsmen Monthly Attendance, Efficiency & Remuneration Leaderboard</span>
            </h3>
            <span className="section-meta-text" style={{ fontSize: '12px', color: '#94a3b8' }}>
              Ranked by Efficiency % • Top 20 of 63 Master Craftsmen • Wage Incentive Audited
            </span>
          </div>

          <div className="table-luxury-wrap">
            <table className="table-luxury">
              <thead>
                <tr>
                  <th style={{ width: '5%', textAlign: 'center' }}>Rank</th>
                  <th style={{ width: '6%' }}>Bench</th>
                  <th style={{ width: '18%' }}>Craftsman Name</th>
                  <th style={{ width: '7%' }}>Emp#</th>
                  <th style={{ width: '7%' }}>Tier</th>
                  <th style={{ width: '6%', textAlign: 'center' }}>Pres.</th>
                  <th style={{ width: '6%', textAlign: 'center' }}>Leave</th>
                  <th style={{ width: '7%', textAlign: 'right' }}>Assumed</th>
                  <th style={{ width: '7%', textAlign: 'right' }}>Actual</th>
                  <th style={{ width: '6%', textAlign: 'right' }}>Eff %</th>
                  <th style={{ width: '11%', textAlign: 'center' }}>Bonus (Rs.450)</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>Total Monthly Pay</th>
                </tr>
              </thead>
              <tbody>
                {craftsmenRanking.map((c) => (
                  <tr key={c.id}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: c.rank <= 3 ? '#d4af37' : '#94a3b8' }}>
                      {c.rank <= 3 ? `🏆 #${c.rank}` : `#${c.rank}`}
                    </td>
                    <td><strong style={{ color: '#d4af37' }}>{c.id}</strong></td>
                    <td style={{ fontWeight: '600', color: '#fff', whiteSpace: 'normal', maxWidth: '180px' }}>{c.name}</td>
                    <td>{c.empNo || '—'}</td>
                    <td>
                      <span style={{ 
                        color: c.skillTier === 'Grade A' ? '#fbbf24' : c.skillTier === 'Grade B' ? '#93c5fd' : '#cbd5e1',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {c.skillTier}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{c.presentDays} d</td>
                    <td style={{ textAlign: 'center', color: c.leaveDays > 0 ? '#f87171' : '#94a3b8' }}>
                      {c.leaveDays} d
                    </td>
                    <td style={{ textAlign: 'right', color: '#93c5fd' }}>{c.assumedHours} h</td>
                    <td style={{ textAlign: 'right', color: '#fbbf24' }}>{c.actualHours} h</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ 
                        color: c.efficiency >= 85 ? '#34d399' : '#f87171',
                        fontWeight: 'bold'
                      }}>
                        {c.efficiency}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', color: '#fbbf24', fontWeight: 'bold' }}>
                      {c.bonusDays} d (Rs. {(c.bonusDays * 450).toLocaleString()})
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#34d399' }}>
                      Rs. {c.monthlyPay.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>
            * Craftsmen with efficiency &ge; 85% earn a daily attendance/performance incentive bonus of Rs. 450. Full wages reflect piece-rate completion plus earned bonuses across 26 scheduled workshop days.
          </div>
        </div>

        {/* Page 3 Footer */}
        <div className="report-page-footer">
          <span>Page 3 of 4 • Bench Efficiency & Remuneration Audit (Top 20 Performers)</span>
          <span>Ashadi Jewellers Workshop Production & Labour Costing System</span>
        </div>
      </div>

      {/* ========================================================
          PAGE 4: Strategic Recommendations & Governance Sign-Off
          ======================================================== */}
      <div className="report-print-page report-page-4">
        <div>
          {/* Page 4 Ribbon Header */}
          <div className="report-page-ribbon">
            <span className="ribbon-company">ASHADI JEWELLERS (PVT) LTD</span>
            <span className="ribbon-doc">STRATEGIC MANAGEMENT DIRECTIVES & GOVERNANCE SIGN-OFF • {reportData.period}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 className="section-heading" style={{ fontSize: '16px', color: '#fff', margin: 0, fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={17} color="#d4af37" />
              <span>Strategic Management Recommendations for the Owner</span>
            </h3>
            <span className="section-meta-text" style={{ fontSize: '12px', color: '#94a3b8' }}>
              Prioritized Interventions to Recover Bottlenecks and Maximize Capacity
            </span>
          </div>

          {/* 4 Cards in 2x2 Grid */}
          <div className="recommendations-grid">
            {executiveInsights.map((insight, idx) => (
              <div key={idx} className="rec-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="rec-number" style={{ background: '#d4af37', color: '#0f172a', fontWeight: '900', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
                    0{idx + 1}
                  </span>
                  <h4 className="rec-card-title" style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '14px', margin: 0 }}>
                    {insight.title}
                  </h4>
                </div>
                <div className="rec-card-impact" style={{ color: '#f87171', fontSize: '12px', fontWeight: 'bold', margin: '4px 0' }}>
                  Impact: {insight.impact}
                </div>
                <div className="rec-card-body" style={{ color: '#cbd5e1', fontSize: '12px', lineHeight: '1.45' }}>
                  {insight.recommendation}
                </div>
              </div>
            ))}
          </div>

          {/* Official Executive Sign-Off & Verification Block */}
          <div className="executive-signoff-block">
            <div className="signoff-box">
              <div className="signoff-title">PREPARED BY</div>
              <div className="signoff-role">Workshop Production Manager</div>
              <div className="signoff-line" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)', margin: '26px 16px 6px 16px' }}></div>
              <div className="signoff-meta">Signature / Date</div>
            </div>

            <div className="signoff-box">
              <div className="signoff-title">AUDITED BY</div>
              <div className="signoff-role">Chief Financial & Audit Controller</div>
              <div className="signoff-line" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)', margin: '26px 16px 6px 16px' }}></div>
              <div className="signoff-meta">Signature / Date</div>
            </div>

            <div className="signoff-box">
              <div className="signoff-title">APPROVED & SANCTIONED BY</div>
              <div className="signoff-role">Managing Director / Owner</div>
              <div className="signoff-line" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)', margin: '26px 16px 6px 16px' }}></div>
              <div className="signoff-meta">Authorized Signature & Official Stamp</div>
            </div>
          </div>
        </div>

        {/* Page 4 Footer */}
        <div className="report-page-footer">
          <span>Page 4 of 4 • Strategic Action Directives & Executive Governance Sign-Off</span>
          <span>Ashadi Jewellers Workshop Production & Labour Costing System</span>
        </div>
      </div>
    </div>
  );
}
