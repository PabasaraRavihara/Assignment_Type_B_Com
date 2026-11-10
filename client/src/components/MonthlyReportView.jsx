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
      {/* Report Header Bar */}
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
            <span>Print / PDF</span>
          </button>

          <button className="btn-gold-primary" onClick={handleDownloadExcel} title="Download Complete Excel Sheet">
            <Download size={16} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Official Branded Paper Header (Visible in Print & Screen) */}
      <div className="report-paper-card" style={{ marginBottom: '24px', padding: '24px', background: 'linear-gradient(180deg, rgba(20, 26, 44, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#fef08a', letterSpacing: '0.05em', fontFamily: 'var(--font-serif)' }}>
              ASHADI JEWELLERS (PVT) LTD
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
              Central Jewellery Manufacturing Workshop • Colombo, Sri Lanka
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
              MONTHLY LABOUR COST & AUDIT
            </div>
            <div style={{ fontSize: '13px', color: '#d4af37', fontWeight: 'bold' }}>
              Reporting Period: {reportData.period} (26 Working Days)
            </div>
          </div>
        </div>

        {/* Period Context & Action Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '10px 16px', borderRadius: '8px', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '13px', color: '#fef08a' }}>
            📌 <strong>Active Period: {reportData.period}</strong> — Auditing <strong>{executiveSummary.totalOrders} Logged Orders</strong>, <strong>{executiveSummary.totalPiecesProduced} Finished Pieces</strong> across 4 channels, and <strong>63 Verified Benches</strong>.
          </div>
          <button 
            className="btn-ghost-secondary no-print" 
            onClick={() => onNavigateTab && onNavigateTab('allocations')}
            style={{ fontSize: '12px', padding: '4px 10px', color: '#fef08a' }}
          >
            + Add / Log More Orders for {reportData.period}
          </button>
        </div>

        {/* 1. Executive Summary KPI Dashboard Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
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
              <span className="kpi-value" style={{ color: '#34d399', fontSize: '20px' }}>
                Rs. {(executiveSummary.totalMonthlyLabourCost / 1000).toFixed(0)}k
              </span>
            </div>
            <div className="kpi-caption">Piece-rate wages + efficiency bonuses</div>
          </div>

          <div className="kpi-card-luxury">
            <div className="kpi-header">
              <span className="kpi-label">AVG GOLD SCRAP LOSS</span>
              <ShieldCheck size={15} color="#fef08a" />
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value" style={{ color: '#fef08a' }}>{executiveSummary.avgGoldLossPct}%</span>
            </div>
            <div className="kpi-caption">Target ceiling: &lt; 3.5% gold loss</div>
          </div>
        </div>

        {/* 2. Multi-Channel Performance Matrix (Comparison Table & Breakdown) */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '18px', color: '#fff', margin: 0, fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#d4af37" />
              <span>Multi-Channel Production & Cost Attribution (The 4 Channels)</span>
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Total Monthly Orders: <strong>{executiveSummary.totalOrders}</strong> • Total Pieces: <strong>{executiveSummary.totalPiecesProduced} pcs</strong>
            </span>
          </div>

          <div className="table-luxury-wrap">
            <table className="table-luxury">
              <thead>
                <tr>
                  <th>Demand Channel</th>
                  <th>Client / Destination</th>
                  <th>Monthly Orders</th>
                  <th>Finished Pieces</th>
                  <th>Assumed (Est.) Hrs</th>
                  <th>Actual Taken Hrs</th>
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
                        color: ch.channelCode === 'EXTERNAL_SHOP' ? '#fef08a' :
                               ch.channelCode === 'OWN_SHOWROOM' ? '#93c5fd' :
                               ch.channelCode === 'FACTORY_STOCK' ? '#cbd5e1' : '#e9d5ff'
                      }}>
                        {ch.channelName}
                      </strong>
                    </td>
                    <td style={{ fontSize: '12px', color: '#94a3b8' }}>{ch.description}</td>
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
                        fontSize: '12px'
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
                    <td style={{ fontSize: '11px', color: '#cbd5e1' }}>{ch.billingModel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Precious Metals Performance & Scrap Recovery Matrix (Gold, Silver, Platinum) */}
        {preciousMetalsSummary && preciousMetalsSummary.length > 0 && (
          <div style={{ marginBottom: '28px', background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', color: '#fff', margin: 0, fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#d4af37" />
                <span>Precious Metals Production & Scrap Recovery Matrix (Gold • Silver • Platinum)</span>
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Multi-Metal Audit Across 63 Verified Benches
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px' }}>
              {preciousMetalsSummary.map((pm) => (
                <div key={pm.metal} style={{
                  background: '#0a0f1d',
                  padding: '16px',
                  borderRadius: '10px',
                  border: `1px solid ${pm.color}40`,
                  boxShadow: `0 4px 16px ${pm.color}10`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{pm.icon}</span>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: pm.color }}>
                          {pm.metal}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Symbol: <strong>{pm.symbol}</strong> • Scrap Ceiling: <strong>{pm.allowableScrapCeiling}%</strong>
                        </div>
                      </div>
                    </div>
                    <span style={{
                      background: pm.isWithinAllowance ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: pm.isWithinAllowance ? '#34d399' : '#f87171',
                      border: `1px solid ${pm.isWithinAllowance ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {pm.isWithinAllowance ? '✓ Within Ceiling' : '⚠️ Scrap Exceeded'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(15, 23, 42, 0.7)', padding: '10px 12px', borderRadius: '8px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Metal Issued</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                        {pm.issuedGrams} g
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{pm.ordersCount} orders • {pm.piecesCount} pcs</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Scrap Loss %</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: pm.isWithinAllowance ? '#34d399' : '#f87171' }}>
                        {pm.scrapLossPct}%
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Ceiling: {pm.allowableScrapCeiling}%</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
                    <span>Returned: <strong>{pm.returnedGrams} g</strong></span>
                    <span>Scrap: <strong>{pm.scrapGrams} g</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. The 19,656h Monthly Capacity Leak Waterfall */}
        <div style={{ marginBottom: '28px', background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', color: '#fff', margin: 0, fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#d4af37" />
                <span>The Monthly Capacity Leak Waterfall (Where the Missing Hours Went)</span>
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                Full breakdown of 19,656 Gross Available Plant Hours across the 26-day working month for 63 benches.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Plant Net Efficiency: </span>
              <strong style={{ fontSize: '18px', color: '#34d399' }}>{monthlyCapacityWaterfall.netPlantEfficiency}%</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div style={{ background: '#0a0f1d', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '12px', color: '#93c5fd', fontWeight: 'bold' }}>1. CRAFTSMAN LEAVES</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', marginTop: '4px' }}>
                {monthlyCapacityWaterfall.approvedLeavesHours} hrs
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Approved sick, medical & casual leaves
              </div>
            </div>

            <div style={{ background: '#0a0f1d', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #64748b' }}>
              <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold' }}>2. MEAL & TEA INTERVALS</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', marginTop: '4px' }}>
                {monthlyCapacityWaterfall.mealAndTeaBreaks.toLocaleString()} hrs
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                1.5 hours daily break per craftsman
              </div>
            </div>

            <div style={{ background: '#0a0f1d', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '12px', color: '#fca5a5', fontWeight: 'bold' }}>3. MELTING & ROLLING DELAYS</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#f87171', marginTop: '4px' }}>
                {monthlyCapacityWaterfall.benchWaitingDelay.toLocaleString()} hrs
              </div>
              <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '2px' }}>
                #1 BOTTLENECK: Queue for melting & rolling
              </div>
            </div>

            <div style={{ background: '#0a0f1d', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '12px', color: '#fef08a', fontWeight: 'bold' }}>4. 13-HOUR FATIGUE SPEED GAP</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#fbbf24', marginTop: '4px' }}>
                {monthlyCapacityWaterfall.fatigueSpeedLoss.toLocaleString()} hrs
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Pace rating drops in 10th-13th hours
              </div>
            </div>

            <div style={{ background: '#0a0f1d', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #a855f7' }}>
              <div style={{ fontSize: '12px', color: '#e9d5ff', fontWeight: 'bold' }}>5. UNLOGGED REWORK DEFECTS</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#c084fc', marginTop: '4px' }}>
                {monthlyCapacityWaterfall.unloggedRework.toLocaleString()} hrs
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Porosity & solder seam touchups
              </div>
            </div>

            <div style={{ background: '#0a0f1d', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '12px', color: '#6ee7b7', fontWeight: 'bold' }}>6. EARNED PRODUCTIVE OUTPUT</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#34d399', marginTop: '4px' }}>
                {monthlyCapacityWaterfall.earnedStandardOutputHours.toLocaleString()} hrs
              </div>
              <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>
                Actual delivered jewellery standard output
              </div>
            </div>
          </div>
        </div>

        {/* 4. Top Performing Craftsmen & Monthly Remuneration */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '18px', color: '#fff', margin: 0, fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#d4af37" />
              <span>Craftsmen Monthly Attendance, Efficiency & Remuneration Leaderboard</span>
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Ranked by Efficiency % • Top 20 of 63 Master Craftsmen
            </span>
          </div>

          <div className="table-luxury-wrap">
            <table className="table-luxury">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Bench ID</th>
                  <th>Craftsman Name</th>
                  <th>Employ No.</th>
                  <th>Skill Tier</th>
                  <th>Present Days</th>
                  <th>Leave Days</th>
                  <th>Assumed Hrs</th>
                  <th>Actual Hrs</th>
                  <th>Efficiency %</th>
                  <th>Bonus Days (Rs.450)</th>
                  <th>Total Monthly Pay</th>
                </tr>
              </thead>
              <tbody>
                {craftsmenRanking.map((c) => (
                  <tr key={c.id}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: c.rank <= 3 ? '#d4af37' : '#94a3b8' }}>
                      {c.rank <= 3 ? `🏆 #${c.rank}` : `#${c.rank}`}
                    </td>
                    <td><strong style={{ color: '#d4af37' }}>{c.id}</strong></td>
                    <td style={{ fontWeight: '600', color: '#fff' }}>{c.name}</td>
                    <td>{c.empNo || '—'}</td>
                    <td>
                      <span style={{ 
                        color: c.skillTier === 'Grade A' ? '#fef08a' : c.skillTier === 'Grade B' ? '#93c5fd' : '#cbd5e1',
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
                    <td style={{ textAlign: 'center', color: '#fef08a', fontWeight: 'bold' }}>
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
        </div>

        {/* 5. Boss Key Insights & Strategic Action Plan */}
        <div>
          <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '14px', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#d4af37" />
            <span>Strategic Management Recommendations for the Owner</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {executiveInsights.map((insight, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: 'rgba(212, 175, 55, 0.05)', 
                  border: '1px solid rgba(212, 175, 55, 0.2)', 
                  borderRadius: '8px', 
                  padding: '16px' 
                }}
              >
                <div style={{ color: '#fef08a', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                  {idx + 1}. {insight.title}
                </div>
                <div style={{ color: '#f87171', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                  Impact: {insight.impact}
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '12px', lineHeight: '1.5' }}>
                  {insight.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
