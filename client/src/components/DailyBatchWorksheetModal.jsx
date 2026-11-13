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
  ArrowRight
} from 'lucide-react';
import api from '../api';

export default function DailyBatchWorksheetModal({ 
  craftsmen, 
  designs, 
  leaves, 
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

  useEffect(() => {
    initializeRows();
  }, [selectedDate, craftsmen, designs]);

  const initializeRows = () => {
    const initialRows = (craftsmen || []).map((c, index) => {
      const isAbsent = absentIds.has(c.id);

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

      return {
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
        channelName: defaultChannel === 'EXTERNAL_SHOP' ? extShop : defaultChannel === 'FACTORY_STOCK' ? 'Central Factory Buffer' : defaultChannel === 'OWNER_SPECIAL' ? 'Owner VIP Commission' : 'Ashadi Flagship Showroom',
        designCode: defaultDesign ? defaultDesign.code : 'RNG-SMP-01',
        qtyAllocated: defaultQty,
        assumedHours: assumed,
        actualHours: '',
        goldIssuedGrams: (defaultQty * 8.2).toFixed(1),
        goldReturnedGrams: ''
      };
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
      workOrder: `${parentRow.workOrder || `WO-${selectedDate.replace(/-/g, '').slice(2)}-${parentRow.craftsmanId}`}-B`,
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
      isSubJob: true
    };

    setRows(prev => {
      const updated = [...prev];
      updated.splice(idx + 1, 0, newJob);
      return updated;
    });
  };

  const handleRemoveSubJob = (idx) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuickAutoShift = async () => {
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

    const activeAllocations = rows
      .filter(r => r.isPresent)
      .map(r => ({
        craftsmanId: r.craftsmanId,
        date: selectedDate,
        workOrder: r.workOrder || `WO-${selectedDate.replace(/-/g, '').slice(2)}-${r.craftsmanId}`,
        channel: r.channel,
        channelName: r.channelName,
        designCode: r.designCode,
        metalType: r.metalType || ((designs || []).find(d => d.code === r.designCode)?.metalType) || 'Gold 22K',
        qtyAllocated: parseInt(r.qtyAllocated, 10) || 1,
        assumedHours: parseFloat(r.assumedHours) || 8.0,
        actualHours: r.actualHours ? parseFloat(r.actualHours) : null,
        goldIssuedGrams: r.goldIssuedGrams ? parseFloat(r.goldIssuedGrams) : null,
        goldReturnedGrams: r.goldReturnedGrams ? parseFloat(r.goldReturnedGrams) : null,
        isSuite: !!r.isSuite,
        suiteName: r.isSuite ? (r.suiteName || 'Jewellery Suite / Set') : null,
        items: r.isSuite && Array.isArray(r.items) ? r.items : []
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

  const presentCount = rows.filter(r => r.isPresent).length;
  const leaveCount = rows.filter(r => !r.isPresent).length;
  const totalAssumedSum = rows
    .filter(r => r.isPresent)
    .reduce((sum, r) => sum + (parseFloat(r.assumedHours) || 0), 0)
    .toFixed(1);

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

        {/* Action Summary Pill Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)', padding: '10px 16px', borderRadius: '8px', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: '#34d399', fontWeight: 'bold' }}>
              ✓ {presentCount} Benches Present
            </span>
            <span>•</span>
            <span style={{ color: '#f87171', fontWeight: 'bold' }}>
              {leaveCount} Craftsmen on Leave ({leaveCount * 13}h Deducted)
            </span>
            <span>•</span>
            <span style={{ color: '#93c5fd', fontWeight: 'bold' }}>
              Total Daily Planned SMT: {totalAssumedSum} Hours
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn-ghost-secondary" 
              onClick={handleQuickAutoShift}
              disabled={isSubmitting}
              style={{ fontSize: '12px', borderColor: '#38bdf8', color: '#38bdf8' }}
              title="1-Click standard dispatch for all present benches based on skills and channels"
            >
              <Sparkles size={14} />
              <span>1-Click Auto Dispatch (All Present)</span>
            </button>

            <button 
              type="button" 
              className="btn-gold-primary" 
              onClick={handleSaveBatch}
              disabled={isSubmitting}
              style={{ fontSize: '12px' }}
            >
              <Save size={14} />
              <span>Save & Dispatch {presentCount} Benches</span>
            </button>
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
                <th style={{ width: '250px' }}>Design / Suite Items</th>
                <th style={{ width: '65px', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '80px', textAlign: 'right' }}>Assumed Hrs</th>
                <th style={{ width: '85px' }}>Gold (g)</th>
                <th style={{ width: '80px' }}>Actual Hrs</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isAbsent = !row.isPresent;
                return (
                  <tr 
                    key={row.isSubJob ? `${row.craftsmanId}-sub-${idx}` : `${row.craftsmanId}-${idx}`}
                    style={{ 
                      opacity: isAbsent ? 0.45 : 1,
                      background: row.isSuite ? 'rgba(245, 158, 11, 0.04)' : row.isSubJob ? 'rgba(56, 189, 248, 0.05)' : isAbsent ? 'rgba(239, 68, 68, 0.04)' : undefined,
                      borderLeft: row.isSuite ? '3px solid #f59e0b' : row.isSubJob ? '3px solid #38bdf8' : undefined
                    }}
                  >
                    <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                      {row.isSubJob ? '↳' : idx + 1}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div>
                          <strong style={{ color: row.isSuite ? '#fbbf24' : row.isSubJob ? '#38bdf8' : '#d4af37' }}>
                            {row.isSubJob ? '↳ Extra Item' : row.craftsmanId}
                          </strong> {!row.isSubJob && `— ${row.craftsmanName}`}
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            {row.isSubJob ? `${row.craftsmanId} • ${row.craftsmanName}` : `${row.skillTier} ${row.empNo ? `• Emp #${row.empNo}` : ''}`}
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
                            title="Add 2nd separate job row for this craftsman on the same day"
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
                        disabled={isAbsent}
                        value={row.workOrder || ''}
                        onChange={(e) => handleRowChange(idx, 'workOrder', e.target.value)}
                        placeholder="e.g. WO-VIP-9942"
                        style={{ 
                          width: '100%', 
                          padding: '4px 6px', 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          color: '#fef08a', 
                          background: '#0a1020', 
                          border: '1px solid rgba(255, 255, 255, 0.15)', 
                          borderRadius: '6px' 
                        }}
                        title="Company unique Order ID / Voucher Number"
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRowChange(idx, 'isPresent', !row.isPresent)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
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
                        disabled={isAbsent}
                        value={row.channel}
                        onChange={(e) => {
                          const ch = e.target.value;
                          let chName = row.channelName;
                          if (ch === 'EXTERNAL_SHOP') {
                            const defaultShop = (clientShops && clientShops.length > 0) ? clientShops[0].name : 'Pushpa Jewellers';
                            chName = defaultShop;
                          } else if (ch === 'OWN_SHOWROOM') {
                            chName = 'Ashadi Flagship Showroom';
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
                            disabled={isAbsent}
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
                    </td>
                    {/* Design Code / Multi-Item Suite Specification */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <button
                          type="button"
                          disabled={isAbsent}
                          onClick={() => handleToggleSuite(idx)}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9.5px',
                            fontWeight: 'bold',
                            cursor: isAbsent ? 'not-allowed' : 'pointer',
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
                            disabled={isAbsent}
                            onClick={() => handleAddSuiteItem(idx)}
                            style={{
                              background: 'rgba(245, 158, 11, 0.2)',
                              border: '1px solid rgba(245, 158, 11, 0.5)',
                              color: '#fbbf24',
                              borderRadius: '4px',
                              padding: '1px 5px',
                              fontSize: '9.5px',
                              fontWeight: 'bold',
                              cursor: isAbsent ? 'not-allowed' : 'pointer'
                            }}
                            title="Add another piece to this suite"
                          >
                            + Piece
                          </button>
                        )}
                      </div>

                      {!row.isSuite ? (
                        <select
                          disabled={isAbsent}
                          value={row.designCode}
                          onChange={(e) => handleRowChange(idx, 'designCode', e.target.value)}
                          style={{ 
                            padding: '5px 6px', 
                            fontSize: '11px', 
                            fontWeight: '600',
                            color: '#fff', 
                            background: '#0a1020',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            width: '100%' 
                          }}
                        >
                          {(designs || []).map(d => (
                            <option key={d.code} value={d.code}>
                              {d.code} ({d.totalSMT}m)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            type="text"
                            disabled={isAbsent}
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
                                    disabled={isAbsent}
                                    value={it.designCode}
                                    onChange={(e) => handleUpdateSuiteItem(idx, itemIdx, 'designCode', e.target.value)}
                                    style={{
                                      flex: 1,
                                      padding: '2px 4px',
                                      fontSize: '10px',
                                      color: '#fff',
                                      background: '#0a1020',
                                      border: '1px solid rgba(255, 255, 255, 0.1)',
                                      borderRadius: '3px'
                                    }}
                                  >
                                    {(designs || []).map(d => (
                                      <option key={d.code} value={d.code}>{d.code} ({d.totalSMT}m)</option>
                                    ))}
                                  </select>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    disabled={isAbsent}
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
                                    disabled={isAbsent || (row.items || []).length <= 1}
                                    onClick={() => handleRemoveSuiteItem(idx, itemIdx)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: (row.items || []).length <= 1 ? '#475569' : '#f87171',
                                      cursor: (row.items || []).length <= 1 ? 'not-allowed' : 'pointer',
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
                          disabled={isAbsent}
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
                        step="0.1"
                        disabled={isAbsent}
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
                        step="0.1"
                        placeholder="g"
                        disabled={isAbsent}
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
                        step="0.1"
                        placeholder="opt"
                        disabled={isAbsent}
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
            💡 <strong>Efficiency Tip:</strong> Use <em>1-Click Auto Dispatch</em> at 08:00 AM to issue all bench job cards instantly. At 08:30 PM shift close, enter actual hours or run standard shift clockout.
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn-ghost-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-gold-primary" 
              onClick={handleSaveBatch}
              disabled={isSubmitting}
            >
              <Save size={15} />
              <span>Confirm & Dispatch {presentCount} Benches</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
