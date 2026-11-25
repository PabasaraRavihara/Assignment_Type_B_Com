/**
 * Ashadi Jewellers - Metallurgical Floor Timing & Calculation Utilities (Server-side)
 */

const FACTORY_BREAKS = [
  { name: 'Plant Breakfast Interval', start: 8 * 60 + 30, end: 9 * 60, duration: 30 },
  { name: 'Morning Tea', start: 10 * 60 + 30, end: 10 * 60 + 45, duration: 15 },
  { name: 'Plant Lunch & Interval', start: 13 * 60, end: 13 * 60 + 45, duration: 45 },
  { name: 'Evening Tea', start: 16 * 60, end: 16 * 60 + 30, duration: 30 },
  { name: 'Night Dinner & OT Interval', start: 19 * 60 + 15, end: 19 * 60 + 45, duration: 30 }
];

const formatMinutesToTime = (totalMinutes) => {
  if (isNaN(totalMinutes) || totalMinutes === null || totalMinutes === undefined) return '05:00 PM';
  const m = Math.round(totalMinutes);
  let hours = Math.floor(m / 60) % 24;
  const mins = m % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minsStr = mins < 10 ? `0${mins}` : mins;
  const hoursStr = hours < 10 ? `0${hours}` : hours;
  return `${hoursStr}:${minsStr} ${ampm}`;
};

const timeStringToMinutes = (timeStr, defaultMinutes = 510) => {
  if (!timeStr) return defaultMinutes;
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return defaultMinutes;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return defaultMinutes;
  return h * 60 + m;
};

const calculateDynamicETA = (startMinutes, budgetedSMT, skillTier, startDate = null) => {
  let speedMultiplier = 1.0;
  if (skillTier === 'Grade A') speedMultiplier = 1.10;
  else if (skillTier === 'Grade C') speedMultiplier = 0.85;

  const numSMT = parseFloat(budgetedSMT);
  const validSMT = isNaN(numSMT) || numSMT <= 0 ? 60 : numSMT;
  const requiredWorkMinutes = Math.max(15, Math.round(validSMT / speedMultiplier));

  const SHIFT_START = 7 * 60; // 07:00 AM
  const SHIFT_END = 20 * 60 + 30; // 08:30 PM

  let currentMin = isNaN(startMinutes) ? 510 : startMinutes;
  if (currentMin < SHIFT_START) currentMin = SHIFT_START;
  
  let dayOffset = 0;
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
      const d = new Date(baseDateStr);
      d.setDate(d.getDate() + offset);
      return d.toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  };

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

  let targetDate = null;
  if (startDate) {
    try {
      const d = new Date(startDate);
      d.setDate(d.getDate() + dayOffset);
      targetDate = d.toISOString().split('T')[0];
    } catch (e) {}
  }

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

const getDaySliceForOrder = (order, targetDateStr) => {
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

module.exports = {
  FACTORY_BREAKS,
  formatMinutesToTime,
  timeStringToMinutes,
  calculateDynamicETA,
  getDaySliceForOrder
};
