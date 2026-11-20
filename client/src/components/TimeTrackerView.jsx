import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  DollarSign, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  Scale, 
  Edit3, 
  Check, 
  X, 
  Calendar, 
  Search, 
  Filter, 
  RotateCcw 
} from 'lucide-react';

export default function TimeTrackerView({ timeLogs = [], craftsmen = [], designs = [], onAddTimeLog, onUpdateTimeLog }) {
  const [showModal, setShowModal] = useState(false);
  const [craftsmanId, setCraftsmanId] = useState(craftsmen && craftsmen[0] ? craftsmen[0].id : '');
  const [designCode, setDesignCode] = useState(designs && designs[0] ? designs[0].code : '');
  const [clockIn, setClockIn] = useState('08:15');
  const [clockOut, setClockOut] = useState('18:45');
  const [breakMin, setBreakMin] = useState(60);
  const [completedQty, setCompletedQty] = useState(4);
  const [passedQA, setPassedQA] = useState(4);
  const [reworkQty, setReworkQty] = useState(0);
  const [goldIssued, setGoldIssued] = useState('25.000');
  const [goldReturned, setGoldReturned] = useState('24.225'); // 3.1% loss
  const [customBonus, setCustomBonus] = useState(''); // Custom bonus override for modal

  // Inline table bonus editing state
  const [editingLogId, setEditingLogId] = useState(null);
  const [editBonusVal, setEditBonusVal] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Date & Search Filtering State
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL', 'TODAY', 'CUSTOM', or specific YYYY-MM-DD
  const [customDate, setCustomDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all distinct available dates from timeLogs (sorted newest first)
  const availableDates = Array.from(new Set((timeLogs || []).map(t => t.date).filter(Boolean))).sort().reverse();

  // Filtered logs
  const filteredTimeLogs = (timeLogs || []).filter(t => {
    if (dateFilter === 'TODAY') {
      if (t.date !== getTodayStr()) return false;
    } else if (dateFilter === 'CUSTOM') {
      if (customDate && t.date !== customDate) return false;
    } else if (dateFilter !== 'ALL') {
      if (t.date !== dateFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const mBench = (t.craftsmanId || '').toLowerCase().includes(q);
      const mName = (t.craftsmanName || '').toLowerCase().includes(q);
      const mDesign = (t.designCode || '').toLowerCase().includes(q);
      const mAlloc = (t.allocId || '').toLowerCase().includes(q);
      if (!mBench && !mName && !mDesign && !mAlloc) return false;
    }
    return true;
  });

  const selectedCraftsman = craftsmen.find(c => c.id === craftsmanId) || craftsmen[0];
  const selectedDesign = designs.find(d => d.code === designCode) || designs[0];

  // Live calculation preview
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  const grossMinutes = (outH * 60 + outM) - (inH * 60 + inM);
  const previewAWM = Math.max(grossMinutes - parseInt(breakMin || 0, 10), 1);
  const previewESM = parseFloat(((passedQA || 0) * (selectedDesign?.totalSMT || 0)).toFixed(1));
  const previewEfficiency = previewAWM > 0 ? parseFloat(((previewESM / previewAWM) * 100).toFixed(1)) : 0;
  const previewBasePay = parseFloat((previewESM * (selectedCraftsman?.minuteRate || 9.5)).toFixed(2));
  const autoSuggestedBonus = (previewEfficiency >= 85.0 && reworkQty === 0) ? 450.0 : 0.0;
  const effectiveBonus = customBonus !== '' ? parseFloat(customBonus || 0) : autoSuggestedBonus;
  const previewTotalPay = parseFloat((previewBasePay + effectiveBonus).toFixed(2));

  // Quick stats summary dynamically computed from filtered results
  const totalWagesPaid = filteredTimeLogs.reduce((sum, t) => sum + (parseFloat(t.totalPay) || 0), 0);
  const totalBonusesPaid = filteredTimeLogs.reduce((sum, t) => sum + (parseFloat(t.bonus) || 0), 0);
  const avgEfficiency = filteredTimeLogs.length > 0 
    ? (filteredTimeLogs.reduce((sum, t) => sum + (parseFloat(t.efficiency) || 0), 0) / filteredTimeLogs.length).toFixed(1)
    : '0.0';
  const bonusEarnersCount = filteredTimeLogs.filter(t => (t.bonus || 0) > 0).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onAddTimeLog) {
      onAddTimeLog({
        craftsmanId,
        designCode,
        clockIn,
        clockOut,
        breakMin,
        completedQty,
        passedQA,
        reworkQty,
        goldIssuedGrams: goldIssued,
        goldReturnedGrams: goldReturned,
        bonus: customBonus !== '' ? parseFloat(customBonus) : autoSuggestedBonus,
        date: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(false);
    setCustomBonus('');
  };

  const handleStartEditBonus = (log) => {
    setEditingLogId(log.id);
    setEditBonusVal(String(log.bonus !== undefined ? log.bonus : 0));
  };

  const handleSaveBonus = async (logId) => {
    if (!onUpdateTimeLog) {
      setEditingLogId(null);
      return;
    }
    setIsUpdating(true);
    try {
      const numVal = parseFloat(editBonusVal || 0);
      await onUpdateTimeLog(logId, { bonus: Math.max(0, numVal) });
      setEditingLogId(null);
    } catch (err) {
      console.error('Failed to update bonus:', err);
      alert('Failed to update bonus. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <div className="executive-header">
        <div>
          <h1 className="executive-title">
            <Clock size={24} color="#d4af37" />
            <span>Time Tracking & Piecework Calculator</span>
          </h1>
          <p className="executive-subtitle">
            Normalises variable daily hours (8:00 AM – 8:30 PM span) into objective Efficiency % and piece-rate payouts with customizable quality bonuses.
          </p>
        </div>
        <button className="btn-gold-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span>Record Bench Completion</span>
        </button>
      </div>

      {/* Quick Summary Metric Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
        gap: '14px', 
        marginBottom: '20px' 
      }}>
        <div style={{ background: '#0f172a', border: '1px solid var(--border-gold)', borderRadius: '10px', padding: '14px 18px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {dateFilter === 'ALL' && !customDate ? 'Total Wages (All Shifts)' : 'Total Day Wages'}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#fef08a', marginTop: '4px' }}>
            Rs. {totalWagesPaid.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {filteredTimeLogs.length} of {timeLogs.length} bench logs shown
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '10px', padding: '14px 18px' }}>
          <div style={{ fontSize: '11px', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Bonuses Paid</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>
            +Rs. {totalBonusesPaid.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{bonusEarnersCount} of {filteredTimeLogs.length} benches awarded</div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '14px 18px' }}>
          <div style={{ fontSize: '11px', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Workshop Efficiency</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: parseFloat(avgEfficiency) >= 85 ? '#34d399' : '#38bdf8', marginTop: '4px' }}>
            {avgEfficiency}%
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Benchmark: 85.0% standard</div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '10px', padding: '14px 18px' }}>
          <div style={{ fontSize: '11px', color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bonus Rule / Override</div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginTop: '6px' }}>
            Standard Rs. 450 (≥85% QA)
          </div>
          <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '3px' }}>
            ✏️ Click any bonus in table to edit
          </div>
        </div>
      </div>

      {/* Formula Explanation Alert */}
      <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid var(--border-gold)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fef08a', fontWeight: 'bold', fontSize: '14px' }}>
            <Sparkles size={16} color="#d4af37" />
            <span>Standard Time-Based Piece-Rate (STPR) Logic & Editable Bonus:</span>
          </div>
          <span style={{ fontSize: '11px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            💡 Tip: Click on any Bonus value or ✏️ icon in the table below to edit / override it live!
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
          Because craftsmen arrive and leave at different times, <strong>Actual Working Minutes (AWM)</strong> is calculated as <code>(Clock Out - Clock In) - Breaks</code>. 
          Payment is based on approved output (<code>Earned Standard Mins × Minute Rate</code>). 
          Standard policy awards <strong>Rs. 450 Daily Quality & Efficiency Bonus</strong> when <strong>Efficiency (ESM / AWM) ≥ 85%</strong> with zero defects, but supervisors can manually customize or change this bonus amount at any time!
        </p>
      </div>

      {/* Interactive Shift Date & Search Filter Bar */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(20, 28, 48, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* Quick Date Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#d4af37', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={14} color="#d4af37" />
              <span>Shift Date Filter:</span>
            </span>

            {/* All Dates Button */}
            <button
              type="button"
              onClick={() => { setDateFilter('ALL'); setCustomDate(''); }}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: dateFilter === 'ALL' && !customDate ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: dateFilter === 'ALL' && !customDate ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.12)',
                color: dateFilter === 'ALL' && !customDate ? '#fef08a' : '#94a3b8',
                transition: 'all 0.15s ease'
              }}
            >
              All Dates ({timeLogs.length})
            </button>

            {/* Today Button */}
            <button
              type="button"
              onClick={() => { setDateFilter('TODAY'); setCustomDate(''); }}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: dateFilter === 'TODAY' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: dateFilter === 'TODAY' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                color: dateFilter === 'TODAY' ? '#4ade80' : '#94a3b8',
                transition: 'all 0.15s ease'
              }}
            >
              ⚡ Today ({getTodayStr()})
            </button>

            {/* Available Shift Dates */}
            {availableDates.slice(0, 5).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => { setDateFilter(d); setCustomDate(''); }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background: dateFilter === d && !customDate ? 'rgba(212, 175, 55, 0.3)' : 'rgba(15, 23, 42, 0.6)',
                  border: dateFilter === d && !customDate ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: dateFilter === d && !customDate ? '#fef08a' : '#cbd5e1',
                  transition: 'all 0.15s ease'
                }}
              >
                📅 {d}
              </button>
            ))}
          </div>

          {/* Date Picker Input & Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* Custom Date Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Pick Date:</span>
              <input
                type="date"
                value={customDate || (dateFilter !== 'ALL' && dateFilter !== 'TODAY' && dateFilter !== 'CUSTOM' ? dateFilter : '')}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateFilter('CUSTOM');
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '11.5px',
                  fontWeight: 'bold',
                  color: '#fef08a',
                  background: '#030712',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  borderRadius: '6px'
                }}
              />
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search bench, name, design..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '30px',
                  paddingRight: '10px',
                  height: '32px',
                  fontSize: '11.5px',
                  background: '#030712',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#fff'
                }}
              />
            </div>

            {/* Reset Filters Button */}
            {(dateFilter !== 'ALL' || customDate || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setDateFilter('ALL');
                  setCustomDate('');
                  setSearchQuery('');
                }}
                className="btn-ghost-secondary"
                style={{ padding: '5px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Reset all filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Status text showing what is filtered */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <span>
            Showing <strong style={{ color: '#fef08a' }}>{filteredTimeLogs.length}</strong> of <strong>{timeLogs.length}</strong> piecework completions 
            {dateFilter === 'TODAY' && <span> • <strong>Today's Shift ({getTodayStr()})</strong></span>}
            {dateFilter !== 'ALL' && dateFilter !== 'TODAY' && dateFilter !== 'CUSTOM' && <span> • Shift Date: <strong style={{ color: '#d4af37' }}>{dateFilter}</strong></span>}
            {dateFilter === 'CUSTOM' && customDate && <span> • Date: <strong style={{ color: '#d4af37' }}>{customDate}</strong></span>}
            {searchQuery && <span> • matching "<strong style={{ color: '#38bdf8' }}>{searchQuery}</strong>"</span>}
          </span>
          <span style={{ color: '#64748b' }}>
            Filtered Output: <strong style={{ color: '#34d399' }}>Rs. {totalWagesPaid.toLocaleString()}</strong> wages • <strong style={{ color: '#38bdf8' }}>{filteredTimeLogs.reduce((s, t) => s + (t.passedQA || 0), 0)} pcs</strong> passed
          </span>
        </div>
      </div>

      <div className="table-luxury-wrap">
        <table className="table-luxury">
          <thead>
            <tr>
              <th>Date</th>
              <th>Craftsman Bench</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Break</th>
              <th>AWM (min)</th>
              <th>Design Code</th>
              <th>Passed Pcs</th>
              <th>Rework</th>
              <th>Earned SMT</th>
              <th>Efficiency %</th>
              <th>Minute Rate</th>
              <th>Base Pay (Rs.)</th>
              <th style={{ background: 'rgba(212, 175, 55, 0.12)', borderLeft: '1px solid var(--border-gold)', borderRight: '1px solid var(--border-gold)' }}>
                Bonus (Rs.) ✏️
              </th>
              <th>Total Day Pay (Rs.)</th>
              <th>Gold Loss %</th>
            </tr>
          </thead>
          <tbody>
            {filteredTimeLogs.length === 0 ? (
              <tr>
                <td colSpan="16" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <Calendar size={30} color="#64748b" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ color: '#cbd5e1', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                    No piecework records found matching your date or search filters.
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>
                    Try choosing another shift date or clearing your search term.
                  </p>
                  <button 
                    type="button"
                    className="btn-ghost-secondary" 
                    onClick={() => { setDateFilter('ALL'); setCustomDate(''); setSearchQuery(''); }}
                    style={{ fontSize: '11px', padding: '5px 14px' }}
                  >
                    Clear Filters (Show All Dates)
                  </button>
                </td>
              </tr>
            ) : (
              filteredTimeLogs.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>
                  <strong style={{ color: 'var(--gold-primary)' }}>{t.craftsmanId}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.craftsmanName}</div>
                </td>
                <td style={{ textAlign: 'center' }}>{t.clockIn}</td>
                <td style={{ textAlign: 'center' }}>{t.clockOut}</td>
                <td style={{ textAlign: 'center' }}>{t.breakMin}m</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--text-main)' }}>{t.awm}m</td>
                <td>
                  <code style={{ background: 'var(--code-bg, rgba(10, 15, 29, 0.8))', color: 'var(--text-main)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>{t.designCode}</code>
                  {t.allocId && (
                    <div style={{ fontSize: '10px', color: '#38bdf8', marginTop: '2px', fontWeight: '500' }}>
                      ⚡ {t.allocId}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>{t.passedQA}</td>
                <td style={{ textAlign: 'center', color: t.reworkQty > 0 ? '#ef4444' : 'var(--text-dim)' }}>{t.reworkQty}</td>
                <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--gold-primary)' }}>{t.esm} min</td>
                <td style={{ textAlign: 'right', fontWeight: '800', color: t.efficiency >= 85 ? '#10b981' : '#f59e0b' }}>
                  {t.efficiency}%
                </td>
                <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>Rs. {t.minuteRate ? t.minuteRate.toFixed(2) : '9.50'}</td>
                <td style={{ textAlign: 'right', color: 'var(--text-main)' }}>Rs. {t.basePay ? t.basePay.toLocaleString() : '0'}</td>
                
                {/* Editable Bonus Column */}
                <td style={{ 
                  textAlign: 'right', 
                  background: 'rgba(212, 175, 55, 0.05)', 
                  borderLeft: '1px solid rgba(212, 175, 55, 0.2)', 
                  borderRight: '1px solid rgba(212, 175, 55, 0.2)',
                  padding: '8px' 
                }}>
                  {editingLogId === t.id ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '11px', color: '#d4af37' }}>Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        style={{
                          width: '78px',
                          padding: '3px 6px',
                          background: '#030712',
                          border: '1px solid #d4af37',
                          borderRadius: '4px',
                          color: '#fef08a',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          textAlign: 'right'
                        }}
                        value={editBonusVal}
                        onChange={(e) => setEditBonusVal(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveBonus(t.id);
                          if (e.key === 'Escape') setEditingLogId(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveBonus(t.id)}
                        disabled={isUpdating}
                        style={{
                          background: '#10b981',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '4px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Save Bonus"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLogId(null)}
                        style={{
                          background: '#475569',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '4px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Cancel"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => handleStartEditBonus(t)}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      title="Click to edit bonus amount"
                    >
                      {t.bonus > 0 ? (
                        <span className="badge-bonus-pill">+Rs. {t.bonus}</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>Rs. 0</span>
                      )}
                      <Edit3 size={12} color="#d4af37" style={{ opacity: 0.7 }} />
                    </div>
                  )}
                </td>

                <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--gold-primary)', fontSize: '14px' }}>
                  Rs. {t.totalPay ? t.totalPay.toLocaleString() : '0'}
                </td>
                <td style={{ textAlign: 'right', color: 'var(--text-main)', fontWeight: '600' }}>{t.goldLossPct}%</td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>

      {/* Record Work Modal */}
      {showModal && (
        <div className="modal-backdrop-luxury">
          <div className="modal-window-luxury" style={{ maxWidth: '680px' }}>
            <h3 style={{ marginBottom: '18px', color: '#fff', fontSize: '19px', fontFamily: 'var(--font-serif)' }}>
              Record Daily Bench Work & Piecework Pay
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Craftsman (From 62 Benches)
                  </label>
                  <select style={{ width: '100%' }} value={craftsmanId} onChange={(e) => setCraftsmanId(e.target.value)}>
                    {craftsmen.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} — {c.name} ({c.empNo}) [{c.skillTier}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Jewellery Design
                  </label>
                  <select style={{ width: '100%' }} value={designCode} onChange={(e) => setDesignCode(e.target.value)}>
                    {designs.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} — {d.name} ({d.totalSMT} min)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Clock-In Time
                  </label>
                  <input type="time" style={{ width: '100%' }} value={clockIn} onChange={(e) => setClockIn(e.target.value)} required />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Clock-Out Time
                  </label>
                  <input type="time" style={{ width: '100%' }} value={clockOut} onChange={(e) => setClockOut(e.target.value)} required />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Breaks (min)
                  </label>
                  <input type="number" style={{ width: '100%' }} min="0" max="180" value={breakMin} onChange={(e) => setBreakMin(parseInt(e.target.value || 0, 10))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Completed Pcs
                  </label>
                  <input type="number" style={{ width: '100%' }} min="0" value={completedQty} onChange={(e) => setCompletedQty(parseInt(e.target.value || 0, 10))} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Passed QA Pcs
                  </label>
                  <input type="number" style={{ width: '100%' }} min="0" value={passedQA} onChange={(e) => setPassedQA(parseInt(e.target.value || 0, 10))} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Rework Pcs
                  </label>
                  <input type="number" style={{ width: '100%' }} min="0" value={reworkQty} onChange={(e) => setReworkQty(parseInt(e.target.value || 0, 10))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Raw Gold Issued (grams)
                  </label>
                  <input type="number" style={{ width: '100%' }} step="0.001" value={goldIssued} onChange={(e) => setGoldIssued(e.target.value)} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Finished + Scrap Returned (g)
                  </label>
                  <input type="number" style={{ width: '100%' }} step="0.001" value={goldReturned} onChange={(e) => setGoldReturned(e.target.value)} />
                </div>
              </div>

              {/* Editable Bonus Field in Modal */}
              <div style={{ 
                background: 'rgba(212, 175, 55, 0.07)', 
                border: '1px solid rgba(212, 175, 55, 0.3)', 
                borderRadius: '8px', 
                padding: '12px 14px', 
                marginBottom: '16px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#fef08a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={15} color="#d4af37" />
                    <span>Custom Daily Bonus Amount (Rs.)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomBonus(String(autoSuggestedBonus))}
                    style={{ 
                      background: 'rgba(212, 175, 55, 0.15)', 
                      border: '1px solid #d4af37', 
                      color: '#fef08a', 
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '11px', 
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Auto-Suggest (+Rs. {autoSuggestedBonus})
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1' }}>Rs.</span>
                  <input 
                    type="number" 
                    min="0" 
                    step="50" 
                    style={{ flex: 1, fontSize: '14px', fontWeight: 'bold', color: '#34d399' }} 
                    placeholder={`Default rule suggests: Rs. ${autoSuggestedBonus}`} 
                    value={customBonus} 
                    onChange={(e) => setCustomBonus(e.target.value)} 
                  />
                  {customBonus !== '' && (
                    <button 
                      type="button" 
                      onClick={() => setCustomBonus('')}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Reset to Auto
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>
                  Leave empty to auto-calculate (Rs. 450 if Efficiency ≥ 85% & 0 Rework), or enter any custom bonus amount (e.g. Rs. 600, Rs. 1,000, or Rs. 0).
                </div>
              </div>

              {/* Dynamic Live Calculations Preview */}
              <div style={{ background: '#0a0f1d', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-gold)', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#d4af37', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} />
                  <span>Live Industrial Engineering Calculation:</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div>Actual Working Minutes (AWM): <strong>{previewAWM} min</strong></div>
                  <div>Earned Standard Minutes (ESM): <strong>{previewESM} min</strong></div>
                  <div>Craftsman Efficiency: <strong style={{ color: previewEfficiency >= 85 ? '#34d399' : '#fbbf24' }}>{previewEfficiency}%</strong></div>
                  <div>Base Piece-Rate Pay: <strong>Rs. {previewBasePay.toLocaleString()}</strong></div>
                  <div>
                    Efficiency & QA Bonus: 
                    <strong style={{ color: effectiveBonus > 0 ? '#34d399' : '#94a3b8', marginLeft: '6px' }}>
                      +Rs. {effectiveBonus}
                    </strong>
                    {customBonus !== '' && (
                      <span style={{ fontSize: '10px', color: '#38bdf8', marginLeft: '6px' }}>(Custom Override)</span>
                    )}
                  </div>
                  <div style={{ color: '#fef08a', fontWeight: '800', fontSize: '15px' }}>
                    Total Day Pay: Rs. {previewTotalPay.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-ghost-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-gold-primary">Save Work Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
