/**
 * Ashadi Jewellers - Metallurgical Floor Timing & Calculation Utilities
 * Shared helper module to eliminate circular dependencies across React components.
 */

// Comprehensive precious metals and alloy master catalogue
export const STANDARD_METALS = [
  { id: 'Gold 24K', label: '🟡 Gold 24K (Pure 999.9 Bullion • Ceiling 3.2%)', family: 'HighGold', ceiling: 3.2 },
  { id: 'Gold 22K', label: '🟡 Gold 22K (Standard 916 Sovereign • Ceiling 3.5%)', family: 'HighGold', ceiling: 3.5 },
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
  if (!metal) return 3.5;
  const found = STANDARD_METALS.find(m => m.id === metal || m.id.toLowerCase() === metal.toLowerCase());
  if (found) return found.ceiling;
  const lower = String(metal).toLowerCase();
  if (lower.includes('platinum') || lower.includes('palladium')) return 1.8;
  if (lower.includes('silver')) return 5.5;
  if (lower.includes('24k')) return 3.2;
  if (lower.includes('22k')) return 3.5;
  if (lower.includes('18k')) return 3.0;
  if (lower.includes('14k')) return 2.8;
  if (lower.includes('9k')) return 2.5;
  if (lower.includes('brass') || lower.includes('bronze') || lower.includes('copper')) return 6.0;
  return 3.5;
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

// Metallurgical ETA Engine: Computes wall-clock target completion time accounting for skill tier and breaks
export const calculateDynamicETA = (startMinutes, budgetedSMT, skillTier) => {
  let speedMultiplier = 1.0;
  if (skillTier === 'Grade A') speedMultiplier = 1.10;
  else if (skillTier === 'Grade C') speedMultiplier = 0.85;

  const numSMT = parseFloat(budgetedSMT);
  const validSMT = isNaN(numSMT) || numSMT <= 0 ? 60 : numSMT;
  const requiredWorkMinutes = Math.max(15, Math.round(validSMT / speedMultiplier));

  let currentMin = isNaN(startMinutes) ? 510 : startMinutes;
  let workDone = 0;
  let totalBreakMinutesEncountered = 0;

  while (workDone < requiredWorkMinutes && currentMin < 24 * 60) {
    const isBreak = FACTORY_BREAKS.some(b => currentMin >= b.start && currentMin < b.end);
    if (isBreak) {
      totalBreakMinutesEncountered += 1;
    } else {
      workDone += 1;
    }
    currentMin += 1;
  }

  return {
    targetETAMinutes: currentMin,
    targetETATime: formatMinutesToTime(currentMin),
    requiredWorkMinutes,
    totalBreakMinutesEncountered,
    speedMultiplier
  };
};

// Formats comprehensive human-readable order details into the QR code data payload
export const formatOrderQRDetails = (order, selectedDate = '') => {
  if (!order) return 'ASHADI-WO';

  const wo = order.workOrder || order.id || 'WO-PENDING';
  const date = order.date || selectedDate || new Date().toISOString().split('T')[0];
  const channel = order.channelName || (
    order.channel === 'EXTERNAL_SHOP' ? 'External Jeweller Shop (B2B)' :
    order.channel === 'OWNER_SPECIAL' ? 'Owner VIP Commission' :
    order.channel === 'FACTORY_STOCK' ? 'Central Factory Stock' : 'Ashadi Flagship Showroom'
  );
  const craftsman = `${order.craftsmanName || 'Craftsman'} (${order.craftsmanId || 'Bench'} • ${order.skillTier || 'Grade B'})`;
  const design = `${order.designCode || 'Design'}${order.designName ? ` — ${order.designName}` : ''} (Qty: ${order.qtyAllocated || 1} pcs)`;
  const smtMins = order.budgetedSMT || (order.assumedHours ? order.assumedHours * 60 : 240);
  const smtHrs = (smtMins / 60).toFixed(1);
  const metal = `${order.metalType || 'Gold 22K'}${order.goldIssuedGrams ? ` (${order.goldIssuedGrams}g Issued)` : ''}`;
  const ceiling = getMetalScrapCeiling(order.metalType);
  
  const startMin = timeStringToMinutes(order.dispatchTime, 510);
  const eta = calculateDynamicETA(startMin, smtMins, order.skillTier || 'Grade B');

  return [
    `ASHADI JEWELLERS - BENCH TRAVELER`,
    `---------------------------------`,
    `ORDER ID: ${wo}`,
    `DATE: ${date}`,
    `CHANNEL: ${channel}`,
    `CRAFTSMAN: ${craftsman}`,
    `DESIGN: ${design}`,
    `SMT LABOUR: ${smtMins}m (${smtHrs}h)`,
    `METAL: ${metal}`,
    `SCRAP CEILING: max ${ceiling}%`,
    `START: ${formatMinutesToTime(startMin)} | BREAKS: +${eta.totalBreakMinutesEncountered}m`,
    `TARGET FINISH (ETA): ${eta.targetETATime}`,
    `---------------------------------`,
    `LIVE TRACKING PORTAL:`,
    `https://assignmenttypebcom-eight.vercel.app/?wo=${wo}`
  ].join('\n');
};
