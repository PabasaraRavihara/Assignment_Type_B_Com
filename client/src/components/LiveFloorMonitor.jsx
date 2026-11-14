import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Pause, 
  Play, 
  Sparkles, 
  Calendar, 
  Store, 
  Package, 
  Crown, 
  Search, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Sliders,
  Scale,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import ShopFloorQRScannerModal from './ShopFloorQRScannerModal';
import PrintableJobSlipModal from './PrintableJobSlipModal';
import BatchPrintSlipsModal from './BatchPrintSlipsModal';
import { 
  FACTORY_BREAKS, 
  formatMinutesToTime, 
  timeStringToMinutes, 
  getActiveBreak, 
  calculateDynamicETA,
  getMetalScrapCeiling,
  STANDARD_METALS
} from '../utils/floorTiming';
import { QrCode, Printer } from 'lucide-react';

export { FACTORY_BREAKS, formatMinutesToTime, timeStringToMinutes, getActiveBreak, calculateDynamicETA, getMetalScrapCeiling, STANDARD_METALS };

export default function LiveFloorMonitor({
  allocations,
  craftsmen,
  designs,
  leaves = [],
  clientShops,
  targetDate,
  onUpdateAllocation,
  onOpenEditModal,
  onOpenCarryModal,
  onNavigateTab
}) {
  // Real-time ticking clock
  const [currentRealTime, setCurrentRealTime] = useState(new Date());

  // Simulation mode: 'REAL' or custom minutes from midnight (e.g. 570 for 09:30 AM)
  const [simulationMode, setSimulationMode] = useState('REAL');
  const [simulatedMinutes, setSimulatedMinutes] = useState(690); // default 11:30 AM for demo

  // Quick filters
  const [floorStatusFilter, setFloorStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    if (targetDate) return targetDate;
    // Pick today or the latest date with orders
    if (allocations && allocations.length > 0) {
      const dates = allocations.map(a => a.date).filter(Boolean).sort().reverse();
      return dates[0] || new Date().toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    if (targetDate) {
      setSelectedDate(targetDate);
    }
  }, [targetDate]);

  // QR Kiosk & Printable Slip Modal states
  const [showQRKiosk, setShowQRKiosk] = useState(false);
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
  const [printingSlipOrder, setPrintingSlipOrder] = useState(null);
  const [scanNotification, setScanNotification] = useState(null);
  const [highlightedBenchId, setHighlightedBenchId] = useState(null);
  const toastTimerRef = useRef(null);
  const floorLockoutsRef = useRef({});

  // 30-second Anti-Flap Lockout Protection for live floor scans with sessionStorage persistence
  const getFloorLockoutState = (item) => {
    if (!item) return { locked: false, remainingSec: 0 };
    const keys = [item.craftsmanId, item.workOrder, item.id, item._id]
      .filter(Boolean)
      .map(k => String(k).toUpperCase());
    const nowMs = Date.now();
    for (const k of keys) {
      let entry = floorLockoutsRef.current[k];
      if (!entry) {
        try {
          const raw = sessionStorage.getItem(`ashadi_lock_${k}`);
          if (raw) entry = JSON.parse(raw);
        } catch (e) {}
      }
      if (entry && (nowMs - entry.time) < 30000) {
        return { locked: true, remainingSec: Math.ceil((30000 - (nowMs - entry.time)) / 1000) };
      }
    }
    return { locked: false, remainingSec: 0 };
  };

  const recordFloorLockout = (item, action) => {
    if (!item) return;
    const keys = [item.craftsmanId, item.workOrder, item.id, item._id]
      .filter(Boolean)
      .map(k => String(k).toUpperCase());
    const nowMs = Date.now();
    for (const k of keys) {
      floorLockoutsRef.current[k] = { action, time: nowMs };
      try {
        sessionStorage.setItem(`ashadi_lock_${k}`, JSON.stringify({ action, time: nowMs }));
      } catch (e) {}
    }
  };

  // Trigger floating 3.8s Shop Floor QR scan notification toast & card pulse
  const triggerScanNotification = (notif) => {
    if (!notif) return;
    setScanNotification(notif);
    const targetBenchId = notif.craftsmanId || notif.allocationId || notif.workOrder;
    setHighlightedBenchId(targetBenchId);

    // Play subtle audio chime if browser allows
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(notif.actionColor === '#f59e0b' ? 587.33 : 880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.22);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.22);
    } catch (e) {}

    // Auto-scroll the bench card into view smoothly
    setTimeout(() => {
      const el = document.getElementById(`bench-card-${notif.craftsmanId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);

    // Auto-dismiss after 3.8 seconds
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setScanNotification(null);
      setHighlightedBenchId(null);
    }, 3800);
  };

  // Listen to remote scan events (e.g. craftsman scanning on Phone or Kiosk) and Dashboard Bench clicks
  useEffect(() => {
    const handleRemoteScanEvent = (e) => {
      if (e.detail) {
        triggerScanNotification(e.detail);
      }
    };

    const handleHighlightBench = (e) => {
      if (e.detail && e.detail.craftsmanId) {
        if (e.detail.date) {
          setSelectedDate(e.detail.date);
        }
        setFloorStatusFilter('ALL'); // Reset filter to ensure the target bench is visible
        setHighlightedBenchId(e.detail.craftsmanId);
        setTimeout(() => {
          const el = document.getElementById(`bench-card-${e.detail.craftsmanId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 180);
        setTimeout(() => setHighlightedBenchId(null), 4500);
      }
    };

    window.addEventListener('ashadi:floor_scan_event', handleRemoteScanEvent);
    window.addEventListener('ashadi:highlight_bench', handleHighlightBench);
    return () => {
      window.removeEventListener('ashadi:floor_scan_event', handleRemoteScanEvent);
      window.removeEventListener('ashadi:highlight_bench', handleHighlightBench);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Modal for Quick Vault Check-In / Completion
  const [completingAlloc, setCompletingAlloc] = useState(null);
  const [vaultActualHours, setVaultActualHours] = useState('');
  const [vaultGoldReturned, setVaultGoldReturned] = useState('');
  const [vaultCompletedQty, setVaultCompletedQty] = useState(1);

  // Tick clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentRealTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Process instant background scan from barcode gun while viewing the main screen
  const processLiveScan = (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) return;

    // Strict Ashadi QR / Barcode Filter: Reject external codes
    const isAshadiCode = 
      trimmed.startsWith('ACTION:') ||
      /WO-[a-zA-Z0-9_-]+/i.test(trimmed) ||
      /AL-[0-9]+/i.test(trimmed) ||
      /^C0\d\d$/i.test(trimmed) ||
      trimmed.includes('ASHADI') ||
      /Order:\s*[a-zA-Z0-9_-]+/i.test(trimmed);

    if (!isAshadiCode) {
      // Discard any external / non-Ashadi barcodes or QR codes completely
      return;
    }

    let targetCode = trimmed;
    const woMatch = trimmed.match(/ORDER ID:\s*([^\n\r]+)/i) || 
                    trimmed.match(/Order:\s*([a-zA-Z0-9_-]+)/i) ||
                    trimmed.match(/wo=([a-zA-Z0-9_-]+)/i) || 
                    trimmed.match(/(WO-[a-zA-Z0-9_-]+)/i) ||
                    trimmed.match(/(AL-[0-9]+)/i);
    if (woMatch && woMatch[1]) {
      targetCode = woMatch[1].trim();
    }
    const targetUpper = targetCode.toUpperCase();

    // Strict exact matching in allocations (No loose substring inclusions)
    let found = (allocations || []).find(a => 
      (a.workOrder && a.workOrder.toUpperCase() === targetUpper) ||
      (a.id && String(a.id).toUpperCase() === targetUpper) ||
      (a._id && String(a._id).toUpperCase() === targetUpper)
    );

    if (!found && /^C0\d\d$/i.test(targetCode)) {
      found = (allocations || []).find(a => 
        a.craftsmanId && a.craftsmanId.toUpperCase() === targetUpper && a.status !== 'Completed'
      ) || (allocations || []).find(a => 
        a.craftsmanId && a.craftsmanId.toUpperCase() === targetUpper
      );
    }

    if (found && onUpdateAllocation) {
      const isCompleted = found.status === 'Completed' || (found.actualHours !== null && found.actualHours !== undefined && found.actualHours !== '');
      if (isCompleted) return;

      const lockout = getFloorLockoutState(found);
      if (lockout.locked) {
        // Prevent accidental rapid toggling / double-bounce
        return;
      }

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const formattedNow = formatMinutesToTime(now.getHours() * 60 + now.getMinutes());
      const nowMin = now.getHours() * 60 + now.getMinutes();

      let updated = { ...found };
      let actionTitle = '';
      let actionIcon = '⚡';
      let actionColor = '#38bdf8';

      const isPaused = found.status && found.status.includes('Paused');

      if (!found.dispatchTime || found.status === 'Standby') {
        updated.dispatchTime = timeStr;
        updated.status = 'In Progress';
        actionTitle = 'Started Morning Bench';
        actionIcon = '▶';
        actionColor = '#4ade80';
      } else if (isPaused) {
        updated.status = 'In Progress';
        actionTitle = 'Resumed Bench Work';
        actionIcon = '▶';
        actionColor = '#4ade80';
      } else {
        // Pause logic based on shift clock
        if (nowMin >= 8 * 60 + 15 && nowMin <= 9 * 60 + 15) {
          updated.status = 'Paused (Breakfast Break)';
          actionTitle = 'Paused for Breakfast';
          actionIcon = '🥣';
          actionColor = '#f59e0b';
        } else if (nowMin >= 12 * 60 + 30 && nowMin <= 14 * 60 + 30) {
          updated.status = 'Paused (Lunch Interval)';
          actionTitle = 'Paused for Plant Lunch';
          actionIcon = '🍱';
          actionColor = '#f59e0b';
        } else if (nowMin >= 19 * 60 && nowMin <= 20 * 60 + 15) {
          updated.status = 'Paused (Dinner Interval)';
          actionTitle = 'Paused for Night Dinner';
          actionIcon = '🍛';
          actionColor = '#f59e0b';
        } else {
          updated.status = 'Paused (Tea Break)';
          actionTitle = 'Paused for Tea Break';
          actionIcon = '☕';
          actionColor = '#f59e0b';
        }
      }

      // Optimistically update in memory and record 20s anti-flap lockout
      found.status = updated.status;
      found.dispatchTime = updated.dispatchTime;
      recordFloorLockout(found, updated.status);

      onUpdateAllocation(found.id || found._id, updated);
      triggerScanNotification({
        craftsmanName: found.craftsmanName,
        craftsmanId: found.craftsmanId,
        skillTier: found.skillTier,
        workOrder: found.workOrder,
        designName: found.designName || found.designCode,
        actionTitle,
        actionIcon,
        actionColor,
        timeStr: formattedNow,
        allocationId: found.id || found._id,
        source: 'BARCODE_GUN'
      });
    }
  };

  // Global Keydown Listener for Wireless USB Barcode Guns (No popup required!)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalScanKeyDown = (e) => {
      // Don't intercept if user is typing in search bar or date input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      // Don't intercept if ShopFloorQRScannerModal or any luxury modal is open
      if (document.querySelector('.modal-backdrop-luxury')) return;

      const now = Date.now();
      if (now - lastKeyTime > 200) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        const code = buffer.trim();
        buffer = '';
        if (code.length >= 3) {
          processLiveScan(code);
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalScanKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalScanKeyDown);
  }, [allocations, onUpdateAllocation]);

  // Determine active floor time in minutes from midnight
  const effectiveMinuteOfDay = simulationMode === 'REAL'
    ? (currentRealTime.getHours() * 60 + currentRealTime.getMinutes())
    : simulatedMinutes;

  const activeBreak = getActiveBreak(effectiveMinuteOfDay);
  const isShiftActive = effectiveMinuteOfDay >= 7 * 60 && effectiveMinuteOfDay < 20 * 60; // 07:00 AM - 08:00 PM (13.0-Hour Factory Span)
  const isNightShift = effectiveMinuteOfDay >= 20 * 60; // 08:00 PM onwards (Night Work & Overtime)

  // Filter allocations for selected floor shift date
  const dayAllocations = (allocations || []).filter(a => a.date === selectedDate);
  const activeDayLeaves = (leaves || []).filter(l => l.date === selectedDate);

  // Compute live ETA and metrics for each active bench allocation
  const activeOrdersEnriched = dayAllocations.map((a, index) => {
    // Default dispatch time: 08:00 AM staggered by bench index if not specified
    const defaultStartMin = 7 * 60 + Math.min(30, (index % 10) * 3); // staggered 7:00 - 7:30 AM
    const startMinutes = a.dispatchTime ? timeStringToMinutes(a.dispatchTime, defaultStartMin) : defaultStartMin;
    const startTimeStr = formatMinutesToTime(startMinutes);

    const budgetedSMT = a.budgetedSMT || (a.assumedHours ? a.assumedHours * 60 : 240);
    const etaData = calculateDynamicETA(startMinutes, budgetedSMT, a.skillTier || 'Grade B');

    // Calculate elapsed working time vs breaks
    const totalElapsedWallClock = Math.max(0, effectiveMinuteOfDay - startMinutes);

    // Calculate actual working minutes passed (excluding scheduled breaks)
    let elapsedWorkingMins = 0;
    for (let m = startMinutes; m < effectiveMinuteOfDay; m++) {
      if (!FACTORY_BREAKS.some(b => m >= b.start && m < b.end)) {
        elapsedWorkingMins += 1;
      }
    }

    const progressPct = Math.min(100, Math.max(0, Math.round((elapsedWorkingMins / etaData.requiredWorkMinutes) * 100)));
    const remainingWorkMinutes = Math.max(0, etaData.requiredWorkMinutes - elapsedWorkingMins);

    // Determine Live Status
    let liveStatus = 'ON_TRACK';
    let statusLabel = 'On Track';
    let statusColor = '#10b981'; // Green
    let statusBg = 'rgba(16, 185, 129, 0.15)';
    let statusBorder = 'rgba(16, 185, 129, 0.4)';

    const isCompleted = a.status === 'Completed' || (a.actualHours !== null && a.actualHours !== undefined && a.actualHours !== '');

    if (isCompleted) {
      liveStatus = 'COMPLETED';
      statusLabel = 'Completed & Vaulted';
      statusColor = '#38bdf8';
      statusBg = 'rgba(56, 189, 248, 0.15)';
      statusBorder = 'rgba(56, 189, 248, 0.45)';
    } else if (a.status && (a.status === 'Paused' || a.status.includes('Paused'))) {
      liveStatus = 'PAUSED';
      statusLabel = a.status.startsWith('Paused') ? `☕ ${a.status}` : a.status;
      statusColor = '#f59e0b';
      statusBg = 'rgba(245, 158, 11, 0.2)';
      statusBorder = 'rgba(245, 158, 11, 0.55)';
    } else if (activeBreak) {
      // Craftsman is actively finishing a delicate operation (soldering/stone setting) through the break window
      liveStatus = 'ON_TRACK';
      statusLabel = `⚡ Working at Bench (${activeBreak.name} Window)`;
      statusColor = '#38bdf8';
      statusBg = 'rgba(56, 189, 248, 0.18)';
      statusBorder = 'rgba(56, 189, 248, 0.45)';
    } else if (effectiveMinuteOfDay >= 20 * 60 && !isCompleted && a.status !== 'Paused') {
      const otMins = effectiveMinuteOfDay - 20 * 60;
      liveStatus = 'NIGHT_OT';
      statusLabel = `🌙 Night OT (+${Math.floor(otMins / 60)}h ${otMins % 60}m)`;
      statusColor = '#c084fc';
      statusBg = 'rgba(168, 85, 247, 0.2)';
      statusBorder = 'rgba(168, 85, 247, 0.5)';
    } else if (effectiveMinuteOfDay > etaData.targetETAMinutes) {
      const overdueMins = effectiveMinuteOfDay - etaData.targetETAMinutes;
      liveStatus = 'OVERDUE';
      statusLabel = `Overdue (+${overdueMins}m)`;
      statusColor = '#ff2e56'; // Fiery Neon Alert Red
      statusBg = 'rgba(255, 46, 86, 0.22)';
      statusBorder = '1.5px solid #ff2e56';
    } else if (totalElapsedWallClock > (etaData.targetETAMinutes - startMinutes) * 0.82 && progressPct < 70) {
      liveStatus = 'AT_RISK';
      statusLabel = 'Pace Lagging (Slow)';
      statusColor = '#f97316'; // Warning Tangerine Orange
      statusBg = 'rgba(249, 115, 22, 0.18)';
      statusBorder = '1.5px solid #f97316';
    }

    return {
      ...a,
      startMinutes,
      startTimeStr,
      budgetedSMT,
      etaData,
      totalElapsedWallClock,
      elapsedWorkingMins,
      progressPct: isCompleted ? 100 : progressPct,
      remainingWorkMinutes: isCompleted ? 0 : remainingWorkMinutes,
      liveStatus,
      statusLabel,
      statusColor,
      statusBg,
      statusBorder,
      isCompleted
    };
  });

  // Track craftsmen who have an allocation today
  const orderCraftsmanIds = new Set(dayAllocations.map(a => (a.craftsmanId || '').toLowerCase()));

  // For craftsmen on the roster without an active order today (Standby or Leave)
  const idleOrLeaveBenches = (craftsmen || []).slice(0, 63)
    .filter(c => !orderCraftsmanIds.has((c.id || '').toLowerCase()))
    .map(c => {
      const leave = activeDayLeaves.find(l => l.craftsmanId && l.craftsmanId.toLowerCase() === c.id.toLowerCase());
      if (leave) {
        return {
          id: `leave-${c.id}-${selectedDate}`,
          craftsmanId: c.id,
          craftsmanName: c.name,
          skillTier: c.skillTier || 'Grade B',
          isLeave: true,
          leaveType: leave.leaveType || 'Approved Leave',
          leaveReason: leave.reason || 'Medical / Personal Leave',
          hoursDeducted: leave.hoursDeducted || 13.0,
          liveStatus: 'LEAVE',
          statusLabel: 'On Leave',
          statusColor: '#f43f5e',
          statusBg: 'rgba(244, 63, 94, 0.16)',
          statusBorder: '1.5px solid rgba(244, 63, 94, 0.55)',
          isCompleted: false
        };
      }
      return {
        id: `standby-${c.id}-${selectedDate}`,
        craftsmanId: c.id,
        craftsmanName: c.name,
        skillTier: c.skillTier || 'Grade B',
        isStandby: true,
        liveStatus: 'STANDBY',
        statusLabel: 'Standby (Idle)',
        statusColor: '#94a3b8',
        statusBg: 'rgba(148, 163, 184, 0.1)',
        statusBorder: 'rgba(255, 255, 255, 0.12)',
        isCompleted: false
      };
    });

  // Sort all benches sequentially by Bench ID (C001, C002, ..., C063)
  const enrichedFloorOrders = [...activeOrdersEnriched, ...idleOrLeaveBenches].sort((a, b) => {
    const idA = a.craftsmanId || a.id || '';
    const idB = b.craftsmanId || b.id || '';
    return idA.localeCompare(idB, undefined, { numeric: true });
  });

  // Apply filters
  const filteredFloorOrders = enrichedFloorOrders.filter(item => {
    // Status filter
    if (floorStatusFilter === 'ACTIVE' && (item.isCompleted || item.liveStatus === 'PAUSED' || item.isLeave || item.isStandby)) return false;
    if (floorStatusFilter === 'ON_TRACK' && item.liveStatus !== 'ON_TRACK') return false;
    if (floorStatusFilter === 'PAUSED' && item.liveStatus !== 'PAUSED') return false;
    if (floorStatusFilter === 'AT_RISK' && item.liveStatus !== 'AT_RISK') return false;
    if (floorStatusFilter === 'OVERDUE' && item.liveStatus !== 'OVERDUE') return false;
    if (floorStatusFilter === 'COMPLETED' && !item.isCompleted) return false;
    if (floorStatusFilter === 'STANDBY' && !item.isStandby) return false;
    if (floorStatusFilter === 'LEAVE' && !item.isLeave) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.craftsmanName || '').toLowerCase().includes(q);
      const matchBench = (item.craftsmanId || '').toLowerCase().includes(q);
      const matchWO = (item.workOrder || '').toLowerCase().includes(q);
      const matchDesign = (item.designCode || '').toLowerCase().includes(q) || 
        (item.designName || '').toLowerCase().includes(q) ||
        (item.suiteName || '').toLowerCase().includes(q) ||
        (item.items && item.items.some(it => (it.designCode || '').toLowerCase().includes(q) || (it.designName || '').toLowerCase().includes(q)));
      const matchClient = (item.channelName || '').toLowerCase().includes(q);
      const matchReason = (item.leaveReason || '').toLowerCase().includes(q);
      return matchName || matchBench || matchWO || matchDesign || matchClient || matchReason;
    }
    return true;
  });

  // KPI calculations
  const totalBenches = enrichedFloorOrders.length;
  const completedCount = enrichedFloorOrders.filter(o => o.isCompleted).length;
  const onTrackCount = enrichedFloorOrders.filter(o => o.liveStatus === 'ON_TRACK').length;
  const pausedCount = enrichedFloorOrders.filter(o => o.liveStatus === 'PAUSED').length;
  const atRiskCount = enrichedFloorOrders.filter(o => o.liveStatus === 'AT_RISK').length;
  const overdueCount = enrichedFloorOrders.filter(o => o.liveStatus === 'OVERDUE').length;
  const activeCount = enrichedFloorOrders.filter(o => !o.isCompleted && !o.isLeave && !o.isStandby).length;
  const standbyCount = enrichedFloorOrders.filter(o => o.isStandby).length;
  const leaveCount = enrichedFloorOrders.filter(o => o.isLeave).length;

  // Handle Quick Check-In / Vault Modal Submission
  const handleConfirmVaultReturn = (e) => {
    e.preventDefault();
    if (!completingAlloc || !onUpdateAllocation) return;

    const actualHoursNum = parseFloat(vaultActualHours);
    const returnedGramsNum = vaultGoldReturned ? parseFloat(vaultGoldReturned) : null;
    const completedQtyNum = parseInt(vaultCompletedQty, 10) || completingAlloc.qtyAllocated || 1;

    let scrapLoss = null;
    if (completingAlloc.goldIssuedGrams && returnedGramsNum && completingAlloc.goldIssuedGrams > 0) {
      scrapLoss = parseFloat((((completingAlloc.goldIssuedGrams - returnedGramsNum) / completingAlloc.goldIssuedGrams) * 100).toFixed(2));
    }

    const assumed = completingAlloc.assumedHours || (completingAlloc.budgetedSMT / 60);
    const varianceHours = actualHoursNum ? parseFloat((actualHoursNum - assumed).toFixed(2)) : 0;
    const variancePct = assumed > 0 ? parseFloat(((varianceHours / assumed) * 100).toFixed(1)) : 0;

    const targetId = completingAlloc.id || completingAlloc._id;
    onUpdateAllocation(targetId, {
      ...completingAlloc,
      actualHours: actualHoursNum,
      goldReturnedGrams: returnedGramsNum,
      qtyAllocated: completedQtyNum,
      goldLossPct: scrapLoss,
      varianceHours,
      variancePct,
      status: 'Completed'
    });

    setCompletingAlloc(null);
    setVaultActualHours('');
    setVaultGoldReturned('');
  };

  // Quick pause / resume bench toggle
  const handleTogglePause = (order) => {
    if (!onUpdateAllocation) return;
    const isCurrentlyPaused = order.liveStatus === 'PAUSED' || (order.status && (order.status === 'Paused' || order.status.includes('Paused')));
    const newStatus = isCurrentlyPaused ? 'In Progress' : 'Paused';
    const targetId = order.id || order._id;
    onUpdateAllocation(targetId, {
      ...order,
      status: newStatus
    });
  };

  return (
    <div>
      {/* Top Floor Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        borderRadius: '14px',
        padding: '20px 24px',
        marginBottom: '20px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
                padding: '3px 9px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '900',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }}></span>
                REAL-TIME MONITOR
              </div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#4ade80',
                padding: '3px 9px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Automatic multi-device synchronization active (Phone Kiosk <-> Laptop Live Monitor auto-updates every 3.5s)"
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                <span>☁️ Live Cloud Sync (3.5s)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQRKiosk(true)}
                className="btn-gold-primary"
                style={{ fontSize: '11px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                title="Open Floor Kiosk Scanner for craftsmen without computers"
              >
                <QrCode size={13} />
                <span>📷 Floor QR Kiosk</span>
              </button>
              <button
                type="button"
                onClick={() => setShowBatchPrintModal(true)}
                className="btn-ghost-secondary"
                style={{ fontSize: '11px', padding: '3px 10px', borderColor: 'rgba(52, 211, 153, 0.5)', color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                title="Batch print all dispatched bench QR slips for this shift (4 per A4 sheet with cut lines)"
              >
                <Printer size={13} color="#34d399" />
                <span>🖨️ Batch Print Slips (4 / A4)</span>
              </button>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fef08a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="#d4af37" />
                Live Shop Floor Tracker & Dynamic ETA Countdown
              </h1>
            </div>
            <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: '1.5' }}>
              Precision SMT-driven countdown predicting exact completion times per bench, factoring in craftsman skill tier and plant tea/lunch breaks.
            </p>
          </div>

          {/* Plant Clock & Simulation Controls */}
          <div style={{
            background: 'rgba(10, 17, 40, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '10px',
            padding: '12px 18px',
            textAlign: 'right',
            minWidth: '280px'
          }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Factory Floor Time (13-Hour Shift)
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#38bdf8', fontFamily: 'monospace' }}>
              {formatMinutesToTime(effectiveMinuteOfDay)}
              {simulationMode !== 'REAL' && <span style={{ fontSize: '11px', color: '#f59e0b', marginLeft: '6px' }}>(Simulated)</span>}
            </div>
            <div style={{ fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
              {activeBreak ? (
                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                  ☕ {activeBreak.name} Active ({formatMinutesToTime(activeBreak.start)} - {formatMinutesToTime(activeBreak.end)})
                </span>
              ) : isNightShift ? (
                <span style={{ color: '#c084fc', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🌙 Night Work & Overtime Active (Post-8:00 PM Bench Window)
                </span>
              ) : isShiftActive ? (
                <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                  🟢 Standard Shift Active (07:00 AM – 08:00 PM Window)
                </span>
              ) : (
                <span style={{ color: '#94a3b8' }}>
                  🌌 Early Morning Standby (Pre-07:00 AM)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Shift Simulation Slider / Quick Presets */}
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
            <Sliders size={14} color="#d4af37" />
            <span style={{ fontWeight: 'bold', color: '#fef08a' }}>Shift Simulation Mode:</span>
            <span style={{ color: '#94a3b8', fontSize: '11px' }}>(Jump to any shift window to test ETA countdowns & break triggers)</span>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSimulationMode('REAL')}
              className="btn-ghost-secondary"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderColor: simulationMode === 'REAL' ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                background: simulationMode === 'REAL' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: simulationMode === 'REAL' ? '#38bdf8' : '#94a3b8',
                fontWeight: simulationMode === 'REAL' ? 'bold' : 'normal'
              }}
            >
              🔴 Live Clock
            </button>
            <button
              onClick={() => { setSimulationMode('SIMULATED'); setSimulatedMinutes(7 * 60 + 15); }}
              className="btn-ghost-secondary"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderColor: simulationMode === 'SIMULATED' && simulatedMinutes === 435 ? '#d4af37' : 'rgba(255, 255, 255, 0.1)',
                background: simulationMode === 'SIMULATED' && simulatedMinutes === 435 ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                color: simulationMode === 'SIMULATED' && simulatedMinutes === 435 ? '#fef08a' : '#cbd5e1'
              }}
            >
              🌅 07:15 AM (Shift Start)
            </button>
            <button
              onClick={() => { setSimulationMode('SIMULATED'); setSimulatedMinutes(8 * 60 + 40); }}
              className="btn-ghost-secondary"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderColor: simulationMode === 'SIMULATED' && simulatedMinutes === 520 ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)',
                background: simulationMode === 'SIMULATED' && simulatedMinutes === 520 ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
                color: simulationMode === 'SIMULATED' && simulatedMinutes === 520 ? '#fbbf24' : '#cbd5e1'
              }}
            >
              🥣 08:40 AM (Breakfast)
            </button>
            <button
              onClick={() => { setSimulationMode('SIMULATED'); setSimulatedMinutes(9 * 60 + 30); }}
              className="btn-ghost-secondary"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderColor: simulationMode === 'SIMULATED' && simulatedMinutes === 570 ? '#d4af37' : 'rgba(255, 255, 255, 0.1)',
                background: simulationMode === 'SIMULATED' && simulatedMinutes === 570 ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                color: simulationMode === 'SIMULATED' && simulatedMinutes === 570 ? '#fef08a' : '#cbd5e1'
              }}
            >
              🔨 09:30 AM (Morning Bench)
            </button>
            <button
              onClick={() => { setSimulationMode('SIMULATED'); setSimulatedMinutes(10 * 60 + 35); }}
              className="btn-ghost-secondary"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderColor: simulationMode === 'SIMULATED' && simulatedMinutes === 635 ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)',
                background: simulationMode === 'SIMULATED' && simulatedMinutes === 635 ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
                color: simulationMode === 'SIMULATED' && simulatedMinutes === 635 ? '#fbbf24' : '#cbd5e1'
              }}
            >
              ☕ 10:35 AM (Tea Break)
            </button>
            <button
              onClick={() => { setSimulationMode('SIMULATED'); setSimulatedMinutes(13 * 60 + 15); }}
              className="btn-ghost-secondary"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderColor: simulationMode === 'SIMULATED' && simulatedMinutes === 795 ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)',
                background: simulationMode === 'SIMULATED' && simulatedMinutes === 795 ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
                color: simulationMode === 'SIMULATED' && simulatedMinutes === 795 ? '#fbbf24' : '#cbd5e1'
              }}
            >
              🍱 01:15 PM (Lunch)
            </button>
            <button
              onClick={() => { setSimulationMode('SIMULATED'); setSimulatedMinutes(14 * 60 + 45); }}
              className="btn-ghost-secondary"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderColor: simulationMode === 'SIMULATED' && simulatedMinutes === 885 ? '#d4af37' : 'rgba(255, 255, 255, 0.1)',
                background: simulationMode === 'SIMULATED' && simulatedMinutes === 885 ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                color: simulationMode === 'SIMULATED' && simulatedMinutes === 885 ? '#fef08a' : '#cbd5e1'
              }}
            >
              ⚡ 02:45 PM (Afternoon)
            </button>
            <button
              onClick={() => { setSimulationMode('SIMULATED'); setSimulatedMinutes(19 * 60 + 30); }}
              className="btn-ghost-secondary"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderColor: simulationMode === 'SIMULATED' && simulatedMinutes === 1170 ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)',
                background: simulationMode === 'SIMULATED' && simulatedMinutes === 1170 ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
                color: simulationMode === 'SIMULATED' && simulatedMinutes === 1170 ? '#fde047' : '#cbd5e1'
              }}
            >
              🍛 07:30 PM (Night Dinner)
            </button>
            <button
              onClick={() => { setSimulationMode('SIMULATED'); setSimulatedMinutes(21 * 60 + 15); }}
              className="btn-ghost-secondary"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderColor: simulationMode === 'SIMULATED' && simulatedMinutes === 1275 ? '#c084fc' : 'rgba(255, 255, 255, 0.1)',
                background: simulationMode === 'SIMULATED' && simulatedMinutes === 1275 ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                color: simulationMode === 'SIMULATED' && simulatedMinutes === 1275 ? '#e9d5ff' : '#cbd5e1'
              }}
            >
              🌙 09:15 PM (Night Work / OT)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Dispatched Benches</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px' }}>{totalBenches}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{activeCount} active in progress</div>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 'bold' }}>🟢 On Track (Pacing Well)</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80', marginTop: '4px' }}>{onTrackCount}</div>
          <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: '2px' }}>ETA on or ahead of budget</div>
        </div>

        <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#fde047', textTransform: 'uppercase', fontWeight: 'bold' }}>🟡 Pace at Risk (Lagging)</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24', marginTop: '4px' }}>{atRiskCount}</div>
          <div style={{ fontSize: '11px', color: '#fef08a', marginTop: '2px' }}>High bench time spent</div>
        </div>

        <div style={{ background: 'rgba(255, 46, 86, 0.08)', border: '1px solid rgba(255, 46, 86, 0.35)', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#fda4af', textTransform: 'uppercase', fontWeight: 'bold' }}>🚨 Critical Overdue</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff2e56', marginTop: '4px' }}>{overdueCount}</div>
          <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '2px' }}>Past target ETA ceiling</div>
        </div>

        <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#7dd3fc', textTransform: 'uppercase', fontWeight: 'bold' }}>✅ Completed & Vaulted</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', marginTop: '4px' }}>{completedCount}</div>
          <div style={{ fontSize: '11px', color: '#bae6fd', marginTop: '2px' }}>Scrap & hours recorded</div>
        </div>
      </div>

      {/* Date & Filter Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={15} color="#d4af37" />
          <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold' }}>Shift Date:</span>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', color: '#fef08a', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '6px' }}
          />
          <button
            type="button"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            style={{
              padding: '4px 9px',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '6px',
              cursor: 'pointer',
              border: selectedDate === new Date().toISOString().split('T')[0] ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)',
              background: selectedDate === new Date().toISOString().split('T')[0] ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              color: selectedDate === new Date().toISOString().split('T')[0] ? '#4ade80' : '#cbd5e1'
            }}
            title="Switch to Today's Live Date"
          >
            📅 Today (Live)
          </button>
        </div>

        {/* Search Box */}
        <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '340px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text"
            placeholder="Search bench, craftsman, work order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '32px', height: '32px', fontSize: '12px' }}
          />
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All (${enrichedFloorOrders.length})` },
            { id: 'ACTIVE', label: `Active (${activeCount})` },
            { id: 'ON_TRACK', label: `🟢 On Track (${onTrackCount})` },
            { id: 'PAUSED', label: `☕ On Break (${pausedCount})` },
            { id: 'AT_RISK', label: `⚠️ Lagging (${atRiskCount})` },
            { id: 'OVERDUE', label: `🚨 Overdue (${overdueCount})` },
            { id: 'COMPLETED', label: `🔵 Vault Done (${completedCount})` },
            { id: 'STANDBY', label: `⚪ Standby (${standbyCount})` },
            { id: 'LEAVE', label: `🚫 On Leave (${leaveCount})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFloorStatusFilter(f.id)}
              className="btn-ghost-secondary"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderColor: floorStatusFilter === f.id ? '#d4af37' : 'rgba(255, 255, 255, 0.08)',
                color: floorStatusFilter === f.id ? '#fef08a' : '#94a3b8',
                background: floorStatusFilter === f.id ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                fontWeight: floorStatusFilter === f.id ? 'bold' : 'normal'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bench Station Grid */}
      {filteredFloorOrders.length === 0 ? (
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          color: '#94a3b8'
        }}>
          <Clock size={32} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: '#cbd5e1', fontSize: '15px', marginBottom: '6px' }}>No Active Benches Found for {selectedDate}</h3>
          <p style={{ fontSize: '12px', margin: 0 }}>
            Switch dates or click "Fast 63-Bench Batch Worksheet" in the Daily Dispatch tab to populate work orders.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {filteredFloorOrders.map(order => {
            const ceiling = getMetalScrapCeiling(order.metalType);
            const isHighlighted = highlightedBenchId && (
              highlightedBenchId === order.id || 
              highlightedBenchId === order._id || 
              highlightedBenchId === order.craftsmanId || 
              (order.workOrder && String(highlightedBenchId).includes(order.workOrder))
            );

            return (
              <div 
                key={order.id}
                id={`bench-card-${order.craftsmanId}`}
                style={{
                  background: isHighlighted ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.85)',
                  border: isHighlighted ? `2px solid ${scanNotification?.actionColor || '#38bdf8'}` : `1px solid ${order.statusBorder}`,
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isHighlighted ? `0 0 35px ${scanNotification?.actionColor ? `${scanNotification.actionColor}99` : 'rgba(56, 189, 248, 0.9)'}` : order.liveStatus === 'OVERDUE' ? '0 0 16px rgba(239, 68, 68, 0.25)' : order.liveStatus === 'PAUSED' ? '0 0 16px rgba(245, 158, 11, 0.25)' : 'none',
                  transform: isHighlighted ? 'scale(1.025)' : 'none',
                  animation: isHighlighted ? 'benchCardPulse 1.8s ease-in-out infinite' : 'none',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Status Bar Top Line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: order.statusColor
                }} />

                <div>
                  {/* Card Header: Bench & Craftsman */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                          {order.craftsmanId || 'BENCH'}
                        </span>
                        {isHighlighted && scanNotification && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '900',
                            background: scanNotification?.actionColor || '#f59e0b',
                            color: '#000000',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            letterSpacing: '0.5px'
                          }}>
                            🔴 SCANNED NOW
                          </span>
                        )}
                        {isHighlighted && !scanNotification && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '900',
                            background: '#d4af37',
                            color: '#0a0f1d',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            letterSpacing: '0.5px'
                          }}>
                            🎯 SELECTED BENCH
                          </span>
                        )}
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: order.skillTier === 'Grade A' ? 'rgba(212, 175, 55, 0.2)' : order.skillTier === 'Grade B' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                          color: order.skillTier === 'Grade A' ? '#fef08a' : order.skillTier === 'Grade B' ? '#7dd3fc' : '#cbd5e1'
                        }}>
                          {order.skillTier || 'Grade B'} {order.skillTier === 'Grade A' ? '(110% Speed)' : order.skillTier === 'Grade C' ? '(85% Speed)' : '(100% Speed)'}
                        </span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px' }}>
                        {order.craftsmanName}
                      </div>
                    </div>

                    {/* Live Status Badge */}
                    <div style={{
                      background: order.statusBg,
                      color: order.statusColor,
                      border: `1px solid ${order.statusBorder}`,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {order.liveStatus === 'OVERDUE' && <span style={{ fontSize: '13px' }}>🚨</span>}
                      {order.liveStatus === 'AT_RISK' && <span style={{ fontSize: '13px' }}>⚠️</span>}
                      {order.isLeave && <span style={{ fontSize: '13px' }}>🚫</span>}
                      {order.liveStatus === 'COMPLETED' && <CheckCircle2 size={12} />}
                      {order.liveStatus === 'ON_TRACK' && <Activity size={12} />}
                      {order.liveStatus === 'PAUSED' && <Pause size={12} />}
                      {order.statusLabel}
                    </div>
                  </div>

                  {order.isLeave ? (
                    <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fda4af' }}>
                          🚫 {order.leaveType}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                          -{order.hoursDeducted}h Deducted
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                        Reason: <strong style={{ color: '#ffffff' }}>{order.leaveReason}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#fda4af' }}>
                        Craftsman on approved leave. Bench capacity unavailable for this shift.
                      </div>
                    </div>
                  ) : order.isStandby ? (
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px dashed rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '16px', marginBottom: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
                        ⚪ Bench Standby (Idle)
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        No active work order dispatched yet for this bench on {selectedDate}.
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                        Bench is available for jewellery job allocation.
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Order & Design Details */}
                      <div style={{ background: 'rgba(10, 17, 40, 0.6)', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#d4af37', fontWeight: 'bold' }}>
                            {order.workOrder || order.id}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Qty: <strong style={{ color: '#f8fafc' }}>{order.qtyAllocated || 1} pcs</strong>
                          </span>
                        </div>

                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f1f5f9', marginBottom: '4px' }}>
                          {order.isSuite ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ 
                                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.2))', 
                                  color: '#fbbf24', 
                                  padding: '2px 8px', 
                                  borderRadius: '4px', 
                                  fontSize: '11px',
                                  border: '1px solid rgba(245, 158, 11, 0.4)',
                                  fontWeight: 'bold'
                                }}>
                                  👑 Suite ({order.qtyAllocated || 1} pcs)
                                </span>
                                <span style={{ color: '#fff' }}>{order.suiteName || 'Jewellery Suite / Set'}</span>
                              </div>
                              {order.items && order.items.length > 0 && (
                                <div style={{ fontSize: '10.5px', color: '#cbd5e1', fontWeight: 'normal', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {order.items.map((it, idx) => (
                                    <span key={idx} style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1px 5px', borderRadius: '3px' }}>
                                      <strong>{it.qty}x</strong> {it.designName || it.designCode}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            `${order.designCode} — ${order.designName}`
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8' }}>
                          <span>Metal: <strong style={{ color: '#fef08a' }}>{order.metalType || 'Gold 22K'}</strong></span>
                          <span style={{ color: '#cbd5e1' }}>Destination: <strong>{order.channelName || order.channel}</strong></span>
                        </div>
                      </div>

                      {/* Dynamic ETA & Timing Box */}
                      <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Dispatched: <strong style={{ color: '#cbd5e1' }}>{order.startTimeStr}</strong>
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: '900', color: order.statusColor }}>
                            🎯 ETA: {order.etaData.targetETATime}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                            <span style={{ color: '#94a3b8' }}>Working Progress</span>
                            <span style={{ color: order.statusColor, fontWeight: 'bold' }}>
                              {order.liveStatus === 'PAUSED' ? `${order.progressPct}% (Paused)` : `${order.progressPct}%`}
                            </span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${order.progressPct}%`,
                              background: order.liveStatus === 'OVERDUE' ? '#ef4444' : (order.liveStatus === 'AT_RISK' || order.liveStatus === 'PAUSED') ? '#f59e0b' : '#10b981',
                              transition: 'width 0.4s ease'
                            }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                          <span>SMT: {order.budgetedSMT}m ({(order.budgetedSMT / 60).toFixed(1)}h)</span>
                          <span>Breaks Offset: +{order.etaData.totalBreakMinutesEncountered}m</span>
                          <span>
                            {order.isCompleted 
                              ? 'Finished' 
                              : order.liveStatus === 'OVERDUE' 
                                ? `Overdue by ${effectiveMinuteOfDay - order.etaData.targetETAMinutes}m`
                                : `${Math.floor(order.remainingWorkMinutes / 60)}h ${order.remainingWorkMinutes % 60}m left`
                            }
                          </span>
                        </div>
                      </div>

                      {/* Gold Issued / Returned Scrap Audit */}
                      {order.goldIssuedGrams && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '4px 8px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '4px', marginBottom: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>
                            Issued: <strong style={{ color: '#fef08a' }}>{order.goldIssuedGrams}g</strong>
                          </span>
                          {order.goldReturnedGrams ? (
                            <span style={{ color: order.goldLossPct > ceiling ? '#ef4444' : '#4ade80', fontWeight: 'bold' }}>
                              Returned: {order.goldReturnedGrams}g ({order.goldLossPct}% loss • max {ceiling}%)
                            </span>
                          ) : (
                            <span style={{ color: '#38bdf8' }}>At bench (Pending vault check-in)</span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Card Action Buttons Footer */}
                <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                  {order.isLeave ? (
                    <div style={{ width: '100%', fontSize: '11px', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>🔒 Plant capacity reduced by {order.hoursDeducted}h</span>
                      <span style={{ color: '#94a3b8' }}>Shift Leave Recorded</span>
                    </div>
                  ) : order.isStandby ? (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Available for new job</span>
                      {onNavigateTab && (
                        <button 
                          type="button" 
                          className="btn-gold-primary" 
                          onClick={() => onNavigateTab('dispatch')}
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                        >
                          + Dispatch Work
                        </button>
                      )}
                    </div>
                  ) : !order.isCompleted ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setCompletingAlloc(order);
                          // Auto-suggest actual hours based on elapsed working time
                          const estActualHours = parseFloat((order.elapsedWorkingMins / 60).toFixed(1));
                          setVaultActualHours(String(estActualHours > 0 ? estActualHours : order.assumedHours || 8.0));
                          setVaultCompletedQty(order.qtyAllocated || 1);
                        }}
                        className="btn-gold-primary"
                        style={{ flex: 1, fontSize: '11px', padding: '6px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        title="Complete this order directly from the card & record returned gold"
                      >
                        <CheckCircle2 size={13} />
                        <span>Vault Check-In (Complete)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePause(order)}
                        className="btn-ghost-secondary"
                        style={{ fontSize: '11px', padding: '6px 8px' }}
                        title={(order.liveStatus === 'PAUSED' || (order.status && order.status.includes('Paused'))) ? 'Resume Bench Work' : 'Pause Bench (Meeting/Break)'}
                      >
                        {(order.liveStatus === 'PAUSED' || (order.status && order.status.includes('Paused'))) ? <Play size={13} color="#4ade80" /> : <Pause size={13} color="#fbbf24" />}
                      </button>

                      {onOpenCarryModal && (
                        <button
                          type="button"
                          onClick={() => onOpenCarryModal(order)}
                          className="btn-ghost-secondary"
                          style={{ fontSize: '11px', padding: '6px 8px' }}
                          title="Carry over remaining quantity to tomorrow"
                        >
                          <ArrowRight size={13} color="#38bdf8" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setPrintingSlipOrder(order)}
                        className="btn-ghost-secondary"
                        style={{ fontSize: '11px', padding: '6px 8px' }}
                        title="Print Craftsman Bench QR Job Card"
                      >
                        <QrCode size={13} color="#fef08a" />
                      </button>
                    </>
                  ) : (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Actual: <strong style={{ color: '#4ade80' }}>{order.actualHours} hrs</strong> (Var: {order.varianceHours > 0 ? `+${order.varianceHours}` : order.varianceHours}h)
                      </span>
                      {onOpenEditModal && (
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(order)}
                          className="btn-ghost-secondary"
                          style={{ fontSize: '10px', padding: '3px 8px' }}
                        >
                          Edit Record
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floor QR Kiosk Modal */}
      {showQRKiosk && (
        <ShopFloorQRScannerModal
          isOpen={showQRKiosk}
          onClose={() => setShowQRKiosk(false)}
          allocations={allocations}
          onUpdateAllocation={onUpdateAllocation}
        />
      )}

      {/* Printable Bench QR Slip Modal */}
      {printingSlipOrder && (
        <PrintableJobSlipModal
          isOpen={!!printingSlipOrder}
          onClose={() => setPrintingSlipOrder(null)}
          order={printingSlipOrder}
        />
      )}

      {/* Batch 4-per-A4 Print Modal */}
      {showBatchPrintModal && (
        <BatchPrintSlipsModal
          isOpen={showBatchPrintModal}
          onClose={() => setShowBatchPrintModal(false)}
          allocations={dayAllocations && dayAllocations.length > 0 ? dayAllocations : allocations}
          selectedDate={selectedDate}
        />
      )}

      {/* Quick Vault Check-In Modal */}
      {completingAlloc && (
        <div className="modal-backdrop">
          <div className="modal-luxury" style={{ maxWidth: '480px' }}>
            <div className="modal-luxury-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="#10b981" />
                <h3 className="modal-luxury-title">Vault Check-In & Bench Completion</h3>
              </div>
              <button className="modal-luxury-close" onClick={() => setCompletingAlloc(null)}>✕</button>
            </div>

            <form onSubmit={handleConfirmVaultReturn} style={{ padding: '20px' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#bae6fd' }}>
                Completing <strong>{completingAlloc.workOrder}</strong> for <strong>{completingAlloc.craftsmanName}</strong> ({completingAlloc.isSuite ? `👑 ${completingAlloc.suiteName || 'Suite'}` : completingAlloc.designCode} • {completingAlloc.metalType}).
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
                    Actual Hours Taken
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    required
                    value={vaultActualHours}
                    onChange={(e) => setVaultActualHours(e.target.value)}
                    style={{ width: '100%', fontSize: '15px', fontWeight: 'bold', color: '#4ade80' }}
                  />
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                    Assumed: {completingAlloc.assumedHours || (completingAlloc.budgetedSMT / 60).toFixed(1)} hrs
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
                    Completed Qty (Pcs)
                  </label>
                  <input 
                    type="number"
                    min="1"
                    required
                    value={vaultCompletedQty}
                    onChange={(e) => setVaultCompletedQty(e.target.value)}
                    style={{ width: '100%', fontSize: '15px', fontWeight: 'bold', color: '#fef08a' }}
                  />
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                    Dispatched: {completingAlloc.qtyAllocated || 1} pcs
                  </span>
                </div>
              </div>

              {completingAlloc.goldIssuedGrams && (
                <div style={{ marginBottom: '16px', background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#fef08a', marginBottom: '4px' }}>
                    Finished Jewellery + Scrap Returned (Grams)
                  </label>
                  <input 
                    type="number"
                    step="0.001"
                    placeholder="e.g. 24.150"
                    value={vaultGoldReturned}
                    onChange={(e) => setVaultGoldReturned(e.target.value)}
                    style={{ width: '100%', fontSize: '15px', fontWeight: 'bold', color: '#38bdf8' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px', color: '#94a3b8' }}>
                    <span>Gold Issued: {completingAlloc.goldIssuedGrams}g</span>
                    <span>Standard Ceiling: max {getMetalScrapCeiling(completingAlloc.metalType)}%</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn-ghost-secondary" onClick={() => setCompletingAlloc(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-gold-primary">
                  Confirm & Vault Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
