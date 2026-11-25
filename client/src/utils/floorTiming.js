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

// Convert HH:MM string (e.g. "08:30") to minutes from midnight
export const timeStringToMinutes = (timeStr, defaultMinutes = 510) => {
  if (!timeStr) return defaultMinutes;
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return defaultMinutes;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return defaultMinutes;
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

  // Safety cap of 14 working days
  while (workDone < requiredWorkMinutes && dayOffset < 14) {
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
    } else {
      workDone += 1;
    }
    currentMin += 1;
  }

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
    isMultiDay: dayOffset > 0
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
