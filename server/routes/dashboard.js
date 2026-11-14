const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Allocation = require('../models/Allocation');
const Leave = require('../models/Leave');
const { ensureDbConnected } = require('../db');
const { getAllocations, setAllocations } = require('../data/allocationsStore');
let { craftsmenList, timeLogsList, designsMaster, leavesList } = require('../data/initialData');

router.get('/metrics', async (req, res) => {
  await ensureDbConnected();
  let dbLeaves = [];
  if (mongoose.connection.readyState === 1) {
    try {
      const dbAllocs = await Allocation.find().sort({ createdAt: -1 }).lean();
      if (dbAllocs && dbAllocs.length > 0) {
        setAllocations(dbAllocs);
      }
      dbLeaves = await Leave.find().sort({ date: -1, createdAt: -1 }).lean();
    } catch (e) {
      console.log('MongoDB dashboard fetch notice:', e.message);
    }
  }

  // Unified leaves list from DB and initial baseline (deduplicated by craftsman + date)
  const leavesMap = new Map();
  leavesList.forEach(l => {
    const key = `${(l.craftsmanId || '').toLowerCase()}_${l.date}`;
    leavesMap.set(key, l);
  });
  if (dbLeaves && dbLeaves.length > 0) {
    dbLeaves.forEach(l => {
      const key = `${(l.craftsmanId || '').toLowerCase()}_${l.date}`;
      leavesMap.set(key, l);
    });
  }
  const allLeaves = Array.from(leavesMap.values());

  const allAllocations = getAllocations();
  const totalCraftsmen = craftsmenList.length; // 63 Craftsmen

  // Gather all unique dates with allocations or leaves
  const dateSet = new Set();
  allAllocations.forEach(a => { if (a.date) dateSet.add(a.date); });
  allLeaves.forEach(l => { if (l.date) dateSet.add(l.date); });
  const availableDates = Array.from(dateSet).sort().reverse();

  // Selected date: either from query or latest available or today
  const todayStr = new Date().toISOString().split('T')[0];
  const selectedDate = req.query.date || (availableDates.length > 0 ? availableDates[0] : todayStr);

  // Filter for selected date
  const dayAllocations = allAllocations.filter(a => a.date === selectedDate);
  const dayLeaves = allLeaves.filter(l => l.date === selectedDate);
  const dayLeaveHours = dayLeaves.reduce((acc, l) => acc + (l.hoursDeducted || 13.0), 0);
  const activeCraftsmen = Math.max(0, totalCraftsmen - dayLeaves.length);

  // Time logs for the selected date (if any)
  const dayTimeLogs = timeLogsList.filter(t => t.date === selectedDate);
  const dayLogsToUse = dayTimeLogs.length > 0 ? dayTimeLogs : timeLogsList;

  const totalLogs = dayLogsToUse.length;
  const totalEarnedSMT = dayLogsToUse.reduce((acc, t) => acc + (t.esm || 0), 0);
  const totalActualMinutes = dayLogsToUse.reduce((acc, t) => acc + (t.awm || 0), 0);
  const avgEfficiency = totalActualMinutes > 0 
    ? parseFloat(((totalEarnedSMT / totalActualMinutes) * 100).toFixed(1))
    : 85.0;

  const totalLabourPay = dayLogsToUse.reduce((acc, t) => acc + (t.totalPay || 0), 0);
  const totalPassedPcs = dayLogsToUse.reduce((acc, t) => acc + (t.passedQA || 0), 0);
  const totalCompletedPcs = dayLogsToUse.reduce((acc, t) => acc + (t.completedQty || 0), 0);
  const totalReworkPcs = dayLogsToUse.reduce((acc, t) => acc + (t.reworkQty || 0), 0);
  
  const qaPassRate = totalCompletedPcs > 0
    ? parseFloat(((totalPassedPcs / totalCompletedPcs) * 100).toFixed(1))
    : 96.5;

  const hasOrders = dayAllocations.length > 0;
  
  // Calculate day's standard output hours
  let earnedStandardHours = 0;
  let dayActualHours = 0;
  let totalDayPieces = 0;
  let totalDayGoldIssued = 0;
  let totalDayGoldReturned = 0;

  if (hasOrders) {
    earnedStandardHours = parseFloat(dayAllocations.reduce((acc, a) => {
      const hrs = a.assumedHours !== undefined && a.assumedHours !== null
        ? parseFloat(a.assumedHours)
        : ((a.budgetedSMT || 0) / 60);
      return acc + (isNaN(hrs) ? 0 : hrs);
    }, 0).toFixed(1));

    dayActualHours = parseFloat(dayAllocations.reduce((acc, a) => {
      const act = a.actualHours !== undefined && a.actualHours !== null
        ? parseFloat(a.actualHours)
        : (a.assumedHours || ((a.budgetedSMT || 0) / 60));
      return acc + (isNaN(act) ? 0 : act);
    }, 0).toFixed(1));

    totalDayPieces = dayAllocations.reduce((acc, a) => acc + (a.qtyAllocated || 0), 0);
    totalDayGoldIssued = parseFloat(dayAllocations.reduce((acc, a) => acc + (parseFloat(a.goldIssuedGrams) || 0), 0).toFixed(2));
    totalDayGoldReturned = parseFloat(dayAllocations.reduce((acc, a) => acc + (parseFloat(a.goldReturnedGrams) || 0), 0).toFixed(2));
  } else {
    // If no orders on this specific date, report 0 actual output (unallocated plant capacity)
    earnedStandardHours = 0.0;
    dayActualHours = 0.0;
    totalDayPieces = 0;
    totalDayGoldIssued = 0;
    totalDayGoldReturned = 0;
  }

  // 1. THE 13-HOUR SHIFT (07:00 AM – 08:00 PM) CAPACITY AUDIT
  // Company standard shift: 13.0 Gross Shift Hours
  // Total Plant Roster Capacity: 63 Craftsmen × 13.0 Hours = 819.0 Gross Plant Hours
  const shiftStandardHours = 13.0;
  const breakStandardHours = 2.0; // Breakfast (30m) + Morning Tea (15m) + Plant Lunch (45m) + Evening Tea (30m) = 120m (2.0h)
  const netWorkingStandardHours = 11.0; // 13.0 - 2.0 = 11.0 Net working bench hours

  const grossShiftHours = parseFloat((totalCraftsmen * shiftStandardHours).toFixed(1)); // 819.0 hrs (63 × 13.0)
  const approvedLeavesHours = parseFloat(dayLeaveHours.toFixed(1));     // Leaves deducted (e.g. 13.0h)
  const grossOnSiteHours = parseFloat((activeCraftsmen * shiftStandardHours).toFixed(1)); // 806.0 hrs (62 × 13.0)
  const netShiftHoursAfterLeaves = grossOnSiteHours;
  const loggedBreakHours = parseFloat((activeCraftsmen * breakStandardHours).toFixed(1)); // 124.0 hrs (62 × 2.0h)
  const netAvailableHours = parseFloat(Math.max(0, grossOnSiteHours - loggedBreakHours).toFixed(1)); // 682.0 hrs (62 × 11.0h)
  
  // Total gap from gross on-site capacity
  const lostHoursTotal = parseFloat(Math.max(0, grossOnSiteHours - earnedStandardHours).toFixed(1));

  // Root-cause dissection of the lost hours
  let benchWaitingIdleHours = 0;
  let speedPaceGapHours = 0;
  let unloggedReworkHours = 0;

  if (hasOrders) {
    const unaccountedGap = Math.max(0, lostHoursTotal - loggedBreakHours);
    benchWaitingIdleHours = parseFloat((unaccountedGap * 0.46).toFixed(1));
    speedPaceGapHours = parseFloat((unaccountedGap * 0.35).toFixed(1));
    unloggedReworkHours = parseFloat(Math.max(0, unaccountedGap - benchWaitingIdleHours - speedPaceGapHours).toFixed(1));
  }

  const capacityLeakWaterfall = {
    grossShiftHours,            // 819.0 hrs (Roster Ceiling 63 × 13.0)
    grossOnSiteHours,           // 806.0 hrs (Active On-Site 62 × 13.0)
    approvedLeavesHours,        // 13.0 hrs
    netShiftHoursAfterLeaves,   // 806.0 hrs
    loggedBreakHours,           // 124.0 hrs (62 × 2.0h)
    netAvailableHours,          // 682.0 hrs (62 × 11.0h)
    earnedStandardHours,        // Actual SMV Output produced
    lostHoursTotal,             // The Gap from on-site presence
    hasOrders,
    rootCauses: {
      approvedLeaves: { 
        hours: approvedLeavesHours, 
        pct: parseFloat(((approvedLeavesHours / grossShiftHours) * 100).toFixed(1)), 
        desc: `${dayLeaves.length} craftsmen on approved leave / medical absence (-${approvedLeavesHours}h)` 
      },
      loggedBreaks: { 
        hours: loggedBreakHours, 
        pct: parseFloat(((loggedBreakHours / grossOnSiteHours) * 100).toFixed(1)), 
        desc: `Breakfast, lunch & tea intervals for ${activeCraftsmen} active craftsmen (-${loggedBreakHours}h)` 
      },
      benchWaitingIdle: { 
        hours: benchWaitingIdleHours, 
        pct: grossOnSiteHours > 0 ? parseFloat(((benchWaitingIdleHours / grossOnSiteHours) * 100).toFixed(1)) : 0, 
        desc: "Crucible melting, rolling mill bottlenecks & scale verification delays" 
      },
      speedPaceGap: { 
        hours: speedPaceGapHours, 
        pct: grossOnSiteHours > 0 ? parseFloat(((speedPaceGapHours / grossOnSiteHours) * 100).toFixed(1)) : 0, 
        desc: "Pace fatigue & sub-standard rate in 10th-13th working hours" 
      },
      unloggedRework: { 
        hours: unloggedReworkHours, 
        pct: grossOnSiteHours > 0 ? parseFloat(((unloggedReworkHours / grossOnSiteHours) * 100).toFixed(1)) : 0, 
        desc: "Micro-repairs, porosity soldering & claw adjustments without scrap logs" 
      }
    },
    grossAttendanceUtilization: hasOrders ? parseFloat(((earnedStandardHours / grossOnSiteHours) * 100).toFixed(1)) : 0,
    netWorkingEfficiency: hasOrders && netAvailableHours > 0 ? parseFloat(((earnedStandardHours / netAvailableHours) * 100).toFixed(1)) : 0,
    targetRecoverableHours: hasOrders ? parseFloat((benchWaitingIdleHours * 0.6 + unloggedReworkHours * 0.8).toFixed(1)) : 0
  };

  // 2. MULTI-CHANNEL DYNAMIC BREAKDOWN FOR THIS SPECIFIC DATE
  const channelDefs = [
    { code: "EXTERNAL_SHOP", label: "External Retail Jeweller Orders (B2B)", billingModel: "B2B Contract Rate (SMV + Wastage Fee)" },
    { code: "OWN_SHOWROOM", label: "Ashadi Branch Showrooms (Internal Transfers)", billingModel: "Factory Transfer Cost (Gold + Direct Labour)" },
    { code: "FACTORY_STOCK", label: "Main Factory Central Stock (Buffer)", billingModel: "Standard Inventory Asset Valuation" },
    { code: "OWNER_SPECIAL", label: "Owner & VIP Private Custom Orders", billingModel: "Mastergrade VIP Costing (Zero Loss Allowed)" }
  ];

  const channelBreakdown = {};
  channelDefs.forEach(ch => {
    const chAllocs = dayAllocations.filter(a => a.channel === ch.code);
    const hours = parseFloat(chAllocs.reduce((sum, a) => sum + (parseFloat(a.assumedHours) || (a.budgetedSMT / 60) || 0), 0).toFixed(1));
    const ordersCount = chAllocs.length;
    const piecesCount = chAllocs.reduce((sum, a) => sum + (a.qtyAllocated || 0), 0);
    const goldIssuedGrams = parseFloat(chAllocs.reduce((sum, a) => sum + (parseFloat(a.goldIssuedGrams) || 0), 0).toFixed(2));
    const withScrap = chAllocs.filter(a => a.goldLossPct !== null && a.goldLossPct !== undefined);
    const avgScrapLossPct = withScrap.length > 0 
      ? parseFloat((withScrap.reduce((sum, a) => sum + a.goldLossPct, 0) / withScrap.length).toFixed(2)) 
      : (ch.code === 'FACTORY_STOCK' ? 2.73 : ch.code === 'OWNER_SPECIAL' ? 3.30 : 3.40);
    
    const labourValueRs = parseFloat(chAllocs.reduce((sum, a) => {
      const rate = a.skillTier === 'Grade A' ? 11.50 : a.skillTier === 'Grade B' ? 9.50 : 7.50;
      return sum + ((a.budgetedSMT || (a.unitSMT * a.qtyAllocated) || 0) * rate);
    }, 0).toFixed(2));

    const pctOfCapacity = earnedStandardHours > 0 
      ? parseFloat(((hours / earnedStandardHours) * 100).toFixed(1)) 
      : 0;

    channelBreakdown[ch.code] = {
      label: ch.label,
      code: ch.code,
      allocatedHours: hours,
      pctOfCapacity,
      ordersCount,
      piecesCount,
      labourValueRs,
      billingModel: ch.billingModel,
      goldIssuedGrams,
      avgScrapLossPct
    };
  });

  // Calculate average gold loss for day
  const validLossItems = dayAllocations.filter(a => a.goldLossPct !== null && a.goldLossPct !== undefined);
  const avgGoldLoss = validLossItems.length > 0
    ? parseFloat((validLossItems.reduce((acc, a) => acc + a.goldLossPct, 0) / validLossItems.length).toFixed(2))
    : 3.15;

  // Category breakdown
  const categorySummary = {};
  designsMaster.forEach(d => {
    categorySummary[d.category] = (categorySummary[d.category] || 0) + 1;
  });

  res.json({
    company: "Ashadi Jewellers",
    selectedDate,
    hasOrders,
    availableDates,
    workforce: {
      totalCraftsmen,
      activeCraftsmen,
      todayAbsent: dayLeaves.length,
      todayLeaveHours: approvedLeavesHours,
      shiftStandardHours,
      breakStandardHours,
      grossOnSiteHours,
      rosterGrossHours: grossShiftHours,
      gradeA: craftsmenList.filter(c => c.skillTier === 'Grade A').length,
      gradeB: craftsmenList.filter(c => c.skillTier === 'Grade B').length,
      gradeC: craftsmenList.filter(c => c.skillTier === 'Grade C').length
    },
    dailyPerformance: {
      totalEarnedSMT: parseFloat((earnedStandardHours * 60).toFixed(1)),
      totalActualMinutes: parseFloat((dayActualHours * 60).toFixed(1)),
      avgEfficiency,
      totalLabourPay: parseFloat(totalLabourPay.toFixed(2)),
      totalPassedPcs: totalDayPieces || totalPassedPcs,
      totalReworkPcs,
      qaPassRate,
      avgGoldLoss,
      dayAssumedHours: earnedStandardHours,
      dayActualHours,
      dayOrdersCount: dayAllocations.length,
      dayPiecesCount: totalDayPieces,
      dayGoldIssuedGrams: totalDayGoldIssued,
      dayGoldReturnedGrams: totalDayGoldReturned
    },
    capacityLeakWaterfall,
    channelBreakdown,
    categorySummary,
    dayAllocations,
    todayLeaves: dayLeaves,
    recentAllocations: allAllocations.slice(0, 10),
    recentLogs: dayLogsToUse.slice(0, 10)
  });
});

// Download generated Excel sheet
router.get('/download-excel', (req, res) => {
  const filePath = path.join(__dirname, '..', '..', 'Ashadi_Jewellers_Labour_Costing_System.xlsx');
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'Ashadi_Jewellers_Labour_Costing_System.xlsx');
  } else {
    res.status(404).json({ error: 'Excel file not found on server' });
  }
});

module.exports = router;
