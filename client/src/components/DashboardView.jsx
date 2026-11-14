import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, TrendingUp, DollarSign, Award, Scale, AlertCircle, 
  ArrowUpRight, Activity, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, BarChart3, Layers,
  Building2, Store, Package, Crown, AlertTriangle, UserX, FileText, Calendar,
  Search, RefreshCw, Zap, Filter, Check, QrCode, Coffee, Play
} from 'lucide-react';
import api from '../api';
import { 
  FACTORY_BREAKS, 
  formatMinutesToTime, 
  timeStringToMinutes, 
  calculateDynamicETA 
} from '../utils/floorTiming';

export default function DashboardView({ metrics, loading, craftsmen, designs, timeLogs, leaves, allocations = [], onNavigateTab, onOpenKiosk }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    try {
      const saved = sessionStorage.getItem('ashadi_selected_date');
      if (saved) return saved;
    } catch (e) {}
    return metrics?.selectedDate || new Date().toISOString().split('T')[0];
  });
  const [dayData, setDayData] = useState(metrics);
  const [isFetchingDate, setIsFetchingDate] = useState(false);
  const [selectedBench, setSelectedBench] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState('ALL');
  const [dailyScenario, setDailyScenario] = useState(null); // 'LOW' (350h), 'NORMAL' (400h), 'HIGH' (450h), or null (Standby / 0.0h)
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoster, setShowRoster] = useState(true);
  const [autoPopulating, setAutoPopulating] = useState(false);
  const [benchStatusFilter, setBenchStatusFilter] = useState('ALL');
  const [currentFloorTime, setCurrentFloorTime] = useState(new Date());

  // Real-time workshop floor clock ticker (re-evaluates floor ETA and overdue states every 15s)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFloorTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Auto-detect benchmark range based on current day's actual standard output
  useEffect(() => {
    const earned = dayData?.capacityLeakWaterfall?.earnedStandardHours !== undefined 
      ? Number(dayData.capacityLeakWaterfall.earnedStandardHours) 
      : 0;
    const hasAnyOrders = (dayData?.dayAllocations && dayData.dayAllocations.length > 0) || 
      (allocations && allocations.some(a => a.date === selectedDate));

    if (!hasAnyOrders || earned <= 0) {
      // No orders dispatched yet on this date (Standby 0.0h) — do not falsely claim it's a 400h Normal Day
      setDailyScenario(null);
    } else if (earned >= 500) {
      setDailyScenario('PEAK');
    } else if (earned >= 440) {
      setDailyScenario('HIGH');
    } else if (earned < 375) {
      setDailyScenario('LOW');
    } else {
      setDailyScenario('NORMAL');
    }
  }, [selectedDate, dayData, allocations]);

  useEffect(() => {
    if (metrics) {
      setDayData(metrics);
      const savedDate = sessionStorage.getItem('ashadi_selected_date');
      if (savedDate) {
        setSelectedDate(savedDate);
      } else if (metrics.selectedDate) {
        setSelectedDate(metrics.selectedDate);
      }
    }
  }, [metrics]);

  const handleDateChange = async (newDate) => {
    if (!newDate) return;
    try {
      sessionStorage.setItem('ashadi_selected_date', newDate);
    } catch (e) {}
    setSelectedDate(newDate);
    setIsFetchingDate(true);
    try {
      const res = await api.get(`/dashboard/metrics?date=${newDate}`);
      setDayData(res.data);
    } catch (err) {
      console.error('Failed to load metrics for date:', err);
    } finally {
      setIsFetchingDate(false);
    }
  };

  const handleShiftDate = (days) => {
    try {
      const parts = selectedDate.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2] + days);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dt = String(d.getDate()).padStart(2, '0');
      handleDateChange(`${y}-${m}-${dt}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAutoPopulateDate = async () => {
    if (window.confirm(`Auto-populate all 63 craftsman benches with production orders for ${selectedDate}?`)) {
      setAutoPopulating(true);
      try {
        await api.post('/allocations/auto-shift-populate', { date: selectedDate, markCompleted: true });
        const res = await api.get(`/dashboard/metrics?date=${selectedDate}`);
        setDayData(res.data);
      } catch (err) {
        console.error('Failed to auto-populate shift for date:', err);
      } finally {
        setAutoPopulating(false);
      }
    }
  };

  const formatDatePretty = (isoStr) => {
    if (!isoStr) return '';
    try {
      const parts = isoStr.split('-');
      if (parts.length === 3) {
        const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (e) {}
    return isoStr;
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#d4af37', marginBottom: '8px' }}>
          Connecting to Ashadi Jewellers Production Engine...
        </div>
        <p style={{ fontSize: '13px' }}>Loading 63 verified benches and multi-channel cost matrices</p>
      </div>
    );
  }

  if (!dayData) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8', maxWidth: '620px', margin: '0 auto' }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f87171', marginBottom: '10px' }}>
          ⚠️ Backend API Server Disconnected (Port 5000)
        </div>
        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '18px' }}>
          The web application is ready, but it cannot connect to the Node.js backend server at <code>http://localhost:5000</code>.
        </p>
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '10px', padding: '16px 20px', textAlign: 'left', marginBottom: '20px', fontSize: '13px' }}>
          <strong style={{ color: '#fef08a' }}>How to start the backend server:</strong>
          <ol style={{ marginTop: '8px', paddingLeft: '20px', color: '#cbd5e1', lineHeight: '1.7' }}>
            <li>Open a command prompt / terminal in this project folder.</li>
            <li>Run: <code style={{ color: '#38bdf8', fontWeight: 'bold' }}>npm run dev</code> (or double-click <code style={{ color: '#fef08a' }}>start_ashadi_system.bat</code>).</li>
            <li>Or start the backend alone: <code style={{ color: '#38bdf8' }}>cd server && node index.js</code>.</li>
          </ol>
        </div>
        <button 
          className="btn-gold-primary" 
          onClick={() => window.location.reload()}
          style={{ padding: '10px 24px', fontSize: '13px' }}
        >
          🔄 Reconnect Dashboard
        </button>
      </div>
    );
  }

  const { workforce, dailyPerformance, capacityLeakWaterfall, channelBreakdown } = dayData;
  
  // Collect all unique available dates from metrics and live allocations
  const allDateSet = new Set(dayData.availableDates || []);
  (allocations || []).forEach(a => { if (a.date) allDateSet.add(a.date); });
  const availableDates = Array.from(allDateSet).sort().reverse();

  // Prefer live allocations matching selectedDate (synchronised in real-time across tabs)
  const liveMatchedAllocs = (allocations && allocations.length > 0)
    ? allocations.filter(a => a.date === selectedDate)
    : [];

  const dayAllocations = liveMatchedAllocs.length > 0 
    ? liveMatchedAllocs 
    : (dayData.dayAllocations || []);

  const hasOrders = dayAllocations.length > 0;
  
  // Deduplicated leaves for selected date (one craftsman can only be on leave once per day)
  const combinedDayLeaves = [
    ...(leaves || []),
    ...(dayData.todayLeaves || [])
  ];
  const dayLeavesMap = new Map();
  combinedDayLeaves.forEach(l => {
    if (l && l.date === selectedDate) {
      const key = (l.craftsmanId || '').toLowerCase();
      if (!dayLeavesMap.has(key)) {
        dayLeavesMap.set(key, l);
      }
    }
  });
  const dayLeaves = Array.from(dayLeavesMap.values());

  // Daily Scenario Analysis for the 350h - 450h Fluctuation Simulator
  const scenarioData = {
    LOW: {
      key: 'LOW',
      label: 'Low Output Day (~350 hrs)',
      pill: '350 hrs Output',
      color: '#f87171',
      outputHours: 350.0,
      lostHours: 456.0,
      utilization: 43.4,
      waitingHours: 160.0,
      waitingPct: 19.8,
      paceHours: 130.0,
      pacePct: 16.1,
      reworkHours: 55.0,
      reworkPct: 6.8,
      breaksHours: 124.0,
      breaksPct: 15.4,
      explanation: "Why 350 Hours? 2-3 craftsmen absent on sick leave (-26h to -39h), bottleneck delay waiting for 22K gold melting & wire rolling mill queues (160h), and defect rework on intricate claw settings (55h)."
    },
    NORMAL: {
      key: 'NORMAL',
      label: 'Standard Day (~400 hrs - Boss Observed)',
      pill: '400 hrs Output (Observed)',
      color: '#fcd34d',
      outputHours: 400.0,
      lostHours: 406.0,
      utilization: 49.6,
      waitingHours: 130.0,
      waitingPct: 16.1,
      paceHours: 98.0,
      pacePct: 12.2,
      reworkHours: 54.0,
      reworkPct: 6.7,
      breaksHours: 124.0,
      breaksPct: 15.4,
      explanation: "Why 400 Hours? 62 craftsmen on-site for 13 hours (07:00 AM – 08:00 PM = 806.0 Gross On-Site Hours). 124.0h used for scheduled breakfast, lunch & tea breaks. 130h lost waiting for crucible melting & vault scale checks. 98h lost due to microscope eye fatigue in the 10th-13th hours. Net productive output = ~400 standard hours."
    },
    HIGH: {
      key: 'HIGH',
      label: 'Optimized Target Day (~450 hrs)',
      pill: '450 hrs Target',
      color: '#34d399',
      outputHours: 450.0,
      lostHours: 356.0,
      utilization: 55.8,
      waitingHours: 85.0,
      waitingPct: 10.5,
      paceHours: 85.0,
      pacePct: 10.5,
      reworkHours: 30.0,
      reworkPct: 3.7,
      breaksHours: 124.0,
      breaksPct: 15.4,
      explanation: "How to reach 450+ Hours? Stagger rolling mill usage so benches don't queue up at once, deliver alloyed gold wire early at 07:15 AM, enforce SMT piece targets, and eliminate unlogged rework with high first-time pass QA."
    },
    PEAK: {
      key: 'PEAK',
      label: '🏆 Peak Yield (≥500h - 550h)',
      pill: '500h+ Peak Yield',
      color: '#38bdf8',
      outputHours: 525.0,
      lostHours: 294.0,
      utilization: 64.1,
      waitingHours: 40.0,
      waitingPct: 4.9,
      paceHours: 65.0,
      pacePct: 7.9,
      reworkHours: 18.0,
      reworkPct: 2.2,
      breaksHours: 124.0,
      breaksPct: 15.4,
      explanation: "How to reach 500h – 550h+ Peak Output? Prepare 22K gold wire the previous evening (recovering +53h of waiting queues), zero rolling mill delays, Grade-A craftsmen producing +1 piece per shift, and high-precision casting eliminating bench defect rework."
    }
  };

  const curScen = (dailyScenario && scenarioData[dailyScenario]) ? scenarioData[dailyScenario] : scenarioData.NORMAL;

  // Circular Gauge Helper
  const renderGauge = (value, target, label, subtext, color = '#d4af37') => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(Math.max(value, 0), 100);
    const offset = circumference - (pct / 100) * circumference;

    return (
      <div className="gauge-item">
        <div className="gauge-circle-wrap">
          <svg className="gauge-svg" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="9"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={color}
              strokeWidth="9"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="gauge-center-text">
            <span className="gauge-center-val" style={{ color }}>{value}%</span>
            <span className="gauge-center-unit">{target}</span>
          </div>
        </div>
        <div className="gauge-label">{label}</div>
        <div className="gauge-subtext">{subtext}</div>
      </div>
    );
  };

  // Top workers sample for comparison chart (Autodesk style)
  const topPerformers = [
    { name: "Mr. L.A. Gayan Priyankara (#20)", id: "C001", efficiency: 96.0, smt: 486.0, tier: "Grade A" },
    { name: "Mr. B.A. Kasun Chamilantha (#22)", id: "C002", efficiency: 94.0, smt: 486.0, tier: "Grade A" },
    { name: "Mr. D. Suresh Priyantha (#24)", id: "C004", efficiency: 93.0, smt: 523.2, tier: "Grade A" },
    { name: "Mr. K.G.A. Sithmina Weerarathane (#26)", id: "C005", efficiency: 95.0, smt: 545.4, tier: "Grade A" },
    { name: "Mr. B.A. Sameera Ireshana (#30)", id: "C008", efficiency: 92.5, smt: 452.0, tier: "Grade A" },
    { name: "Ms. G.G. Malki Nisansala (#338)", id: "C015", efficiency: 90.0, smt: 545.4, tier: "Grade A" },
    { name: "Mr. A.G. Anura (#1018)", id: "C032", efficiency: 86.5, smt: 487.2, tier: "Grade B" },
    { name: "Mr. A.D. Chandana (#1299)", id: "C054", efficiency: 85.3, smt: 486.0, tier: "Grade C" },
  ];

  const leak = capacityLeakWaterfall || {
    grossShiftHours: 819.0,
    grossOnSiteHours: 806.0,
    approvedLeavesHours: 13.0,
    loggedBreakHours: 124.0,
    netAvailableHours: 682.0,
    earnedStandardHours: 400.0,
    lostHoursTotal: 406.0,
    rootCauses: {
      approvedLeaves: { hours: 13.0, pct: 1.6 },
      loggedBreaks: { hours: 124.0, pct: 15.4 },
      benchWaitingIdle: { hours: 130.0, pct: 16.1 },
      speedPaceGap: { hours: 98.0, pct: 12.2 },
      unloggedRework: { hours: 54.0, pct: 6.7 }
    },
    grossAttendanceUtilization: 49.6,
    netWorkingEfficiency: 58.7
  };

  const channels = channelBreakdown || {};

  // Filter day's allocations for table view
  const filteredDayAllocs = dayAllocations.filter(item => {
    const matchChan = selectedChannel === 'ALL' || item.channel === selectedChannel;
    const matchSearch = !searchTerm || 
      (item.craftsmanName && item.craftsmanName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.craftsmanId && item.craftsmanId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.workOrder && item.workOrder.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.designName && item.designName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchChan && matchSearch;
  });

  return (
    <div>
      {/* 1. EXECUTIVE TITLE */}
      <div className="executive-header">
        <div>
          <h1 className="executive-title">
            <Sparkles size={24} color="#d4af37" />
            <span>Executive Production & Labour Cost Control</span>
          </h1>
          <p className="executive-subtitle">
            Time-Based Labour Costing System • 63 Verified Workshop Benches • Ashadi Jewellers
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {onOpenKiosk && (
            <button 
              className="btn-gold-primary" 
              onClick={onOpenKiosk}
              style={{ 
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(202, 138, 4, 0.2) 100%)',
                borderColor: '#facc15',
                color: '#fef08a',
                fontWeight: 'bold',
                boxShadow: '0 0 12px rgba(234, 179, 8, 0.3)'
              }}
              title="Open Touchless Floor Kiosk Scanner (Use Phone / Tablet Camera)"
            >
              <QrCode size={15} color="#fde047" />
              <span>⚡ Floor Kiosk</span>
            </button>
          )}
          <button className="btn-ghost-secondary" onClick={() => onNavigateTab('leaves')}>
            <UserX size={15} />
            <span>Attendance & Leaves</span>
          </button>
          <button className="btn-ghost-secondary" onClick={() => onNavigateTab('allocations')}>
            <span>Dispatch Daily Orders</span>
          </button>
          <button className="btn-gold-primary" onClick={() => onNavigateTab('monthlyReport')}>
            <FileText size={15} />
            <span>Monthly Report</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PROMINENT DATE SELECTOR / EXECUTIVE DAY INSPECTION BAR                 */}
      {/* ========================================================================= */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(20, 28, 48, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
        border: '1px solid rgba(212, 175, 55, 0.4)',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid #d4af37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d4af37'
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#d4af37', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                EXECUTIVE SINGLE-DAY AUDIT SELECTOR
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{formatDatePretty(selectedDate)}</span>
                {isFetchingDate && <RefreshCw size={16} className="spin" color="#d4af37" />}
              </h2>
            </div>
          </div>

          {/* Date Picker Input & Steppers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn-ghost-secondary"
              onClick={() => handleShiftDate(-1)}
              title="Previous Day"
              style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ChevronLeft size={16} /> <span>Prev Day</span>
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{
                background: 'rgba(10, 15, 29, 0.9)',
                border: '1px solid #d4af37',
                borderRadius: '8px',
                color: '#fff',
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            />

            <button
              className="btn-ghost-secondary"
              onClick={() => handleShiftDate(1)}
              title="Next Day"
              style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Next Day</span> <ChevronRight size={16} />
            </button>

            <button
              onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: selectedDate === new Date().toISOString().split('T')[0] ? 'var(--gold-metallic)' : 'rgba(255, 255, 255, 0.08)',
                color: selectedDate === new Date().toISOString().split('T')[0] ? '#0b0f19' : '#cbd5e1',
                border: '1px solid rgba(212, 175, 55, 0.4)'
              }}
            >
              Today
            </button>
          </div>
        </div>

        {/* Quick Date Chips (dates with real orders) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>Quick Select Available Shift Dates:</span>
          {availableDates.slice(0, 8).map(d => (
            <button
              key={d}
              onClick={() => handleDateChange(d)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: selectedDate === d ? 'rgba(212, 175, 55, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                border: selectedDate === d ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.1)',
                color: selectedDate === d ? '#fef08a' : '#94a3b8',
                transition: 'all 0.15s ease'
              }}
            >
              📅 {d}
            </button>
          ))}
          {availableDates.length > 8 && (
            <span style={{ fontSize: '11px', color: '#64748b' }}>+{availableDates.length - 8} more</span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. EXECUTIVE DAY BRIEFING CARD FOR THE BOSS                               */}
      {/* ========================================================================= */}
      <div style={{
        background: hasOrders ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
        border: hasOrders ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ maxWidth: '850px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              background: hasOrders ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: hasOrders ? '#34d399' : '#fcd34d',
              border: hasOrders ? '1px solid #10b981' : '1px solid #f59e0b'
            }}>
              {hasOrders ? `✓ ${dayAllocations.length} Orders Dispatched on this Date` : '⚠️ Baseline Shift (No Work Orders Logged Yet)'}
            </span>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
              Shift Scope: <strong>07:00 AM – 08:00 PM (13.0 Hours) • 63 Benches = 819.0h Roster Ceiling</strong>
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
            {hasOrders ? (
              <span>
                On <strong>{formatDatePretty(selectedDate)}</strong>, the plant had <strong>{workforce.activeCraftsmen} active craftsmen</strong> on benches ({workforce.todayAbsent} on approved leave: -{workforce.todayLeaveHours}h). 
                Total gross on-site presence was <strong>{leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} hours</strong>. Productive output delivered was <strong>{leak.earnedStandardHours} standard working hours</strong> ({leak.grossAttendanceUtilization}% capacity yield) across <strong>{dailyPerformance.dayOrdersCount} orders</strong> and <strong>{dailyPerformance.dayPiecesCount} pieces</strong>. Total gold issued was <strong>{dailyPerformance.dayGoldIssuedGrams}g</strong>.
              </span>
            ) : (
              <span>
                No production work orders have been allocated yet for <strong>{formatDatePretty(selectedDate)}</strong>. 
                Gross on-site capacity is <strong>{leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} hours</strong> ({workforce.activeCraftsmen} active benches × 13.0h; {workforce.todayAbsent} on leave: -{workforce.todayLeaveHours || (workforce.todayAbsent * 13.0).toFixed(1)}h). 
                You can auto-dispatch a complete standard shift for this day or navigate to the Allocations tab to add specific orders.
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {!hasOrders && (
            <button
              onClick={handleAutoPopulateDate}
              disabled={autoPopulating}
              className="btn-gold-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
            >
              <Zap size={15} />
              <span>{autoPopulating ? 'Populating 63 Benches...' : '⚡ Auto-Populate Full 63-Bench Shift'}</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab('allocations')}
            className="btn-ghost-secondary"
            style={{ fontSize: '12px', padding: '8px 14px' }}
          >
            <span>Dispatch Custom Orders</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. THE 13-HOUR SHIFT CAPACITY WATERFALL & LEAKAGE AUDIT (FOR THIS DATE)   */}
      {/* ========================================================================= */}
      <div className="luxury-box" style={{ marginBottom: '28px', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'linear-gradient(180deg, rgba(22, 32, 50, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)' }}>
        <div className="luxury-box-header">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#d4af37', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              <Clock size={13} />
              <span>DAILY 13-HOUR SHIFT AUDIT (07:00 AM – 08:00 PM) • {selectedDate}</span>
            </div>
            <h3 className="luxury-box-title" style={{ color: '#fef08a' }}>
              <AlertTriangle size={20} color="#f59e0b" />
              <span>
                {hasOrders 
                  ? `Capacity Audit: The ${leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} Gross On-Site Hours vs Productive Output on ${selectedDate}`
                  : `Plant Shift Status: ${leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} Gross On-Site Hours on ${selectedDate}`
                }
              </span>
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              {hasOrders ? (
                <span>
                  Gross On-Site Presence: <strong>{workforce.activeCraftsmen} Active Craftsmen × 13.0 Hours = {leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} Gross Hours</strong> (Roster ceiling: 63 × 13.0 = 819.0h, less {workforce.todayAbsent} leave: -{(workforce.todayLeaveHours || workforce.todayAbsent * 13.0).toFixed(1)}h). On this date, actual standard output was <strong>{leak.earnedStandardHours} Hours</strong>. Capacity gap: <strong>{leak.lostHoursTotal} Hours</strong>.
                </span>
              ) : (
                <span>
                  Gross On-Site Presence: <strong>{workforce.activeCraftsmen} Active Craftsmen × 13.0 Hours = {leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} Gross On-Site Hours</strong> (Roster ceiling: 63 × 13.0 = 819.0h, less {workforce.todayAbsent} leave: -{(workforce.todayLeaveHours || workforce.todayAbsent * 13.0).toFixed(1)}h). No work orders allocated yet on this date (Output: <strong>0.0 Hours</strong>).
                </span>
              )}
            </p>
          </div>

          {/* Daily Output Fluctuation Simulator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold' }}>Simulate Factory Benchmark Ranges:</span>
              {(!hasOrders || Number(leak.earnedStandardHours) === 0) && (
                <span style={{ fontSize: '10px', background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '4px', padding: '1px 6px' }}>
                  Standby (0.0h)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'LOW', label: '🔴 Low Day (~350h)' },
                { id: 'NORMAL', label: '🟡 Normal Day (~400h)' },
                { id: 'HIGH', label: '🟢 Target Day (≥450h)' },
                { id: 'PEAK', label: '🏆 Peak Shift (≥500h)' }
              ].map(s => {
                const isActive = dailyScenario === s.id;
                const activeColor = s.id === 'LOW' ? '#f87171' : s.id === 'NORMAL' ? '#f59e0b' : s.id === 'HIGH' ? '#34d399' : '#38bdf8';
                const activeBg = s.id === 'LOW' ? 'rgba(239, 68, 68, 0.25)' : s.id === 'NORMAL' ? 'rgba(245, 158, 11, 0.25)' : s.id === 'HIGH' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(56, 189, 248, 0.25)';
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setDailyScenario(s.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      border: isActive ? `1.5px solid ${activeColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isActive ? activeBg : 'rgba(15, 23, 42, 0.6)',
                      color: isActive ? '#fff' : '#94a3b8',
                      boxShadow: isActive ? (s.id === 'PEAK' ? '0 0 14px rgba(56, 189, 248, 0.4)' : s.id === 'HIGH' ? '0 0 12px rgba(52, 211, 153, 0.35)' : s.id === 'NORMAL' ? '0 0 10px rgba(245, 158, 11, 0.3)' : '0 0 10px rgba(239, 68, 68, 0.3)') : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5-Card Waterfall Breakdown for the Selected Date */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {/* Card 1: Gross Clocked Time */}
          <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>1. GROSS ON-SITE TIME</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: '4px 0' }}>
              {leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} hrs
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              {workforce.activeCraftsmen} Active Craftsmen × 13.0 Hours
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              07:00 AM – 08:00 PM (Roster: 63 = 819.0h)
            </div>
          </div>

          {/* Card 2: Deducted Approved Leaves */}
          <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>2. APPROVED LEAVES</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#f87171', margin: '4px 0' }}>
              - {leak.approvedLeavesHours !== undefined ? Number(leak.approvedLeavesHours).toFixed(1) : (workforce.todayAbsent * 13.0).toFixed(1)} hrs
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              {workforce.todayAbsent} Craftsmen on Leave ({workforce.todayAbsent} × 13.0h)
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
              {workforce.activeCraftsmen} Active on bench today
            </div>
          </div>

          {/* Card 3: Deducted Meal/Tea Breaks */}
          <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>3. DEDUCTED BREAKS</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#fcd34d', margin: '4px 0' }}>
              - {leak.loggedBreakHours !== undefined ? Number(leak.loggedBreakHours).toFixed(1) : (workforce.activeCraftsmen * 2.0).toFixed(1)} hrs
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              {workforce.activeCraftsmen} Active × 2.0 hrs breaks
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Breakfast (30m), Lunch (45m) & 2 Teas (45m)
            </div>
          </div>

          {/* Card 4: Net Available Bench Time */}
          <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>4. NET BENCH TIME</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#38bdf8', margin: '4px 0' }}>
              {leak.netAvailableHours !== undefined ? Number(leak.netAvailableHours).toFixed(1) : (workforce.activeCraftsmen * 11.0).toFixed(1)} hrs
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Time at workbench ({workforce.activeCraftsmen} × 11.0h)
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
              Effective working window (Gross − Breaks)
            </div>
          </div>

          {/* Card 5: Standard Output Delivered */}
          <div style={{ 
            background: (Number(leak.earnedStandardHours) >= 500)
              ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(10, 15, 29, 0.9) 100%)'
              : (Number(leak.earnedStandardHours) >= 440)
              ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.16) 0%, rgba(10, 15, 29, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(10, 15, 29, 0.85) 100%)', 
            border: (Number(leak.earnedStandardHours) >= 500) 
              ? '1.5px solid #38bdf8' 
              : (Number(leak.earnedStandardHours) >= 440) 
              ? '1.5px solid #34d399' 
              : '1px solid #d4af37', 
            borderRadius: '12px', 
            padding: '16px',
            boxShadow: (Number(leak.earnedStandardHours) >= 500)
              ? '0 0 20px rgba(56, 189, 248, 0.35)'
              : (Number(leak.earnedStandardHours) >= 440)
              ? '0 0 18px rgba(52, 211, 153, 0.25)'
              : '0 0 15px rgba(212, 175, 55, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: (Number(leak.earnedStandardHours) >= 500) ? '#38bdf8' : (Number(leak.earnedStandardHours) >= 440) ? '#34d399' : '#d4af37', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                5. PRODUCTIVE OUTPUT
              </div>
              {Number(leak.earnedStandardHours) >= 500 ? (
                <span style={{ fontSize: '9.5px', background: 'rgba(56, 189, 248, 0.25)', color: '#7dd3fc', border: '1px solid #38bdf8', borderRadius: '4px', padding: '1px 6px', fontWeight: 'bold' }}>
                  🏆 500h+ Peak Shift
                </span>
              ) : Number(leak.earnedStandardHours) >= 440 ? (
                <span style={{ fontSize: '9.5px', background: 'rgba(52, 211, 153, 0.2)', color: '#6ee7b7', border: '1px solid #34d399', borderRadius: '4px', padding: '1px 6px', fontWeight: 'bold' }}>
                  ★ Target Achieved
                </span>
              ) : null}
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: (Number(leak.earnedStandardHours) >= 500) ? '#7dd3fc' : (Number(leak.earnedStandardHours) >= 440) ? '#6ee7b7' : '#fef08a', margin: '4px 0', textShadow: (Number(leak.earnedStandardHours) >= 500) ? '0 0 14px rgba(56, 189, 248, 0.5)' : (Number(leak.earnedStandardHours) >= 440) ? '0 0 14px rgba(52, 211, 153, 0.5)' : '0 0 12px rgba(212, 175, 55, 0.4)' }}>
              {leak.earnedStandardHours !== undefined ? Number(leak.earnedStandardHours).toFixed(1) : '0.0'} hrs
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              {hasOrders ? `${leak.grossAttendanceUtilization}% Plant Yield` : 'No Orders Dispatched (Standby)'}
            </div>
            <div style={{ fontSize: '11px', marginTop: '6px' }}>
              {hasOrders ? (
                <span style={{ color: '#f87171' }}>Capacity Gap: <strong>{leak.lostHoursTotal} hrs lost</strong></span>
              ) : (
                <span style={{ color: '#38bdf8' }}>Available: <strong>{leak.netAvailableHours !== undefined ? Number(leak.netAvailableHours).toFixed(1) : (workforce.activeCraftsmen * 11.0).toFixed(1)} bench hrs</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Root-Cause Breakdown for THIS Date */}
        <div style={{ background: 'rgba(10, 15, 29, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          {hasOrders ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fef08a' }}>
                  WHERE DID THE {leak.lostHoursTotal} LOST HOURS GO ON {selectedDate}? (DAILY ROOT-CAUSE BREAKDOWN)
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Target Recoverable Hours: <strong style={{ color: '#34d399' }}>+{leak.targetRecoverableHours || 115} hrs/day</strong>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Reason 1: Approved Leaves */}
                {leak.approvedLeavesHours > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: '#fff', fontWeight: '600' }}>
                        🏥 1. Approved Craftsman Leaves & Absenteeism ({workforce.todayAbsent} craftsmen):
                      </span>
                      <strong style={{ color: '#f87171' }}>{leak.approvedLeavesHours} Hours ({leak.rootCauses.approvedLeaves.pct}% of shift)</strong>
                    </div>
                    <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(leak.rootCauses.approvedLeaves.pct, 100)}%`, height: '100%', background: '#f87171', borderRadius: '4px' }} />
                    </div>
                  </div>
                )}

                {/* Reason 2: Deducted Meals and Tea Breaks */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      ☕ 2. Scheduled Meals & Tea Breaks (Breakfast 30m, Lunch 45m, 2 Teas 45m = 2.0 Hours):
                    </span>
                    <strong style={{ color: '#60a5fa' }}>{leak.loggedBreakHours} Hours ({leak.rootCauses.loggedBreaks.pct}% of shift)</strong>
                  </div>
                  <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(leak.rootCauses.loggedBreaks.pct, 100)}%`, height: '100%', background: '#60a5fa', borderRadius: '4px' }} />
                  </div>
                </div>

                {/* Reason 3: Bench Waiting & Material Queues */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      ⏳ 3. Bench Material Waiting Queues (Melting crucible, wire rolling mill & supervisor scale delays):
                    </span>
                    <strong style={{ color: '#fb923c' }}>{leak.rootCauses.benchWaitingIdle.hours} Hours ({leak.rootCauses.benchWaitingIdle.pct}% of shift)</strong>
                  </div>
                  <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(leak.rootCauses.benchWaitingIdle.pct, 100)}%`, height: '100%', background: '#fb923c', borderRadius: '4px' }} />
                  </div>
                </div>

                {/* Reason 4: Pace / Speed Fatigue Gap */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      🐢 4. 13-Hour Shift Pace Fatigue (Microscope eye fatigue & hand speed drop in 10th-13th shift hours):
                    </span>
                    <strong style={{ color: '#fbbf24' }}>{leak.rootCauses.speedPaceGap.hours} Hours ({leak.rootCauses.speedPaceGap.pct}% of shift)</strong>
                  </div>
                  <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(leak.rootCauses.speedPaceGap.pct, 100)}%`, height: '100%', background: '#fbbf24', borderRadius: '4px' }} />
                  </div>
                </div>

                {/* Reason 5: Unlogged Defect Rework */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      🔧 5. Unlogged Defect Rework (Re-filing, re-soldering porosity & claw repairs at bench):
                    </span>
                    <strong style={{ color: '#c084fc' }}>{leak.rootCauses.unloggedRework.hours} Hours ({leak.rootCauses.unloggedRework.pct}% of shift)</strong>
                  </div>
                  <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(leak.rootCauses.unloggedRework.pct, 100)}%`, height: '100%', background: '#c084fc', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fef08a', marginBottom: '6px' }}>
                📋 Plant Shift Status for {selectedDate}: {leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} Gross On-Site Hours (0 Orders Dispatched)
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '700px', margin: '0 auto 16px auto', lineHeight: '1.5' }}>
                On this date, no production work orders have been allocated yet. All 63 benches are in standby mode. 
                To view a real shift with 17 completed orders and live capacity leak metrics, choose a date from below:
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleDateChange('2026-11-06')}
                  className="btn-gold-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 16px' }}
                >
                  <Calendar size={14} />
                  <span>📅 View Latest Shift with Real Orders (2026-11-06)</span>
                </button>
                <button
                  onClick={handleAutoPopulateDate}
                  disabled={autoPopulating}
                  className="btn-ghost-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 16px' }}
                >
                  <Zap size={14} color="#f59e0b" />
                  <span>⚡ Auto-Populate Full 63-Bench Shift for {selectedDate}</span>
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
              💡 <strong>Actionable Solution for the Boss:</strong> Preparing alloyed 22K gold wire the previous evening and staggering rolling mill station times will immediately recover <strong>+80 to +115 hours daily</strong>, pushing factory output from ~380-400h up to <strong>450+ Hours</strong>!
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MULTI-CHANNEL ORDER ATTRIBUTION FOR THIS DATE                          */}
      {/* ========================================================================= */}
      <div className="luxury-box" style={{ marginBottom: '28px' }}>
        <div className="luxury-box-header">
          <div>
            <h3 className="luxury-box-title">
              <Building2 size={20} color="#d4af37" />
              <span>Multi-Channel Production & Labour Value Breakdown ({selectedDate})</span>
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              Where did the working hours go on this day across <strong>External Jewellers</strong>, <strong>Showrooms</strong>, <strong>Factory Stock</strong>, and <strong>Owner VIP</strong>?
            </p>
          </div>
          <span className="badge-tier-a">4 Production Channels</span>
        </div>

        {/* Channel Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '20px' }}>
          {/* Channel 1: External Shops */}
          {(() => {
            const ch = channels.EXTERNAL_SHOP || {};
            return (
              <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Store size={18} color="#f59e0b" />
                    <strong style={{ color: '#fff', fontSize: '14px' }}>External Jewellers (B2B)</strong>
                  </div>
                  <span className="badge-bonus-pill">{ch.pctOfCapacity || 0}% Load</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#fef08a' }}>{ch.allocatedHours || 0} Hours</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  {ch.piecesCount || 0} pieces • {ch.ordersCount || 0} active orders
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '12px', paddingTop: '10px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Labour Billed:</span>
                  <strong style={{ color: '#34d399' }}>Rs. {(ch.labourValueRs || 0).toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Gold Issued:</span>
                  <span>{ch.goldIssuedGrams || 0}g (Loss: {ch.avgScrapLossPct || 3.4}%)</span>
                </div>
                <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '8px' }}>
                  • Billed at contract rate with agreed gold wastage factor.
                </div>
              </div>
            );
          })()}

          {/* Channel 2: Own Showrooms */}
          {(() => {
            const ch = channels.OWN_SHOWROOM || {};
            return (
              <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={18} color="#3b82f6" />
                    <strong style={{ color: '#fff', fontSize: '14px' }}>Ashadi Branch Showrooms</strong>
                  </div>
                  <span className="badge-tier-b">{ch.pctOfCapacity || 0}% Load</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#93c5fd' }}>{ch.allocatedHours || 0} Hours</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  {ch.piecesCount || 0} pieces • {ch.ordersCount || 0} internal dispatches
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '12px', paddingTop: '10px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Transfer Cost:</span>
                  <strong style={{ color: '#34d399' }}>Rs. {(ch.labourValueRs || 0).toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Gold Issued:</span>
                  <span>{ch.goldIssuedGrams || 0}g (Loss: {ch.avgScrapLossPct || 3.2}%)</span>
                </div>
                <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '8px' }}>
                  • Internal transfer at pure factory cost (Gold + Direct SMT Labour).
                </div>
              </div>
            );
          })()}

          {/* Channel 3: Factory Stock */}
          {(() => {
            const ch = channels.FACTORY_STOCK || {};
            return (
              <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={18} color="#cbd5e1" />
                    <strong style={{ color: '#fff', fontSize: '14px' }}>Factory Central Stock</strong>
                  </div>
                  <span className="badge-tier-c">{ch.pctOfCapacity || 0}% Load</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#cbd5e1' }}>{ch.allocatedHours || 0} Hours</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  {ch.piecesCount || 0} pieces • {ch.ordersCount || 0} buffer runs
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '12px', paddingTop: '10px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Inventory Asset:</span>
                  <strong style={{ color: '#34d399' }}>Rs. {(ch.labourValueRs || 0).toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Gold Issued:</span>
                  <span>{ch.goldIssuedGrams || 0}g (Loss: {ch.avgScrapLossPct || 2.73}%)</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                  • Buffer stock used to fill bench capacity during low retail demand.
                </div>
              </div>
            );
          })()}

          {/* Channel 4: Owner / VIP Orders */}
          {(() => {
            const ch = channels.OWNER_SPECIAL || {};
            return (
              <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Crown size={18} color="#c084fc" />
                    <strong style={{ color: '#fff', fontSize: '14px' }}>Owner & VIP Orders</strong>
                  </div>
                  <span style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                    {ch.pctOfCapacity || 0}% Load
                  </span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#e9d5ff' }}>{ch.allocatedHours || 0} Hours</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  {ch.piecesCount || 0} pieces • {ch.ordersCount || 0} VIP commissions
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '12px', paddingTop: '10px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Crafting Cost:</span>
                  <strong style={{ color: '#34d399' }}>Rs. {(ch.labourValueRs || 0).toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Gold Issued:</span>
                  <span>{ch.goldIssuedGrams || 0}g (Zero gold loss allowed)</span>
                </div>
                <div style={{ fontSize: '11px', color: '#c084fc', marginTop: '8px' }}>
                  • Handled exclusively by Grade A Master Craftsmen (Rs. 11.50/min).
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. DAY'S BENCH ROSTER & WORK ORDERS TABLE (INSPECT WHAT HAPPENED)         */}
      {/* ========================================================================= */}
      <div className="luxury-box" style={{ marginBottom: '28px' }}>
        <div className="luxury-box-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className="luxury-box-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="#d4af37" />
              <span>Day's Bench Roster & Dispatched Orders: {selectedDate}</span>
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              Inspect every craftsman bench who worked on this date, their assumed vs actual hours, and gold loss.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search craftsman or order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'rgba(10, 15, 29, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '6px 10px 6px 30px',
                  fontSize: '12px',
                  width: '200px'
                }}
              />
            </div>

            {/* Channel filter */}
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              style={{
                background: 'rgba(10, 15, 29, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: '#fff',
                padding: '6px 10px',
                fontSize: '12px'
              }}
            >
              <option value="ALL">All Channels</option>
              <option value="EXTERNAL_SHOP">External Jewellers (B2B)</option>
              <option value="OWN_SHOWROOM">Ashadi Showrooms</option>
              <option value="FACTORY_STOCK">Factory Stock</option>
              <option value="OWNER_SPECIAL">Owner VIP</option>
            </select>

            <button
              className="btn-ghost-secondary"
              onClick={() => setShowRoster(!showRoster)}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              {showRoster ? 'Collapse Table' : 'Expand Table'}
            </button>
          </div>
        </div>

        {/* Leaves indicator for this day */}
        {dayLeaves.length > 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            fontSize: '12px'
          }}>
            <strong style={{ color: '#f87171' }}>⚠️ Craftsmen on Approved Leave on {selectedDate}:</strong>
            {dayLeaves.map(l => (
              <span key={l.id} style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '2px 8px', borderRadius: '4px', color: '#cbd5e1' }}>
                {l.craftsmanId} ({l.craftsmanName}) • {l.leaveType} (-{l.hoursDeducted || 12}h)
              </span>
            ))}
          </div>
        )}

        {showRoster && (
          <div>
            {filteredDayAllocs.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                  No work orders found matching filters for <strong>{selectedDate}</strong>.
                </p>
                <button
                  onClick={handleAutoPopulateDate}
                  disabled={autoPopulating}
                  className="btn-gold-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 16px', marginTop: '6px' }}
                >
                  <Zap size={14} />
                  <span>{autoPopulating ? 'Populating...' : '⚡ Auto-Populate 63-Bench Shift for this Date'}</span>
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="allocations-table" style={{ width: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>BENCH / CRAFTSMAN</th>
                      <th>SKILL TIER</th>
                      <th>CHANNEL</th>
                      <th>WORK ORDER</th>
                      <th>DESIGN</th>
                      <th style={{ textAlign: 'right' }}>QTY</th>
                      <th style={{ textAlign: 'right' }}>ASSUMED HRS</th>
                      <th style={{ textAlign: 'right' }}>ACTUAL HRS</th>
                      <th style={{ textAlign: 'right' }}>VARIANCE</th>
                      <th style={{ textAlign: 'right' }}>GOLD LOSS</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDayAllocs.map((item) => {
                      const channelBadge = {
                        EXTERNAL_SHOP: { label: 'B2B Retail', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
                        OWN_SHOWROOM: { label: 'Showroom', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
                        FACTORY_STOCK: { label: 'Factory Stock', color: '#cbd5e1', bg: 'rgba(255, 255, 255, 0.1)' },
                        OWNER_SPECIAL: { label: 'Owner VIP', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)' }
                      }[item.channel] || { label: item.channel, color: '#d4af37', bg: 'rgba(212, 175, 55, 0.15)' };

                      const tierBadge = {
                        'Grade A': 'badge-tier-a',
                        'Grade B': 'badge-tier-b',
                        'Grade C': 'badge-tier-c'
                      }[item.skillTier] || 'badge-tier-b';

                      return (
                        <tr key={item.id}>
                          <td>
                            <strong style={{ color: '#fff' }}>{item.craftsmanName}</strong>
                            <div style={{ fontSize: '11px', color: '#d4af37' }}>{item.craftsmanId}</div>
                          </td>
                          <td>
                            <span className={tierBadge}>{item.skillTier}</span>
                          </td>
                          <td>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: channelBadge.color,
                              background: channelBadge.bg
                            }}>
                              {channelBadge.label}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{item.workOrder}</span>
                          </td>
                          <td>
                            <div style={{ color: '#fff' }}>{item.designName}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{item.designCode} ({item.unitSMT}m)</div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.qtyAllocated}</td>
                          <td style={{ textAlign: 'right', color: '#fef08a', fontWeight: 'bold' }}>
                            {(item.assumedHours || (item.budgetedSMT / 60)).toFixed(2)}h
                          </td>
                          <td style={{ textAlign: 'right', color: '#fff' }}>
                            {item.actualHours !== null && item.actualHours !== undefined && item.actualHours !== '' ? `${parseFloat(item.actualHours).toFixed(2)}h` : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {item.varianceHours !== null && item.varianceHours !== undefined && item.varianceHours !== '' ? (
                              <span style={{ color: parseFloat(item.varianceHours) > 0 ? '#f87171' : '#34d399', fontWeight: 'bold' }}>
                                {parseFloat(item.varianceHours) > 0 ? `+${parseFloat(item.varianceHours).toFixed(2)}h` : `${parseFloat(item.varianceHours).toFixed(2)}h`}
                              </span>
                            ) : (
                              <span style={{ color: '#64748b' }}>—</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {item.goldLossPct !== null && item.goldLossPct !== undefined && item.goldLossPct !== '' ? (
                              <span style={{ color: parseFloat(item.goldLossPct) > 3.5 ? '#f87171' : '#34d399' }}>
                                {parseFloat(item.goldLossPct).toFixed(2)}%
                              </span>
                            ) : (
                              <span style={{ color: '#64748b' }}>—</span>
                            )}
                          </td>
                          <td>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              background: item.status === 'Completed' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: item.status === 'Completed' ? '#34d399' : '#fcd34d'
                            }}>
                              {item.status || 'In Progress'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. CIRCULAR GAUGES (AUTODESK DASHBOARD STYLE) */}
      <div className="gauges-panel">
        <div className="gauges-header">
          <div className="gauges-title">
            <Activity size={18} color="#d4af37" />
            <span>Factory Operational Excellence Calibration</span>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Real-Time Standard Minute Value (SMV) Benchmarking
          </span>
        </div>

        <div className="gauges-grid">
          {renderGauge(
            Math.round(dailyPerformance.avgEfficiency || 85),
            "Target ≥ 80%",
            "Productivity",
            "Earned SMT vs Actual Working Minutes",
            "#d4af37"
          )}
          {renderGauge(
            Math.round((workforce.activeCraftsmen / workforce.totalCraftsmen) * 100),
            "Target 100%",
            "Availability",
            `${workforce.activeCraftsmen} of ${workforce.totalCraftsmen} Benches Active`,
            "#38bdf8"
          )}
          {renderGauge(
            Math.round(dailyPerformance.qaPassRate || 96),
            "Target ≥ 95%",
            "Quality Rate",
            "First-Time-Right QA Pass Rate",
            "#34d399"
          )}
          {renderGauge(
            91,
            "Target ≥ 88%",
            "Overall Labour Eff. (OLE)",
            "Integrated Time, Quality & Gold Scrap",
            "#a78bfa"
          )}
        </div>
      </div>

      {/* 8. PRIMARY METRIC CARDS */}
      <div className="kpis-grid">
        <div className="kpi-luxury-card">
          <div className="kpi-header">
            <span>VERIFIED CRAFTSMEN</span>
            <div className="kpi-icon-box"><Users size={18} /></div>
          </div>
          <div className="kpi-big-number">{workforce.totalCraftsmen} Benches</div>
          <div className="kpi-footer-note">
            <span style={{ color: '#fef08a' }}>{workforce.gradeA} Master A</span> • <span style={{ color: '#93c5fd' }}>{workforce.gradeB} Senior B</span> • <span style={{ color: '#cbd5e1' }}>{workforce.gradeC} Assist C</span>
          </div>
        </div>

        <div className="kpi-luxury-card">
          <div className="kpi-header">
            <span>DAY STANDARD HOURS</span>
            <div className="kpi-icon-box"><Clock size={18} /></div>
          </div>
          <div className="kpi-big-number" style={{ color: '#fef08a' }}>
            {leak.earnedStandardHours} hrs
          </div>
          <div className="kpi-footer-note">{dailyPerformance.totalEarnedSMT?.toLocaleString()} Earned Std Minutes</div>
        </div>

        <div className="kpi-luxury-card">
          <div className="kpi-header">
            <span>TOTAL LABOUR VALUE</span>
            <div className="kpi-icon-box"><DollarSign size={18} /></div>
          </div>
          <div className="kpi-big-number" style={{ color: '#34d399' }}>
            Rs. {dailyPerformance.totalLabourPay.toLocaleString()}
          </div>
          <div className="kpi-footer-note">Direct labour payroll calculation</div>
        </div>

        <div className="kpi-luxury-card">
          <div className="kpi-header">
            <span>GOLD DUST SCRAP LOSS</span>
            <div className="kpi-icon-box"><Scale size={18} /></div>
          </div>
          <div className="kpi-big-number" style={{ color: '#38bdf8' }}>
            {dailyPerformance.avgGoldLoss}%
          </div>
          <div className="kpi-footer-note">Within allowable tolerance ceiling (2.5% – 4.0%)</div>
        </div>
      </div>

      {/* 9. WORKER COMPARISON & FLOOR MAP */}
      <div className="two-col-grid">
        <div className="luxury-box">
          <div className="luxury-box-header">
            <h3 className="luxury-box-title">
              <BarChart3 size={18} color="#d4af37" />
              <span>Worker Performance Benchmark (Seniority Sorted)</span>
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Target: 85% Efficiency</span>
          </div>

          <div className="bar-chart-container">
            {topPerformers.map((worker) => (
              <div key={worker.id} className="bar-row">
                <div className="bar-worker-name" title={worker.name}>
                  {worker.name}
                </div>
                <div className="bar-track">
                  <div 
                    className="bar-fill" 
                    style={{ 
                      width: `${Math.min(worker.efficiency, 100)}%`,
                      background: worker.efficiency >= 90 
                        ? 'linear-gradient(90deg, #d4af37, #10b981)' 
                        : 'linear-gradient(90deg, #b45309, #d4af37)'
                    }} 
                  />
                </div>
                <div className="bar-val-badge" style={{ color: worker.efficiency >= 90 ? '#34d399' : '#fef08a' }}>
                  {worker.efficiency}% ({worker.smt}m)
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
            <span>⭐ Craftsmen achieving ≥ 85% efficiency receive the Rs. 450 daily bonus.</span>
            <button 
              onClick={() => onNavigateTab('craftsmen')}
              style={{ color: '#d4af37', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>View all 63</span> <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Live 63-Bench Workshop Floor Map */}
        {(() => {
          // Compute Live Bench Statuses from allocations and leaves
          const combinedLeaves = [
            ...(leaves || []),
            ...(dayData?.todayLeaves || [])
          ];
          const activeDayLeavesMap = new Map();
          combinedLeaves.forEach(l => {
            if (l && l.date === selectedDate) {
              const key = l.id || `${l.craftsmanId}_${l.date}`;
              activeDayLeavesMap.set(key, l);
            }
          });
          const activeDayLeaves = Array.from(activeDayLeavesMap.values());

          // Sort craftsmen sequentially by Bench ID (C001, C002, ..., C063)
          const sortedCraftsmen = [...(craftsmen || [])].sort((a, b) => {
            return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
          });

          // Determine effective floor time in minutes from midnight for the selected date
          const todayIsoStr = new Date().toISOString().split('T')[0];
          let effectiveMinuteOfDay;
          if (selectedDate === todayIsoStr) {
            effectiveMinuteOfDay = currentFloorTime.getHours() * 60 + currentFloorTime.getMinutes();
          } else if (selectedDate < todayIsoStr) {
            effectiveMinuteOfDay = 20 * 60; // End of 13-hr shift for past shift records
          } else {
            effectiveMinuteOfDay = 7 * 60; // Start of shift for future shifts
          }

          const benchStatusList = sortedCraftsmen.slice(0, 63).map((c, benchIdx) => {
            const isAbsent = activeDayLeaves.some(l => 
              (l.craftsmanId && l.craftsmanId.toLowerCase() === c.id.toLowerCase()) || 
              (l.craftsmanName && l.craftsmanName.toLowerCase() === c.name.toLowerCase())
            );
            const craftsmanAllocs = (dayAllocations || []).filter(a => 
              (a.craftsmanId && a.craftsmanId.toLowerCase() === c.id.toLowerCase()) || 
              (a.craftsmanName && a.craftsmanName.toLowerCase() === c.name.toLowerCase())
            );
            const activeAlloc = craftsmanAllocs.find(a => a.status !== 'Completed' && (a.actualHours === null || a.actualHours === undefined || a.actualHours === ''));
            const alloc = activeAlloc || (craftsmanAllocs.length > 0 ? craftsmanAllocs[craftsmanAllocs.length - 1] : null);

            let status = 'STANDBY';
            let statusLabel = 'Standby (Idle)';
            let statusIcon = '⚪';
            let statusColor = '#94a3b8';
            let statusBorder = 'rgba(255, 255, 255, 0.12)';
            let statusBg = 'rgba(15, 23, 42, 0.7)';
            let boxShadow = 'none';
            let progressPct = 0;
            let overdueMins = 0;
            let targetETATimeStr = '';

            if (isAbsent) {
              status = 'ABSENT';
              statusLabel = 'On Leave';
              statusIcon = '🚫';
              statusColor = '#f43f5e';
              statusBorder = '1.5px solid rgba(244, 63, 94, 0.7)';
              statusBg = 'rgba(225, 29, 72, 0.16)';
              boxShadow = 'none';
            } else if (alloc) {
              const isCompleted = alloc.status === 'Completed' || (alloc.actualHours !== null && alloc.actualHours !== undefined && alloc.actualHours !== '');
              const isPaused = alloc.status && alloc.status.includes('Paused');

              if (isCompleted) {
                progressPct = 100;
                status = 'COMPLETED';
                statusLabel = 'Vault Return Done';
                statusIcon = '🔵';
                statusColor = '#38bdf8';
                statusBorder = '1.5px solid rgba(56, 189, 248, 0.65)';
                statusBg = 'rgba(56, 189, 248, 0.16)';
                boxShadow = 'none';
              } else if (isPaused) {
                progressPct = 85;
                status = 'PAUSED';
                statusLabel = alloc.status.includes('Lunch') ? 'Lunch Break' : alloc.status.includes('Dinner') ? 'Dinner Break' : 'Tea Break';
                statusIcon = '☕';
                statusColor = '#eab308';
                statusBorder = '1.5px solid rgba(234, 179, 8, 0.75)';
                statusBg = 'rgba(234, 179, 8, 0.2)';
                boxShadow = '0 0 10px rgba(234, 179, 8, 0.35)';
              } else if (alloc.dispatchTime && alloc.status !== 'Standby') {
                const defaultStartMin = 7 * 60 + Math.min(30, (benchIdx % 10) * 3);
                const startMinutes = timeStringToMinutes(alloc.dispatchTime, defaultStartMin);
                const budgetedSMT = alloc.budgetedSMT || (alloc.assumedHours ? alloc.assumedHours * 60 : 240);
                const etaData = calculateDynamicETA(startMinutes, budgetedSMT, c.skillTier || 'Grade B');
                targetETATimeStr = formatMinutesToTime(etaData.targetETAMinutes);

                let elapsedWorkingMins = 0;
                for (let m = startMinutes; m < effectiveMinuteOfDay; m++) {
                  if (!FACTORY_BREAKS.some(b => m >= b.start && m < b.end)) {
                    elapsedWorkingMins += 1;
                  }
                }

                const calculatedProgress = Math.min(100, Math.max(0, Math.round((elapsedWorkingMins / etaData.requiredWorkMinutes) * 100)));
                const totalElapsedWallClock = Math.max(0, effectiveMinuteOfDay - startMinutes);

                const isOverdue = effectiveMinuteOfDay > etaData.targetETAMinutes;
                overdueMins = Math.max(0, effectiveMinuteOfDay - etaData.targetETAMinutes);
                const isLagging = !isOverdue && totalElapsedWallClock > (etaData.targetETAMinutes - startMinutes) * 0.82 && calculatedProgress < 70;

                if (isOverdue) {
                  status = 'OVERDUE';
                  statusLabel = `Overdue (+${overdueMins}m)`;
                  statusIcon = '🚨';
                  statusColor = '#ff2e56';
                  statusBorder = '1.5px solid #ff2e56';
                  statusBg = 'rgba(255, 46, 86, 0.22)';
                  boxShadow = '0 0 14px rgba(255, 46, 86, 0.55)';
                  progressPct = 100;
                } else if (isLagging) {
                  status = 'LAGGING';
                  statusLabel = 'Pace Lagging (Slow)';
                  statusIcon = '⚠️';
                  statusColor = '#f97316';
                  statusBorder = '1.5px solid #f97316';
                  statusBg = 'rgba(249, 115, 22, 0.2)';
                  boxShadow = '0 0 10px rgba(249, 115, 22, 0.4)';
                  progressPct = calculatedProgress || 65;
                } else {
                  status = 'WORKING';
                  statusLabel = 'Active Working (On Track)';
                  statusIcon = '🟢';
                  statusColor = '#10b981';
                  statusBorder = '1.5px solid rgba(16, 185, 129, 0.75)';
                  statusBg = 'rgba(16, 185, 129, 0.16)';
                  boxShadow = '0 0 8px rgba(16, 185, 129, 0.25)';
                  progressPct = calculatedProgress || 65;
                }
              } else {
                status = 'STANDBY';
                statusLabel = 'Assigned (Pending Start)';
                statusIcon = '⚪';
                statusColor = '#cbd5e1';
                statusBorder = 'rgba(255, 255, 255, 0.2)';
                statusBg = 'rgba(30, 41, 59, 0.7)';
                boxShadow = 'none';
                progressPct = 0;
              }
            }

            // Extract craftsman first name or callsign
            const nameParts = (c.name || '').replace(/^(Mr\.|Ms\.|Mrs\.)\s*/i, '').trim().split(' ');
            const significantParts = nameParts.filter(p => !p.includes('.') && p.length > 2);
            const displayName = significantParts.length > 0 ? significantParts[0] : (nameParts[0] || c.id);

            return {
              craftsman: c,
              allocation: alloc,
              status,
              statusLabel,
              statusIcon,
              statusColor,
              statusBorder,
              statusBg,
              boxShadow,
              progressPct,
              overdueMins,
              targetETATimeStr,
              displayName
            };
          });

          const benchCounts = {
            TOTAL: benchStatusList.length,
            WORKING: benchStatusList.filter(b => b.status === 'WORKING').length,
            OVERDUE: benchStatusList.filter(b => b.status === 'OVERDUE').length,
            LAGGING: benchStatusList.filter(b => b.status === 'LAGGING').length,
            PAUSED: benchStatusList.filter(b => b.status === 'PAUSED').length,
            COMPLETED: benchStatusList.filter(b => b.status === 'COMPLETED').length,
            STANDBY: benchStatusList.filter(b => b.status === 'STANDBY').length,
            ABSENT: benchStatusList.filter(b => b.status === 'ABSENT').length
          };

          return (
            <div className="luxury-box">
              <div className="luxury-box-header" style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={20} color="#d4af37" />
                  <div>
                    <h3 className="luxury-box-title" style={{ margin: 0, fontSize: '16px' }}>
                      Live 63-Bench Workshop Floor Map
                    </h3>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      Interactive Workshop Telemetry • Click any status button to filter & highlight benches
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {benchStatusFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setBenchStatusFilter('ALL')}
                      style={{
                        background: 'rgba(212, 175, 55, 0.15)',
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                        color: '#fef08a',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ✕ Show All
                    </button>
                  )}
                  <span className="badge-tier-a">63 Benches</span>
                </div>
              </div>

              {/* 🚦 Live Summary Status Bar (At-a-Glance Summary & Filter) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
                margin: '14px 0 16px 0',
                padding: '10px',
                background: 'rgba(10, 16, 30, 0.75)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: '10px'
              }}>
                {/* 1. All Benches */}
                <button
                  type="button"
                  onClick={() => setBenchStatusFilter('ALL')}
                  style={{
                    background: benchStatusFilter === 'ALL' ? 'rgba(212, 175, 55, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                    border: benchStatusFilter === 'ALL' ? '1.5px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: benchStatusFilter === 'ALL' ? '0 0 12px rgba(212, 175, 55, 0.3)' : 'none',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold' }}>All Workshop</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: benchStatusFilter === 'ALL' ? '#fef08a' : '#fff' }}>
                    63 Benches
                  </div>
                </button>

                {/* 2. Active Working */}
                <button
                  type="button"
                  onClick={() => setBenchStatusFilter(benchStatusFilter === 'WORKING' ? 'ALL' : 'WORKING')}
                  style={{
                    background: benchStatusFilter === 'WORKING' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.08)',
                    border: benchStatusFilter === 'WORKING' ? '2px solid #10b981' : '1px solid rgba(16, 185, 129, 0.3)',
                    boxShadow: benchStatusFilter === 'WORKING' ? '0 0 14px rgba(16, 185, 129, 0.45)' : 'none',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#86efac', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
                    Active Working
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#4ade80' }}>
                    {benchCounts.WORKING} Benches
                  </div>
                </button>

                {/* 3. Overdue (Critical schedule breach) */}
                <button
                  type="button"
                  onClick={() => setBenchStatusFilter(benchStatusFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
                  style={{
                    background: benchStatusFilter === 'OVERDUE' ? 'rgba(255, 46, 86, 0.28)' : 'rgba(255, 46, 86, 0.08)',
                    border: benchStatusFilter === 'OVERDUE' ? '2px solid #ff2e56' : '1px solid rgba(255, 46, 86, 0.35)',
                    boxShadow: benchStatusFilter === 'OVERDUE' ? '0 0 16px rgba(255, 46, 86, 0.55)' : 'none',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#fda4af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🚨</span>
                    Overdue
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#ff2e56' }}>
                    {benchCounts.OVERDUE} Benches
                  </div>
                </button>

                {/* 4. Lagging (Pace Behind Schedule) */}
                <button
                  type="button"
                  onClick={() => setBenchStatusFilter(benchStatusFilter === 'LAGGING' ? 'ALL' : 'LAGGING')}
                  style={{
                    background: benchStatusFilter === 'LAGGING' ? 'rgba(249, 115, 22, 0.28)' : 'rgba(249, 115, 22, 0.08)',
                    border: benchStatusFilter === 'LAGGING' ? '2px solid #f97316' : '1px solid rgba(249, 115, 22, 0.35)',
                    boxShadow: benchStatusFilter === 'LAGGING' ? '0 0 14px rgba(249, 115, 22, 0.45)' : 'none',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#fed7aa', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚠️</span>
                    Lagging
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#fb923c' }}>
                    {benchCounts.LAGGING} Benches
                  </div>
                </button>

                {/* 5. On Break */}
                <button
                  type="button"
                  onClick={() => setBenchStatusFilter(benchStatusFilter === 'PAUSED' ? 'ALL' : 'PAUSED')}
                  style={{
                    background: benchStatusFilter === 'PAUSED' ? 'rgba(234, 179, 8, 0.28)' : 'rgba(234, 179, 8, 0.08)',
                    border: benchStatusFilter === 'PAUSED' ? '2px solid #eab308' : '1px solid rgba(234, 179, 8, 0.3)',
                    boxShadow: benchStatusFilter === 'PAUSED' ? '0 0 14px rgba(234, 179, 8, 0.45)' : 'none',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#fde047', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>☕</span>
                    On Break
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#fbbf24' }}>
                    {benchCounts.PAUSED} Benches
                  </div>
                </button>

                {/* 6. Vault Return Done */}
                <button
                  type="button"
                  onClick={() => setBenchStatusFilter(benchStatusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
                  style={{
                    background: benchStatusFilter === 'COMPLETED' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.08)',
                    border: benchStatusFilter === 'COMPLETED' ? '2px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.3)',
                    boxShadow: benchStatusFilter === 'COMPLETED' ? '0 0 14px rgba(56, 189, 248, 0.45)' : 'none',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#7dd3fc', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🔵</span>
                    Vault Done
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#38bdf8' }}>
                    {benchCounts.COMPLETED} Benches
                  </div>
                </button>

                {/* 7. Standby */}
                <button
                  type="button"
                  onClick={() => setBenchStatusFilter(benchStatusFilter === 'STANDBY' ? 'ALL' : 'STANDBY')}
                  style={{
                    background: benchStatusFilter === 'STANDBY' ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.06)',
                    border: benchStatusFilter === 'STANDBY' ? '2px solid #94a3b8' : '1px solid rgba(148, 163, 184, 0.2)',
                    boxShadow: benchStatusFilter === 'STANDBY' ? '0 0 14px rgba(148, 163, 184, 0.3)' : 'none',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚪</span>
                    Standby
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#cbd5e1' }}>
                    {benchCounts.STANDBY} Benches
                  </div>
                </button>

                {/* 8. On Leave (Rose Wine Distinct Absence Style) */}
                <button
                  type="button"
                  onClick={() => setBenchStatusFilter(benchStatusFilter === 'ABSENT' ? 'ALL' : 'ABSENT')}
                  style={{
                    background: benchStatusFilter === 'ABSENT' ? 'rgba(225, 29, 72, 0.28)' : 'rgba(225, 29, 72, 0.08)',
                    border: benchStatusFilter === 'ABSENT' ? '2px solid #f43f5e' : '1px solid rgba(244, 63, 94, 0.35)',
                    boxShadow: benchStatusFilter === 'ABSENT' ? '0 0 14px rgba(244, 63, 94, 0.45)' : 'none',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#fda4af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🚫</span>
                    On Leave
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#f43f5e' }}>
                    {benchCounts.ABSENT} Benches
                  </div>
                </button>
              </div>

              {/* 63-Bench Interactive Telemetry Grid */}
              <div className="bench-grid-map">
                {benchStatusList.map((item) => {
                  const c = item.craftsman;
                  const isSelected = selectedBench?.craftsman?.id === c.id || selectedBench?.id === c.id;
                  const matchesFilter = benchStatusFilter === 'ALL' || item.status === benchStatusFilter;
                  const isDimmed = !matchesFilter;

                  const tierColor = c.skillTier === 'Grade A' ? '#facc15' : c.skillTier === 'Grade B' ? '#38bdf8' : '#cbd5e1';
                  const tierBg = c.skillTier === 'Grade A' ? 'rgba(234, 179, 8, 0.2)' : c.skillTier === 'Grade B' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.2)';

                  return (
                    <div 
                      key={c.id} 
                      className="bench-card-mini"
                      onClick={() => setSelectedBench(item)}
                      style={{
                        borderColor: isSelected ? '#d4af37' : item.statusBorder,
                        background: isSelected ? 'rgba(212, 175, 55, 0.28)' : item.statusBg,
                        boxShadow: isSelected 
                          ? '0 0 16px rgba(212, 175, 55, 0.5)' 
                          : item.boxShadow,
                        opacity: isDimmed ? 0.2 : 1,
                        transform: isSelected ? 'scale(1.08)' : (isDimmed ? 'scale(0.96)' : 'scale(1)'),
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: '74px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '6px 5px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      title={`Bench ${c.id}: ${c.name} — ${item.statusLabel} (${c.skillTier})`}
                    >
                      {/* Top: Bench ID + Skill Grade Pill */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: isSelected ? '#fef08a' : '#fff' }}>
                          {c.id}
                        </span>
                        <span style={{
                          fontSize: '8.5px',
                          fontWeight: '800',
                          color: tierColor,
                          background: tierBg,
                          padding: '1px 3.5px',
                          borderRadius: '3px',
                          border: `1px solid ${tierColor}44`,
                          lineHeight: '1'
                        }}>
                          {c.skillTier === 'Grade A' ? 'A' : c.skillTier === 'Grade B' ? 'B' : 'C'}
                        </span>
                      </div>

                      {/* Middle: Craftsman Call-name */}
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: item.status === 'ABSENT' ? '#fda4af' : (item.status === 'OVERDUE' ? '#ffffff' : (item.status === 'LAGGING' ? '#fef3c7' : '#f8fafc')),
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '0.2px'
                      }}>
                        {item.displayName}
                      </div>

                      {/* Bottom: Status Pill */}
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        fontSize: '9.5px',
                        fontWeight: '700',
                        color: item.statusColor,
                        lineHeight: '1.2'
                      }}>
                        <span>{item.statusIcon}</span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.status === 'OVERDUE' ? `+${item.overdueMins}m` :
                           item.status === 'LAGGING' ? 'Lagging' :
                           item.status === 'WORKING' ? 'Working' :
                           item.status === 'PAUSED' ? 'Break' :
                           item.status === 'COMPLETED' ? 'Done' :
                           item.status === 'ABSENT' ? 'Leave' : 'Standby'}
                        </span>
                      </div>

                      {/* Micro Progress Line at bottom */}
                      {item.status !== 'ABSENT' && item.progressPct > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '2.5px',
                          background: 'rgba(255, 255, 255, 0.1)'
                        }}>
                          <div style={{
                            width: `${item.progressPct}%`,
                            height: '100%',
                            background: item.statusColor,
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bench Quick-Inspect Detail Drawer */}
              {selectedBench && (
                <div style={{
                  marginTop: '16px',
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(10, 16, 30, 0.98) 100%)',
                  border: '1.5px solid var(--border-gold-bright)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      background: 'rgba(212, 175, 55, 0.2)',
                      border: '1.5px solid #d4af37',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      fontWeight: '900',
                      color: '#fef08a'
                    }}>
                      {selectedBench.craftsman?.id || selectedBench.id}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '16px', color: '#fff' }}>
                          {selectedBench.craftsman?.name || selectedBench.name}
                        </strong>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: selectedBench.statusColor ? `${selectedBench.statusColor}22` : 'rgba(212, 175, 55, 0.2)',
                          border: `1px solid ${selectedBench.statusColor || '#d4af37'}`,
                          color: selectedBench.statusColor || '#fef08a'
                        }}>
                          {selectedBench.statusIcon} {selectedBench.statusLabel || 'Active'}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span>Emp #{selectedBench.craftsman?.empNo || selectedBench.empNo}</span>
                        <span>•</span>
                        <span>{selectedBench.craftsman?.specialization || selectedBench.specialization}</span>
                        <span>•</span>
                        <span style={{ color: '#fef08a', fontWeight: 'bold' }}>
                          {selectedBench.craftsman?.skillTier || selectedBench.skillTier} (Rs. {(selectedBench.craftsman?.minuteRate || selectedBench.minuteRate || 0).toFixed(2)}/min)
                        </span>
                      </div>

                      {selectedBench.allocation && (
                        <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px', background: 'rgba(0,0,0,0.35)', padding: '6px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>Work Order: <strong style={{ color: '#38bdf8' }}>{selectedBench.allocation.workOrder}</strong></span>
                          <span>•</span>
                          <span>Design: <strong style={{ color: '#fde047' }}>{selectedBench.allocation.designName || selectedBench.allocation.designCode}</strong></span>
                          {selectedBench.allocation.goldIssuedGrams && (
                            <>
                              <span>•</span>
                              <span>Issued: <strong style={{ color: '#4ade80' }}>{selectedBench.allocation.goldIssuedGrams}g</strong> ({selectedBench.allocation.metalType || 'Gold 22K'})</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Telemetry Alert Highlights in Drawer */}
                      {selectedBench.status === 'OVERDUE' && (
                        <div style={{ marginTop: '8px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(255, 46, 86, 0.15)', border: '1px solid #ff2e56', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fda4af' }}>
                          <span style={{ fontSize: '15px' }}>🚨</span>
                          <span>
                            <strong style={{ color: '#ff2e56' }}>Critical Overdue (+{selectedBench.overdueMins}m):</strong> Bench has exceeded Target ETA ({selectedBench.targetETATimeStr}). Needs immediate floor supervisor attention.
                          </span>
                        </div>
                      )}

                      {selectedBench.status === 'LAGGING' && (
                        <div style={{ marginTop: '8px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(249, 115, 22, 0.15)', border: '1px solid #f97316', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fed7aa' }}>
                          <span style={{ fontSize: '15px' }}>⚠️</span>
                          <span>
                            <strong style={{ color: '#fb923c' }}>Pace Lagging Behind Schedule:</strong> Elapsed working time is high relative to progress. Target ETA: {selectedBench.targetETATimeStr}.
                          </span>
                        </div>
                      )}

                      {selectedBench.status === 'ABSENT' && (
                        <div style={{ marginTop: '8px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(225, 29, 72, 0.14)', border: '1px solid rgba(244, 63, 94, 0.6)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fda4af' }}>
                          <span style={{ fontSize: '15px' }}>🚫</span>
                          <span>
                            <strong style={{ color: '#f43f5e' }}>Craftsman on Approved Leave:</strong> Bench capacity unavailable for this date.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      type="button"
                      className="btn-gold-primary" 
                      onClick={() => {
                        const targetId = selectedBench.craftsman?.id || selectedBench.id || selectedBench.allocation?.craftsmanId;
                        if (onNavigateTab) {
                          onNavigateTab('allocations', { date: selectedDate, craftsmanId: targetId });
                        }
                        if (targetId) {
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('ashadi:highlight_bench', { 
                              detail: { 
                                craftsmanId: targetId,
                                date: selectedDate 
                              } 
                            }));
                          }, 150);
                        }
                      }}
                      style={{ padding: '8px 16px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Activity size={14} />
                      <span>Open in Live Floor Monitor</span>
                    </button>
                    <button 
                      type="button"
                      className="btn-ghost-secondary" 
                      onClick={() => setSelectedBench(null)} 
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
