/**
 * Ashadi Jewellers - Metallurgical Floor Timing & Calculation Utilities
 * Shared helper module to eliminate circular dependencies across React components.
 */

// Comprehensive precious metals and alloy master catalogue
export const STANDARD_METALS = [
  { id: 'Gold 24K', label: '🟡 Gold 24K (Pure 999.9 Bullion • Ceiling 3.2%)', family: 'HighGold', ceiling: 3.2 },
  { id: 'Gold 22K', label: '🟡 Gold 22K (Standard 916 Sovereign • Ceiling 3.75%)', family: 'HighGold', ceiling: 3.75 },
  { id: 'Gold 18K Yellow', label: '🟡 Gold 18K Yellow (750 Standard • Ceiling 3.0%)', family: 'CommercialGold', ceiling: 3.0 },
  { id: 'Gold 18K White', label: '❄️ Gold 18K White (750 Nickel/Palladium • Ceiling 3.0%)', family: 'CommercialGold', ceiling: 3.0 },
  { id: 'Gold 18K Rose', label: '🌸 Gold 18K Rose (750 Pink Copper • Ceiling 3.0%)', family: 'CommercialGold', ceiling: 3.0 },
  { id: 'Gold 14K Yellow', label: '🟡 Gold 14K Yellow (585 Export Grade • Ceiling 2.8%)', family: 'ModernGold', ceiling: 2.8 },
  { id: 'Gold 14K White', label: '❄️ Gold 14K White (585 Rhodium Finish • Ceiling 2.8%)', family: 'ModernGold', ceiling: 2.8 },
  { id: 'Gold 14K Rose', label: '🌸 Gold 14K Rose (585 Modern Pink • Ceiling 2.8%)', family: 'ModernGold', ceiling: 2.8 },
  { id: 'Gold 9K', label: '🟡 Gold 9K (375 British Standard • Ceiling 2.5%)', family: 'ModernGold', ceiling: 2.5 },
  { id: 'Platinum 950', label: '💎 Platinum 950 (High-Purity 1768°C • Ceiling 1.8% • Grade A)', family: 'Platinum', ceiling: 1.8 },
  { id: 'Platinum 900', label: '💎 Platinum 900 (10% Iridium Master • Ceiling 1.8% • Grade A)', family: 'Platinum', ceiling: 1.8 },
  { id: 'Palladium 950', label: '💍 Palladium 950 (Hypoallergenic Luxury • Ceiling 1.8%)', family: 'Platinum', ceiling: 1.8 },
  { id: 'Silver 925', label: '⚪ Silver 925 (Sterling Silver • Ceiling 5.5%)', family: 'Silver', ceiling: 5.5 },
  { id: 'Silver 999', label: '⚪ Silver 999 (Fine Pure Silver • Ceiling 5.0%)', family: 'Silver', ceiling: 5.0 },
  { id: 'Brass / Bronze', label: '🥉 Brass / Bronze (Master Model Prototype • Ceiling 6.0%)', family: 'BaseMetal', ceiling: 6.0 },
  { id: 'Copper', label: '🥉 Copper (Forming Sheet / Blank • Ceiling 6.0%)', family: 'BaseMetal', ceiling: 6.0 }
];

export const getMetalScrapCeiling = (metal) => {
  if (!metal) return 3.75;
  const found = STANDARD_METALS.find(m => m.id === metal || m.id.toLowerCase() === metal.toLowerCase());
  if (found) return found.ceiling;
  const lower = String(metal).toLowerCase();
  if (lower.includes('platinum') || lower.includes('palladium')) return 1.8;
  if (lower.includes('silver')) return 5.5;
  if (lower.includes('24k')) return 3.2;
  if (lower.includes('22k')) return 3.75;
  if (lower.includes('18k')) return 3.0;
  if (lower.includes('14k')) return 2.8;
  if (lower.includes('9k')) return 2.5;
  if (lower.includes('brass') || lower.includes('bronze') || lower.includes('copper')) return 6.0;
  return 3.75;
};

// Scheduled factory breaks in 12-hour shift (minutes from midnight)
export const FACTORY_BREAKS = [
  { name: 'Plant Breakfast Interval', start: 8 * 60 + 30, end: 9 * 60, duration: 30 },
  { name: 'Morning Tea', start: 10 * 60 + 30, end: 10 * 60 + 45, duration: 15 },
  { name: 'Plant Lunch & Interval', start: 13 * 60, end: 13 * 60 + 45, duration: 45 },
  { name: 'Evening Tea', start: 16 * 60, end: 16 * 60 + 30, duration: 30 },
  { name: 'Night Dinner & OT Interval', start: 19 * 60 + 15, end: 19 * 60 + 45, duration: 30 }
];

// Helper to format minutes from midnight into 12-hr time string (e.g. 845 -> "02:05 PM")
export const formatMinutesToTime = (totalMinutes) => {
  if (isNaN(totalMinutes) || totalMinutes === null || totalMinutes === undefined) return '05:00 PM';
  const m = Math.round(totalMinutes);
  let hours = Math.floor(m / 60) % 24;
  const mins = m % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const minsStr = mins < 10 ? `0${mins}` : mins;
  const hoursStr = hours < 10 ? `0${hours}` : hours;
  return `${hoursStr}:${minsStr} ${ampm}`;
};

// Convert HH:MM or HH:MM AM/PM string (e.g. "08:30" or "02:15 PM") to minutes from midnight
export const timeStringToMinutes = (timeStr, defaultMinutes = 510) => {
  if (!timeStr) return defaultMinutes;
  const str = String(timeStr).trim();
  const match = str.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!match) return defaultMinutes;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toLowerCase() : null;
  if (isNaN(h) || isNaN(m)) return defaultMinutes;
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return h * 60 + m;
};

// Check if a specific minute falls within a scheduled plant break
export const getActiveBreak = (minuteOfDay) => {
  if (isNaN(minuteOfDay)) return null;
  return FACTORY_BREAKS.find(b => minuteOfDay >= b.start && minuteOfDay < b.end);
};

// Helper to format minutes into clean human-readable Hours & Minutes (e.g. 203 -> "3h 23m", 45 -> "45m", 150 -> "2h 30m")
export const formatDurationMinutes = (totalMinutes) => {
  if (isNaN(totalMinutes) || totalMinutes === null || totalMinutes === undefined || totalMinutes <= 0) {
    return '0m';
  }
  const mins = Math.round(totalMinutes);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${m}m`;
};

// Metallurgical ETA Engine: Computes wall-clock target completion time accounting for skill tier, breaks, and multi-day shift rollover
export const calculateDynamicETA = (startMinutes, budgetedSMT, skillTier, startDate = null) => {
  let speedMultiplier = 1.0;
  if (skillTier === 'Grade A') speedMultiplier = 1.10;
  else if (skillTier === 'Grade C') speedMultiplier = 0.85;

  const numSMT = parseFloat(budgetedSMT);
  const validSMT = isNaN(numSMT) || numSMT <= 0 ? 60 : numSMT;
  const requiredWorkMinutes = Math.max(15, Math.round(validSMT / speedMultiplier));

  const SHIFT_START = 7 * 60; // 07:00 AM (Workshop Shift Open)
  const SHIFT_END = 20 * 60 + 30; // 08:30 PM (Workshop Shift & Overtime Close)

  let currentMin = isNaN(startMinutes) ? 510 : startMinutes;
  // If given time is before shift start, clamp to shift start
  if (currentMin < SHIFT_START) currentMin = SHIFT_START;
  
  let dayOffset = 0;
  // If given time is at or after shift end, roll to next day's shift start
  if (currentMin >= SHIFT_END) {
    dayOffset += 1;
    currentMin = SHIFT_START;
  }

  let workDone = 0;
  let totalBreakMinutesEncountered = 0;
  const encounteredBreakNames = new Set();
  const daysMap = {};

  const getDateForOffset = (baseDateStr, offset) => {
    if (!baseDateStr) return null;
    try {
      const parts = String(baseDateStr).split('-').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) return null;
      const utc = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + offset));
      return utc.toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  };

  // Safety cap of 14 working days
  while (workDone < requiredWorkMinutes && dayOffset < 14) {
    if (!daysMap[dayOffset]) {
      daysMap[dayOffset] = {
        dayOffset,
        dateStr: getDateForOffset(startDate, dayOffset),
        workMinutes: 0,
        breakMinutes: 0,
        startMin: currentMin,
        endMin: currentMin
      };
    }

    if (currentMin >= SHIFT_END) {
      // Shift closes at 08:30 PM, roll over to next morning 07:00 AM
      dayOffset += 1;
      currentMin = SHIFT_START;
      continue;
    }

    const activeB = FACTORY_BREAKS.find(b => currentMin >= b.start && currentMin < b.end);
    if (activeB) {
      totalBreakMinutesEncountered += 1;
      encounteredBreakNames.add(activeB.name);
      daysMap[dayOffset].breakMinutes += 1;
    } else {
      workDone += 1;
      daysMap[dayOffset].workMinutes += 1;
    }
    daysMap[dayOffset].endMin = currentMin + 1;
    currentMin += 1;
  }

  const dailyBreakdown = Object.values(daysMap).map(d => ({
    ...d,
    workHours: parseFloat((d.workMinutes / 60).toFixed(2)),
    breakHours: parseFloat((d.breakMinutes / 60).toFixed(2)),
    startTimeStr: formatMinutesToTime(d.startMin),
    endTimeStr: formatMinutesToTime(d.endMin)
  }));

  const timeOnly = formatMinutesToTime(currentMin);
  let targetETATime;
  if (dayOffset === 0) {
    targetETATime = timeOnly;
  } else if (dayOffset === 1) {
    targetETATime = `Tomorrow ${timeOnly}`;
  } else {
    targetETATime = `+${dayOffset}d ${timeOnly}`;
  }

  const targetDate = startDate ? getDateForOffset(startDate, dayOffset) : null;

  const todayWorkHours = dailyBreakdown[0]?.workHours || parseFloat((requiredWorkMinutes / 60).toFixed(2));
  const rolloverWorkHours = dailyBreakdown.slice(1).reduce((sum, d) => sum + d.workHours, 0);

  return {
    targetETAMinutes: currentMin,
    targetETATime,
    timeOnly,
    dayOffset,
    targetDate,
    requiredWorkMinutes,
    totalBreakMinutesEncountered,
    breakSummary: Array.from(encounteredBreakNames).join(' + '),
    speedMultiplier,
    isMultiDay: dayOffset > 0,
    dailyBreakdown,
    todayWorkHours,
    rolloverWorkHours: parseFloat(rolloverWorkHours.toFixed(2))
  };
};

/**
 * Returns the exact working hours slice and metadata for an order on a given target calendar date.
 * If a 12h order started on 2026-11-25 at 09:30 AM:
 * - On 2026-11-25: returns 9.00h (Day 1 of 2)
 * - On 2026-11-26: returns 3.00h (Day 2 of 2, Rollover from Nov 25)
 */
export const getDaySliceForOrder = (order, targetDateStr) => {
  if (!order || !targetDateStr) return null;
  const smtMins = order.budgetedSMT || (order.assumedHours ? order.assumedHours * 60 : 240);
  const startMin = timeStringToMinutes(order.dispatchTime || order.orderStartTime, 435);
  const eta = calculateDynamicETA(startMin, smtMins, order.skillTier || 'Grade B', order.date || targetDateStr);
  
  const foundSlice = eta.dailyBreakdown.find(d => d.dateStr === targetDateStr);
  if (!foundSlice) {
    if (order.date === targetDateStr) {
      return {
        workHours: eta.todayWorkHours,
        totalOrderHours: order.assumedHours || parseFloat((smtMins / 60).toFixed(2)),
        isFirstDay: true,
        isRollover: false,
        dayOffset: 0,
        startTimeStr: order.dispatchTime || '07:15 AM',
        endTimeStr: eta.targetETATime,
        eta
      };
    }
    return null;
  }

  return {
    workHours: foundSlice.workHours,
    totalOrderHours: order.assumedHours || parseFloat((smtMins / 60).toFixed(2)),
    isFirstDay: foundSlice.dayOffset === 0,
    isRollover: foundSlice.dayOffset > 0,
    dayOffset: foundSlice.dayOffset,
    rolloverFromDate: foundSlice.dayOffset > 0 ? order.date : null,
    startTimeStr: foundSlice.startTimeStr,
    endTimeStr: foundSlice.endTimeStr,
    eta
  };
};

const compareDateAndMinute = (dateA, minA, dateB, minB) => {
  if (dateA && dateB && dateA !== dateB) {
    return dateA < dateB ? -1 : 1;
  }
  return minA - minB;
};

export const diffDaysBetween = (dateStart, dateEnd) => {
  if (!dateStart || !dateEnd) return 0;
  const pA = String(dateStart).split('-').map(Number);
  const pB = String(dateEnd).split('-').map(Number);
  if (pA.length !== 3 || pB.length !== 3 || pA.some(isNaN) || pB.some(isNaN)) return 0;
  const msA = Date.UTC(pA[0], pA[1] - 1, pA[2]);
  const msB = Date.UTC(pB[0], pB[1] - 1, pB[2]);
  return Math.round((msB - msA) / 86400000);
};

/**
 * Schedules all orders per craftsman sequentially across multiple days.
 * If a craftsman is given 2 or 3 orders (e.g. 12h + 3h + 3h), subsequent orders
 * automatically queue behind the previous order's completion date & time.
 */
export const computeCraftsmanSchedules = (allocations = []) => {
  const scheduleMap = new Map();
  if (!allocations || allocations.length === 0) return scheduleMap;

  const byCraftsman = new Map();
  allocations.forEach(a => {
    const key = (a.craftsmanId || a.craftsmanName || 'UNASSIGNED').toLowerCase();
    if (!byCraftsman.has(key)) byCraftsman.set(key, []);
    byCraftsman.get(key).push(a);
  });

  byCraftsman.forEach((orders) => {
    const sorted = [...orders].sort((x, y) => {
      const dX = x.date || '9999-12-31';
      const dY = y.date || '9999-12-31';
      if (dX !== dY) return dX.localeCompare(dY);
      const tX = timeStringToMinutes(x.orderGivenTime || x.dispatchTime || x.orderStartTime, 435);
      const tY = timeStringToMinutes(y.orderGivenTime || y.dispatchTime || y.orderStartTime, 435);
      if (tX !== tY) return tX - tY;
      return (x.createdAt || '').localeCompare(y.createdAt || '');
    });

    let cursorDate = null;
    let cursorMin = 420;
    let prevOrderUncompleted = false;
    let prevOrderOverdue = false;

    sorted.forEach((order, queueIdx) => {
      const givenDate = order.date || new Date().toISOString().split('T')[0];
      const defaultStartMin = 7 * 60 + Math.min(30, (queueIdx % 10) * 3);
      const givenMin = timeStringToMinutes(order.orderGivenTime || order.dispatchTime || order.orderStartTime, defaultStartMin);
      const orderGivenTimeStr = formatMinutesToTime(givenMin);

      const explicitAssumed = parseFloat(order.assumedHours);
      const budgetedHours = (!isNaN(explicitAssumed) && explicitAssumed > 0)
        ? explicitAssumed
        : (order.budgetedSMT ? order.budgetedSMT / 60 : 4.0);
      const budgetedSMT = Math.round(budgetedHours * 60);

      let benchStartDate = givenDate;
      let benchStartMin = givenMin;
      if (queueIdx > 0 && cursorDate) {
        if (compareDateAndMinute(givenDate, givenMin, cursorDate, cursorMin) < 0) {
          benchStartDate = cursorDate;
          benchStartMin = cursorMin;
        }
      }
      const benchStartTimeStr = formatMinutesToTime(benchStartMin);

      const etaData = calculateDynamicETA(benchStartMin, budgetedSMT, order.skillTier || 'Grade B', benchStartDate);
      const isCompleted = order.status === 'Completed' || (order.actualHours !== null && order.actualHours !== undefined && order.actualHours !== '');

      // Advance sequential cursor: if completed with actualHours, use actual finish; otherwise use budgeted ETA
      if (isCompleted && order.actualHours !== null && order.actualHours !== undefined && order.actualHours !== '') {
        const actualSMT = Math.max(15, Math.round(parseFloat(order.actualHours) * 60));
        const actualEta = calculateDynamicETA(benchStartMin, actualSMT, order.skillTier || 'Grade B', benchStartDate);
        cursorDate = actualEta.targetDate || benchStartDate;
        cursorMin = actualEta.targetETAMinutes;
      } else {
        cursorDate = etaData.targetDate || benchStartDate;
        cursorMin = etaData.targetETAMinutes;
      }

      let punctuality = 'ON_TRACK';
      let punctualityLabel = 'On Track';
      let punctualityColor = '#10b981';

      if (isCompleted) {
        const actualH = parseFloat(order.actualHours) || budgetedHours;
        const diffH = parseFloat((actualH - budgetedHours).toFixed(2));
        if (diffH < -0.1) {
          punctuality = 'EARLY';
          punctualityLabel = `Early by ${formatDurationMinutes(Math.abs(Math.round(diffH * 60)))}`;
          punctualityColor = '#38bdf8';
        } else if (diffH > 0.1) {
          punctuality = 'LATE';
          punctualityLabel = `Late by ${formatDurationMinutes(Math.round(diffH * 60))}`;
          punctualityColor = '#f59e0b';
        } else {
          punctuality = 'ON_TIME';
          punctualityLabel = 'Delivered On Time';
          punctualityColor = '#10b981';
        }
      } else if (queueIdx > 0 && prevOrderUncompleted) {
        punctuality = 'QUEUED';
        punctualityLabel = prevOrderOverdue
          ? `In Queue (#${queueIdx + 1} • Delayed by Prev)`
          : `In Queue (#${queueIdx + 1} at Bench)`;
        punctualityColor = '#c084fc';
      }

      const isQueued = !isCompleted && queueIdx > 0 && prevOrderUncompleted;
      const totalSpanDays = Math.max(1, (etaData.dailyBreakdown || []).length);

      const meta = {
        orderIdKey: order.id || order._id || order.workOrder,
        orderGivenDate: givenDate,
        orderGivenMin: givenMin,
        orderGivenTimeStr,
        benchStartDate,
        benchStartMin,
        benchStartTimeStr,
        budgetedHours,
        budgetedSMT,
        etaData,
        totalSpanDays,
        queueIndex: queueIdx,
        queueTotal: sorted.length,
        isCompleted,
        isQueued,
        punctuality,
        punctualityLabel,
        punctualityColor
      };

      scheduleMap.set(order.id || order._id || order.workOrder, meta);
      prevOrderUncompleted = !isCompleted;
    });
  });

  return scheduleMap;
};

/**
 * Returns all orders active, sliced, queued, or overdue on targetDateStr.
 */
export const getScheduledAllocationsForDate = (allocations = [], targetDateStr, todayIsoStr = null) => {
  if (!allocations || allocations.length === 0 || !targetDateStr) return [];
  const todayStr = todayIsoStr || new Date().toISOString().split('T')[0];
  const scheduleMap = computeCraftsmanSchedules(allocations);
  const result = [];

  allocations.forEach(a => {
    const meta = scheduleMap.get(a.id || a._id || a.workOrder);
    if (!meta) return;

    const { etaData, isCompleted, isQueued, benchStartDate, budgetedHours, totalSpanDays } = meta;
    const foundSlice = (etaData.dailyBreakdown || []).find(d => d.dateStr === targetDateStr);
    const isGivenOnDate = a.date === targetDateStr;

    // Only include orders that actually run on targetDateStr (either a daily slice or queued on targetDateStr)
    if (!foundSlice && !isGivenOnDate) {
      return;
    }

    const effectiveHours = foundSlice
      ? foundSlice.workHours
      : (isGivenOnDate && isQueued ? 0 : budgetedHours);

    const dayIndexInOrder = foundSlice ? (foundSlice.dayOffset + 1) : 1;

    const isRollover = foundSlice
      ? (foundSlice.dayOffset > 0 || benchStartDate !== a.date)
      : false;

    result.push({
      ...a,
      effectiveAssumedHours: effectiveHours,
      totalOrderAssumedHours: budgetedHours,
      totalSpanDays,
      dayIndexInOrder,
      isFirstDay: dayIndexInOrder === 1 && benchStartDate === a.date,
      isRollover,
      rolloverFromDate: isRollover ? a.date : null,
      orderGivenDate: meta.orderGivenDate,
      orderGivenTimeStr: meta.orderGivenTimeStr,
      benchStartDate: meta.benchStartDate,
      benchStartMin: meta.benchStartMin,
      benchStartTimeStr: meta.benchStartTimeStr,
      sliceStartTime: foundSlice ? foundSlice.startTimeStr : meta.benchStartTimeStr,
      sliceEndTime: foundSlice ? foundSlice.endTimeStr : etaData.targetETATime,
      etaData,
      isMultiDay: totalSpanDays > 1 || (etaData.targetDate && etaData.targetDate !== a.date),
      multiDayBreakdown: etaData.dailyBreakdown,
      queueIndex: meta.queueIndex,
      queueTotal: meta.queueTotal,
      isQueued,
      punctuality: meta.punctuality,
      punctualityLabel: meta.punctualityLabel,
      punctualityColor: meta.punctualityColor,
      isCompleted
    });
  });

  return result;
};

/**
 * Collects all unique calendar dates touched by any scheduled order (including rollover Day 2, Day 3...).
 */
export const getScheduledDatesFromAllocations = (allocations = []) => {
  const dateSet = new Set();
  if (!allocations || allocations.length === 0) return dateSet;
  const scheduleMap = computeCraftsmanSchedules(allocations);
  allocations.forEach(a => {
    if (a.date) dateSet.add(a.date);
    const meta = scheduleMap.get(a.id || a._id || a.workOrder);
    if (meta?.etaData?.dailyBreakdown) {
      meta.etaData.dailyBreakdown.forEach(d => {
        if (d.dateStr) dateSet.add(d.dateStr);
      });
    }
  });
  return dateSet;
};

/**
 * Unified real-time status & overdue evaluator used by BOTH DashboardView and LiveFloorMonitor.
 */
export const evaluateOrderLiveStatus = ({
  order,
  etaData,
  isCompleted,
  isQueued,
  effectiveMinuteOfDay,
  selectedDate,
  todayStr,
  activeBreak,
  benchStartDate,
  benchStartMin
}) => {
  if (isCompleted) {
    return {
      liveStatus: 'COMPLETED',
      isOverdue: false,
      overdueMins: 0,
      isLagging: false,
      progressPct: 100
    };
  }

  const isPaused = order?.status && (order.status === 'Paused' || order.status.includes('Paused'));
  if (isPaused) {
    return {
      liveStatus: 'PAUSED',
      isOverdue: false,
      overdueMins: 0,
      isLagging: false,
      progressPct: 85
    };
  }

  if (isQueued) {
    return {
      liveStatus: 'QUEUED',
      isOverdue: false,
      overdueMins: 0,
      isLagging: false,
      progressPct: 0
    };
  }

  // Evaluate overdue strictly comparing effective evaluation clock against (etaData.targetDate, etaData.targetETAMinutes).
  // When viewing today OR a past shift date for an uncompleted order, compare against the real current clock (todayStr, nowMinutes)
  // if real time has already passed the target ETA!
  let isOverdue = false;
  let overdueMins = 0;

  const evalDate = (selectedDate <= todayStr && todayStr) ? todayStr : selectedDate;
  const nowD = new Date();
  const realNowMinutes = nowD.getHours() * 60 + nowD.getMinutes();
  const evalMinute = (selectedDate === todayStr)
    ? effectiveMinuteOfDay
    : (selectedDate < todayStr ? realNowMinutes : effectiveMinuteOfDay);

  if (etaData && etaData.targetDate) {
    if (evalDate > etaData.targetDate) {
      isOverdue = true;
      const daysPast = diffDaysBetween(etaData.targetDate, evalDate);
      const minsOnFinalDay = Math.max(0, (20 * 60 + 30) - etaData.targetETAMinutes);
      const minsToday = Math.max(0, evalMinute - 7 * 60);
      overdueMins = minsOnFinalDay + Math.max(0, daysPast - 1) * (13.5 * 60) + minsToday;
    } else if (evalDate === etaData.targetDate) {
      if (evalMinute > etaData.targetETAMinutes) {
        isOverdue = true;
        overdueMins = evalMinute - etaData.targetETAMinutes;
      }
    }
    // if evalDate < etaData.targetDate -> still on an earlier day, NOT overdue
  } else if (etaData && !etaData.isMultiDay) {
    if (evalMinute > etaData.targetETAMinutes) {
      isOverdue = true;
      overdueMins = evalMinute - etaData.targetETAMinutes;
    }
  }

  // Calculate working minutes elapsed across days up to (selectedDate, effectiveMinuteOfDay)
  let elapsedWorkingMins = 0;
  if (etaData?.dailyBreakdown && etaData.dailyBreakdown.length > 0) {
    for (const daySlice of etaData.dailyBreakdown) {
      if (!daySlice.dateStr || daySlice.dateStr < selectedDate) {
        elapsedWorkingMins += daySlice.workMinutes;
      } else if (daySlice.dateStr === selectedDate) {
        const sliceStart = daySlice.startMin;
        const limitMin = Math.min(daySlice.endMin, effectiveMinuteOfDay);
        for (let m = sliceStart; m < limitMin; m++) {
          if (!FACTORY_BREAKS.some(b => m >= b.start && m < b.end)) {
            elapsedWorkingMins += 1;
          }
        }
      }
    }
  } else {
    const sMin = benchStartMin || 435;
    for (let m = sMin; m < effectiveMinuteOfDay; m++) {
      if (!FACTORY_BREAKS.some(b => m >= b.start && m < b.end)) {
        elapsedWorkingMins += 1;
      }
    }
  }

  const reqMins = etaData?.requiredWorkMinutes || 240;
  const progressPct = Math.min(100, Math.max(0, Math.round((elapsedWorkingMins / reqMins) * 100)));

  if (isOverdue) {
    return {
      liveStatus: 'OVERDUE',
      isOverdue: true,
      overdueMins: Math.round(overdueMins),
      isLagging: false,
      progressPct: 100,
      elapsedWorkingMins
    };
  }

  if (activeBreak) {
    return {
      liveStatus: 'ON_TRACK',
      isOverdue: false,
      overdueMins: 0,
      isLagging: false,
      progressPct,
      elapsedWorkingMins
    };
  }

  if (effectiveMinuteOfDay >= 20 * 60) {
    return {
      liveStatus: 'NIGHT_OT',
      isOverdue: false,
      overdueMins: 0,
      isLagging: false,
      progressPct,
      elapsedWorkingMins
    };
  }

  const isSameDayAndSlow = (!etaData?.isMultiDay) &&
    (effectiveMinuteOfDay - (benchStartMin || 435) > ((etaData?.targetETAMinutes || 1000) - (benchStartMin || 435)) * 0.82) &&
    progressPct < 70;

  if (isSameDayAndSlow) {
    return {
      liveStatus: 'AT_RISK',
      isOverdue: false,
      overdueMins: 0,
      isLagging: true,
      progressPct,
      elapsedWorkingMins
    };
  }

  return {
    liveStatus: 'ON_TRACK',
    isOverdue: false,
    overdueMins: 0,
    isLagging: false,
    progressPct,
    elapsedWorkingMins
  };
};

/**
 * Calculates Gold Wastage & Balance Scrap to Return
 * Standard factory metallurgical formula:
 * 1. Allowed Wastage = Finish Weight × (Scrap Rate % / 100)  [e.g. 3.75% for 22K]
 * 2. Expected Scrap to Return = Issued Gold - (Finish Weight + Allowed Wastage)
 * 3. Actual Loss = Issued Gold - (Finish Weight + Actual Scrap Returned)
 * 4. Scrap Variance = Actual Scrap Returned - Expected Scrap to Return
 */
export const calculateGoldWastageReconciliation = (issuedGrams, finishGrams, scrapReturnedGrams, metalType = 'Gold 22K') => {
  const issued = parseFloat(issuedGrams) || 0;
  const finish = parseFloat(finishGrams) || 0;
  const scrapReturned = parseFloat(scrapReturnedGrams) || 0;
  const ceilingPct = getMetalScrapCeiling(metalType); // 3.75% for 22K

  // Allowed loss calculated on Finished Jewellery Item Net Weight
  const allowedWastageGrams = parseFloat((finish * (ceilingPct / 100)).toFixed(3));
  
  // Required scrap dust to hand over to vault: Issued - (Finish + Allowed Loss)
  const expectedScrapGrams = parseFloat(Math.max(0, issued - (finish + allowedWastageGrams)).toFixed(3));
  
  // Total gold returned accounted: Finished Piece + Scrap Dust Returned
  const totalAccountedGrams = parseFloat((finish + scrapReturned).toFixed(3));
  
  // Actual loss occurred at the bench
  const actualLossGrams = parseFloat(Math.max(0, issued - totalAccountedGrams).toFixed(3));
  const actualLossPct = issued > 0 ? parseFloat(((actualLossGrams / issued) * 100).toFixed(2)) : 0;
  
  // Variance: Difference between actual scrap returned and expected scrap to return
  const scrapVarianceGrams = parseFloat((scrapReturned - expectedScrapGrams).toFixed(3));
  const isLossPermitted = actualLossGrams <= (allowedWastageGrams + 0.005);

  return {
    issuedGrams: issued,
    finishGrams: finish,
    scrapReturnedGrams: scrapReturned,
    ceilingPct,
    allowedWastageGrams,
    expectedScrapGrams,
    totalAccountedGrams,
    actualLossGrams,
    actualLossPct,
    scrapVarianceGrams,
    isLossPermitted
  };
};

// Formats comprehensive human-readable order details into a concise, high-scannability QR code payload
export const formatOrderQRDetails = (order, selectedDate = '') => {
  if (!order) return 'ASHADI-WO';

  const wo = order.workOrder || order.id || 'WO-PENDING';
  const date = order.date || selectedDate || new Date().toISOString().split('T')[0];
  
  let craftsman = order.craftsmanName || 'Craftsman';
  if (craftsman.startsWith('Mr. ')) craftsman = craftsman.replace('Mr. ', '');
  const craftsmanLabel = `${craftsman} (${order.craftsmanId || 'Bench'})`;

  const channel = order.channel === 'EXTERNAL_SHOP' ? 'B2B Shop' :
    order.channel === 'OWNER_SPECIAL' ? 'VIP Commission' :
    order.channel === 'FACTORY_STOCK' ? 'Factory Stock' : 'Showroom';

  let design = `${order.designCode || 'Design'} (${order.qtyAllocated || 1} pcs)`;
  if (order.isSuite && order.items && order.items.length > 0) {
    const suiteItemsStr = order.items.map(i => `${i.qty || 1}x ${i.designCode || i.designName || 'Item'}`).join(', ');
    design = `Suite: ${order.suiteName || 'Combo Set'} [${suiteItemsStr}] (${order.qtyAllocated || order.items.length} pcs)`;
  }
  const metal = `${order.metalType || 'Gold 22K'}${order.goldIssuedGrams ? ` (${order.goldIssuedGrams}g)` : ''}`;
  const ceiling = getMetalScrapCeiling(order.metalType);

  const smtMins = order.budgetedSMT || (order.assumedHours ? order.assumedHours * 60 : 240);
  const startMin = timeStringToMinutes(order.dispatchTime, 510);
  const eta = calculateDynamicETA(startMin, smtMins, order.skillTier || 'Grade B');

  return [
    'ASHADI JEWELLERS',
    `Order: ${wo} | ${date}`,
    `Craftsman: ${craftsmanLabel}`,
    `Channel: ${channel}`,
    `Design: ${design}`,
    `Metal: ${metal} | Scrap: max ${ceiling}%`,
    `Target ETA: ${eta.targetETATime}`
  ].join('\n');
};
