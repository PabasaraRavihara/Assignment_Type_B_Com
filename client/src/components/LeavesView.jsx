import React, { useState } from 'react';
import { Calendar, UserX, Plus, CheckCircle2, AlertTriangle, Clock, Users, Trash2, ShieldCheck, HeartPulse } from 'lucide-react';

export default function LeavesView({ leaves, craftsmen, onAddLeave, onDeleteLeave, metrics }) {
  const [showModal, setShowModal] = useState(false);
  const [craftsmanId, setCraftsmanId] = useState(craftsmen && craftsmen[0] ? craftsmen[0].id : '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveType, setLeaveType] = useState('Full Day Leave (13h)');
  const [reason, setReason] = useState('Approved Casual Leave');
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('ALL');

  const today = new Date().toISOString().split('T')[0];
  const todayLeaves = (leaves || []).filter(l => l.date === today);
  const todayHoursLost = todayLeaves.reduce((sum, l) => sum + (l.hoursDeducted || 13.0), 0);
  const totalCraftsmen = craftsmen.length || 63;
  const activeToday = Math.max(0, totalCraftsmen - todayLeaves.length);
  const adjustedCapacityToday = parseFloat((totalCraftsmen * 13.0 - todayHoursLost).toFixed(1));

  const filteredLeaves = (leaves || []).filter(l => {
    const matchesSearch = l.craftsmanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           l.craftsmanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (l.empNo && l.empNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (l.date && l.date.includes(searchTerm));
    const matchesMonth = monthFilter === 'ALL' || (l.date && l.date.startsWith(monthFilter));
    return matchesSearch && matchesMonth;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!craftsmanId) return;

    onAddLeave({
      craftsmanId,
      date,
      leaveType,
      reason
    });

    setShowModal(false);
    setReason('Approved Casual Leave');
  };

  const getLeaveBadge = (type) => {
    if (type.includes('Medical')) {
      return (
        <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
          🏥 Medical Leave (13h)
        </span>
      );
    }
    if (type.includes('Half Day')) {
      return (
        <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fef08a', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
          ⏱️ Half Day (6.5h)
        </span>
      );
    }
    return (
      <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
        📅 Full Day (13h)
      </span>
    );
  };

  return (
    <div>
      <div className="executive-header">
        <div>
          <h1 className="executive-title">
            <UserX size={24} color="#d4af37" />
            <span>Craftsman Attendance & Leave Management</span>
          </h1>
          <p className="executive-subtitle">
            Record craftsman absences to dynamically adjust daily plant capacity (<strong>63 Benches × 13h = 819 Gross Hours</strong>).
            Identifies approved leaves so they are not mistaken for workshop delays.
          </p>
        </div>
        <button className="btn-gold-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span>Record Craftsman Leave</span>
        </button>
      </div>

      {/* KPI Cards: Dynamic Impact on Today's Capacity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="kpi-card-luxury">
          <div className="kpi-header">
            <span className="kpi-label">TOTAL CRAFTSMEN</span>
            <Users size={16} color="#d4af37" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{totalCraftsmen}</span>
            <span className="kpi-unit">Benches</span>
          </div>
          <div className="kpi-caption">Registered master goldsmith roster</div>
        </div>

        <div className="kpi-card-luxury">
          <div className="kpi-header">
            <span className="kpi-label">TODAY'S ABSENT CRAFTSMEN</span>
            <UserX size={16} color="#f87171" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ color: '#f87171' }}>{todayLeaves.length}</span>
            <span className="kpi-unit">Craftsmen</span>
          </div>
          <div className="kpi-caption" style={{ color: '#fca5a5' }}>
            {activeToday} active benches working today
          </div>
        </div>

        <div className="kpi-card-luxury">
          <div className="kpi-header">
            <span className="kpi-label">CAPACITY HOURS DEDUCTED</span>
            <Clock size={16} color="#fbbf24" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ color: '#fbbf24' }}>-{todayHoursLost}</span>
            <span className="kpi-unit">Hours</span>
          </div>
          <div className="kpi-caption">Deducted from 819h plant baseline</div>
        </div>

        <div className="kpi-card-luxury">
          <div className="kpi-header">
            <span className="kpi-label">TODAY'S ADJUSTED CAPACITY</span>
            <ShieldCheck size={16} color="#34d399" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ color: '#34d399' }}>{adjustedCapacityToday}</span>
            <span className="kpi-unit">Gross Hrs</span>
          </div>
          <div className="kpi-caption">Accurate realistic plant target today</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '14px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Filter by Craftsman Name, Employ No, ID or Date..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ minWidth: '280px', flex: 1 }}
        />
        
        {/* Month Selector Pills */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[
            { id: 'ALL', label: 'All Months' },
            { id: '2026-11', label: 'November 2026' },
            { id: '2026-10', label: 'October 2026' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMonthFilter(m.id)}
              className="btn-ghost-secondary"
              style={{
                borderColor: monthFilter === m.id ? '#d4af37' : 'rgba(255, 255, 255, 0.1)',
                color: monthFilter === m.id ? '#fef08a' : '#cbd5e1',
                background: monthFilter === m.id ? 'rgba(212, 175, 55, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                padding: '5px 12px',
                fontSize: '12px'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '13px', color: '#94a3b8' }}>
          Showing <strong>{filteredLeaves.length}</strong> recorded leave entries
        </div>
      </div>

      {/* Leaves Table */}
      <div className="table-luxury-wrap">
        <table className="table-luxury">
          <thead>
            <tr>
              <th>Date</th>
              <th>Leave ID</th>
              <th>Craftsman Bench</th>
              <th>Employ No.</th>
              <th>Leave Type</th>
              <th>Hours Deducted</th>
              <th>Reason / Justification</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.map((l) => (
              <tr key={l.id}>
                <td><strong>{l.date}</strong></td>
                <td><code style={{ background: '#0a0f1d', padding: '2px 6px', borderRadius: '4px', color: '#d4af37' }}>{l.id}</code></td>
                <td>
                  <strong style={{ color: '#fef08a' }}>{l.craftsmanId}</strong> — {l.craftsmanName}
                </td>
                <td>{l.empNo || '—'}</td>
                <td>{getLeaveBadge(l.leaveType)}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#f87171' }}>
                  -{l.hoursDeducted} hrs
                </td>
                <td style={{ color: '#cbd5e1' }}>{l.reason}</td>
                <td>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    color: '#34d399',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    <CheckCircle2 size={13} /> Approved
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => onDeleteLeave && onDeleteLeave(l.id)}
                    className="btn-ghost-secondary"
                    style={{ padding: '4px 8px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    title="Cancel Leave Record"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Leave Modal */}
      {showModal && (
        <div className="modal-backdrop-luxury">
          <div className="modal-window-luxury" style={{ maxWidth: '560px' }}>
            <h3 style={{ marginBottom: '18px', color: '#fff', fontSize: '19px', fontFamily: 'var(--font-serif)' }}>
              Record Craftsman Leave / Absence
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                  Select Craftsman (From 63 Benches)
                </label>
                <select 
                  style={{ width: '100%' }}
                  value={craftsmanId}
                  onChange={(e) => setCraftsmanId(e.target.value)}
                >
                  {craftsmen.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.name} ({c.empNo ? `Emp #${c.empNo} • ` : ''}{c.skillTier})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Leave Date
                  </label>
                  <input 
                    type="date" 
                    style={{ width: '100%' }}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Leave Category
                  </label>
                  <select 
                    style={{ width: '100%' }}
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                  >
                    <option value="Full Day Leave (13h)">Full Day Leave (13 Hours Lost)</option>
                    <option value="Half Day Leave (6.5h)">Half Day Leave (6.5 Hours Lost)</option>
                    <option value="Medical Leave (13h)">Medical / Sick Leave (13 Hours Lost)</option>
                    <option value="Authorized Casual (13h)">Authorized Casual (13 Hours Lost)</option>
                    <option value="Unauthorized Absent (13h)">Absent Without Notice (13 Hours Lost)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                  Reason / Notes
                </label>
                <input 
                  type="text" 
                  style={{ width: '100%' }}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Eye fatigue doctor visit, family function, personal emergency"
                />
              </div>

              <div style={{ 
                background: 'rgba(212, 175, 55, 0.08)', 
                border: '1px solid rgba(212, 175, 55, 0.25)', 
                borderRadius: '8px', 
                padding: '12px', 
                marginBottom: '20px', 
                fontSize: '13px',
                color: '#fef08a'
              }}>
                ℹ️ <strong>Capacity Rule:</strong> Recording this leave automatically updates today's Gross Available Plant Hours on the Boss's Dashboard and reduces gross benchmark from 819h.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-ghost-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-gold-primary">
                  Save Leave Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
