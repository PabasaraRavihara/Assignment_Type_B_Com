import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, Clock, TrendingUp, DollarSign, Award, Scale, AlertCircle, 
  ArrowUpRight, Activity, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, BarChart3, Layers,
  Building2, Store, Package, Crown, AlertTriangle, UserX, FileText, Calendar,
  Search, RefreshCw, Zap, Filter, Check, QrCode, Coffee, Play,
  MapPin, Phone, Coins, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../api';
import { getDailyGoldRates, formatLKR } from '../utils/goldRates';
import { 
  FACTORY_BREAKS, 
  formatMinutesToTime, 
  timeStringToMinutes, 
  calculateDynamicETA,
  formatDurationMinutes,
  calculateGoldWastageReconciliation,
  getMetalScrapCeiling,
  getDaySliceForOrder
} from '../utils/floorTiming';

export default function DashboardView({ 
  metrics, 
  loading, 
  craftsmen, 
  designs, 
  timeLogs, 
  leaves, 
  allocations = [], 
  clientShops = [],
  onNavigateTab, 
  onOpenKiosk,
  onMetricsUpdate,
  onReloadData,
  onDateChange
}) {
  const [selectedDate, setSelectedDate] = useState(() => {
    try {
      const saved = sessionStorage.getItem('ashadi_selected_date');
      if (saved) return saved;
    } catch (e) {}
    return metrics?.selectedDate || new Date().toISOString().split('T')[0];
  });
  const [dayData, setDayData] = useState(() => {
    try {
      const savedDate = sessionStorage.getItem('ashadi_selected_date');
      const cached = sessionStorage.getItem('ashadi_cached_day_metrics');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (!savedDate || parsed.selectedDate === savedDate)) {
          return parsed;
        }
      }
    } catch (e) {}
    return metrics;
  });
  const [isFetchingDate, setIsFetchingDate] = useState(false);
  const [selectedBench, setSelectedBench] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState('ALL');
  const [dailyScenario, setDailyScenario] = useState(null); // 'LOW' (350h), 'NORMAL' (400h), 'HIGH' (450h), or null (Standby / 0.0h)
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoster, setShowRoster] = useState(true);
  const [autoPopulating, setAutoPopulating] = useState(false);
  const [benchStatusFilter, setBenchStatusFilter] = useState('ALL');
  const [currentFloorTime, setCurrentFloorTime] = useState(new Date());

  // Granular Destination Sub-Breakdown States (External Shops vs Showroom Branches)
  const [channelSubTab, setChannelSubTab] = useState('EXTERNAL'); // 'EXTERNAL' | 'SHOWROOM' | 'VALUATION'
  const [isDestinationExpanded, setIsDestinationExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem('ashadi_destination_breakdown_expanded');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });
  const [extShopQuery, setExtShopQuery] = useState('');
  const [showroomQuery, setShowroomQuery] = useState('');
  const [expandedShopOrders, setExpandedShopOrders] = useState({});
  const [selectedSpecificShop, setSelectedSpecificShop] = useState('ALL');

  const toggleDestinationExpanded = () => {
    setIsDestinationExpanded(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ashadi_destination_breakdown_expanded', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Real-time workshop floor clock ticker (re-evaluates floor ETA and overdue states every 15s)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFloorTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Floor Schedule Alert Chime (Crisp & Loud Audio File with Enhanced Dual-Tone Fallback)
  const playAlertChime = (soundFile = '/sounds/chime.wav') => {
    try {
      const audio = new Audio(soundFile);
      audio.volume = 0.85; // Clear & prominent volume
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback to high-volume dual-tone Web Audio synthesizer if browser policy requires it
          playSyntheticChime();
        });
      }
    } catch (e) {
      playSyntheticChime();
    }
  };

  const playSyntheticChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      
      const playTone = (freq, startTime, duration, vol) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      // Loud, rich dual-tone chime (G5 784Hz -> C6 1046.5Hz)
      playTone(784.0, now, 0.45, 0.32);
      playTone(1046.5, now + 0.16, 0.70, 0.35);
    } catch (err) {}
  };

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

  // Sync selectedDate and dayData when mounting or when metrics updates
  useEffect(() => {
    let savedDate = null;
    try {
      savedDate = sessionStorage.getItem('ashadi_selected_date');
    } catch (e) {}

    const targetDate = savedDate || selectedDate || metrics?.selectedDate || new Date().toISOString().split('T')[0];

    if (metrics && metrics.selectedDate === targetDate) {
      setDayData(metrics);
      setSelectedDate(targetDate);
      try {
        sessionStorage.setItem('ashadi_cached_day_metrics', JSON.stringify(metrics));
      } catch (e) {}
    } else if (targetDate) {
      setSelectedDate(targetDate);
      // Fetch the actual date data to prevent stale metrics mismatch when switching tabs
      setIsFetchingDate(true);
      api.get(`/dashboard/metrics?date=${targetDate}`)
        .then(res => {
          if (res.data) {
            setDayData(res.data);
            try {
              sessionStorage.setItem('ashadi_cached_day_metrics', JSON.stringify(res.data));
            } catch (e) {}
            if (onMetricsUpdate) onMetricsUpdate(res.data);
          }
        })
        .catch(err => console.error('Failed to sync metrics for date:', err))
        .finally(() => setIsFetchingDate(false));
    }
  }, [metrics]);

  const handleDateChange = async (newDate) => {
    if (!newDate) return;
    try {
      sessionStorage.setItem('ashadi_selected_date', newDate);
      window.dispatchEvent(new CustomEvent('ashadi:date_changed', { detail: { date: newDate } }));
    } catch (e) {}
    if (onDateChange) onDateChange(newDate);
    setSelectedDate(newDate);
    setIsFetchingDate(true);
    try {
      const res = await api.get(`/dashboard/metrics?date=${newDate}`);
      if (res.data) {
        setDayData(res.data);
        try {
          sessionStorage.setItem('ashadi_cached_day_metrics', JSON.stringify(res.data));
        } catch (e) {}
        if (onMetricsUpdate) onMetricsUpdate(res.data);
      }
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
        const todayStr = new Date().toISOString().split('T')[0];
        const isPast = selectedDate < todayStr;
        await api.post('/allocations/auto-shift-populate', { date: selectedDate, markCompleted: isPast });
        if (onReloadData) await onReloadData(selectedDate);
        const res = await api.get(`/dashboard/metrics?date=${selectedDate}`);
        if (res.data) {
          setDayData(res.data);
          if (onMetricsUpdate) onMetricsUpdate(res.data);
        }
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

  // Multi-day shift hour slicing across dates (ensures 12h order splits: 9.0h today, 3.0h tomorrow)
  const liveSlicedAllocs = useMemo(() => {
    if (!allocations || allocations.length === 0) return [];
    const result = [];
    allocations.forEach(a => {
      const slice = getDaySliceForOrder(a, selectedDate);
      if (slice) {
        result.push({
          ...a,
          effectiveAssumedHours: slice.workHours,
          totalOrderAssumedHours: slice.totalOrderHours,
          isFirstDay: slice.isFirstDay,
          isRollover: slice.isRollover,
          rolloverFromDate: slice.rolloverFromDate,
          sliceStartTime: slice.startTimeStr,
          sliceEndTime: slice.endTimeStr,
          sliceTargetETA: slice.isRollover ? slice.endTimeStr : slice.eta.targetETATime,
          isMultiDay: slice.eta.isMultiDay,
          multiDayBreakdown: slice.eta.dailyBreakdown
        });
      }
    });
    return result;
  }, [allocations, selectedDate]);

  const dayAllocations = liveSlicedAllocs.length > 0 
    ? liveSlicedAllocs 
    : (dayData?.dayAllocations || []);

  const hasOrders = dayAllocations.length > 0;

  // Live sum of productive standard output hours for selectedDate
  const liveEarnedHours = useMemo(() => {
    if (!dayAllocations || dayAllocations.length === 0) return 0;
    return parseFloat(dayAllocations.reduce((acc, a) => {
      const hrs = a.effectiveAssumedHours !== undefined && a.effectiveAssumedHours !== null
        ? parseFloat(a.effectiveAssumedHours)
        : (a.assumedHours !== undefined && a.assumedHours !== null
          ? parseFloat(a.assumedHours)
          : ((a.budgetedSMT || 0) / 60));
      return acc + (isNaN(hrs) ? 0 : hrs);
    }, 0).toFixed(1));
  }, [dayAllocations]);

  // Total hours rolling over to tomorrow from multi-day orders on selectedDate
  const rolloverToTomorrowHours = useMemo(() => {
    if (!dayAllocations || dayAllocations.length === 0) return 0;
    return parseFloat(dayAllocations.reduce((acc, a) => {
      if (a.isMultiDay && a.isFirstDay && a.totalOrderAssumedHours && a.effectiveAssumedHours) {
        return acc + Math.max(0, a.totalOrderAssumedHours - a.effectiveAssumedHours);
      }
      return acc;
    }, 0).toFixed(1));
  }, [dayAllocations]);
  
  // Deduplicated leaves for selected date (one craftsman can only be on leave once per day)
  const combinedDayLeaves = [
    ...(leaves || []),
    ...(dayData?.todayLeaves || [])
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

  // Sort craftsmen sequentially by Bench ID (C001, C002, ..., C063)
  const sortedCraftsmen = useMemo(() => {
    return [...(craftsmen || [])].sort((a, b) => {
      return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
    });
  }, [craftsmen]);

  // Compute Live Bench Statuses from allocations and leaves at top-level
  const benchStatusList = useMemo(() => {
    const todayIsoStr = new Date().toISOString().split('T')[0];
    let effectiveMinuteOfDay;
    if (selectedDate === todayIsoStr) {
      effectiveMinuteOfDay = currentFloorTime.getHours() * 60 + currentFloorTime.getMinutes();
    } else if (selectedDate < todayIsoStr) {
      effectiveMinuteOfDay = 20 * 60; // End of 13-hr shift for past shift records
    } else {
      effectiveMinuteOfDay = 7 * 60; // Start of shift for future shifts
    }

    return sortedCraftsmen.slice(0, 63).map((c, benchIdx) => {
      const isAbsent = dayLeaves.some(l => 
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
      let etaData = null;

      if (alloc && alloc.dispatchTime) {
        const defaultStartMin = 7 * 60 + Math.min(30, (benchIdx % 10) * 3);
        const startMinutes = timeStringToMinutes(alloc.dispatchTime, defaultStartMin);
        const budgetedSMT = alloc.budgetedSMT || (alloc.assumedHours ? alloc.assumedHours * 60 : 240);
        etaData = calculateDynamicETA(startMinutes, budgetedSMT, c.skillTier || 'Grade B', selectedDate);
        targetETATimeStr = etaData.targetETATime;
      }

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

          let elapsedWorkingMins = 0;
          for (let m = startMinutes; m < effectiveMinuteOfDay; m++) {
            if (!FACTORY_BREAKS.some(b => m >= b.start && m < b.end)) {
              elapsedWorkingMins += 1;
            }
          }

          const calculatedProgress = etaData ? Math.min(100, Math.max(0, Math.round((elapsedWorkingMins / etaData.requiredWorkMinutes) * 100))) : 50;
          const totalElapsedWallClock = Math.max(0, effectiveMinuteOfDay - startMinutes);

          let isOverdue = false;
          let isLagging = false;

          if (etaData && !etaData.isMultiDay) {
            // Same-day job: evaluate if current floor minute has exceeded target ETA
            isOverdue = effectiveMinuteOfDay > etaData.targetETAMinutes;
            if (isOverdue) {
              overdueMins = Math.max(0, effectiveMinuteOfDay - etaData.targetETAMinutes);
            } else {
              isLagging = totalElapsedWallClock > (etaData.targetETAMinutes - startMinutes) * 0.82 && calculatedProgress < 70;
            }
          } else if (etaData && etaData.isMultiDay) {
            // Multi-day job: spans across shift windows (closes at 08:30 PM, resumes next morning at 07:00 AM)
            // On Day 0 (the dispatch day), the craftsman is working through today's shift and CANNOT be overdue!
            if (selectedDate < todayIsoStr) {
              // Viewing historical/past records: only overdue if target completion date has passed
              if (etaData.targetDate && etaData.targetDate < todayIsoStr) {
                isOverdue = true;
                overdueMins = 60;
              } else if (etaData.targetDate && etaData.targetDate === todayIsoStr) {
                const currentActualMins = currentFloorTime.getHours() * 60 + currentFloorTime.getMinutes();
                isOverdue = currentActualMins > etaData.targetETAMinutes;
                overdueMins = isOverdue ? Math.max(0, currentActualMins - etaData.targetETAMinutes) : 0;
              }
            }
            if (!isOverdue) {
              overdueMins = 0;
              isLagging = calculatedProgress < 15 && effectiveMinuteOfDay > (17 * 60);
            }
          }

          if (isOverdue) {
            status = 'OVERDUE';
            const formattedOverdue = formatDurationMinutes(overdueMins);
            statusLabel = `Overdue (+${formattedOverdue})`;
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
            statusLabel = etaData.isMultiDay ? 'Multi-Day Shift (On Track)' : 'Active Working (On Track)';
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
        etaData,
        displayName
      };
    });
  }, [sortedCraftsmen, dayLeaves, dayAllocations, selectedDate, currentFloorTime]);

  const benchCounts = useMemo(() => ({
    TOTAL: benchStatusList.length,
    WORKING: benchStatusList.filter(b => b.status === 'WORKING').length,
    OVERDUE: benchStatusList.filter(b => b.status === 'OVERDUE').length,
    LAGGING: benchStatusList.filter(b => b.status === 'LAGGING').length,
    PAUSED: benchStatusList.filter(b => b.status === 'PAUSED').length,
    COMPLETED: benchStatusList.filter(b => b.status === 'COMPLETED').length,
    STANDBY: benchStatusList.filter(b => b.status === 'STANDBY').length,
    ABSENT: benchStatusList.filter(b => b.status === 'ABSENT').length
  }), [benchStatusList]);

  // Granular Destination Sub-Breakdown for External Partner Shops & Ashadi Showrooms
  const { externalShopsBreakdown, showroomsBreakdown, totalGoldValuationLKR, totalDayGoldGrams } = useMemo(() => {
    const goldRates = getDailyGoldRates();
    const rate22KPerGram = goldRates?.rates?.['Gold 22K']?.perGram || 39531.25;

    const extMap = new Map();
    const showroomMap = new Map();
    let totalGold = 0;

    (dayAllocations || []).forEach(alloc => {
      const goldIssued = parseFloat(alloc.goldIssuedGrams) || 0;
      totalGold += goldIssued;

      const matchedCraftsman = (craftsmen || []).find(c => c.id === alloc.craftsmanId);
      const craftsmanDisplayName = matchedCraftsman?.name || alloc.craftsmanName || alloc.craftsmanId;
      const hours = parseFloat(alloc.assumedHours) || (alloc.budgetedSMT ? alloc.budgetedSMT / 60 : 0);
      const rate = alloc.skillTier === 'Grade A' ? 11.50 : alloc.skillTier === 'Grade B' ? 9.50 : 7.50;
      const labourValue = (alloc.budgetedSMT || (alloc.unitSMT * (alloc.qtyAllocated || 1)) || (hours * 60)) * rate;

      if (alloc.channel === 'EXTERNAL_SHOP') {
        const rawName = (alloc.channelName || 'External Retail Jeweller').trim();
        if (!extMap.has(rawName)) {
          const foundShop = (clientShops || []).find(s => 
            s.name?.toLowerCase() === rawName.toLowerCase() ||
            rawName.toLowerCase().includes(s.name?.toLowerCase() || '___')
          );

          extMap.set(rawName, {
            name: rawName,
            location: foundShop?.location || 'Registered B2B Partner',
            contactPerson: foundShop?.contactPerson || 'Store Manager',
            phone: foundShop?.phone || '+94 (Colombo Wholesale)',
            agreedLossPct: foundShop?.agreedLossPct || 3.5,
            billingModel: foundShop?.billingModel || 'Contract SMT + 3.5% Loss',
            orders: [],
            piecesCount: 0,
            allocatedHours: 0,
            goldIssuedGrams: 0,
            goldReturnedGrams: 0,
            labourValueRs: 0,
            benchesMap: new Map(),
            lossPcts: []
          });
        }

        const s = extMap.get(rawName);
        s.orders.push(alloc);
        s.piecesCount += alloc.qtyAllocated || 1;
        s.allocatedHours += hours;
        s.goldIssuedGrams += goldIssued;
        if (alloc.goldReturnedGrams) s.goldReturnedGrams += parseFloat(alloc.goldReturnedGrams) || 0;
        if (alloc.goldLossPct !== null && alloc.goldLossPct !== undefined) s.lossPcts.push(parseFloat(alloc.goldLossPct));
        s.labourValueRs += labourValue;
        s.benchesMap.set(alloc.craftsmanId, craftsmanDisplayName);
      } else if (alloc.channel === 'OWN_SHOWROOM') {
        const rawName = (alloc.channelName || 'Ashadi Flagship Showroom').trim();
        if (!showroomMap.has(rawName)) {
          showroomMap.set(rawName, {
            name: rawName,
            orders: [],
            piecesCount: 0,
            allocatedHours: 0,
            goldIssuedGrams: 0,
            labourValueRs: 0,
            benchesMap: new Map()
          });
        }

        const sr = showroomMap.get(rawName);
        sr.orders.push(alloc);
        sr.piecesCount += alloc.qtyAllocated || 1;
        sr.allocatedHours += hours;
        sr.goldIssuedGrams += goldIssued;
        sr.labourValueRs += labourValue;
        sr.benchesMap.set(alloc.craftsmanId, craftsmanDisplayName);
      }
    });

    const extList = Array.from(extMap.values()).map(s => {
      const avgLoss = s.lossPcts.length > 0
        ? parseFloat((s.lossPcts.reduce((a, b) => a + b, 0) / s.lossPcts.length).toFixed(2))
        : s.agreedLossPct;
      return {
        ...s,
        ordersCount: s.orders.length,
        allocatedHours: parseFloat(s.allocatedHours.toFixed(1)),
        goldIssuedGrams: parseFloat(s.goldIssuedGrams.toFixed(2)),
        goldReturnedGrams: parseFloat(s.goldReturnedGrams.toFixed(2)),
        labourValueRs: Math.round(s.labourValueRs),
        bullionValuationRs: Math.round(s.goldIssuedGrams * rate22KPerGram),
        avgLossPct: avgLoss,
        benches: Array.from(s.benchesMap.entries()).map(([id, name]) => ({ id, name }))
      };
    }).sort((a, b) => b.allocatedHours - a.allocatedHours);

    const srList = Array.from(showroomMap.values()).map(sr => {
      return {
        ...sr,
        ordersCount: sr.orders.length,
        allocatedHours: parseFloat(sr.allocatedHours.toFixed(1)),
        goldIssuedGrams: parseFloat(sr.goldIssuedGrams.toFixed(2)),
        labourValueRs: Math.round(sr.labourValueRs),
        bullionValuationRs: Math.round(sr.goldIssuedGrams * rate22KPerGram),
        benches: Array.from(sr.benchesMap.entries()).map(([id, name]) => ({ id, name }))
      };
    }).sort((a, b) => b.allocatedHours - a.allocatedHours);

    return {
      externalShopsBreakdown: extList,
      showroomsBreakdown: srList,
      totalGoldValuationLKR: Math.round(totalGold * rate22KPerGram),
      totalDayGoldGrams: parseFloat(totalGold.toFixed(2))
    };
  }, [dayAllocations, craftsmen, clientShops]);

  // Automated Overdue Alert Alarm Controller (Strictly plays alert.wav ONLY when a bench becomes Overdue)
  const alertedOverdueBenchesRef = useRef(new Set());
  const [autoOverdueSound, setAutoOverdueSound] = useState(() => {
    try {
      return localStorage.getItem('ashadi_auto_overdue_sound') !== 'false';
    } catch (e) {
      return true;
    }
  });

  const isInitialMountRef = useRef(true);

  // Reset alerted bench IDs when selectedDate changes so new shift starts clean
  useEffect(() => {
    isInitialMountRef.current = true;
    alertedOverdueBenchesRef.current = new Set();
  }, [selectedDate]);

  // Automated Alarm Sound: Triggered ONLY on TODAY's active shift when a bench TRANSITIONS into OVERDUE (100% silent on past dates and tab switching)
  useEffect(() => {
    const todayIso = new Date().toISOString().split('T')[0];
    const isPastDate = selectedDate < todayIso;

    // Past historical dates are closed shifts (evaluated at 08:00 PM close) — never play alarm when viewing history
    if (isPastDate) return;

    if (!autoOverdueSound) return;
    const overdueBenches = benchStatusList.filter(b => b.status === 'OVERDUE');

    // On initial mount/tab switch, mark currently existing overdue benches as known without ringing
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      overdueBenches.forEach(b => alertedOverdueBenchesRef.current.add(b.craftsman.id));
      return;
    }

    if (overdueBenches.length === 0) return;

    // Only ring alarm when an active bench turns OVERDUE while you are watching the live floor
    const newlyOverdue = overdueBenches.filter(b => !alertedOverdueBenchesRef.current.has(b.craftsman.id));
    if (newlyOverdue.length > 0) {
      // Ring the loud urgent 3-tone warning chime (/sounds/alert.wav)
      playAlertChime('/sounds/alert.wav');
      newlyOverdue.forEach(b => alertedOverdueBenchesRef.current.add(b.craftsman.id));
    }
  }, [benchStatusList, autoOverdueSound, selectedDate]);

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

  const leak = useMemo(() => {
    const baseLeak = capacityLeakWaterfall || {
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

    if (!hasOrders) return baseLeak;

    // Use liveEarnedHours to strictly reflect day's partitioned shift output (e.g. 9.0h today, 3.0h tomorrow)
    const earned = (liveEarnedHours > 0 || dayAllocations.length > 0) ? liveEarnedHours : (baseLeak.earnedStandardHours || 0);
    const grossOnSite = baseLeak.grossOnSiteHours !== undefined ? Number(baseLeak.grossOnSiteHours) : (workforce.activeCraftsmen * 13.0);
    const netAvailable = baseLeak.netAvailableHours !== undefined ? Number(baseLeak.netAvailableHours) : (workforce.activeCraftsmen * 11.0);
    const lostHours = Math.max(0, grossOnSite - earned);
    const grossUtil = grossOnSite > 0 ? parseFloat(((earned / grossOnSite) * 100).toFixed(1)) : 0;
    const netEff = netAvailable > 0 ? parseFloat(((earned / netAvailable) * 100).toFixed(1)) : 0;

    return {
      ...baseLeak,
      earnedStandardHours: earned,
      grossOnSiteHours: grossOnSite,
      netAvailableHours: netAvailable,
      lostHoursTotal: parseFloat(lostHours.toFixed(1)),
      grossAttendanceUtilization: grossUtil,
      netWorkingEfficiency: netEff
    };
  }, [capacityLeakWaterfall, hasOrders, liveEarnedHours, dayAllocations, workforce]);

  const channels = channelBreakdown || {};

  // Filter day's allocations for table view
  const filteredDayAllocs = dayAllocations.filter(item => {
    const matchedCraftsman = (craftsmen || []).find(c => c.id === item.craftsmanId);
    const resolvedName = matchedCraftsman?.name || item.craftsmanName || '';
    const matchChan = selectedChannel === 'ALL' || item.channel === selectedChannel;
    const matchShop = selectedSpecificShop === 'ALL' || (item.channelName && item.channelName === selectedSpecificShop);
    const matchSearch = !searchTerm || 
      resolvedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.craftsmanName && item.craftsmanName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.craftsmanId && item.craftsmanId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.workOrder && item.workOrder.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.designName && item.designName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.channelName && item.channelName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchChan && matchShop && matchSearch;
  });

  return (
    <div>
      {/* 1. EXECUTIVE TITLE */}
      <div className="executive-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '22px',
        padding: '4px 0'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '3px 12px', borderRadius: '20px', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.35)', marginBottom: '8px' }}>
            <Crown size={12} color="#fbbf24" />
            <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#fef08a', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Ashadi Jewellers • Plant Operations Terminal
            </span>
          </div>
          <h1 className="executive-title" style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-serif, serif)' }}>
            <Sparkles size={24} color="#d4af37" style={{ filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.6))' }} />
            <span>Executive Production & Labour Cost Control</span>
          </h1>
          <p className="executive-subtitle" style={{ margin: 0, fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>Time-Based Labour Costing System</span>
            <span style={{ color: 'rgba(212, 175, 55, 0.4)' }}>•</span>
            <span style={{ color: '#cbd5e1' }}>63 Verified Workshop Benches</span>
            <span style={{ color: 'rgba(212, 175, 55, 0.4)' }}>•</span>
            <span style={{ color: '#38bdf8', fontWeight: '600' }}>Live Floor Sync Active</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {onOpenKiosk && (
            <button 
              className="btn-gold-primary btn-floor-kiosk-trigger" 
              onClick={onOpenKiosk}
              style={{ 
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.28) 0%, rgba(202, 138, 4, 0.18) 100%)',
                borderColor: '#facc15',
                color: '#fef08a',
                fontWeight: 'bold',
                boxShadow: '0 0 16px rgba(234, 179, 8, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12px'
              }}
              title="Open Touchless Floor Kiosk Scanner (Use Phone / Tablet Camera)"
            >
              <QrCode size={15} color="#fde047" />
              <span>⚡ Floor Kiosk</span>
            </button>
          )}
          <button className="btn-ghost-secondary" onClick={() => onNavigateTab('leaves')} style={{ padding: '8px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <UserX size={15} />
            <span>Attendance & Leaves</span>
          </button>
          <button className="btn-ghost-secondary" onClick={() => onNavigateTab('allocations', { date: selectedDate })} style={{ padding: '8px 14px', fontSize: '12px' }}>
            <span>Dispatch Daily Orders</span>
          </button>
          <button className="btn-gold-primary" onClick={() => onNavigateTab('monthlyReport')} style={{ padding: '8px 16px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 0 16px rgba(212, 175, 55, 0.3)' }}>
            <FileText size={15} />
            <span>Monthly Report</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PROMINENT DATE SELECTOR / EXECUTIVE DAY INSPECTION BAR                 */}
      {/* ========================================================================= */}
      <div className="executive-audit-selector-box" style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(10, 16, 30, 0.98) 100%)',
        border: '1px solid rgba(212, 175, 55, 0.45)',
        borderRadius: '16px',
        padding: '18px 22px',
        marginBottom: '22px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Luxury Corner Ambient Glow */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(180, 130, 20, 0.1) 100%)',
              border: '1.5px solid #d4af37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fef08a',
              boxShadow: '0 0 16px rgba(212, 175, 55, 0.35)',
              flexShrink: 0
            }}>
              <Calendar size={22} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#d4af37', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                EXECUTIVE SINGLE-DAY AUDIT SELECTOR
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-serif, serif)' }}>
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
              style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '8px' }}
            >
              <ChevronLeft size={16} /> <span>Prev Day</span>
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{
                background: 'rgba(8, 12, 22, 0.95)',
                border: '1.5px solid #d4af37',
                borderRadius: '8px',
                color: '#fef08a',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(212, 175, 55, 0.2)'
              }}
            />

            <button
              className="btn-ghost-secondary"
              onClick={() => handleShiftDate(1)}
              title="Next Day"
              style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '8px' }}
            >
              <span>Next Day</span> <ChevronRight size={16} />
            </button>

            <button
              onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                background: selectedDate === new Date().toISOString().split('T')[0] ? 'linear-gradient(135deg, #d4af37 0%, #aa820a 100%)' : 'rgba(255, 255, 255, 0.08)',
                color: selectedDate === new Date().toISOString().split('T')[0] ? '#0b0f19' : '#cbd5e1',
                border: selectedDate === new Date().toISOString().split('T')[0] ? '1.5px solid #fef08a' : '1px solid rgba(212, 175, 55, 0.35)',
                boxShadow: selectedDate === new Date().toISOString().split('T')[0] ? '0 0 16px rgba(212, 175, 55, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Today
            </button>
          </div>
        </div>

        {/* Quick Date Chips (dates with real orders) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>Quick Select Available Shift Dates:</span>
          {availableDates.slice(0, 8).map(d => {
            const isSelected = selectedDate === d;
            return (
              <button
                key={d}
                onClick={() => handleDateChange(d)}
                className="audit-date-chip"
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.35) 0%, rgba(180, 130, 20, 0.22) 100%)' 
                    : 'rgba(15, 23, 42, 0.7)',
                  border: isSelected ? '1.5px solid #facc15' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: isSelected ? '#fef08a' : '#94a3b8',
                  boxShadow: isSelected ? '0 0 12px rgba(234, 179, 8, 0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {isSelected ? '⭐' : '📅'} {d}
              </button>
            );
          })}
          {availableDates.length > 8 && (
            <span style={{ fontSize: '11px', color: '#64748b' }}>+{availableDates.length - 8} more</span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. EXECUTIVE DAY BRIEFING CARD FOR THE BOSS                               */}
      {/* ========================================================================= */}
      <div className="executive-briefing-card" style={{
        background: hasOrders 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.10) 0%, rgba(10, 25, 20, 0.9) 100%)' 
          : 'linear-gradient(135deg, rgba(245, 158, 11, 0.10) 0%, rgba(25, 20, 10, 0.9) 100%)',
        border: hasOrders ? '1.5px solid rgba(52, 211, 153, 0.45)' : '1.5px solid rgba(245, 158, 11, 0.45)',
        borderRadius: '16px',
        padding: '18px 22px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: hasOrders ? '0 10px 30px rgba(16, 185, 129, 0.15)' : '0 10px 30px rgba(245, 158, 11, 0.15)'
      }}>
        <div style={{ maxWidth: '900px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: hasOrders ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)' : 'rgba(245, 158, 11, 0.25)',
              color: hasOrders ? '#34d399' : '#fcd34d',
              border: hasOrders ? '1.5px solid #10b981' : '1.5px solid #f59e0b',
              boxShadow: hasOrders ? '0 0 14px rgba(16, 185, 129, 0.35)' : '0 0 14px rgba(245, 158, 11, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>{hasOrders ? `✓ ${dayAllocations.length} Orders Dispatched on this Date` : '⚠️ Baseline Shift (No Work Orders Logged Yet)'}</span>
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.05)', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              Shift Scope: <strong style={{ color: '#cbd5e1' }}>07:00 AM – 08:00 PM (13.0h)</strong> • <strong style={{ color: '#d4af37' }}>63 Benches = 819.0h Ceiling</strong>
            </span>
          </div>

          {/* Mini KPI Highlights Strip */}
          {hasOrders && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', fontSize: '11.5px' }}>
                <Users size={13} color="#38bdf8" />
                <span style={{ color: '#94a3b8' }}>Active Benches:</span>
                <strong style={{ color: '#38bdf8' }}>{workforce.activeCraftsmen} / 63</strong>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: '11.5px' }}>
                <Zap size={13} color="#34d399" />
                <span style={{ color: '#94a3b8' }}>Standard Output:</span>
                <strong style={{ color: '#34d399' }}>{leak.earnedStandardHours} hrs</strong>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.35)', fontSize: '11.5px' }}>
                <TrendingUp size={13} color="#fef08a" />
                <span style={{ color: '#94a3b8' }}>Plant Yield:</span>
                <strong style={{ color: '#fef08a' }}>{leak.grossAttendanceUtilization}%</strong>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '11.5px' }}>
                <Scale size={13} color="#fbbf24" />
                <span style={{ color: '#94a3b8' }}>Gold Issued:</span>
                <strong style={{ color: '#fcd34d' }}>{dailyPerformance.dayGoldIssuedGrams}g</strong>
              </div>
            </div>
          )}

          <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
            {hasOrders ? (
              <span>
                On <strong>{formatDatePretty(selectedDate)}</strong>, the plant had <strong style={{ color: '#34d399' }}>{workforce.activeCraftsmen} active craftsmen</strong> on benches ({workforce.todayAbsent} on approved leave: -{workforce.todayLeaveHours}h). 
                Total gross on-site presence was <strong style={{ color: '#fff' }}>{leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} hours</strong>. Productive output delivered was <strong style={{ color: '#fef08a' }}>{leak.earnedStandardHours} standard working hours</strong> ({leak.grossAttendanceUtilization}% capacity yield) across <strong style={{ color: '#38bdf8' }}>{dailyPerformance.dayOrdersCount} orders</strong> and <strong style={{ color: '#38bdf8' }}>{dailyPerformance.dayPiecesCount} pieces</strong>. Total gold issued was <strong style={{ color: '#fcd34d' }}>{dailyPerformance.dayGoldIssuedGrams}g</strong>.
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

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!hasOrders && (
            <button
              onClick={handleAutoPopulateDate}
              disabled={autoPopulating}
              className="btn-gold-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '9px 16px', boxShadow: '0 0 16px rgba(212, 175, 55, 0.35)' }}
            >
              <Zap size={15} />
              <span>{autoPopulating ? 'Populating 63 Benches...' : '⚡ Auto-Populate Full 63-Bench Shift'}</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab('allocations', { date: selectedDate })}
            className="btn-gold-primary"
            style={{ fontSize: '12px', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(180, 130, 20, 0.15) 100%)', border: '1px solid #d4af37', color: '#fef08a', boxShadow: '0 0 14px rgba(212, 175, 55, 0.2)' }}
          >
            <span>Dispatch Custom Orders</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. THE 13-HOUR SHIFT CAPACITY WATERFALL & LEAKAGE AUDIT (FOR THIS DATE)   */}
      {/* ========================================================================= */}
      <div className="luxury-box executive-waterfall-box" style={{ marginBottom: '28px', border: '1px solid rgba(212, 175, 55, 0.35)', background: 'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.08) 0%, rgba(13, 20, 36, 0.96) 65%, rgba(10, 15, 29, 0.99) 100%)', boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 24px rgba(212, 175, 55, 0.08)', borderRadius: '16px' }}>
        <div className="luxury-box-header" style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.15)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)', border: '1px solid rgba(212, 175, 55, 0.35)', color: '#fef08a', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', boxShadow: '0 0 12px rgba(212, 175, 55, 0.15)' }}>
              <Clock size={13} color="#fef08a" />
              <span>DAILY 13-HOUR SHIFT AUDIT (07:00 AM – 08:00 PM) • {selectedDate}</span>
            </div>
            <h3 className="luxury-box-title waterfall-title" style={{ fontSize: '20px', fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif", color: '#fef08a', textShadow: '0 2px 12px rgba(212, 175, 55, 0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={18} color="#f59e0b" />
              </div>
              <span>
                {hasOrders 
                  ? `Capacity Audit: The ${leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} Gross On-Site Hours vs Productive Output on ${selectedDate}`
                  : `Plant Shift Status: ${leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} Gross On-Site Hours on ${selectedDate}`
                }
              </span>
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', marginTop: '6px', lineHeight: '1.6' }}>
              {hasOrders ? (
                <span>
                  Gross On-Site Presence: <strong style={{ color: '#f8fafc' }}>{workforce.activeCraftsmen} Active Craftsmen × 13.0 Hours = {leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} Gross Hours</strong> (Roster ceiling: 63 × 13.0 = 819.0h, less {workforce.todayAbsent} leave: -{(workforce.todayLeaveHours || workforce.todayAbsent * 13.0).toFixed(1)}h). On this date, actual standard output was <strong style={{ color: '#6ee7b7' }}>{leak.earnedStandardHours} Hours</strong>. Capacity gap: <strong style={{ color: '#f87171' }}>{leak.lostHoursTotal} Hours</strong>.
                </span>
              ) : (
                <span>
                  Gross On-Site Presence: <strong style={{ color: '#f8fafc' }}>{workforce.activeCraftsmen} Active Craftsmen × 13.0 Hours = {leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} Gross On-Site Hours</strong> (Roster ceiling: 63 × 13.0 = 819.0h, less {workforce.todayAbsent} leave: -{(workforce.todayLeaveHours || workforce.todayAbsent * 13.0).toFixed(1)}h). No work orders allocated yet on this date (Output: <strong style={{ color: '#6ee7b7' }}>0.0 Hours</strong>).
                </span>
              )}
            </p>
          </div>

          {/* Daily Output Fluctuation Simulator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Simulate Factory Benchmark Ranges:</span>
              {(!hasOrders || Number(leak.earnedStandardHours) === 0) && (
                <span style={{ fontSize: '10px', background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '12px', padding: '2px 8px', fontWeight: '600' }}>
                  Standby (0.0h)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'LOW', label: '🔴 Low Day (~350h)' },
                { id: 'NORMAL', label: '🟡 Normal Day (~400h)' },
                { id: 'HIGH', label: '🟢 Target Day (≥450h)' },
                { id: 'PEAK', label: '🏆 Peak Shift (≥500h)' }
              ].map(s => {
                const isActive = dailyScenario === s.id;
                const activeColor = s.id === 'LOW' ? '#f87171' : s.id === 'NORMAL' ? '#f59e0b' : s.id === 'HIGH' ? '#34d399' : '#38bdf8';
                const activeBg = s.id === 'LOW' ? 'rgba(239, 68, 68, 0.22)' : s.id === 'NORMAL' ? 'rgba(245, 158, 11, 0.22)' : s.id === 'HIGH' ? 'rgba(52, 211, 153, 0.22)' : 'rgba(56, 189, 248, 0.22)';
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setDailyScenario(s.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: isActive ? `1.5px solid ${activeColor}` : '1px solid rgba(255, 255, 255, 0.12)',
                      background: isActive ? activeBg : 'rgba(15, 23, 42, 0.65)',
                      color: isActive ? '#fff' : '#94a3b8',
                      boxShadow: isActive ? (s.id === 'PEAK' ? '0 0 16px rgba(56, 189, 248, 0.45)' : s.id === 'HIGH' ? '0 0 14px rgba(52, 211, 153, 0.4)' : s.id === 'NORMAL' ? '0 0 12px rgba(245, 158, 11, 0.35)' : '0 0 12px rgba(239, 68, 68, 0.35)') : 'none',
                      transition: 'all 0.2s ease',
                      transform: isActive ? 'translateY(-1px)' : 'none'
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          {/* Card 1: Gross Clocked Time */}
          <div className="waterfall-card-item" style={{ 
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.95) 100%)', 
            border: '1px solid rgba(148, 163, 184, 0.25)', 
            borderRadius: '14px', 
            padding: '16px 18px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>1. GROSS ON-SITE TIME</div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(148, 163, 184, 0.12)', border: '1px solid rgba(148, 163, 184, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={14} color="#cbd5e1" />
                </div>
              </div>
              <div className="waterfall-val-gross" style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em', margin: '2px 0 6px 0', textShadow: '0 2px 10px rgba(255, 255, 255, 0.15)' }}>
                {leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} hrs
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>
                {workforce.activeCraftsmen} Active Craftsmen × 13.0 Hours
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              07:00 AM – 08:00 PM (Roster: 63 = 819.0h)
            </div>
          </div>

          {/* Card 2: Deducted Approved Leaves */}
          <div className="waterfall-card-item" style={{ 
            background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)', 
            border: '1px solid rgba(239, 68, 68, 0.35)', 
            borderRadius: '14px', 
            padding: '16px 18px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: '#f87171', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>2. APPROVED LEAVES</div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserX size={14} color="#f87171" />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#f87171', letterSpacing: '-0.02em', margin: '2px 0 6px 0', textShadow: '0 0 16px rgba(239, 68, 68, 0.4)' }}>
                - {leak.approvedLeavesHours !== undefined ? Number(leak.approvedLeavesHours).toFixed(1) : (workforce.todayAbsent * 13.0).toFixed(1)} hrs
              </div>
              <div style={{ fontSize: '12px', color: '#fca5a5', fontWeight: '600' }}>
                {workforce.todayAbsent} Craftsmen on Leave ({workforce.todayAbsent} × 13.0h)
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(239, 68, 68, 0.15)' }}>
              {workforce.activeCraftsmen} Active on bench today
            </div>
          </div>

          {/* Card 3: Deducted Meal/Tea Breaks */}
          <div className="waterfall-card-item" style={{ 
            background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)', 
            border: '1px solid rgba(245, 158, 11, 0.35)', 
            borderRadius: '14px', 
            padding: '16px 18px',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>3. DEDUCTED BREAKS</div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Coffee size={14} color="#fbbf24" />
                </div>
              </div>
              <div className="loss-break-number" style={{ fontSize: '28px', fontWeight: '800', color: '#fcd34d', letterSpacing: '-0.02em', margin: '2px 0 6px 0', textShadow: '0 0 16px rgba(245, 158, 11, 0.35)' }}>
                - {leak.loggedBreakHours !== undefined ? Number(leak.loggedBreakHours).toFixed(1) : (workforce.activeCraftsmen * 2.0).toFixed(1)} hrs
              </div>
              <div style={{ fontSize: '12px', color: '#fde68a', fontWeight: '600' }}>
                {workforce.activeCraftsmen} Active × 2.0 hrs breaks
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(245, 158, 11, 0.15)' }}>
              Breakfast (30m), Lunch (45m) & 2 Teas (45m)
            </div>
          </div>

          {/* Card 4: Net Available Bench Time */}
          <div className="waterfall-card-item" style={{ 
            background: 'linear-gradient(145deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)', 
            border: '1px solid rgba(56, 189, 248, 0.35)', 
            borderRadius: '14px', 
            padding: '16px 18px',
            boxShadow: '0 8px 24px rgba(56, 189, 248, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>4. NET BENCH TIME</div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={14} color="#38bdf8" />
                </div>
              </div>
              <div className="loss-net-number" style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8', letterSpacing: '-0.02em', margin: '2px 0 6px 0', textShadow: '0 0 16px rgba(56, 189, 248, 0.4)' }}>
                {leak.netAvailableHours !== undefined ? Number(leak.netAvailableHours).toFixed(1) : (workforce.activeCraftsmen * 11.0).toFixed(1)} hrs
              </div>
              <div style={{ fontSize: '12px', color: '#bae6fd', fontWeight: '600' }}>
                Time at workbench ({workforce.activeCraftsmen} × 11.0h)
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(56, 189, 248, 0.15)' }}>
              Effective working window (Gross − Breaks)
            </div>
          </div>

          {/* Card 5: Standard Output Delivered */}
          <div className="waterfall-card-item waterfall-card-output" style={{ 
            background: (Number(leak.earnedStandardHours) >= 500)
              ? 'linear-gradient(145deg, rgba(56, 189, 248, 0.22) 0%, rgba(13, 20, 36, 0.95) 60%, rgba(10, 15, 29, 0.98) 100%)'
              : (Number(leak.earnedStandardHours) >= 440)
              ? 'linear-gradient(145deg, rgba(52, 211, 153, 0.22) 0%, rgba(10, 35, 25, 0.92) 50%, rgba(15, 23, 42, 0.98) 100%)'
              : 'linear-gradient(145deg, rgba(212, 175, 55, 0.18) 0%, rgba(25, 20, 10, 0.92) 50%, rgba(15, 23, 42, 0.98) 100%)', 
            border: (Number(leak.earnedStandardHours) >= 500) 
              ? '1.5px solid #38bdf8' 
              : (Number(leak.earnedStandardHours) >= 440) 
              ? '1.5px solid #34d399' 
              : '1.5px solid #d4af37', 
            borderRadius: '14px', 
            padding: '16px 18px',
            boxShadow: (Number(leak.earnedStandardHours) >= 500)
              ? '0 12px 32px rgba(56, 189, 248, 0.35)'
              : (Number(leak.earnedStandardHours) >= 440)
              ? '0 12px 32px rgba(52, 211, 153, 0.3)'
              : '0 12px 30px rgba(212, 175, 55, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: (Number(leak.earnedStandardHours) >= 500) ? '#38bdf8' : (Number(leak.earnedStandardHours) >= 440) ? '#34d399' : '#d4af37', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  5. PRODUCTIVE OUTPUT
                </div>
                {Number(leak.earnedStandardHours) >= 500 ? (
                  <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.25)', color: '#7dd3fc', border: '1px solid #38bdf8', borderRadius: '12px', padding: '2px 8px', fontWeight: '800', boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)' }}>
                    🏆 500h+ Peak Shift
                  </span>
                ) : Number(leak.earnedStandardHours) >= 440 ? (
                  <span style={{ fontSize: '10px', background: 'rgba(52, 211, 153, 0.22)', color: '#6ee7b7', border: '1px solid #34d399', borderRadius: '12px', padding: '2px 8px', fontWeight: '800', boxShadow: '0 0 10px rgba(52, 211, 153, 0.35)' }}>
                    ★ Target Achieved
                  </span>
                ) : null}
              </div>
              <div className="loss-output-number" style={{ fontSize: '30px', fontWeight: '800', color: (Number(leak.earnedStandardHours) >= 500) ? '#7dd3fc' : (Number(leak.earnedStandardHours) >= 440) ? '#6ee7b7' : '#fef08a', letterSpacing: '-0.02em', margin: '2px 0 6px 0', textShadow: (Number(leak.earnedStandardHours) >= 500) ? '0 0 16px rgba(56, 189, 248, 0.5)' : (Number(leak.earnedStandardHours) >= 440) ? '0 0 16px rgba(52, 211, 153, 0.5)' : '0 0 14px rgba(212, 175, 55, 0.4)' }}>
                {leak.earnedStandardHours !== undefined ? Number(leak.earnedStandardHours).toFixed(1) : '0.0'} hrs
              </div>
              <div style={{ margin: '6px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>{hasOrders ? `${leak.grossAttendanceUtilization}% Plant Yield` : 'Standby (0 Orders)'}</span>
                  <span style={{ color: '#34d399', fontWeight: '700' }}>{leak.earnedStandardHours || '0.0'} / {leak.netAvailableHours || '660.0'}h</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(leak.grossAttendanceUtilization || 0, 100)}%`, 
                    height: '100%', 
                    background: (Number(leak.earnedStandardHours) >= 500)
                      ? 'linear-gradient(90deg, #38bdf8 0%, #7dd3fc 100%)'
                      : (Number(leak.earnedStandardHours) >= 440)
                      ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                      : 'linear-gradient(90deg, #d4af37 0%, #fef08a 100%)',
                    borderRadius: '3px',
                    boxShadow: '0 0 8px rgba(52, 211, 153, 0.5)'
                  }} />
                </div>
              </div>
            </div>
            <div style={{ fontSize: '11px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {hasOrders ? (
                <div>
                  <span style={{ color: '#fca5a5', fontWeight: '600' }}>Capacity Gap: <strong style={{ color: '#f87171' }}>{leak.lostHoursTotal} hrs lost</strong></span>
                  {rolloverToTomorrowHours > 0 && (
                    <div style={{ color: '#38bdf8', fontSize: '10.5px', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>📅</span>
                      <span>+{rolloverToTomorrowHours.toFixed(1)}h multi-day balance carried to next shift</span>
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ color: '#38bdf8', fontWeight: '600' }}>Available: <strong style={{ color: '#7dd3fc' }}>{leak.netAvailableHours !== undefined ? Number(leak.netAvailableHours).toFixed(1) : (workforce.activeCraftsmen * 11.0).toFixed(1)} bench hrs</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Root-Cause Breakdown for THIS Date */}
        <div className="root-cause-box" style={{ background: 'rgba(10, 15, 29, 0.75)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '14px', padding: '20px', boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.4)' }}>
          {hasOrders ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div className="root-cause-title" style={{ fontSize: '13px', fontWeight: '800', color: '#fef08a', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={15} color="#f59e0b" />
                  <span>WHERE DID THE {leak.lostHoursTotal} LOST HOURS GO ON {selectedDate}? (DAILY ROOT-CAUSE BREAKDOWN)</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', fontSize: '12px', fontWeight: '700', boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)' }}>
                  <Sparkles size={13} color="#34d399" />
                  <span>Target Recoverable: <strong style={{ color: '#34d399' }}>+{leak.targetRecoverableHours || 115} hrs/day</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Reason 1: Approved Leaves */}
                {leak.approvedLeavesHours > 0 && (
                  <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '10px', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '8px' }}>
                      <span className="root-cause-label" style={{ color: '#f8fafc', fontWeight: '600' }}>
                        🏥 1. Approved Craftsman Leaves & Absenteeism ({workforce.todayAbsent} craftsmen):
                      </span>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', fontSize: '11px', fontWeight: '700' }}>
                        {leak.approvedLeavesHours} Hours ({leak.rootCauses.approvedLeaves.pct}% of shift)
                      </span>
                    </div>
                    <div className="loss-bar-track" style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(leak.rootCauses.approvedLeaves.pct, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)', borderRadius: '4px', boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)' }} />
                    </div>
                  </div>
                )}

                {/* Reason 2: Deducted Meals and Tea Breaks */}
                <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '8px' }}>
                    <span className="root-cause-label" style={{ color: '#f8fafc', fontWeight: '600' }}>
                      ☕ 2. Scheduled Meals & Tea Breaks (Breakfast 30m, Lunch 45m, 2 Teas 45m = 2.0 Hours):
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(96, 165, 250, 0.2)', border: '1px solid rgba(96, 165, 250, 0.35)', color: '#60a5fa', fontSize: '11px', fontWeight: '700' }}>
                      {leak.loggedBreakHours} Hours ({leak.rootCauses.loggedBreaks.pct}% of shift)
                    </span>
                  </div>
                  <div className="loss-bar-track" style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(leak.rootCauses.loggedBreaks.pct, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)', borderRadius: '4px', boxShadow: '0 0 8px rgba(96, 165, 250, 0.5)' }} />
                  </div>
                </div>

                {/* Reason 3: Bench Waiting & Material Queues */}
                <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '8px' }}>
                    <span className="root-cause-label" style={{ color: '#f8fafc', fontWeight: '600' }}>
                      ⏳ 3. Bench Material Waiting Queues (Melting crucible, wire rolling mill & supervisor scale delays):
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(251, 146, 60, 0.2)', border: '1px solid rgba(251, 146, 60, 0.35)', color: '#fb923c', fontSize: '11px', fontWeight: '700' }}>
                      {leak.rootCauses.benchWaitingIdle.hours} Hours ({leak.rootCauses.benchWaitingIdle.pct}% of shift)
                    </span>
                  </div>
                  <div className="loss-bar-track" style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(leak.rootCauses.benchWaitingIdle.pct, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #ea580c 0%, #fb923c 100%)', borderRadius: '4px', boxShadow: '0 0 8px rgba(251, 146, 60, 0.5)' }} />
                  </div>
                </div>

                {/* Reason 4: Pace / Speed Fatigue Gap */}
                <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '8px' }}>
                    <span className="root-cause-label" style={{ color: '#f8fafc', fontWeight: '600' }}>
                      🐢 4. 13-Hour Shift Pace Fatigue (Microscope eye fatigue & hand speed drop in 10th-13th shift hours):
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.2)', border: '1px solid rgba(251, 191, 36, 0.35)', color: '#fbbf24', fontSize: '11px', fontWeight: '700' }}>
                      {leak.rootCauses.speedPaceGap.hours} Hours ({leak.rootCauses.speedPaceGap.pct}% of shift)
                    </span>
                  </div>
                  <div className="loss-bar-track" style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(leak.rootCauses.speedPaceGap.pct, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #d97706 0%, #fbbf24 100%)', borderRadius: '4px', boxShadow: '0 0 8px rgba(251, 191, 36, 0.5)' }} />
                  </div>
                </div>

                {/* Reason 5: Unlogged Defect Rework */}
                <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '8px' }}>
                    <span className="root-cause-label" style={{ color: '#f8fafc', fontWeight: '600' }}>
                      🔧 5. Unlogged Defect Rework (Re-filing, re-soldering porosity & claw repairs at bench):
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(192, 132, 252, 0.2)', border: '1px solid rgba(192, 132, 252, 0.35)', color: '#c084fc', fontSize: '11px', fontWeight: '700' }}>
                      {leak.rootCauses.unloggedRework.hours} Hours ({leak.rootCauses.unloggedRework.pct}% of shift)
                    </span>
                  </div>
                  <div className="loss-bar-track" style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(leak.rootCauses.unloggedRework.pct, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #9333ea 0%, #c084fc 100%)', borderRadius: '4px', boxShadow: '0 0 8px rgba(192, 132, 252, 0.5)' }} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div className="root-cause-title" style={{ fontSize: '15px', fontWeight: '800', color: '#fef08a', marginBottom: '8px' }}>
                📋 Plant Shift Status for {selectedDate}: {leak.grossOnSiteHours !== undefined ? Number(leak.grossOnSiteHours).toFixed(1) : (workforce.activeCraftsmen * 13.0).toFixed(1)} Gross On-Site Hours (0 Orders Dispatched)
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '700px', margin: '0 auto 18px auto', lineHeight: '1.6' }}>
                On this date, no production work orders have been allocated yet. All 63 benches are in standby mode. 
                To view a real shift with completed orders and live capacity leak metrics, choose a date from below:
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleDateChange('2026-11-06')}
                  className="btn-gold-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '10px 20px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(180, 130, 20, 0.15) 100%)', border: '1px solid #d4af37', color: '#fef08a', boxShadow: '0 0 14px rgba(212, 175, 55, 0.2)' }}
                >
                  <Calendar size={14} color="#fef08a" />
                  <span>📅 View Latest Shift with Real Orders (2026-11-06)</span>
                </button>
                <button
                  onClick={handleAutoPopulateDate}
                  disabled={autoPopulating}
                  className="btn-ghost-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', padding: '10px 20px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fcd34d' }}
                >
                  <Zap size={14} color="#f59e0b" />
                  <span>⚡ Auto-Populate Full 63-Bench Shift for {selectedDate}</span>
                </button>
              </div>
            </div>
          )}

          {/* Luxury Executive Action Callout Card */}
          <div style={{ marginTop: '18px', padding: '16px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(245, 158, 11, 0.05) 50%, rgba(15, 23, 42, 0.85) 100%)', border: '1px solid rgba(212, 175, 55, 0.35)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 0 16px rgba(212, 175, 55, 0.08)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(180, 130, 20, 0.15) 100%)', border: '1px solid rgba(212, 175, 55, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 12px rgba(212, 175, 55, 0.25)' }}>
              <Sparkles size={18} color="#fef08a" />
            </div>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ fontSize: '11px', color: '#d4af37', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                EXECUTIVE RECOMMENDATION FOR FACTORY OWNER & DIRECTORS
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
                Preparing alloyed 22K gold wire the previous evening and staggering rolling mill station times will immediately recover <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', fontWeight: '800' }}>+80 to +115 hours daily</span>, pushing factory output from ~380-400h up to <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(212, 175, 55, 0.2)', border: '1px solid rgba(212, 175, 55, 0.4)', color: '#fef08a', fontWeight: '800' }}>450+ Hours Output</span>!
              </div>
            </div>
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
              <div className="channel-card channel-card-external" style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Store size={18} color="#f59e0b" />
                    <strong style={{ color: 'var(--text-main, #fff)', fontSize: '14px' }}>External Jewellers (B2B)</strong>
                  </div>
                  <span className="badge-bonus-pill">{ch.pctOfCapacity || 0}% Load</span>
                </div>
                <div className="channel-card-hours-external" style={{ fontSize: '24px', fontWeight: '800', color: '#fef08a' }}>{ch.allocatedHours || 0} Hours</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                  {ch.piecesCount || 0} pieces • {ch.ordersCount || 0} active orders
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '12px', paddingTop: '10px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Labour Billed:</span>
                  <strong style={{ color: '#10b981' }}>Rs. {(ch.labourValueRs || 0).toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Gold Issued:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{ch.goldIssuedGrams || 0}g (Loss: {ch.avgScrapLossPct || 3.4}%)</span>
                </div>
                <div className="channel-note-external" style={{ fontSize: '11px', color: '#f59e0b', marginTop: '8px' }}>
                  • Billed at contract rate with agreed gold wastage factor.
                </div>
              </div>
            );
          })()}

          {/* Channel 2: Own Showrooms */}
          {(() => {
            const ch = channels.OWN_SHOWROOM || {};
            return (
              <div className="channel-card channel-card-showroom" style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={18} color="#3b82f6" />
                    <strong style={{ color: 'var(--text-main, #fff)', fontSize: '14px' }}>Ashadi Branch Showrooms</strong>
                  </div>
                  <span className="badge-tier-b">{ch.pctOfCapacity || 0}% Load</span>
                </div>
                <div className="channel-card-hours-showroom" style={{ fontSize: '24px', fontWeight: '800', color: '#93c5fd' }}>{ch.allocatedHours || 0} Hours</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                  {ch.piecesCount || 0} pieces • {ch.ordersCount || 0} internal dispatches
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '12px', paddingTop: '10px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Transfer Cost:</span>
                  <strong style={{ color: '#10b981' }}>Rs. {(ch.labourValueRs || 0).toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Gold Issued:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{ch.goldIssuedGrams || 0}g (Loss: {ch.avgScrapLossPct || 3.2}%)</span>
                </div>
                <div className="channel-note-showroom" style={{ fontSize: '11px', color: '#38bdf8', marginTop: '8px' }}>
                  • Internal transfer at pure factory cost (Gold + Direct SMT Labour).
                </div>
              </div>
            );
          })()}

          {/* Channel 3: Factory Stock */}
          {(() => {
            const ch = channels.FACTORY_STOCK || {};
            return (
              <div className="channel-card channel-card-stock" style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={18} color="#cbd5e1" />
                    <strong style={{ color: 'var(--text-main, #fff)', fontSize: '14px' }}>Factory Central Stock</strong>
                  </div>
                  <span className="badge-tier-c">{ch.pctOfCapacity || 0}% Load</span>
                </div>
                <div className="channel-card-hours-stock" style={{ fontSize: '24px', fontWeight: '800', color: '#cbd5e1' }}>{ch.allocatedHours || 0} Hours</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                  {ch.piecesCount || 0} pieces • {ch.ordersCount || 0} buffer runs
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '12px', paddingTop: '10px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Inventory Asset:</span>
                  <strong style={{ color: '#10b981' }}>Rs. {(ch.labourValueRs || 0).toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Gold Issued:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{ch.goldIssuedGrams || 0}g (Loss: {ch.avgScrapLossPct || 2.73}%)</span>
                </div>
                <div className="channel-note-stock" style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                  • Buffer stock used to fill bench capacity during low retail demand.
                </div>
              </div>
            );
          })()}

          {/* Channel 4: Owner / VIP Orders */}
          {(() => {
            const ch = channels.OWNER_SPECIAL || {};
            return (
              <div className="channel-card channel-card-vip" style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Crown size={18} color="#c084fc" />
                    <strong style={{ color: 'var(--text-main, #fff)', fontSize: '14px' }}>Owner & VIP Orders</strong>
                  </div>
                  <span style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                    {ch.pctOfCapacity || 0}% Load
                  </span>
                </div>
                <div className="channel-card-hours-vip" style={{ fontSize: '24px', fontWeight: '800', color: '#e9d5ff' }}>{ch.allocatedHours || 0} Hours</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                  {ch.piecesCount || 0} pieces • {ch.ordersCount || 0} VIP commissions
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '12px', paddingTop: '10px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Crafting Cost:</span>
                  <strong style={{ color: '#10b981' }}>Rs. {(ch.labourValueRs || 0).toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-muted, #94a3b8)' }}>Gold Issued:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{ch.goldIssuedGrams || 0}g (Zero gold loss allowed)</span>
                </div>
                <div className="channel-note-vip" style={{ fontSize: '11px', color: '#c084fc', marginTop: '8px' }}>
                  • Handled exclusively by Grade A Master Craftsmen (Rs. 11.50/min).
                </div>
              </div>
            );
          })()}
        </div>

        {/* ========================================================================= */}
        {/* GRANULAR CLIENT SHOPS & SHOWROOM BRANCHES BREAKDOWN                       */}
        {/* ========================================================================= */}
        <div style={{ 
          background: 'radial-gradient(ellipse at 50% 0%, rgba(212, 175, 55, 0.08) 0%, rgba(13, 20, 36, 0.95) 75%)', 
          border: '1px solid rgba(212, 175, 55, 0.35)', 
          borderRadius: '16px', 
          padding: isDestinationExpanded ? '22px' : '16px 20px', 
          marginTop: '10px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
          transition: 'all 0.3s ease'
        }}>
          {/* Header & Tabs */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '14px', 
            borderBottom: isDestinationExpanded ? '1px solid rgba(212, 175, 55, 0.2)' : 'none', 
            paddingBottom: isDestinationExpanded ? '16px' : '0', 
            marginBottom: isDestinationExpanded ? '18px' : '0' 
          }}>
            <div 
              onClick={toggleDestinationExpanded}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              title={isDestinationExpanded ? "Click to collapse this section" : "Click to expand this section"}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fef08a', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                <Sparkles size={13} color="#fef08a" />
                <span>Client & Destination Breakdown • {selectedDate}</span>
                {!isDestinationExpanded && (
                  <span style={{ 
                    fontSize: '10px', 
                    padding: '2px 8px', 
                    borderRadius: '10px', 
                    background: 'rgba(212, 175, 55, 0.15)', 
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: '#fef08a',
                    marginLeft: '8px'
                  }}>
                    Collapsed (Click to Expand)
                  </span>
                )}
              </div>
              <h4 style={{ fontSize: '18px', fontFamily: "'Cinzel', Georgia, serif", color: '#fef08a', margin: 0, fontWeight: '700', textShadow: '0 2px 10px rgba(212, 175, 55, 0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Assigned Retail Jeweller Shops & Branch Showrooms</span>
                {isDestinationExpanded ? (
                  <ChevronUp size={18} color="#d4af37" />
                ) : (
                  <ChevronDown size={18} color="#d4af37" />
                )}
              </h4>
            </div>

            {/* Sub-Tabs Selector & Collapse/Expand Toggle */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {isDestinationExpanded ? (
                <>
                  <button
                    type="button"
                    onClick={() => setChannelSubTab('EXTERNAL')}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '20px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: channelSubTab === 'EXTERNAL' ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: channelSubTab === 'EXTERNAL' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                      color: channelSubTab === 'EXTERNAL' ? '#fef08a' : '#94a3b8',
                      boxShadow: channelSubTab === 'EXTERNAL' ? '0 0 14px rgba(245, 158, 11, 0.35)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Store size={14} color={channelSubTab === 'EXTERNAL' ? '#f59e0b' : '#94a3b8'} />
                    <span>External Partner Shops ({externalShopsBreakdown.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannelSubTab('SHOWROOM')}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '20px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: channelSubTab === 'SHOWROOM' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: channelSubTab === 'SHOWROOM' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                      color: channelSubTab === 'SHOWROOM' ? '#bae6fd' : '#94a3b8',
                      boxShadow: channelSubTab === 'SHOWROOM' ? '0 0 14px rgba(56, 189, 248, 0.35)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Building2 size={14} color={channelSubTab === 'SHOWROOM' ? '#38bdf8' : '#94a3b8'} />
                    <span>Ashadi Showrooms ({showroomsBreakdown.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannelSubTab('VALUATION')}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '20px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: channelSubTab === 'VALUATION' ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: channelSubTab === 'VALUATION' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                      color: channelSubTab === 'VALUATION' ? '#6ee7b7' : '#94a3b8',
                      boxShadow: channelSubTab === 'VALUATION' ? '0 0 14px rgba(16, 185, 129, 0.35)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Coins size={14} color={channelSubTab === 'VALUATION' ? '#10b981' : '#94a3b8'} />
                    <span>🪙 Bullion Valuation</span>
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#cbd5e1' }}>
                  <span style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 10px', borderRadius: '12px', color: '#fef08a' }}>
                    🏪 {externalShopsBreakdown.length} Shops
                  </span>
                  <span style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '4px 10px', borderRadius: '12px', color: '#7dd3fc' }}>
                    🏢 {showroomsBreakdown.length} Showrooms
                  </span>
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px', borderRadius: '12px', color: '#6ee7b7' }}>
                    🪙 {totalDayGoldGrams}g Gold
                  </span>
                </div>
              )}

              {/* Dedicated Collapse / Expand Button */}
              <button
                type="button"
                onClick={toggleDestinationExpanded}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  border: isDestinationExpanded ? '1px solid rgba(212, 175, 55, 0.4)' : '1.5px solid #d4af37',
                  background: isDestinationExpanded ? 'rgba(212, 175, 55, 0.1)' : 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(180, 130, 20, 0.2) 100%)',
                  color: '#fef08a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isDestinationExpanded ? 'none' : '0 0 12px rgba(212, 175, 55, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                title={isDestinationExpanded ? "Collapse this section" : "Expand this section"}
              >
                <span>{isDestinationExpanded ? 'Collapse' : 'Expand'}</span>
                {isDestinationExpanded ? <ChevronUp size={14} color="#fef08a" /> : <ChevronDown size={14} color="#fef08a" />}
              </button>
            </div>
          </div>

          {/* Collapsible Content Body */}
          {isDestinationExpanded && (
            <>
              {/* TAB 1: EXTERNAL PARTNER SHOPS */}
              {channelSubTab === 'EXTERNAL' && (
            <div>
              {/* Filter bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    placeholder="Search partner shop name..."
                    value={extShopQuery}
                    onChange={(e) => setExtShopQuery(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '7px 10px 7px 32px',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Showing <strong style={{ color: '#fef08a' }}>{externalShopsBreakdown.filter(s => !extShopQuery || s.name.toLowerCase().includes(extShopQuery.toLowerCase())).length}</strong> partner shops on {selectedDate}
                </div>
              </div>

              {externalShopsBreakdown.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
                  <Store size={32} color="#f59e0b" style={{ margin: '0 auto 10px auto', opacity: 0.6 }} />
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fef08a', marginBottom: '4px' }}>No External Jeweller Orders Allocated on {selectedDate}</div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '500px', margin: '0 auto 12px auto' }}>
                    There are no work orders assigned to external B2B retail jeweller clients for this shift date.
                  </p>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('allocations', { date: selectedDate })}
                    className="btn-gold-primary"
                    style={{ fontSize: '11px', padding: '6px 14px' }}
                  >
                    <span>Dispatch External Shop Orders</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {externalShopsBreakdown
                    .filter(s => !extShopQuery || s.name.toLowerCase().includes(extShopQuery.toLowerCase()) || s.location.toLowerCase().includes(extShopQuery.toLowerCase()))
                    .map((shop) => {
                      const isExpanded = !!expandedShopOrders[shop.name];
                      return (
                        <div 
                          key={shop.name} 
                          style={{ 
                            background: 'rgba(15, 23, 42, 0.75)', 
                            border: '1px solid rgba(245, 158, 11, 0.3)', 
                            borderRadius: '14px', 
                            padding: '16px 20px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Store size={18} color="#f59e0b" />
                                <h5 style={{ fontSize: '16px', fontWeight: '800', color: '#fef08a', margin: 0 }}>{shop.name}</h5>
                                <span style={{ fontSize: '10.5px', background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '12px', padding: '2px 8px', fontWeight: '700' }}>
                                  External B2B Retailer
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#94a3b8', marginTop: '6px', flexWrap: 'wrap' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} color="#94a3b8" />{shop.location}</span>
                                <span>•</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Phone size={12} color="#94a3b8" />{shop.phone}</span>
                                <span>•</span>
                                <span style={{ color: '#cbd5e1' }}>Contact: <strong style={{ color: '#fff' }}>{shop.contactPerson}</strong></span>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Contract Labour Billed</div>
                              <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{formatLKR(shop.labourValueRs)}</div>
                            </div>
                          </div>

                          {/* 5 Metric Chips */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '8px 12px' }}>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Orders & Pieces</div>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{shop.ordersCount} orders • {shop.piecesCount} pcs</div>
                            </div>
                            <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '8px 12px' }}>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Standard Output</div>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#fef08a' }}>{shop.allocatedHours} hrs</div>
                            </div>
                            <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '8px 12px' }}>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Gold Issued (22K)</div>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8' }}>{shop.goldIssuedGrams}g</div>
                            </div>
                            <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '8px 12px' }}>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Bullion Value (22K)</div>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#6ee7b7' }}>{formatLKR(shop.bullionValuationRs)}</div>
                            </div>
                            <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '8px 12px' }}>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Loss Ceiling / Actual</div>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#f87171' }}>≤ {shop.agreedLossPct}% / {shop.avgLossPct}%</div>
                            </div>
                          </div>

                          {/* Benches Assigned */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>Craftsman Benches:</span>
                              {shop.benches.map(b => (
                                <span key={b.id} style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#7dd3fc', borderRadius: '6px', padding: '2px 8px', fontWeight: '600' }}>
                                  Bench {b.id}: {b.name}
                                </span>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => setExpandedShopOrders(prev => ({ ...prev, [shop.name]: !isExpanded }))}
                              style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#cbd5e1',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <span>{isExpanded ? 'Hide Work Orders' : `View Work Orders (${shop.orders.length})`}</span>
                              <ChevronDown size={12} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                          </div>

                          {/* Expandable Order List */}
                          {isExpanded && (
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: '#fef08a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Dispatched Work Orders for {shop.name}:
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                                {shop.orders.map((ord, oIdx) => (
                                  <div key={oIdx} style={{ background: 'rgba(10, 15, 29, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '8px 12px', fontSize: '11px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                      <strong style={{ color: '#fff' }}>{ord.workOrder || `WO-${oIdx + 1}`}</strong>
                                      <span style={{ fontSize: '9.5px', padding: '1px 6px', borderRadius: '4px', background: ord.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)', color: ord.status === 'Completed' ? '#6ee7b7' : '#7dd3fc', border: ord.status === 'Completed' ? '1px solid #10b981' : '1px solid #38bdf8' }}>
                                        {ord.status || 'Active'}
                                      </span>
                                    </div>
                                    <div style={{ color: '#94a3b8' }}>{ord.designCode} • {ord.metalType || 'Gold 22K'} • {ord.qtyAllocated || 1} pcs</div>
                                    <div style={{ color: '#cbd5e1', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                                      <span>Bench: <strong>{ord.craftsmanId}</strong></span>
                                      <span>SMT: <strong>{ord.assumedHours || 2.0}h</strong></span>
                                      <span>Gold: <strong>{ord.goldIssuedGrams || 0}g</strong></span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASHADI SHOWROOM BRANCHES */}
          {channelSubTab === 'SHOWROOM' && (
            <div>
              {/* Filter bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    placeholder="Search showroom branch..."
                    value={showroomQuery}
                    onChange={(e) => setShowroomQuery(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '7px 10px 7px 32px',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Showing <strong style={{ color: '#38bdf8' }}>{showroomsBreakdown.filter(sr => !showroomQuery || sr.name.toLowerCase().includes(showroomQuery.toLowerCase())).length}</strong> showroom branches on {selectedDate}
                </div>
              </div>

              {showroomsBreakdown.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', border: '1px dashed rgba(56, 189, 248, 0.3)' }}>
                  <Building2 size={32} color="#38bdf8" style={{ margin: '0 auto 10px auto', opacity: 0.6 }} />
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#bae6fd', marginBottom: '4px' }}>No Ashadi Showroom Orders Allocated on {selectedDate}</div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '500px', margin: '0 auto 12px auto' }}>
                    There are no internal retail showroom transfer orders scheduled for this shift.
                  </p>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('allocations', { date: selectedDate })}
                    className="btn-gold-primary"
                    style={{ fontSize: '11px', padding: '6px 14px' }}
                  >
                    <span>Dispatch Showroom Orders</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {showroomsBreakdown
                    .filter(sr => !showroomQuery || sr.name.toLowerCase().includes(showroomQuery.toLowerCase()))
                    .map((showroom) => {
                      const isExpanded = !!expandedShopOrders[showroom.name];
                      return (
                        <div 
                          key={showroom.name} 
                          style={{ 
                            background: 'rgba(15, 23, 42, 0.75)', 
                            border: '1px solid rgba(56, 189, 248, 0.35)', 
                            borderRadius: '14px', 
                            padding: '16px 20px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Building2 size={18} color="#38bdf8" />
                                <h5 style={{ fontSize: '16px', fontWeight: '800', color: '#bae6fd', margin: 0 }}>{showroom.name}</h5>
                                <span style={{ fontSize: '10.5px', background: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '12px', padding: '2px 8px', fontWeight: '700' }}>
                                  🏬 Ashadi Branch Showroom
                                </span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                                Internal Transfer at pure factory cost (Gold Weight + Direct SMT Labour)
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Internal Transfer Labour Cost</div>
                              <div style={{ fontSize: '18px', fontWeight: '800', color: '#34d399' }}>{formatLKR(showroom.labourValueRs)}</div>
                            </div>
                          </div>

                          {/* 4 Metric Chips */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '8px 12px' }}>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Orders & Pieces</div>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{showroom.ordersCount} orders • {showroom.piecesCount} pcs</div>
                            </div>
                            <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '8px 12px' }}>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Standard Hours</div>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#fef08a' }}>{showroom.allocatedHours} hrs</div>
                            </div>
                            <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '8px 12px' }}>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Gold Issued (22K)</div>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8' }}>{showroom.goldIssuedGrams}g</div>
                            </div>
                            <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '8px 12px' }}>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Bullion Valuation (22K)</div>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#6ee7b7' }}>{formatLKR(showroom.bullionValuationRs)}</div>
                            </div>
                          </div>

                          {/* Benches Assigned */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>Craftsman Benches:</span>
                              {showroom.benches.map(b => (
                                <span key={b.id} style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#7dd3fc', borderRadius: '6px', padding: '2px 8px', fontWeight: '600' }}>
                                  Bench {b.id}: {b.name}
                                </span>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => setExpandedShopOrders(prev => ({ ...prev, [showroom.name]: !isExpanded }))}
                              style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#cbd5e1',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <span>{isExpanded ? 'Hide Work Orders' : `View Work Orders (${showroom.orders.length})`}</span>
                              <ChevronDown size={12} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                          </div>

                          {/* Expandable Order List */}
                          {isExpanded && (
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Dispatched Work Orders for {showroom.name}:
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                                {showroom.orders.map((ord, oIdx) => (
                                  <div key={oIdx} style={{ background: 'rgba(10, 15, 29, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '8px 12px', fontSize: '11px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                      <strong style={{ color: '#fff' }}>{ord.workOrder || `WO-${oIdx + 1}`}</strong>
                                      <span style={{ fontSize: '9.5px', padding: '1px 6px', borderRadius: '4px', background: ord.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)', color: ord.status === 'Completed' ? '#6ee7b7' : '#7dd3fc', border: ord.status === 'Completed' ? '1px solid #10b981' : '1px solid #38bdf8' }}>
                                        {ord.status || 'Active'}
                                      </span>
                                    </div>
                                    <div style={{ color: '#94a3b8' }}>{ord.designCode} • {ord.metalType || 'Gold 22K'} • {ord.qtyAllocated || 1} pcs</div>
                                    <div style={{ color: '#cbd5e1', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                                      <span>Bench: <strong>{ord.craftsmanId}</strong></span>
                                      <span>SMT: <strong>{ord.assumedHours || 2.0}h</strong></span>
                                      <span>Gold: <strong>{ord.goldIssuedGrams || 0}g</strong></span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BULLION CAPITAL VALUATION */}
          {channelSubTab === 'VALUATION' && (
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#34d399', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    🪙 Factory Gold Capital Valuation on {selectedDate}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#6ee7b7', margin: '4px 0' }}>
                    {formatLKR(totalGoldValuationLKR)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    Total Gold Issued Across All 63 Benches: <strong style={{ color: '#fff' }}>{totalDayGoldGrams} grams (22K Standard)</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Valued at Colombo Sea Street Rate:</span>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#fef08a' }}>
                    {formatLKR(getDailyGoldRates()?.rates?.['Gold 22K']?.perGram)} / gram (22K)
                  </div>
                </div>
              </div>

              {/* Channel Share Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
                <div style={{ background: 'rgba(10, 15, 29, 0.8)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '700' }}>External Client Jewellers</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: '3px 0' }}>
                    {formatLKR(externalShopsBreakdown.reduce((sum, s) => sum + s.bullionValuationRs, 0))}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {externalShopsBreakdown.reduce((sum, s) => sum + s.goldIssuedGrams, 0).toFixed(1)}g gold across {externalShopsBreakdown.length} shops
                  </div>
                </div>

                <div style={{ background: 'rgba(10, 15, 29, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>Ashadi Retail Showrooms</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: '3px 0' }}>
                    {formatLKR(showroomsBreakdown.reduce((sum, sr) => sum + sr.bullionValuationRs, 0))}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {showroomsBreakdown.reduce((sum, sr) => sum + sr.goldIssuedGrams, 0).toFixed(1)}g gold across {showroomsBreakdown.length} branches
                  </div>
                </div>
              </div>
            </div>
          )}
            </>
          )}
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
              onChange={(e) => {
                setSelectedChannel(e.target.value);
                setSelectedSpecificShop('ALL');
              }}
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

            {/* Specific Shop / Showroom Filter Dropdown */}
            {(selectedChannel === 'EXTERNAL_SHOP' || selectedChannel === 'OWN_SHOWROOM' || selectedSpecificShop !== 'ALL') && (
              <select
                value={selectedSpecificShop}
                onChange={(e) => setSelectedSpecificShop(e.target.value)}
                style={{
                  background: 'rgba(10, 15, 29, 0.9)',
                  border: '1.5px solid rgba(212, 175, 55, 0.4)',
                  borderRadius: '6px',
                  color: '#fef08a',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
              >
                <option value="ALL">-- Filter Specific Shop / Branch --</option>
                {selectedChannel !== 'OWN_SHOWROOM' && externalShopsBreakdown.length > 0 && (
                  <optgroup label="External Partner Shops">
                    {externalShopsBreakdown.map(s => (
                      <option key={s.name} value={s.name}>🏪 {s.name} ({s.ordersCount} orders)</option>
                    ))}
                  </optgroup>
                )}
                {selectedChannel !== 'EXTERNAL_SHOP' && showroomsBreakdown.length > 0 && (
                  <optgroup label="Ashadi Showroom Branches">
                    {showroomsBreakdown.map(sr => (
                      <option key={sr.name} value={sr.name}>🏬 {sr.name} ({sr.ordersCount} orders)</option>
                    ))}
                  </optgroup>
                )}
              </select>
            )}

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
          <div className="leave-banner-alert" style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            fontSize: '12px'
          }}>
            <strong style={{ color: '#ef4444' }}>⚠️ Craftsmen on Approved Leave on {selectedDate}:</strong>
            {dayLeaves.map(l => (
              <span key={l.id} className="leave-chip-item" style={{ background: 'var(--bg-item, rgba(15, 23, 42, 0.8))', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
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
              <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <table className="allocations-table" style={{ width: '100%', minWidth: '1350px' }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: '160px', textAlign: 'left' }}>CRAFTSMAN</th>
                      <th style={{ minWidth: '105px', textAlign: 'left' }}>CHANNEL</th>
                      <th style={{ minWidth: '115px', textAlign: 'left' }}>ORDER NUMBER</th>
                      <th style={{ minWidth: '160px', textAlign: 'left' }}>DESIGN</th>
                      <th style={{ minWidth: '50px', textAlign: 'center' }}>QTY</th>
                      <th style={{ minWidth: '95px', textAlign: 'center' }} title="Shift Dispatch / Order Handover Time">GIVEN TIME</th>
                      <th style={{ minWidth: '95px', textAlign: 'center' }} title="Craftsman Bench Work Start Time">START TIME</th>
                      <th style={{ minWidth: '140px', textAlign: 'center' }} title="Target Completion ETA (Dynamic SMT + Breaks + Shift Rollovers)">TARGET ETA</th>
                      <th style={{ minWidth: '95px', textAlign: 'right' }}>ASSUMED HRS</th>
                      <th style={{ minWidth: '85px', textAlign: 'right' }}>ACTUAL HRS</th>
                      <th style={{ minWidth: '100px', textAlign: 'center' }} title="Craftsman Actual Daily Break Time (Standard Shift Allowance = 2.0h / 120m)">BREAK TIME</th>
                      <th style={{ minWidth: '100px', textAlign: 'right' }}>ISSUE WEIGHT</th>
                      <th style={{ minWidth: '220px', textAlign: 'left' }} title="Standard Metallurgical Formula: Allowed Wastage = Finish Weight × Ceiling% (3.75% for 22K), Expected Scrap = Issued Gold - (Finish Weight + Allowed Wastage)">RETURN WEIGHT</th>
                      <th style={{ minWidth: '100px', textAlign: 'center' }}>STATUS</th>
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

                      const matchedCraftsman = (craftsmen || []).find(c => c.id === item.craftsmanId);
                      const displayName = matchedCraftsman?.name || item.craftsmanName || item.craftsmanId;
                      const displayTier = matchedCraftsman?.skillTier || item.skillTier || 'Grade B';

                      const tierBadge = {
                        'Grade A': 'badge-tier-a',
                        'Grade B': 'badge-tier-b',
                        'Grade C': 'badge-tier-c'
                      }[displayTier] || 'badge-tier-b';

                      // Shift Timing Calculations
                      const givenTimeStr = item.orderGivenTime || item.dispatchTime || '07:15 AM';
                      const startTimeStr = item.orderStartTime || item.dispatchTime || '07:15 AM';
                      const startMin = timeStringToMinutes(item.dispatchTime || item.orderStartTime, 435);
                      const smtMins = item.budgetedSMT || (item.assumedHours ? item.assumedHours * 60 : 240);
                      const rowEta = calculateDynamicETA(startMin, smtMins, displayTier || 'Grade B', selectedDate);
                      const targetETAStr = item.targetETATime || rowEta.targetETATime;

                      // Gold & 3.75% Wastage Calculations
                      const issuedGold = parseFloat(item.goldIssuedGrams) || 0;
                      const ceiling = getMetalScrapCeiling(item.metalType || 'Gold 22K');
                      const isCompleted = item.status === 'Completed' || (item.actualHours !== null && item.actualHours !== undefined && item.actualHours !== '');

                      let finishGrams = parseFloat(item.finishedItemGrams) || 0;
                      let scrapReturned = parseFloat(item.scrapReturnedGrams) || 0;

                      if (!finishGrams && item.goldReturnedGrams) {
                        const ret = parseFloat(item.goldReturnedGrams);
                        if (ret > 0 && issuedGold > 0 && ret < issuedGold * 0.9 && (item.goldLossPct > 10 || !isCompleted)) {
                          finishGrams = ret;
                        } else if (ret > 0) {
                          finishGrams = ret;
                        }
                      }

                      const recon = (issuedGold > 0 && finishGrams > 0)
                        ? calculateGoldWastageReconciliation(issuedGold, finishGrams, scrapReturned, item.metalType || 'Gold 22K')
                        : null;

                      const allowedLossGrams = finishGrams > 0 ? finishGrams * (ceiling / 100) : 0;
                      const expectedScrapGrams = finishGrams > 0 ? Math.max(0, issuedGold - (finishGrams + allowedLossGrams)) : 0;

                      return (
                        <tr key={item.id}>
                          {/* 1. CRAFTSMAN */}
                          <td>
                            <strong className="craftsman-name" style={{ color: 'var(--text-main)', fontSize: '12px' }}>{displayName}</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--gold-primary)', fontWeight: '700' }}>{item.craftsmanId}</span>
                              <span className={tierBadge} style={{ fontSize: '9px', padding: '1px 6px' }}>{displayTier}</span>
                            </div>
                          </td>

                          {/* 2. CHANNEL (Main Category badge only) */}
                          <td>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: channelBadge.color,
                              background: channelBadge.bg,
                              border: `1px solid ${channelBadge.color}33`,
                              display: 'inline-block',
                              whiteSpace: 'nowrap'
                            }} title={item.channelName || channelBadge.label}>
                              {channelBadge.label}
                            </span>
                          </td>

                          {/* 3. ORDER NUMBER */}
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#93c5fd', fontSize: '12px' }}>{item.workOrder}</span>
                            {item.isRollover && (
                              <div style={{ marginTop: '2px' }}>
                                <span style={{ fontSize: '9px', background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.4)', borderRadius: '3px', padding: '1px 5px', fontWeight: '600' }}>
                                  🔁 Rollover
                                </span>
                              </div>
                            )}
                          </td>

                          {/* 4. DESIGN */}
                          <td>
                            <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '12px', lineHeight: '1.3' }}>{item.designName}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{item.designCode} ({item.unitSMT}m)</div>
                          </td>

                          {/* 5. QTY */}
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '12px' }}>
                            {item.qtyAllocated}
                          </td>

                          {/* 6. GIVEN TIME */}
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap', color: '#cbd5e1' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600' }}>
                              <Clock size={11} style={{ color: '#94a3b8' }} />
                              {givenTimeStr}
                            </span>
                          </td>

                          {/* 7. START TIME */}
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <span style={{ color: '#fde047', fontWeight: '700', fontSize: '11px' }}>
                              {startTimeStr}
                            </span>
                          </td>

                          {/* 8. TARGET ETA */}
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: rowEta.isMultiDay ? '#38bdf8' : '#f59e0b',
                              background: rowEta.isMultiDay ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              border: `1px solid ${rowEta.isMultiDay ? 'rgba(56, 189, 248, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                              display: 'inline-block'
                            }}>
                              🎯 {targetETAStr}
                            </span>
                          </td>

                          {/* 9. ASSUMED HRS */}
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '12px' }}>
                              {(item.effectiveAssumedHours !== undefined ? parseFloat(item.effectiveAssumedHours) : (item.assumedHours || (item.budgetedSMT / 60))).toFixed(2)}h
                            </div>
                            {item.isMultiDay && (
                              <div style={{ fontSize: '10px', color: item.isRollover ? '#c084fc' : '#38bdf8', whiteSpace: 'nowrap' }} title={`Full order budget: ${(item.totalOrderAssumedHours || item.assumedHours || 12).toFixed(1)}h`}>
                                {item.isRollover ? (
                                  <span>(Day 2 of {(item.totalOrderAssumedHours || item.assumedHours || 12).toFixed(1)}h)</span>
                                ) : (
                                  <span>(Day 1 • {((item.totalOrderAssumedHours || item.assumedHours || 12) - (item.effectiveAssumedHours || 9)).toFixed(1)}h to het)</span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* 10. ACTUAL HRS */}
                          <td style={{ textAlign: 'right', color: isCompleted ? '#34d399' : 'var(--text-main)', fontWeight: '600', fontSize: '12px' }}>
                            {item.actualHours !== null && item.actualHours !== undefined && item.actualHours !== '' ? `${parseFloat(item.actualHours).toFixed(2)}h` : '—'}
                          </td>

                          {/* 11. BREAK TIME */}
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {(() => {
                              const isRowFinished = item.actualHours !== null && item.actualHours !== undefined && item.actualHours !== '';
                              if (!isRowFinished) {
                                return <span style={{ color: '#64748b' }}>—</span>;
                              }
                              const cIndex = (craftsmen || []).findIndex(c => c.id === item.craftsmanId);
                              const idxSeed = cIndex >= 0 ? cIndex : (parseInt((item.craftsmanId || '').replace(/\D/g, ''), 10) || 1);
                              let bHours = item.breakHours !== null && item.breakHours !== undefined && item.breakHours !== ''
                                ? parseFloat(item.breakHours)
                                : (item.breakMin ? parseFloat((item.breakMin / 60).toFixed(2)) : null);

                              if (bHours === null) {
                                const pseudoMin = 108 + ((idxSeed * 17) % 25);
                                bHours = parseFloat((pseudoMin / 60).toFixed(2));
                              }
                              const bMins = Math.round(bHours * 60);
                              const isOverStd = bHours > 2.05;
                              const isUnderStd = bHours < 1.92;

                              return (
                                <span title={`Craftsman Daily Meal & Tea Break: ${bHours.toFixed(2)} hrs (${bMins}m) • Factory Standard Allowance = 2.00 hrs (120m)`}>
                                  <span style={{ 
                                    color: isOverStd ? '#fbbf24' : isUnderStd ? '#67e8f9' : '#a5f3fc',
                                    fontWeight: '700',
                                    fontSize: '11px'
                                  }}>
                                    ☕ {bHours.toFixed(2)}h
                                  </span>
                                  <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '3px' }}>
                                    ({bMins}m)
                                  </span>
                                </span>
                              );
                            })()}
                          </td>

                          {/* 12. ISSUE WEIGHT */}
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {issuedGold > 0 ? (
                              <div>
                                <div style={{ color: '#fef08a', fontWeight: '700', fontSize: '12px' }}>
                                  {issuedGold.toFixed(2)}g
                                </div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
                                  {item.metalType || 'Gold 22K'}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#64748b' }}>—</span>
                            )}
                          </td>

                          {/* 13. RETURN WEIGHT & 3.75% WASTAGE */}
                          <td style={{ minWidth: '220px', fontSize: '11px' }}>
                            {issuedGold > 0 ? (
                              <div>
                                {finishGrams > 0 ? (
                                  <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '11px', marginBottom: '2px' }}>
                                      <span>Piece: <strong style={{ color: '#fff' }}>{finishGrams.toFixed(2)}g</strong></span>
                                      <span style={{ color: '#fde047', fontSize: '10px' }}>{ceiling}% Loss: <strong>{allowedLossGrams.toFixed(2)}g</strong></span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1', fontSize: '10px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '2px' }}>
                                      <span>Scrap: <strong style={{ color: scrapReturned > 0 ? '#4ade80' : '#fbbf24' }}>{scrapReturned > 0 ? `${scrapReturned.toFixed(2)}g` : 'Pending'}</strong></span>
                                      <span>
                                        {!isCompleted ? (
                                          <span style={{ color: '#38bdf8', fontWeight: '600' }}>🟡 Bench In-Progress</span>
                                        ) : scrapReturned > 0 ? (
                                          recon && recon.isLossPermitted ? (
                                            <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✅ Balanced</span>
                                          ) : (
                                            <span style={{ color: '#f87171', fontWeight: 'bold' }}>⚠️ Excess Loss ({recon ? recon.actualLossPct : (item.goldLossPct || 0)}%)</span>
                                          )
                                        ) : (
                                          <span style={{ color: '#fbbf24', fontWeight: '600' }}>⚠️ Exp Scrap: ~{expectedScrapGrams.toFixed(2)}g</span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '11px', color: isCompleted ? '#94a3b8' : '#38bdf8', background: 'rgba(15, 23, 42, 0.5)', padding: '5px 8px', borderRadius: '5px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                    {!isCompleted ? (
                                      <div>
                                        <div style={{ fontWeight: '600' }}>🟡 Pending Return</div>
                                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Ceiling: <strong style={{ color: '#fef08a' }}>{ceiling}%</strong> allowable loss</div>
                                      </div>
                                    ) : item.goldLossPct !== null ? (
                                      <span style={{ color: parseFloat(item.goldLossPct) <= ceiling ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                                        {parseFloat(item.goldLossPct) <= ceiling ? `✅ Balanced (${parseFloat(item.goldLossPct).toFixed(2)}% loss)` : `⚠️ Excess Loss (${parseFloat(item.goldLossPct).toFixed(2)}%)`}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#34d399', fontWeight: 'bold' }}>✅ Vault Return Completed</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#64748b' }}>—</span>
                            )}
                          </td>

                          {/* 14. STATUS */}
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              background: item.status === 'Completed' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: item.status === 'Completed' ? '#34d399' : '#fcd34d',
                              border: `1px solid ${item.status === 'Completed' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                              whiteSpace: 'nowrap',
                              display: 'inline-block'
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
                <div className="bar-val-badge worker-perf-badge" style={{ color: worker.efficiency >= 90 ? '#34d399' : '#fef08a' }}>
                  {worker.efficiency}% ({worker.smt}m)
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted, #94a3b8)', display: 'flex', justifyContent: 'space-between' }}>
            <span>⭐ Craftsmen achieving ≥ 85% efficiency receive the Rs. 450 daily bonus.</span>
            <button 
              onClick={() => onNavigateTab('craftsmen')}
              style={{ color: 'var(--gold-primary, #d4af37)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>View all 63</span> <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Live 63-Bench Workshop Floor Map */}
        <div className="luxury-box">
          <div className="luxury-box-header" style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={20} color="#d4af37" />
                  <div>
                    <h3 className="luxury-box-title" style={{ margin: 0, fontSize: '16px' }}>
                      Live 63-Bench Workshop Floor Map
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
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
                        color: 'var(--gold-light, #fef08a)',
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
              <div className="telemetry-filter-bar" style={{
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

              {/* 🚨 Live Telemetry Alert Bar for Overdue & Lagging Craftsmen */}
              {benchCounts.OVERDUE > 0 || benchCounts.LAGGING > 0 ? (
                <div className="live-telemetry-alert-banner" style={{
                  background: 'linear-gradient(135deg, rgba(255, 46, 86, 0.16) 0%, rgba(249, 115, 22, 0.12) 100%)',
                  border: '1.5px solid rgba(255, 46, 86, 0.5)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  margin: '12px 0 14px 0',
                  boxShadow: '0 4px 20px rgba(255, 46, 86, 0.18)',
                  animation: 'alertGlowPulse 2.8s infinite ease-in-out'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="live-alert-dot" style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#ff2e56',
                        boxShadow: '0 0 10px #ff2e56',
                        display: 'inline-block'
                      }} />
                      <span className="live-alert-heading" style={{ fontSize: '13px', fontWeight: '900', color: '#fff', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                        🚨 Live Schedule Alert: {benchCounts.OVERDUE} Benches Overdue {benchCounts.LAGGING > 0 ? `• ${benchCounts.LAGGING} Lagging Behind Pace` : ''}
                      </span>
                      <span className="live-alert-badge" style={{ fontSize: '11px', color: '#fda4af', background: 'rgba(255, 46, 86, 0.25)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        Action Required
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="alert-btn-isolate alert-btn-isolate-overdue"
                        onClick={() => {
                          playAlertChime();
                          setBenchStatusFilter(benchStatusFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE');
                        }}
                        style={{
                          background: benchStatusFilter === 'OVERDUE' ? '#ff2e56' : 'rgba(255, 46, 86, 0.25)',
                          border: '1px solid #ff2e56',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>🚨</span>
                        <span>{benchStatusFilter === 'OVERDUE' ? 'Showing All Benches (Reset)' : `Isolate ${benchCounts.OVERDUE} Overdue Benches`}</span>
                      </button>

                      {benchCounts.LAGGING > 0 && (
                        <button
                          type="button"
                          className="alert-btn-isolate alert-btn-isolate-lagging"
                          onClick={() => {
                            playAlertChime();
                            setBenchStatusFilter(benchStatusFilter === 'LAGGING' ? 'ALL' : 'LAGGING');
                          }}
                          style={{
                            background: benchStatusFilter === 'LAGGING' ? '#f97316' : 'rgba(249, 115, 22, 0.25)',
                            border: '1px solid #f97316',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>⚠️</span>
                          <span>{benchStatusFilter === 'LAGGING' ? 'Showing All Benches' : `Isolate ${benchCounts.LAGGING} Lagging`}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="alert-btn-test"
                        onClick={() => playAlertChime('/sounds/alert.wav')}
                        title="Test Overdue Alarm alert chime sound"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#fef08a',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>🔊</span>
                        <span>Test Alert</span>
                      </button>

                      <button
                        type="button"
                        className="alert-btn-toggle"
                        onClick={() => {
                          const nextVal = !autoOverdueSound;
                          setAutoOverdueSound(nextVal);
                          try {
                            localStorage.setItem('ashadi_auto_overdue_sound', String(nextVal));
                          } catch (e) {}
                          if (nextVal) {
                            playAlertChime('/sounds/alert.wav');
                          }
                        }}
                        title={autoOverdueSound ? "Overdue Alarm is ACTIVE: Automatically rings loud alarm whenever any bench becomes Overdue" : "Overdue Alarm is MUTED"}
                        style={{
                          background: autoOverdueSound ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                          border: `1px solid ${autoOverdueSound ? '#ff2e56' : 'rgba(255, 255, 255, 0.2)'}`,
                          color: autoOverdueSound ? '#fca5a5' : '#94a3b8',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>{autoOverdueSound ? '🔔' : '🔕'}</span>
                        <span>{autoOverdueSound ? 'Overdue Alarm: ON' : 'Overdue Alarm: OFF'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Delayed Craftsmen Chips Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <span className="inspect-chip-label" style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      Click to Inspect:
                    </span>
                    {benchStatusList
                      .filter(b => b.status === 'OVERDUE' || b.status === 'LAGGING')
                      .sort((a, b) => (b.overdueMins || 0) - (a.overdueMins || 0))
                      .map(b => (
                        <button
                          key={b.craftsman.id}
                          type="button"
                          className="inspect-chip-btn"
                          onClick={() => {
                            setSelectedBench(b);
                            playAlertChime();
                          }}
                          style={{
                            background: selectedBench?.craftsman?.id === b.craftsman.id 
                              ? 'rgba(255, 46, 86, 0.45)' 
                              : (b.status === 'OVERDUE' ? 'rgba(255, 46, 86, 0.22)' : 'rgba(249, 115, 22, 0.22)'),
                            border: `1px solid ${selectedBench?.craftsman?.id === b.craftsman.id ? '#d4af37' : (b.status === 'OVERDUE' ? '#ff2e56' : '#f97316')}`,
                            color: '#fff',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: selectedBench?.craftsman?.id === b.craftsman.id ? '0 0 10px #d4af37' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                          title={`Click to inspect Bench ${b.craftsman.id} (${b.craftsman.name})`}
                        >
                          <span>{b.statusIcon}</span>
                          <strong className="inspect-chip-id" style={{ color: '#fef08a' }}>{b.craftsman.id}</strong>
                          <span className="inspect-chip-name">{b.displayName}</span>
                          <span className="inspect-chip-overdue-time" style={{ color: b.status === 'OVERDUE' ? '#fda4af' : '#fed7aa', fontSize: '10px' }}>
                            ({b.status === 'OVERDUE' ? `+${formatDurationMinutes(b.overdueMins)}` : 'Lagging'})
                          </span>
                        </button>
                      ))
                    }
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  margin: '12px 0 14px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#86efac'
                }}>
                  <span>🟢</span>
                  <span style={{ fontWeight: 'bold' }}>All Workshop Benches On Schedule:</span>
                  <span style={{ color: '#cbd5e1' }}>Zero lagging or overdue benches detected for this shift window.</span>
                </div>
              )}

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
                      className={`bench-card-mini ${item.status === 'OVERDUE' ? 'bench-card-overdue-live' : ''} ${item.status === 'LAGGING' ? 'bench-card-lagging-live' : ''}`}
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
                        <span className="bench-card-id" style={{ fontSize: '11px', fontWeight: '900', color: isSelected ? 'var(--gold-primary, #fef08a)' : 'var(--text-main, #fff)' }}>
                          {c.id}
                        </span>
                        <span className={`bench-card-tier-pill ${c.skillTier === 'Grade A' ? 'tier-a' : c.skillTier === 'Grade B' ? 'tier-b' : 'tier-c'}`} style={{
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
                      <div className="bench-card-name" style={{
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
                      <div className="bench-card-status-pill" style={{
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
                          {item.status === 'OVERDUE' ? `+${formatDurationMinutes(item.overdueMins)}` :
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
                            <strong style={{ color: '#ff2e56' }}>Critical Overdue (+{formatDurationMinutes(selectedBench.overdueMins)}):</strong> Bench has exceeded Target ETA ({selectedBench.targetETATimeStr}). Needs immediate floor supervisor attention.
                          </span>
                        </div>
                      )}

                      {selectedBench.etaData?.isMultiDay && selectedBench.status === 'WORKING' && (
                        <div style={{ marginTop: '8px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.4)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#bae6fd' }}>
                          <span style={{ fontSize: '15px' }}>📅</span>
                          <span>
                            <strong style={{ color: '#38bdf8' }}>Multi-Day Shift Span:</strong> Order spans across shift windows (shift closes at 08:30 PM, resumes 07:00 AM). Target Completion: <strong style={{ color: '#fde047' }}>{selectedBench.targetETATimeStr}</strong> ({selectedBench.allocation?.assumedHours || 12}h budgeted).
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
      </div>
    </div>
  );
}
