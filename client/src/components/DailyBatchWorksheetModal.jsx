import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  AlertTriangle, 
  Zap, 
  Sparkles, 
  Users, 
  Clock, 
  Save, 
  UserX, 
  CheckCircle2,
  Layers,
  ArrowRight,
  Store,
  Building2,
  Package,
  Crown,
  Camera,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import api from '../api';
import VisualDesignPickerModal from './VisualDesignPickerModal';
import { getDesignDisplayImage } from '../utils/designImages';

export default function DailyBatchWorksheetModal({ 
  craftsmen, 
  designs, 
  leaves, 
  allocations = [],
  clientShops = [],
  onClose, 
  onSuccess 
}) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Identify who is on leave on selectedDate
  const dateLeaves = (leaves || []).filter(l => l.date === selectedDate);
  const absentIds = new Set(dateLeaves.map(l => l.craftsmanId));

  // Initialize worksheet rows for all craftsmen
  const [rows, setRows] = useState([]);
  const [visualPickerState, setVisualPickerState] = useState(null);

  const handleSelectDesignFromVisualPicker = (selectedDesign) => {
    if (!visualPickerState) return;
    const { rowIdx, isSuite, itemIdx } = visualPickerState;
    if (isSuite && itemIdx !== null) {
      handleUpdateSuiteItem(rowIdx, itemIdx, 'designCode', selectedDesign.code);
    } else {
      handleRowChange(rowIdx, 'designCode', selectedDesign.code);
    }
    setVisualPickerState(null);
  };

  useEffect(() => {
    initializeRows();
  }, [selectedDate, craftsmen, designs, allocations]);

  const initializeRows = () => {
    const dayAllocs = (allocations || []).filter(a => a.date === selectedDate);

    const initialRows = (craftsmen || []).flatMap((c, index) => {
      const isAbsent = absentIds.has(c.id);
      const cAllocs = dayAllocs.filter(a => a.craftsmanId === c.id);

      // Distribute channels across benches: 40% showroom, 35% external, 15% stock, 10% VIP
      let defaultChannel = 'OWN_SHOWROOM';
      if (index % 10 < 4) defaultChannel = 'OWN_SHOWROOM';
      else if (index % 10 < 7) defaultChannel = 'EXTERNAL_SHOP';
      else if (index % 10 < 9) defaultChannel = 'FACTORY_STOCK';
      else defaultChannel = 'OWNER_SPECIAL';

      // Distribute design based on skill tier
      let defaultDesign = designs && designs[0] ? designs[0] : null;
      let defaultQty = 4;
      if (c.skillTier === 'Grade A') {
        defaultDesign = (designs || []).find(d => d.code === 'RNG-DET-02') || designs[0];
        defaultQty = 4;
      } else if (c.skillTier === 'Grade B') {
        defaultDesign = (designs || []).find(d => d.code === 'RNG-SOL-03') || designs[0];
        defaultQty = 4;
      } else {
        defaultDesign = (designs || []).find(d => d.code === 'RNG-SMP-01') || designs[0];
        defaultQty = 8;
      }

      const smt = defaultDesign ? defaultDesign.totalSMT : 45.2;
      const assumed = parseFloat(((smt * defaultQty) / 60).toFixed(2));

      const extShop = (clientShops && clientShops.length > 0) 
        ? clientShops[index % clientShops.length].name 
        : 'Pushpa Jewellers';

      const defaultWO = `WO-${selectedDate.replace(/-/g, '').slice(2)}-${c.id}`;

      const showroomBranches = [
        'Ashadi Main Branch (Kaduwela)',
        'Ashadi Branch (Galle)',
        'Ashadi Branch (Negombo)'
      ];
      const defaultShowroom = showroomBranches[index % showroomBranches.length];

      // If craftsman already has existing work orders on this date, load real status & protect completed ones:
      if (cAllocs.length > 0) {
        return cAllocs.map((existingAlloc, subIdx) => {
          const isDone = existingAlloc.status === 'Completed';
          const isRunning = existingAlloc.status === 'In Progress' || existingAlloc.status === 'Active';
          return {
            craftsmanId: c.id,
            craftsmanName: c.name,
            skillTier: c.skillTier,
            empNo: c.empNo,
            isPresent: !isAbsent,
            workOrder: existingAlloc.workOrder || `${defaultWO}${subIdx > 0 ? `-${String.fromCharCode(65 + subIdx)}` : ''}`,
            isSuite: !!existingAlloc.isSuite,
            suiteName: existingAlloc.suiteName || 'Bridal Suite (Ring + Necklace + Earrings)',
            items: existingAlloc.items && existingAlloc.items.length > 0
              ? existingAlloc.items
              : [{ designCode: existingAlloc.designCode || 'RNG-SMP-01', qty: existingAlloc.qtyAllocated || 1, metalType: existingAlloc.metalType || 'Gold 22K' }],
            channel: existingAlloc.channel || 'OWN_SHOWROOM',
            channelName: existingAlloc.channelName || defaultShowroom,
            craftingMethod: existingAlloc.craftingMethod || 'HANDMADE',
            designCode: existingAlloc.designCode || (defaultDesign ? defaultDesign.code : 'RNG-SMP-01'),
            qtyAllocated: existingAlloc.qtyAllocated || 1,
            assumedHours: existingAlloc.assumedHours || assumed,
            actualHours: existingAlloc.actualHours !== null && existingAlloc.actualHours !== undefined ? existingAlloc.actualHours : '',
            goldIssuedGrams: existingAlloc.goldIssuedGrams !== null && existingAlloc.goldIssuedGrams !== undefined ? existingAlloc.goldIssuedGrams : '',
            goldReturnedGrams: existingAlloc.goldReturnedGrams !== null && existingAlloc.goldReturnedGrams !== undefined ? existingAlloc.goldReturnedGrams : '',
            isSubJob: subIdx > 0,
            isExisting: true,
            existingId: existingAlloc.id,
            existingStatus: isDone ? 'Completed' : isRunning ? 'In Progress' : (existingAlloc.status || 'In Progress'),
            isLocked: isDone // Lock completed orders by default to protect from overwrite
          };
        });
      }

      // Fresh unassigned row:
      return [{
        craftsmanId: c.id,
        craftsmanName: c.name,
        skillTier: c.skillTier,
        empNo: c.empNo,
        isPresent: !isAbsent,
        workOrder: defaultWO,
        isSuite: false,
        suiteName: 'Bridal Suite (Ring + Necklace + Earrings)',
        items: [
          { designCode: defaultDesign ? defaultDesign.code : 'RNG-SMP-01', qty: defaultQty, metalType: 'Gold 22K' }
        ],
        channel: defaultChannel,
        channelName: defaultChannel === 'EXTERNAL_SHOP' ? extShop : defaultChannel === 'FACTORY_STOCK' ? 'Central Factory Buffer' : defaultChannel === 'OWNER_SPECIAL' ? 'Owner VIP Commission' : defaultShowroom,
        craftingMethod: defaultDesign?.craftingMethod || 'HANDMADE',
        designCode: defaultDesign ? defaultDesign.code : 'RNG-SMP-01',
        qtyAllocated: defaultQty,
        assumedHours: assumed,
        actualHours: '',
        goldIssuedGrams: (defaultQty * 8.2).toFixed(1),
        goldReturnedGrams: '',
        isSubJob: false,
        isExisting: false,
        existingId: null,
        existingStatus: 'Ready',
        isLocked: false
      }];
    });

    setRows(initialRows);
  };

  const handleToggleSuite = (idx) => {
    setRows(prev => {
      const updated = [...prev];
      const r = updated[idx];
      const nextIsSuite = !r.isSuite;
      if (nextIsSuite) {
        const ring = (designs || []).find(d => d.code.startsWith('RNG')) || designs[0];
        const nck = (designs || []).find(d => d.code.startsWith('NCK')) || designs[1] || designs[0];
        const err = (designs || []).find(d => d.code.startsWith('ERR')) || designs[2] || designs[0];
        const suiteItems = [
          { designCode: ring ? ring.code : 'RNG-SOL-03', qty: 1, metalType: 'Gold 22K' },
          { designCode: nck ? nck.code : 'NCK-FLR-02', qty: 1, metalType: 'Gold 22K' },
          { designCode: err ? err.code : 'ERR-DRP-01', qty: 2, metalType: 'Gold 22K' }
        ];
        const smt = suiteItems.reduce((acc, it) => {
          const d = (designs || []).find(x => x.code === it.designCode);
          return acc + ((d ? d.totalSMT : 60) * it.qty);
        }, 0);
        const totalQ = suiteItems.reduce((acc, it) => acc + it.qty, 0);
        updated[idx] = {
          ...r,
          isSuite: true,
          suiteName: r.suiteName || 'Bridal Suite (Ring + Necklace + Earrings)',
          items: suiteItems,
          qtyAllocated: totalQ,
          assumedHours: parseFloat((smt / 60).toFixed(2)),
          goldIssuedGrams: (totalQ * 7.5).toFixed(1)
        };
      } else {
        const dObj = (designs || []).find(d => d.code === r.designCode) || designs[0];
        const q = 4;
        const smt = dObj ? dObj.totalSMT * q : 240;
        updated[idx] = {
          ...r,
          isSuite: false,
          qtyAllocated: q,
          assumedHours: parseFloat((smt / 60).toFixed(2)),
          goldIssuedGrams: (q * 8.2).toFixed(1)
        };
      }
      return updated;
    });
  };

  const handleAddSuiteItem = (rowIdx) => {
    setRows(prev => {
      const updated = [...prev];
      const r = updated[rowIdx];
      const nextDesign = designs && designs.length > (r.items?.length || 0) ? designs[r.items.length] : (designs && designs[0] ? designs[0] : null);
      const newItems = [
        ...(r.items || []),
        { designCode: nextDesign ? nextDesign.code : 'RNG-SMP-01', qty: 1, metalType: 'Gold 22K' }
      ];
      const smt = newItems.reduce((acc, it) => {
        const d = (designs || []).find(x => x.code === it.designCode);
        return acc + ((d ? d.totalSMT : 60) * (parseInt(it.qty, 10) || 1));
      }, 0);
      const totalQ = newItems.reduce((acc, it) => acc + (parseInt(it.qty, 10) || 1), 0);
      updated[rowIdx] = {
        ...r,
        items: newItems,
        qtyAllocated: totalQ,
        assumedHours: parseFloat((smt / 60).toFixed(2)),
        goldIssuedGrams: (totalQ * 7.5).toFixed(1)
      };
      return updated;
    });
  };

  const handleUpdateSuiteItem = (rowIdx, itemIdx, field, val) => {
    setRows(prev => {
      const updated = [...prev];
      const r = updated[rowIdx];
      const newItems = r.items.map((it, i) => i === itemIdx ? { ...it, [field]: val } : it);
      const smt = newItems.reduce((acc, it) => {
        const d = (designs || []).find(x => x.code === it.designCode);
        return acc + ((d ? d.totalSMT : 60) * (parseInt(it.qty, 10) || 1));
      }, 0);
      const totalQ = newItems.reduce((acc, it) => acc + (parseInt(it.qty, 10) || 1), 0);
      updated[rowIdx] = {
        ...r,
        items: newItems,
        qtyAllocated: totalQ,
        assumedHours: parseFloat((smt / 60).toFixed(2)),
        goldIssuedGrams: (totalQ * 7.5).toFixed(1)
      };
      return updated;
    });
  };

  const handleRemoveSuiteItem = (rowIdx, itemIdx) => {
    setRows(prev => {
      const updated = [...prev];
      const r = updated[rowIdx];
      if ((r.items || []).length <= 1) return prev;
      const newItems = r.items.filter((_, i) => i !== itemIdx);
      const smt = newItems.reduce((acc, it) => {
        const d = (designs || []).find(x => x.code === it.designCode);
        return acc + ((d ? d.totalSMT : 60) * (parseInt(it.qty, 10) || 1));
      }, 0);
      const totalQ = newItems.reduce((acc, it) => acc + (parseInt(it.qty, 10) || 1), 0);
      updated[rowIdx] = {
        ...r,
        items: newItems,
        qtyAllocated: totalQ,
        assumedHours: parseFloat((smt / 60).toFixed(2)),
        goldIssuedGrams: (totalQ * 7.5).toFixed(1)
      };
      return updated;
    });
  };

  const handleRowChange = (index, field, value) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === 'designCode' || field === 'qtyAllocated') {
        const dCode = field === 'designCode' ? value : updated[index].designCode;
        const q = field === 'qtyAllocated' ? parseInt(value, 10) || 1 : updated[index].qtyAllocated;
        const dObj = (designs || []).find(d => d.code === dCode);
        if (dObj) {
          const assumed = parseFloat(((dObj.totalSMT * q) / 60).toFixed(2));
          updated[index].assumedHours = assumed;
          if (field === 'designCode' && dObj.craftingMethod) {
            updated[index].craftingMethod = dObj.craftingMethod;
          }
        }
      }

      return updated;
    });
  };

  const handleAddJobForBench = (idx) => {
    const parentRow = rows[idx];
    const defaultDesign = designs && designs[1] ? designs[1] : (designs && designs[0] ? designs[0] : null);
    const smt = defaultDesign ? defaultDesign.totalSMT : 45.2;
    const qty = 2;
    const assumed = parseFloat(((smt * qty) / 60).toFixed(2));

    const newJob = {
      craftsmanId: parentRow.craftsmanId,
      craftsmanName: parentRow.craftsmanName,
      skillTier: parentRow.skillTier,
      empNo: parentRow.empNo,
      isPresent: true,
      workOrder: `${(parentRow.workOrder || `WO-${selectedDate.replace(/-/g, '').slice(2)}-${parentRow.craftsmanId}`).replace(/-[A-Z]$/, '')}-B`,
      channel: parentRow.channel,
      channelName: parentRow.channelName,
      designCode: defaultDesign ? defaultDesign.code : 'RNG-SMP-01',
      qtyAllocated: qty,
      assumedHours: assumed,
      actualHours: '',
      goldIssuedGrams: (qty * 8.0).toFixed(1),
      goldReturnedGrams: '',
      isSuite: false,
      suiteName: 'Bridal Suite (Ring + Necklace + Earrings)',
      items: [
        { designCode: defaultDesign ? defaultDesign.code : 'RNG-SMP-01', qty, metalType: 'Gold 22K' }
      ],
      isSubJob: true,
      isExisting: false,
      existingId: null,
      existingStatus: 'Ready',
      isLocked: false
    };

    setRows(prev => {
      const updated = [...prev];
      updated.splice(idx + 1, 0, newJob);
      return updated;
    });
  };

  const handleToggleLock = (idx) => {
    setRows(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], isLocked: !updated[idx].isLocked };
      return updated;
    });
  };

  const handleRemoveSubJob = (idx) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuickAutoShift = async () => {
    const completedItems = rows.filter(r => r.existingStatus === 'Completed');
    if (completedItems.length > 0) {
      if (!window.confirm(`There are already ${completedItems.length} completed job orders on ${selectedDate}. Auto-dispatch will keep those completed records safe and populate remaining unassigned benches. Proceed?`)) {
        return;
      }
    }
    setIsSubmitting(true);
    try {
      await api.post('/allocations/auto-shift-populate', {
        date: selectedDate,
        markCompleted: false
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Auto shift error:', err);
      alert('Failed to auto-dispatch shift. Please verify server connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Only dispatch rows that are Present and NOT locked completed orders:
    const rowsToDispatch = rows.filter(r => r.isPresent && !(r.isLocked && r.existingStatus === 'Completed'));

    if (rowsToDispatch.length === 0) {
      alert('All present benches for this date are already completed/locked. No new pending jobs to dispatch.');
      setIsSubmitting(false);
      return;
    }

    const activeAllocations = rowsToDispatch.map(r => ({
      craftsmanId: r.craftsmanId,
      date: selectedDate,
      workOrder: r.workOrder || `WO-${selectedDate.replace(/-/g, '').slice(2)}-${r.craftsmanId}`,
      channel: r.channel,
      channelName: r.channelName,
      craftingMethod: r.craftingMethod || 'HANDMADE',
      designCode: r.designCode,
      metalType: r.metalType || ((designs || []).find(d => d.code === r.designCode)?.metalType) || 'Gold 22K',
      qtyAllocated: parseInt(r.qtyAllocated, 10) || 1,
      assumedHours: parseFloat(r.assumedHours) || 8.0,
      actualHours: r.actualHours ? parseFloat(r.actualHours) : null,
      goldIssuedGrams: r.goldIssuedGrams ? parseFloat(r.goldIssuedGrams) : null,
      goldReturnedGrams: r.goldReturnedGrams ? parseFloat(r.goldReturnedGrams) : null,
      isSuite: !!r.isSuite,
      suiteName: r.isSuite ? (r.suiteName || 'Jewellery Suite / Set') : null,
      items: r.isSuite && Array.isArray(r.items) ? r.items : [],
      status: r.existingStatus && r.existingStatus !== 'Ready' ? r.existingStatus : undefined
    }));

    try {
      await api.post('/allocations/bulk', {
        date: selectedDate,
        allocations: activeAllocations
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Batch save error:', err);
      const serverMsg = err.response?.data?.error || err.message || 'Unknown network error';
      alert(`Failed to save batch allocations: ${serverMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePresentRows = rows.filter(r => r.isPresent);
  const presentCount = activePresentRows.length;
  const leaveCount = rows.filter(r => !r.isPresent).length;
  const completedCount = activePresentRows.filter(r => r.existingStatus === 'Completed').length;
  const inProgressCount = activePresentRows.filter(r => r.existingStatus === 'In Progress').length;
  const readyCount = activePresentRows.filter(r => r.existingStatus === 'Ready' || !r.existingStatus).length;
  const totalAssumedSum = activePresentRows
    .reduce((sum, r) => sum + (parseFloat(r.assumedHours) || 0), 0)
    .toFixed(1);

  // Demand Channel Capacity Breakdown
  const showroomRows = activePresentRows.filter(r => r.channel === 'OWN_SHOWROOM');
  const showroomHours = showroomRows.reduce((sum, r) => sum + (parseFloat(r.assumedHours) || 0), 0).toFixed(1);
  const showroomPct = parseFloat(totalAssumedSum) > 0 ? ((parseFloat(showroomHours) / parseFloat(totalAssumedSum)) * 100).toFixed(1) : '0.0';

  const b2bRows = activePresentRows.filter(r => r.channel === 'EXTERNAL_SHOP');
  const b2bHours = b2bRows.reduce((sum, r) => sum + (parseFloat(r.assumedHours) || 0), 0).toFixed(1);
  const b2bPct = parseFloat(totalAssumedSum) > 0 ? ((parseFloat(b2bHours) / parseFloat(totalAssumedSum)) * 100).toFixed(1) : '0.0';

  const stockRows = activePresentRows.filter(r => r.channel === 'FACTORY_STOCK');
  const stockHours = stockRows.reduce((sum, r) => sum + (parseFloat(r.assumedHours) || 0), 0).toFixed(1);
  const stockPct = parseFloat(totalAssumedSum) > 0 ? ((parseFloat(stockHours) / parseFloat(totalAssumedSum)) * 100).toFixed(1) : '0.0';

  const vipRows = activePresentRows.filter(r => r.channel === 'OWNER_SPECIAL');
  const vipHours = vipRows.reduce((sum, r) => sum + (parseFloat(r.assumedHours) || 0), 0).toFixed(1);
  const vipPct = parseFloat(totalAssumedSum) > 0 ? ((parseFloat(vipHours) / parseFloat(totalAssumedSum)) * 100).toFixed(1) : '0.0';

  return (
    <div className="modal-backdrop-luxury">
      <div className="modal-window-luxury" style={{ maxWidth: '1240px', width: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        
        <style>{`
          .worksheet-table {
            border-collapse: separate !important;
            border-spacing: 0 !important;
            width: 100% !important;
          }
          .worksheet-table th {
            padding: 10px 8px !important;
            font-size: 11px !important;
            white-space: nowrap !important;
            letter-spacing: 0.5px !important;
          }
          .worksheet-table td {
            padding: 6px 6px !important;
            vertical-align: middle !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          }
          .worksheet-table input[type=number]::-webkit-inner-spin-button,
          .worksheet-table input[type=number]::-webkit-outer-spin-button {
            -webkit-appearance: none !important;
            margin: 0 !important;
          }
          .worksheet-table input[type=number] {
            -moz-appearance: textfield !important;
          }
        `}</style>

        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#d4af37', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <Zap size={14} />
              <span>HIGH-VOLUME BATCH SHOPFLOOR DISPATCH</span>
            </div>
            <h2 style={{ fontSize: '20px', color: '#fff', margin: '4px 0 0 0', fontFamily: 'var(--font-serif)' }}>
              Daily 63-Bench Fast Production Worksheet
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
              Dispatch all 60+ active craftsmen at once in under 2 minutes. Eliminates typing 60 individual modal forms!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '6px 12px', fontWeight: 'bold', color: '#fef08a', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '6px' }}
            />
            <button 
              onClick={onClose} 
              className="btn-ghost-secondary"
              style={{ padding: '6px 10px' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Action Summary Pill Bar & Channel Capacity Planning */}
        <div style={{ 
          background: 'rgba(15, 23, 42, 0.75)', 
          border: '1px solid rgba(212, 175, 55, 0.28)',
          padding: '12px 16px', 
          borderRadius: '10px', 
          marginBottom: '14px', 
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Top Row: Attendance & Main Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', flexWrap: 'wrap' }}>
              <span style={{ color: '#34d399', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={15} /> {presentCount} Benches Present
              </span>

              {completedCount > 0 && (
                <>
                  <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                  <span style={{ 
                    color: '#34d399', 
                    fontWeight: '800', 
                    background: 'rgba(52, 211, 153, 0.15)', 
                    padding: '2px 8px', 
                    borderRadius: '6px', 
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ShieldCheck size={13} /> {completedCount} Completed
                  </span>
                </>
              )}

              {inProgressCount > 0 && (
                <>
                  <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                  <span style={{ 
                    color: '#38bdf8', 
                    fontWeight: '800', 
                    background: 'rgba(56, 189, 248, 0.15)', 
                    padding: '2px 8px', 
                    borderRadius: '6px', 
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Clock size={13} /> {inProgressCount} In Progress
                  </span>
                </>
              )}

              {readyCount > 0 && (
                <>
                  <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                  <span style={{ 
                    color: '#fef08a', 
                    fontWeight: '800', 
                    background: 'rgba(212, 175, 55, 0.15)', 
                    padding: '2px 8px', 
                    borderRadius: '6px', 
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Zap size={13} /> {readyCount} Ready to Dispatch
                  </span>
                </>
              )}

              <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
              <span style={{ color: '#f87171', fontWeight: 'bold' }}>
                {leaveCount} On Leave
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
              <span style={{ color: '#93c5fd', fontWeight: 'bold', background: 'rgba(59, 130, 246, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                Total SMT: {totalAssumedSum}h
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="btn-ghost-secondary" 
                onClick={handleQuickAutoShift}
                disabled={isSubmitting}
                style={{ fontSize: '12px', borderColor: '#38bdf8', color: '#38bdf8' }}
                title="1-Click standard dispatch for all unassigned benches based on skills and channels"
              >
                <Sparkles size={14} />
                <span>1-Click Auto Dispatch ({readyCount > 0 ? `${readyCount} Ready` : 'All'})</span>
              </button>

              <button 
                type="button" 
                className="btn-gold-primary" 
                onClick={handleSaveBatch}
                disabled={isSubmitting || (readyCount === 0 && completedCount > 0 && inProgressCount === 0)}
                style={{ fontSize: '12px' }}
                title={readyCount > 0 ? `Save and dispatch ${readyCount} unassigned benches` : "All benches are already dispatched"}
              >
                <Save size={14} />
                <span>
                  {isSubmitting 
                    ? 'Saving...' 
                    : readyCount > 0 
                      ? `Save & Dispatch ${readyCount} Pending Benches` 
                      : `All ${presentCount} Benches Dispatched`}
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Dynamic Channel Capacity Badges */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            flexWrap: 'wrap', 
            paddingTop: '9px', 
            borderTop: '1px solid rgba(255, 255, 255, 0.08)' 
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '900', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <Layers size={13} style={{ color: '#d4af37' }} />
              <span>Planned Channel Hours:</span>
            </div>

            {/* Showroom Badge */}
            <div 
              style={{
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                color: '#fef08a',
                padding: '4px 11px',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px'
              }}
              title={`Showroom retail orders: ${showroomHours} planned hours across ${showroomRows.length} active benches (${showroomPct}% of total daily capacity)`}
            >
              <Store size={14} style={{ color: '#fbbf24' }} />
              <span>Own Showroom:</span>
              <strong style={{ color: '#fff', fontSize: '12.5px' }}>{showroomHours}h</strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>({showroomRows.length} benches • {showroomPct}%)</span>
            </div>

            {/* B2B External Shops Badge */}
            <div 
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                padding: '4px 11px',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px'
              }}
              title={`B2B External client subcontract demand: ${b2bHours} planned hours across ${b2bRows.length} active benches (${b2bPct}% of total daily capacity)`}
            >
              <Building2 size={14} style={{ color: '#38bdf8' }} />
              <span>External Shop (B2B):</span>
              <strong style={{ color: '#fff', fontSize: '12.5px' }}>{b2bHours}h</strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>({b2bRows.length} benches • {b2bPct}%)</span>
            </div>

            {/* Factory Buffer Stock Badge */}
            <div 
              style={{
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#c084fc',
                padding: '4px 11px',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px'
              }}
              title={`Central Factory Buffer replenish stock: ${stockHours} planned hours across ${stockRows.length} active benches (${stockPct}% of total daily capacity)`}
            >
              <Package size={14} style={{ color: '#c084fc' }} />
              <span>Factory Stock:</span>
              <strong style={{ color: '#fff', fontSize: '12.5px' }}>{stockHours}h</strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>({stockRows.length} benches • {stockPct}%)</span>
            </div>

            {/* Owner VIP Badge (rendered if any benches assigned) */}
            {vipRows.length > 0 && (
              <div 
                style={{
                  background: 'rgba(234, 179, 8, 0.15)',
                  border: '1px solid rgba(234, 179, 8, 0.45)',
                  color: '#facc15',
                  padding: '4px 11px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px'
                }}
                title={`Owner VIP bespoke orders: ${vipHours} planned hours across ${vipRows.length} active benches (${vipPct}% of total daily capacity)`}
              >
                <Crown size={14} style={{ color: '#facc15' }} />
                <span>Owner VIP:</span>
                <strong style={{ color: '#fff', fontSize: '12.5px' }}>{vipHours}h</strong>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>({vipRows.length} benches • {vipPct}%)</span>
              </div>
            )}
          </div>
        </div>

        {/* Spreadsheet-like Scrollable Table */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}>
          <table className="table-luxury worksheet-table" style={{ fontSize: '12px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0a0f1d' }}>
              <tr>
                <th style={{ width: '38px', textAlign: 'center' }}>#</th>
                <th style={{ width: '185px' }}>Craftsman Bench</th>
                <th style={{ width: '135px' }}>Work Order #</th>
                <th style={{ width: '85px', textAlign: 'center' }}>Attendance</th>
                <th style={{ width: '145px' }}>Demand Channel</th>
                <th style={{ width: '130px' }}>Route / Method</th>
                <th style={{ width: '280px' }}>Design / Suite Items</th>
                <th style={{ width: '65px', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '80px', textAlign: 'right' }}>Assumed Hrs</th>
                <th style={{ width: '85px' }}>Gold (g)</th>
                <th style={{ width: '80px' }}>Actual Hrs</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isAbsent = !row.isPresent;
                const isDone = row.existingStatus === 'Completed';
                const isRunning = row.existingStatus === 'In Progress';
                const isLocked = isDone && row.isLocked;
                const isFieldDisabled = isAbsent || isLocked;
                const benchTier = row.skillTier || 'Grade B';
                const matchedDesigns = (designs || []).filter(d => (d.skillTier || 'Grade B') === benchTier);
                const otherDesigns = (designs || []).filter(d => (d.skillTier || 'Grade B') !== benchTier);
                const activeDesignObj = (designs || []).find(d => d.code === row.designCode);
                return (
                  <tr 
                    key={row.isSubJob ? `${row.craftsmanId}-sub-${idx}` : `${row.craftsmanId}-${idx}`}
                    style={{ 
                      opacity: isAbsent ? 0.45 : 1,
                      background: isDone 
                        ? 'rgba(52, 211, 153, 0.05)' 
                        : isRunning 
                          ? 'rgba(56, 189, 248, 0.04)' 
                          : row.isSuite 
                            ? 'rgba(245, 158, 11, 0.04)' 
                            : row.isSubJob 
                              ? 'rgba(56, 189, 248, 0.05)' 
                              : isAbsent 
                                ? 'rgba(239, 68, 68, 0.04)' 
                                : undefined,
                      borderLeft: isDone 
                        ? '3px solid #10b981' 
                        : isRunning 
                          ? '3px solid #38bdf8' 
                          : row.isSuite 
                            ? '3px solid #f59e0b' 
                            : row.isSubJob 
                              ? '3px solid #38bdf8' 
                              : undefined
                    }}
                  >
                    <td style={{ textAlign: 'center', color: isDone ? '#34d399' : '#94a3b8', fontSize: '11px', fontWeight: isDone ? 'bold' : 'normal' }}>
                      {row.isSubJob ? '↳' : idx + 1}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div>
                          <strong style={{ color: isDone ? '#34d399' : isRunning ? '#38bdf8' : row.isSuite ? '#fbbf24' : row.isSubJob ? '#38bdf8' : '#d4af37' }}>
                            {row.isSubJob ? '↳ Extra Item' : row.craftsmanId}
                          </strong> {!row.isSubJob && `— ${row.craftsmanName}`}
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            {row.isSubJob ? `${row.craftsmanId} • ${row.craftsmanName}` : `${row.skillTier} ${row.empNo ? `• Emp #${row.empNo}` : ''}`}
                          </div>

                          {/* Smart Status Badge & Overwrite Protection */}
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                            {isDone ? (
                              <span style={{ 
                                background: 'rgba(52, 211, 153, 0.2)', 
                                color: '#34d399', 
                                border: '1px solid rgba(52, 211, 153, 0.45)', 
                                padding: '1px 6px', 
                                borderRadius: '4px', 
                                fontSize: '9.5px', 
                                fontWeight: '800',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <CheckCircle2 size={10} /> Completed
                              </span>
                            ) : isRunning ? (
                              <span style={{ 
                                background: 'rgba(56, 189, 248, 0.2)', 
                                color: '#38bdf8', 
                                border: '1px solid rgba(56, 189, 248, 0.45)', 
                                padding: '1px 6px', 
                                borderRadius: '4px', 
                                fontSize: '9.5px', 
                                fontWeight: '800',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <Clock size={10} /> In Progress
                              </span>
                            ) : (
                              <span style={{ 
                                background: 'rgba(212, 175, 55, 0.12)', 
                                color: '#fef08a', 
                                border: '1px solid rgba(212, 175, 55, 0.3)', 
                                padding: '1px 6px', 
                                borderRadius: '4px', 
                                fontSize: '9.5px', 
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <Zap size={10} /> Ready
                              </span>
                            )}

                            {isDone && (
                              <button
                                type="button"
                                onClick={() => handleToggleLock(idx)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: row.isLocked ? '#94a3b8' : '#fbbf24',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  padding: '0 2px'
                                }}
                                title={row.isLocked ? "Completed order is locked to prevent overwrite. Click to unlock & edit." : "Order is unlocked. Click to lock & protect."}
                              >
                                {row.isLocked ? '🔒' : '🔓'}
                              </button>
                            )}
                          </div>
                        </div>
                        {row.isSubJob ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubJob(idx)}
                            style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', borderRadius: '4px', padding: '1px 5px', fontSize: '10px', cursor: 'pointer' }}
                            title="Remove additional item"
                          >
                            ✕
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isAbsent}
                            onClick={() => handleAddJobForBench(idx)}
                            style={{ 
                              background: 'rgba(56, 189, 248, 0.15)', 
                              border: '1px solid rgba(56, 189, 248, 0.4)', 
                              color: '#38bdf8', 
                              borderRadius: '4px', 
                              padding: '2px 5px', 
                              fontSize: '9.5px', 
                              fontWeight: 'bold',
                              cursor: isAbsent ? 'not-allowed' : 'pointer' 
                            }}
                            title={isDone ? "Craftsman completed earlier job. Click to assign a 2nd job for the remaining hours!" : "Add 2nd separate job row for this craftsman on the same day"}
                          >
                            + Extra
                          </button>
                        )}
                      </div>
                    </td>
                    {/* Unique Work Order # Column */}
                    <td>
                      <input 
                        type="text"
                        disabled={isFieldDisabled}
                        value={row.workOrder || ''}
                        onChange={(e) => handleRowChange(idx, 'workOrder', e.target.value)}
                        placeholder="e.g. WO-VIP-9942"
                        style={{ 
                          width: '100%', 
                          padding: '4px 6px', 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          color: isDone ? '#34d399' : '#fef08a', 
                          background: isLocked ? '#060c18' : '#0a1020', 
                          border: isLocked ? '1px solid rgba(52, 211, 153, 0.25)' : '1px solid rgba(255, 255, 255, 0.15)', 
                          borderRadius: '6px',
                          cursor: isLocked ? 'not-allowed' : 'text'
                        }}
                        title={isLocked ? "Completed order locked to prevent overwrite" : "Company unique Order ID / Voucher Number"}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => handleRowChange(idx, 'isPresent', !row.isPresent)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          border: isAbsent ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(52, 211, 153, 0.5)',
                          background: isAbsent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                          color: isAbsent ? '#fca5a5' : '#34d399'
                        }}
                      >
                        {isAbsent ? 'On Leave' : 'Present'}
                      </button>
                    </td>
                    <td>
                      <select
                        disabled={isFieldDisabled}
                        value={row.channel}
                        onChange={(e) => {
                          const ch = e.target.value;
                          let chName = row.channelName;
                          if (ch === 'EXTERNAL_SHOP') {
                            const defaultShop = (clientShops && clientShops.length > 0) ? clientShops[0].name : 'Pushpa Jewellers';
                            chName = defaultShop;
                          } else if (ch === 'OWN_SHOWROOM') {
                            chName = 'Ashadi Main Branch (Kaduwela)';
                          } else if (ch === 'FACTORY_STOCK') {
                            chName = 'Central Factory Buffer';
                          } else if (ch === 'OWNER_SPECIAL') {
                            chName = 'Owner VIP Commission';
                          }
                          setRows(prev => {
                            const updated = [...prev];
                            updated[idx] = { ...updated[idx], channel: ch, channelName: chName };
                            return updated;
                          });
                        }}
                        style={{ 
                          padding: '5px 6px', 
                          fontSize: '11px', 
                          color: '#cbd5e1', 
                          background: '#0a1020',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '6px',
                          width: '100%' 
                        }}
                      >
                        <option value="EXTERNAL_SHOP">External Shop (B2B)</option>
                        <option value="OWN_SHOWROOM">Own Showroom</option>
                        <option value="FACTORY_STOCK">Factory Stock</option>
                        <option value="OWNER_SPECIAL">👑 Owner VIP</option>
                      </select>

                      {row.channel === 'EXTERNAL_SHOP' && (
                        <div style={{ marginTop: '3px' }}>
                          <select
                            disabled={isFieldDisabled}
                            value={row.channelName || ''}
                            onChange={(e) => handleRowChange(idx, 'channelName', e.target.value)}
                            style={{
                              padding: '3px 4px',
                              fontSize: '10px',
                              color: '#fef08a',
                              background: '#0d1322',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              borderRadius: '4px',
                              width: '100%'
                            }}
                          >
                            {(clientShops || []).map(s => (
                              <option key={s.id || s.name} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {row.channel === 'OWN_SHOWROOM' && (
                        <div style={{ marginTop: '3px' }}>
                          <select
                            disabled={isFieldDisabled}
                            value={row.channelName || 'Ashadi Main Branch (Kaduwela)'}
                            onChange={(e) => handleRowChange(idx, 'channelName', e.target.value)}
                            style={{
                              padding: '3px 4px',
                              fontSize: '10px',
                              color: '#93c5fd',
                              background: '#0d1322',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                              borderRadius: '4px',
                              width: '100%'
                            }}
                          >
                            <option value="Ashadi Main Branch (Kaduwela)">Kaduwela (Main Branch)</option>
                            <option value="Ashadi Branch (Galle)">Galle Branch</option>
                            <option value="Ashadi Branch (Negombo)">Negombo Branch</option>
                          </select>
                        </div>
                      )}
                    </td>

                    {/* Manufacturing Route / Method Selection */}
                    <td>
                      <select
                        disabled={isFieldDisabled}
                        value={row.craftingMethod || 'HANDMADE'}
                        onChange={(e) => {
                          const route = e.target.value;
                          setRows(prev => {
                            const updated = [...prev];
                            updated[idx] = { ...updated[idx], craftingMethod: route };
                            return updated;
                          });
                        }}
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: '#0a1020',
                          color: row.craftingMethod === 'CASTING' ? '#fb923c' : row.craftingMethod === 'CNC_LASER' ? '#38bdf8' : '#fbbf24',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px'
                        }}
                      >
                        <option value="HANDMADE">🔨 Handmade</option>
                        <option value="CASTING">🔥 Casting</option>
                        <option value="CNC_LASER">⚡ CNC/Laser</option>
                      </select>
                    </td>

                    {/* Design Code / Multi-Item Suite Specification */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <button
                          type="button"
                          disabled={isFieldDisabled}
                          onClick={() => handleToggleSuite(idx)}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9.5px',
                            fontWeight: 'bold',
                            cursor: isFieldDisabled ? 'not-allowed' : 'pointer',
                            border: row.isSuite ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(255, 255, 255, 0.15)',
                            background: row.isSuite ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.2))' : 'rgba(255, 255, 255, 0.05)',
                            color: row.isSuite ? '#fbbf24' : '#94a3b8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="Click to switch between single design and multi-item suite"
                        >
                          <span>{row.isSuite ? '👑 Suite Set Active' : '💎 Single Design'}</span>
                        </button>

                        {row.isSuite && (
                          <button
                            type="button"
                            disabled={isFieldDisabled}
                            onClick={() => handleAddSuiteItem(idx)}
                            style={{
                              background: 'rgba(245, 158, 11, 0.2)',
                              border: '1px solid rgba(245, 158, 11, 0.5)',
                              color: '#fbbf24',
                              borderRadius: '4px',
                              padding: '1px 5px',
                              fontSize: '9.5px',
                              fontWeight: 'bold',
                              cursor: isFieldDisabled ? 'not-allowed' : 'pointer'
                            }}
                            title="Add another piece to this suite"
                          >
                            + Piece
                          </button>
                        )}
                      </div>

                      {!row.isSuite ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <select
                              disabled={isFieldDisabled}
                              value={row.designCode}
                              onChange={(e) => handleRowChange(idx, 'designCode', e.target.value)}
                              style={{ 
                                flex: 1,
                                padding: '5px 6px', 
                                fontSize: '11px', 
                                fontWeight: '600',
                                color: '#fff', 
                                background: '#0a1020',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '6px',
                                minWidth: 0 
                              }}
                            >
                              {matchedDesigns.length > 0 && (
                                <optgroup label={`⭐ Match ${benchTier} (${matchedDesigns.length})`}>
                                  {matchedDesigns.map(d => (
                                    <option key={d.code} value={d.code}>
                                      ⭐ {d.code} — {d.name} ({d.totalSMT}m)
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              <optgroup label={matchedDesigns.length > 0 ? `Other Grade Designs (${otherDesigns.length})` : 'All Jewellery Designs'}>
                                {otherDesigns.map(d => (
                                  <option key={d.code} value={d.code}>
                                    {d.code} — {d.name} ({d.totalSMT}m • {d.skillTier || 'Grade B'})
                                  </option>
                                ))}
                              </optgroup>
                            </select>

                            <button
                              type="button"
                              disabled={isFieldDisabled}
                              onClick={() => setVisualPickerState({
                                isOpen: true,
                                rowIdx: idx,
                                isSuite: false,
                                itemIdx: null,
                                craftsman: { id: row.craftsmanId, name: row.craftsmanName, skillTier: row.skillTier },
                                currentDesignCode: row.designCode
                              })}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                fontSize: '10.5px',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(180, 83, 9, 0.25))',
                                border: '1px solid rgba(212, 175, 55, 0.55)',
                                color: '#fef08a',
                                cursor: isFieldDisabled ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                flexShrink: 0
                              }}
                              title={`Open Visual Photo Gallery for Bench ${row.craftsmanId}`}
                            >
                              <Camera size={12} />
                              <span>Browse</span>
                            </button>
                          </div>

                          {/* Mini visual preview under single design select */}
                          {activeDesignObj && (
                            <div 
                              onClick={() => !isFieldDisabled && setVisualPickerState({
                                isOpen: true,
                                rowIdx: idx,
                                isSuite: false,
                                itemIdx: null,
                                craftsman: { id: row.craftsmanId, name: row.craftsmanName, skillTier: row.skillTier },
                                currentDesignCode: row.designCode
                              })}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                padding: '3px 6px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '4px',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                cursor: isFieldDisabled ? 'default' : 'pointer'
                              }}
                              title="Click to view full photo & switch design"
                            >
                              <img 
                                src={getDesignDisplayImage(activeDesignObj)} 
                                alt="" 
                                style={{ 
                                  width: '20px', 
                                  height: '20px', 
                                  borderRadius: '3px', 
                                  objectFit: 'cover',
                                  border: '1px solid rgba(212, 175, 55, 0.4)',
                                  flexShrink: 0
                                }} 
                              />
                              <span style={{ fontSize: '10px', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                {activeDesignObj.name}
                              </span>
                              <span style={{ fontSize: '9px', color: '#fbbf24', fontWeight: 'bold', flexShrink: 0 }}>
                                {activeDesignObj.totalSMT}m
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            type="text"
                            disabled={isFieldDisabled}
                            value={row.suiteName || ''}
                            onChange={(e) => handleRowChange(idx, 'suiteName', e.target.value)}
                            placeholder="Suite Name (e.g. Bridal Suite)"
                            style={{
                              padding: '2px 5px',
                              fontSize: '10.5px',
                              fontWeight: 'bold',
                              color: '#fef08a',
                              background: '#0d1322',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              borderRadius: '4px',
                              width: '100%'
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '110px', overflowY: 'auto' }}>
                            {(row.items || []).map((it, itemIdx) => {
                              return (
                                <div key={itemIdx} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <select
                                    disabled={isFieldDisabled}
                                    value={it.designCode}
                                    onChange={(e) => handleUpdateSuiteItem(idx, itemIdx, 'designCode', e.target.value)}
                                    style={{
                                      flex: 1,
                                      padding: '2px 4px',
                                      fontSize: '10px',
                                      color: '#fff',
                                      background: '#0a1020',
                                      border: '1px solid rgba(255, 255, 255, 0.1)',
                                      borderRadius: '3px',
                                      minWidth: 0
                                    }}
                                  >
                                    {matchedDesigns.length > 0 && (
                                      <optgroup label={`⭐ Match ${benchTier}`}>
                                        {matchedDesigns.map(d => (
                                          <option key={d.code} value={d.code}>⭐ {d.code} - {d.name} ({d.totalSMT}m)</option>
                                        ))}
                                      </optgroup>
                                    )}
                                    <optgroup label="Other Designs">
                                      {otherDesigns.map(d => (
                                        <option key={d.code} value={d.code}>{d.code} - {d.name} ({d.totalSMT}m)</option>
                                      ))}
                                    </optgroup>
                                  </select>
                                  <button
                                    type="button"
                                    disabled={isFieldDisabled}
                                    onClick={() => setVisualPickerState({
                                      isOpen: true,
                                      rowIdx: idx,
                                      isSuite: true,
                                      itemIdx: itemIdx,
                                      craftsman: { id: row.craftsmanId, name: row.craftsmanName, skillTier: row.skillTier },
                                      currentDesignCode: it.designCode
                                    })}
                                    style={{
                                      padding: '2px 5px',
                                      background: 'rgba(212, 175, 55, 0.2)',
                                      border: '1px solid rgba(212, 175, 55, 0.4)',
                                      borderRadius: '3px',
                                      color: '#fef08a',
                                      cursor: isFieldDisabled ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}
                                    title="Open Visual Photo Picker for this Suite Piece"
                                  >
                                    <Camera size={11} />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    disabled={isFieldDisabled}
                                    value={it.qty}
                                    onChange={(e) => handleUpdateSuiteItem(idx, itemIdx, 'qty', parseInt(e.target.value, 10) || 1)}
                                    style={{
                                      width: '34px',
                                      padding: '2px 2px',
                                      textAlign: 'center',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                      color: '#fef08a',
                                      background: '#0a1020',
                                      border: '1px solid rgba(255, 255, 255, 0.1)',
                                      borderRadius: '3px'
                                    }}
                                    title="Piece quantity"
                                  />
                                  <button
                                    type="button"
                                    disabled={isFieldDisabled || (row.items || []).length <= 1}
                                    onClick={() => handleRemoveSuiteItem(idx, itemIdx)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: (isFieldDisabled || (row.items || []).length <= 1) ? '#475569' : '#f87171',
                                      cursor: (isFieldDisabled || (row.items || []).length <= 1) ? 'not-allowed' : 'pointer',
                                      padding: '1px 3px',
                                      fontSize: '10px'
                                    }}
                                    title="Remove piece"
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.isSuite ? (
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#fbbf24' }}>
                          {row.qtyAllocated} <span style={{ fontSize: '9px', display: 'block', color: '#cbd5e1' }}>Set Pcs</span>
                        </div>
                      ) : (
                        <input 
                          type="number"
                          min="1"
                          max="99"
                          disabled={isFieldDisabled}
                          value={row.qtyAllocated}
                          onChange={(e) => handleRowChange(idx, 'qtyAllocated', e.target.value)}
                          style={{ 
                            width: '46px', 
                            padding: '5px 2px', 
                            textAlign: 'center', 
                            fontSize: '13px', 
                            fontWeight: '800', 
                            color: '#fef08a', 
                            background: '#0a1020', 
                            border: '1px solid rgba(245, 158, 11, 0.5)', 
                            borderRadius: '6px' 
                          }}
                        />
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <input 
                        type="number"
                        step="any"
                        disabled={isFieldDisabled}
                        value={row.assumedHours}
                        onChange={(e) => handleRowChange(idx, 'assumedHours', e.target.value)}
                        style={{ 
                          width: '65px', 
                          padding: '5px 6px', 
                          textAlign: 'right', 
                          fontSize: '12px', 
                          fontWeight: 'bold', 
                          color: '#93c5fd',
                          background: '#0d1322',
                          border: '1px solid rgba(147, 197, 253, 0.4)',
                          borderRadius: '6px'
                        }}
                        title="Directly type any assumed hours (e.g. 4.0, 6.5, 8.0)"
                      />
                    </td>
                    <td>
                      <input 
                        type="number"
                        step="any"
                        placeholder="g"
                        disabled={isFieldDisabled}
                        value={row.goldIssuedGrams}
                        onChange={(e) => handleRowChange(idx, 'goldIssuedGrams', e.target.value)}
                        style={{ 
                          width: '65px', 
                          padding: '5px 6px', 
                          fontSize: '11px', 
                          fontWeight: '600', 
                          color: '#fde047', 
                          background: '#0a1020',
                          border: '1px solid rgba(234, 179, 8, 0.3)',
                          borderRadius: '6px' 
                        }}
                      />
                    </td>
                    <td>
                      <input 
                        type="number"
                        step="any"
                        placeholder="opt"
                        disabled={isFieldDisabled}
                        value={row.actualHours}
                        onChange={(e) => handleRowChange(idx, 'actualHours', e.target.value)}
                        style={{ 
                          width: '65px', 
                          padding: '5px 6px', 
                          fontSize: '11px', 
                          fontWeight: 'bold',
                          color: '#34d399', 
                          background: '#0a1020',
                          border: '1px solid rgba(52, 211, 153, 0.3)',
                          borderRadius: '6px' 
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '14px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            💡 <strong>Efficiency Tip:</strong> Completed work orders are securely locked (🔒) and will not be overwritten. Click <em>+ Extra</em> on any bench to assign an afternoon/secondary job.
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn-ghost-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-gold-primary" 
              onClick={handleSaveBatch}
              disabled={isSubmitting || (readyCount === 0 && completedCount > 0 && inProgressCount === 0)}
            >
              <Save size={15} />
              <span>
                {isSubmitting 
                  ? 'Saving...' 
                  : readyCount > 0 
                    ? `Confirm & Dispatch ${readyCount} Pending Benches` 
                    : `All ${presentCount} Benches Dispatched`}
              </span>
            </button>
          </div>
        </div>

        {/* Visual Jewellery Design Selector Popup */}
        {visualPickerState && visualPickerState.isOpen && (
          <VisualDesignPickerModal
            isOpen={visualPickerState.isOpen}
            onClose={() => setVisualPickerState(null)}
            onSelect={handleSelectDesignFromVisualPicker}
            designs={designs}
            craftsman={visualPickerState.craftsman}
            currentDesignCode={visualPickerState.currentDesignCode}
          />
        )}

      </div>
    </div>
  );
}
