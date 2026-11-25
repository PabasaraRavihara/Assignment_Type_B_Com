import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  Clock, 
  Users, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Building2, 
  Store, 
  Package, 
  Search, 
  ChevronRight,
  TrendingUp,
  Layers
} from 'lucide-react';
import { formatMinutesToTime, timeStringToMinutes, calculateDynamicETA, getMetalScrapCeiling, calculateGoldWastageReconciliation } from '../utils/floorTiming';
import { getDailyGoldRates, formatLKR } from '../utils/goldRates';

export default function DailyReportView({
  allocations = [],
  craftsmen = [],
  designs = [],
  leaves = [],
  initialDate,
  onNavigateTab
}) {
  const [reportDate, setReportDate] = useState(() => {
    return initialDate || new Date().toISOString().split('T')[0];
  });
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Shift Date Navigation
  const handleShiftDate = (days) => {
    const d = new Date(reportDate);
    d.setDate(d.getDate() + days);
    setReportDate(d.toISOString().split('T')[0]);
  };

  // 2. Day-Specific Allocations and Leaves
  const dayAllocations = useMemo(() => {
    return (allocations || []).filter(a => a.date === reportDate);
  }, [allocations, reportDate]);

  const dayLeaves = useMemo(() => {
    return (leaves || []).filter(l => l.date === reportDate);
  }, [leaves, reportDate]);

  // 3. Gold Rates for Valuation
  const goldRates = useMemo(() => getDailyGoldRates(), []);
  const rate22KGram = goldRates?.rates?.['Gold 22K']?.perGram || 39531.25;

  // 4. Compute Comprehensive Day Metrics
  const metrics = useMemo(() => {
    const activeLeavesCount = dayLeaves.length;
    const activeBenches = Math.max(0, 63 - activeLeavesCount);
    const totalOrders = dayAllocations.length;
    const completedOrders = dayAllocations.filter(a => a.status === 'Completed' || a.actualHours !== null).length;
    const inProgressOrders = totalOrders - completedOrders;

    let totalBudgetedHours = 0;
    let totalActualHours = 0;
    let totalIssuedGrams = 0;
    let totalFinishGrams = 0;
    let totalAllowedWastageGrams = 0;
    let totalScrapReturnedGrams = 0;
    let totalAccountedGrams = 0;

    let earlyCount = 0;
    let onTimeCount = 0;
    let lateCount = 0;

    dayAllocations.forEach(a => {
      const budgetH = (a.assumedHours && parseFloat(a.assumedHours) > 0)
        ? parseFloat(a.assumedHours)
        : (a.budgetedSMT ? a.budgetedSMT / 60 : 4.0);
      totalBudgetedHours += budgetH;

      const actH = parseFloat(a.actualHours) || 0;
      totalActualHours += actH;

      const issued = parseFloat(a.goldIssuedGrams) || 0;
      totalIssuedGrams += issued;

      const finish = parseFloat(a.finishedItemGrams) || 0;
      totalFinishGrams += finish;

      const scrap = parseFloat(a.scrapReturnedGrams) || 0;
      totalScrapReturnedGrams += scrap;

      // 3.75% Allowable Wastage calculation
      const ceilingPct = getMetalScrapCeiling(a.metalType || 'Gold 22K');
      const allowedLoss = parseFloat((finish * (ceilingPct / 100)).toFixed(3));
      totalAllowedWastageGrams += allowedLoss;

      const accounted = parseFloat((finish + scrap).toFixed(3));
      totalAccountedGrams += (accounted > 0 ? accounted : (parseFloat(a.goldReturnedGrams) || 0));

      if (a.status === 'Completed' || a.actualHours !== null) {
        const diff = actH - budgetH;
        if (diff < -0.1) earlyCount++;
        else if (diff > 0.1) lateCount++;
        else onTimeCount++;
      }
    });

    const netLossGrams = parseFloat(Math.max(0, totalIssuedGrams - totalAccountedGrams).toFixed(3));
    const netLossPct = totalIssuedGrams > 0 ? parseFloat(((netLossGrams / totalIssuedGrams) * 100).toFixed(2)) : 0;
    const totalBullionValuation = Math.round(totalIssuedGrams * rate22KGram);

    return {
      activeBenches,
      activeLeavesCount,
      totalOrders,
      completedOrders,
      inProgressOrders,
      totalBudgetedHours: parseFloat(totalBudgetedHours.toFixed(1)),
      totalActualHours: parseFloat(totalActualHours.toFixed(1)),
      hoursVariance: parseFloat((totalActualHours - totalBudgetedHours).toFixed(1)),
      totalIssuedGrams: parseFloat(totalIssuedGrams.toFixed(2)),
      totalFinishGrams: parseFloat(totalFinishGrams.toFixed(2)),
      totalAllowedWastageGrams: parseFloat(totalAllowedWastageGrams.toFixed(2)),
      totalScrapReturnedGrams: parseFloat(totalScrapReturnedGrams.toFixed(2)),
      totalAccountedGrams: parseFloat(totalAccountedGrams.toFixed(2)),
      netLossGrams,
      netLossPct,
      totalBullionValuation,
      earlyCount,
      onTimeCount,
      lateCount
    };
  }, [dayAllocations, dayLeaves, rate22KGram]);

  // 5. Filtered Table Records
  const filteredOrders = useMemo(() => {
    return dayAllocations.filter(a => {
      if (channelFilter !== 'ALL' && a.channel !== channelFilter) return false;
      if (statusFilter === 'COMPLETED' && !(a.status === 'Completed' || a.actualHours !== null)) return false;
      if (statusFilter === 'IN_PROGRESS' && (a.status === 'Completed' || a.actualHours !== null)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const cName = (a.craftsmanName || '').toLowerCase();
        const wOrder = (a.workOrder || '').toLowerCase();
        const dCode = (a.designCode || '').toLowerCase();
        if (!cName.includes(q) && !wOrder.includes(q) && !dCode.includes(q)) return false;
      }
      return true;
    });
  }, [dayAllocations, channelFilter, statusFilter, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="daily-shift-report-container" style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 20px 60px 20px' }}>
      {/* Print-Only Header Styles */}
      <style>{`
        @media print {
          body { background: #fff !important; color: #000 !important; font-family: sans-serif; }
          .no-print, .top-nav, footer, .top-actions { display: none !important; }
          .daily-shift-report-container { padding: 0 !important; max-width: 100% !important; }
          .report-paper-card { border: 1px solid #ccc !important; box-shadow: none !important; background: #fff !important; color: #000 !important; page-break-after: always; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #ddd !important; padding: 6px !important; color: #000 !important; font-size: 10px !important; }
          th { background: #f0f0f0 !important; color: #000 !important; }
        }
      `}</style>

      {/* Top Action Bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fef08a', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            <Sparkles size={13} color="#fef08a" />
            <span>Workshop Daily Shift Production & Gold Audit</span>
          </div>
          <h2 style={{ fontSize: '24px', fontFamily: "'Cinzel', Georgia, serif", color: '#fef08a', margin: 0, fontWeight: '700' }}>
            Daily Workshop Production Report
          </h2>
        </div>

        {/* Date Selector & Print Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid rgba(212, 175, 55, 0.4)', borderRadius: '10px', padding: '4px 8px', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              style={{ background: 'transparent', border: 'none', color: '#d4af37', cursor: 'pointer', padding: '4px 8px', fontWeight: 'bold' }}
              title="Previous Shift"
            >
              ‹ Prev
            </button>
            <input 
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}
            />
            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              style={{ background: 'transparent', border: 'none', color: '#d4af37', cursor: 'pointer', padding: '4px 8px', fontWeight: 'bold' }}
              title="Next Shift"
            >
              Next ›
            </button>
            <button
              type="button"
              onClick={() => setReportDate(new Date().toISOString().split('T')[0])}
              style={{ background: 'rgba(212, 175, 55, 0.2)', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '6px', color: '#fef08a', fontSize: '11px', padding: '3px 8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Today
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1.5px solid #d4af37',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(180, 130, 20, 0.2) 100%)',
              color: '#fef08a',
              fontSize: '12px',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.25)'
            }}
          >
            <Printer size={15} color="#fef08a" />
            <span>Print A4 Daily Report</span>
          </button>
        </div>
      </div>

      {/* Main Report Document Card */}
      <div className="report-paper-card" style={{ background: 'rgba(10, 15, 29, 0.85)', border: '1.5px solid rgba(212, 175, 55, 0.35)', borderRadius: '16px', padding: '24px', boxShadow: '0 15px 40px rgba(0, 0, 0, 0.5)' }}>
        {/* Document Header (Always prints nicely) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid rgba(212, 175, 55, 0.35)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fef08a', letterSpacing: '1px', fontFamily: "'Cinzel', Georgia, serif" }}>
              ASHADI JEWELLERS
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
              Factory Workshop Production & Metallurgical Gold Audit Report
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Shift Operating Hours: <strong>07:00 AM – 08:30 PM (13.5 Hours Floor Span)</strong>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
              Shift Date: <span style={{ color: '#fef08a' }}>{reportDate}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Market Valuation: <strong style={{ color: '#fef08a' }}>Rs. 345,000 / 24K Sovereign</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
              ● 22K Gram Benchmark: {formatLKR(rate22KGram)}/g
            </div>
          </div>
        </div>

        {/* 4-Column High Level KPI Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          {/* Box 1: Bench Presence */}
          <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700', textTransform: 'uppercase' }}>
              👥 Bench Attendance
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: '4px 0' }}>
              {metrics.activeBenches} <span style={{ fontSize: '13px', color: '#94a3b8' }}>/ 63 Benches Active</span>
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
              {metrics.activeLeavesCount} Craftsmen on Approved Leave
            </div>
          </div>

          {/* Box 2: Orders & Pcs */}
          <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase' }}>
              📦 Work Orders Completed
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: '4px 0' }}>
              {metrics.completedOrders} <span style={{ fontSize: '13px', color: '#94a3b8' }}>/ {metrics.totalOrders} Orders Vaulted</span>
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
              {metrics.inProgressOrders} active in-progress or queued at bench
            </div>
          </div>

          {/* Box 3: Labour Hours */}
          <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', textTransform: 'uppercase' }}>
              ⏱️ Labour Hours Worked
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: '4px 0' }}>
              {metrics.totalActualHours}h <span style={{ fontSize: '13px', color: '#94a3b8' }}>/ {metrics.totalBudgetedHours}h Budget</span>
            </div>
            <div style={{ fontSize: '11px', color: metrics.hoursVariance <= 0 ? '#4ade80' : '#f87171' }}>
              Punctuality: <strong>{metrics.earlyCount} Early</strong> • <strong>{metrics.onTimeCount} On Time</strong> • <strong>{metrics.lateCount} Late</strong>
            </div>
          </div>

          {/* Box 4: Gold Bullion Valuation */}
          <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(212, 175, 55, 0.35)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', color: '#fef08a', fontWeight: '700', textTransform: 'uppercase' }}>
              🪙 Total Gold Issued Value
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fef08a', margin: '4px 0' }}>
              {formatLKR(metrics.totalBullionValuation)}
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
              Total Gold Issued: <strong style={{ color: '#fff' }}>{metrics.totalIssuedGrams}g</strong> (22K)
            </div>
          </div>
        </div>

        {/* Metallurgical Gold Reconciliation Balance Card */}
        <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1.5px solid rgba(212, 175, 55, 0.45)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#fef08a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Scale size={16} color="#d4af37" />
              <span>Shift Metallurgical Gold Balance & 3.75% Wastage Audit</span>
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Allowable Scrap Formula: <strong style={{ color: '#fef08a' }}>Finished Item Weight × 3.75%</strong>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>1. Gold Issued to Benches:</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fef08a' }}>{metrics.totalIssuedGrams}g</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>2. Finished Jewellery Net:</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#38bdf8' }}>{metrics.totalFinishGrams}g</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>3. Allowed 3.75% Wastage:</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#cbd5e1' }}>{metrics.totalAllowedWastageGrams}g</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>4. Scrap Dust Returned:</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fbbf24' }}>{metrics.totalScrapReturnedGrams}g</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>5. Total Accounted:</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{metrics.totalAccountedGrams}g</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>6. Net Factory Loss:</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: metrics.netLossPct <= 3.75 ? '#4ade80' : '#f87171' }}>
                {metrics.netLossGrams}g ({metrics.netLossPct}%)
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls (Hidden on print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input 
              type="text"
              placeholder="Search craftsman, order, design..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '8px',
                color: '#fff',
                padding: '7px 10px 7px 32px',
                fontSize: '12px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(212, 175, 55, 0.3)', color: '#fff', padding: '6px 10px', borderRadius: '8px', fontSize: '12px' }}
            >
              <option value="ALL">All Channels (B2B & Retail)</option>
              <option value="EXTERNAL_SHOP">External Partner Shops</option>
              <option value="OWN_SHOWROOM">Ashadi Showrooms</option>
              <option value="FACTORY_STOCK">Factory Stock</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(212, 175, 55, 0.3)', color: '#fff', padding: '6px 10px', borderRadius: '8px', fontSize: '12px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed & Vaulted</option>
              <option value="IN_PROGRESS">In Progress / Queued</option>
            </select>
          </div>
        </div>

        {/* Detailed Work Orders & Bench Execution Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '2px solid rgba(212, 175, 55, 0.4)' }}>
                <th style={{ padding: '10px 12px', color: '#fef08a' }}>Bench / Craftsman</th>
                <th style={{ padding: '10px 12px', color: '#fef08a' }}>Order & Design</th>
                <th style={{ padding: '10px 12px', color: '#fef08a' }}>Destination</th>
                <th style={{ padding: '10px 12px', color: '#fef08a' }}>Given Time</th>
                <th style={{ padding: '10px 12px', color: '#fef08a' }}>Start Time</th>
                <th style={{ padding: '10px 12px', color: '#fef08a' }}>Target ETA / End</th>
                <th style={{ padding: '10px 12px', color: '#fef08a' }}>Hours (Assumed vs Act)</th>
                <th style={{ padding: '10px 12px', color: '#fef08a' }}>Punctuality Status</th>
                <th style={{ padding: '10px 12px', color: '#fef08a' }}>Gold (Issued / Piece / Scrap)</th>
                <th style={{ padding: '10px 12px', color: '#fef08a' }}>3.75% Wastage Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No work orders found for shift date {reportDate} matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const isCompleted = order.status === 'Completed' || (order.actualHours !== null && order.actualHours !== undefined);
                  const budgetH = (order.assumedHours && parseFloat(order.assumedHours) > 0)
                    ? parseFloat(order.assumedHours)
                    : (order.budgetedSMT ? order.budgetedSMT / 60 : 4.0);
                  const actH = parseFloat(order.actualHours) || 0;
                  const diffH = isCompleted ? parseFloat((actH - budgetH).toFixed(1)) : 0;

                  const issued = parseFloat(order.goldIssuedGrams) || 0;
                  const finish = parseFloat(order.finishedItemGrams) || 0;
                  const scrap = parseFloat(order.scrapReturnedGrams) || 0;
                  const ceilingPct = getMetalScrapCeiling(order.metalType || 'Gold 22K');
                  const allowedLoss = parseFloat((finish * (ceilingPct / 100)).toFixed(3));
                  const accounted = finish > 0 ? (finish + scrap) : (parseFloat(order.goldReturnedGrams) || 0);
                  const lossGrams = Math.max(0, issued - accounted);
                  const lossPct = issued > 0 ? ((lossGrams / issued) * 100).toFixed(1) : 0;

                  return (
                    <tr 
                      key={order.id || order._id || idx} 
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 'bold', color: '#fff' }}>{order.craftsmanName || 'Craftsman'}</div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                          Bench: <strong style={{ color: '#fef08a' }}>{order.craftsmanId || 'C001'}</strong> • {order.skillTier || 'Grade B'}
                        </div>
                      </td>

                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 'bold', color: '#d4af37' }}>{order.workOrder}</div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{order.designCode || order.designName} ({order.qtyAllocated || 1} pcs)</div>
                      </td>

                      <td style={{ padding: '10px 12px', fontSize: '11px', color: '#cbd5e1' }}>
                        {order.channelName || order.channel}
                      </td>

                      <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                        {order.dispatchTime || '07:15 AM'}
                      </td>

                      <td style={{ padding: '10px 12px', color: '#38bdf8' }}>
                        {order.dispatchTime || '07:15 AM'}
                      </td>

                      <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#fef08a' }}>
                        {order.completedAtTime ? `Vaulted ${order.completedAtTime}` : (order.targetETATime || 'Pending')}
                      </td>

                      <td style={{ padding: '10px 12px' }}>
                        <div>Budget: <strong>{budgetH}h</strong></div>
                        {isCompleted && (
                          <div style={{ fontSize: '11px', color: '#4ade80' }}>
                            Actual: <strong>{actH}h</strong>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '10px 12px' }}>
                        {isCompleted ? (
                          diffH < -0.1 ? (
                            <span style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                              ⚡ Early by {Math.abs(Math.round(diffH * 60))}m
                            </span>
                          ) : diffH > 0.1 ? (
                            <span style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                              ⚠️ Late by {Math.round(diffH * 60)}m
                            </span>
                          ) : (
                            <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                              ✅ On Time
                            </span>
                          )
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>In Progress</span>
                        )}
                      </td>

                      <td style={{ padding: '10px 12px' }}>
                        <div>Issued: <strong style={{ color: '#fef08a' }}>{issued}g</strong></div>
                        {finish > 0 ? (
                          <div style={{ fontSize: '11px', color: '#38bdf8' }}>
                            Item: {finish}g | Scrap: {scrap}g
                          </div>
                        ) : (
                          <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Pending Vault Check-In</div>
                        )}
                      </td>

                      <td style={{ padding: '10px 12px' }}>
                        {finish > 0 ? (
                          lossPct <= ceilingPct ? (
                            <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '11px' }}>
                              ✅ Balanced ({lossPct}% loss • max {ceilingPct}%)
                            </span>
                          ) : (
                            <span style={{ color: '#f87171', fontWeight: 'bold', fontSize: '11px' }}>
                              ⚠️ Excess Loss ({lossPct}% vs {ceilingPct}%)
                            </span>
                          )
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Max {ceilingPct}% Allowed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Supervisor & Owner Signoff Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ borderBottom: '1px solid #94a3b8', marginBottom: '6px', height: '30px' }}></div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>Workshop Floor Supervisor</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Verified Production & Gold Scale</div>
          </div>

          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ borderBottom: '1px solid #94a3b8', marginBottom: '6px', height: '30px' }}></div>
            <div style={{ fontSize: '11px', color: '#d4af37', fontWeight: 'bold' }}>Ashadi Jewellers — Owner / MD</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Executive Audit Approval</div>
          </div>
        </div>
      </div>
    </div>
  );
}
