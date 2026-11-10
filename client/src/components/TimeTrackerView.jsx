import React, { useState } from 'react';
import { Clock, Plus, DollarSign, Award, AlertCircle, CheckCircle2, TrendingUp, Sparkles, Scale } from 'lucide-react';

export default function TimeTrackerView({ timeLogs, craftsmen, designs, onAddTimeLog }) {
  const [showModal, setShowModal] = useState(false);
  const [craftsmanId, setCraftsmanId] = useState(craftsmen && craftsmen[0] ? craftsmen[0].id : '');
  const [designCode, setDesignCode] = useState(designs && designs[0] ? designs[0].code : '');
  const [clockIn, setClockIn] = useState('08:15');
  const [clockOut, setClockOut] = useState('18:45');
  const [breakMin, setBreakMin] = useState(60);
  const [completedQty, setCompletedQty] = useState(4);
  const [passedQA, setPassedQA] = useState(4);
  const [reworkQty, setReworkQty] = useState(0);
  const [goldIssued, setGoldIssued] = useState('25.000');
  const [goldReturned, setGoldReturned] = useState('24.225'); // 3.1% loss

  const selectedCraftsman = craftsmen.find(c => c.id === craftsmanId) || craftsmen[0];
  const selectedDesign = designs.find(d => d.code === designCode) || designs[0];

  // Live calculation preview
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  const grossMinutes = (outH * 60 + outM) - (inH * 60 + inM);
  const previewAWM = Math.max(grossMinutes - parseInt(breakMin || 0, 10), 1);
  const previewESM = parseFloat(((passedQA || 0) * (selectedDesign?.totalSMT || 0)).toFixed(1));
  const previewEfficiency = previewAWM > 0 ? parseFloat(((previewESM / previewAWM) * 100).toFixed(1)) : 0;
  const previewBasePay = parseFloat((previewESM * (selectedCraftsman?.minuteRate || 9.5)).toFixed(2));
  const previewBonus = (previewEfficiency >= 85.0 && reworkQty === 0) ? 450.0 : 0.0;
  const previewTotalPay = parseFloat((previewBasePay + previewBonus).toFixed(2));

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddTimeLog({
      craftsmanId,
      designCode,
      clockIn,
      clockOut,
      breakMin,
      completedQty,
      passedQA,
      reworkQty,
      goldIssuedGrams: goldIssued,
      goldReturnedGrams: goldReturned,
      date: new Date().toISOString().split('T')[0]
    });
    setShowModal(false);
  };

  return (
    <div>
      <div className="executive-header">
        <div>
          <h1 className="executive-title">
            <Clock size={24} color="#d4af37" />
            <span>Time Tracking & Piecework Calculator</span>
          </h1>
          <p className="executive-subtitle">
            Normalises variable daily hours (8:00 AM – 8:30 PM span) into objective Efficiency % and piece-rate payouts with quality bonuses.
          </p>
        </div>
        <button className="btn-gold-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span>Record Bench Completion</span>
        </button>
      </div>

      {/* Formula Explanation Alert */}
      <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid var(--border-gold)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fef08a', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
          <Sparkles size={16} color="#d4af37" />
          <span>Standard Time-Based Piece-Rate (STPR) Logic:</span>
        </div>
        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
          Because craftsmen arrive and leave at different times, <strong>Actual Working Minutes (AWM)</strong> is calculated as <code>(Clock Out - Clock In) - Breaks</code>. 
          Payment is based on approved output (<code>Earned Standard Mins × Minute Rate</code>). 
          Craftsmen delivering <strong>Efficiency (ESM / AWM) ≥ 85%</strong> with zero defects earn a <strong>Rs. 450 Daily Quality & Efficiency Bonus</strong>!
        </p>
      </div>

      <div className="table-luxury-wrap">
        <table className="table-luxury">
          <thead>
            <tr>
              <th>Date</th>
              <th>Craftsman Bench</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Break</th>
              <th>AWM (min)</th>
              <th>Design Code</th>
              <th>Passed Pcs</th>
              <th>Rework</th>
              <th>Earned SMT</th>
              <th>Efficiency %</th>
              <th>Minute Rate</th>
              <th>Base Pay (Rs.)</th>
              <th>Bonus (Rs.)</th>
              <th>Total Day Pay (Rs.)</th>
              <th>Gold Loss %</th>
            </tr>
          </thead>
          <tbody>
            {timeLogs.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>
                  <strong style={{ color: '#d4af37' }}>{t.craftsmanId}</strong>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t.craftsmanName}</div>
                </td>
                <td style={{ textAlign: 'center' }}>{t.clockIn}</td>
                <td style={{ textAlign: 'center' }}>{t.clockOut}</td>
                <td style={{ textAlign: 'center' }}>{t.breakMin}m</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>{t.awm}m</td>
                <td><code style={{ background: '#0a0f1d', padding: '2px 6px', borderRadius: '4px' }}>{t.designCode}</code></td>
                <td style={{ textAlign: 'center', color: '#34d399', fontWeight: 'bold' }}>{t.passedQA}</td>
                <td style={{ textAlign: 'center', color: t.reworkQty > 0 ? '#ef4444' : '#64748b' }}>{t.reworkQty}</td>
                <td style={{ textAlign: 'right', fontWeight: '700', color: '#fef08a' }}>{t.esm} min</td>
                <td style={{ textAlign: 'right', fontWeight: '800', color: t.efficiency >= 85 ? '#34d399' : '#fbbf24' }}>
                  {t.efficiency}%
                </td>
                <td style={{ textAlign: 'right' }}>Rs. {t.minuteRate.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>Rs. {t.basePay.toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>
                  {t.bonus > 0 ? (
                    <span className="badge-bonus-pill">+Rs. {t.bonus}</span>
                  ) : (
                    <span style={{ color: '#64748b' }}>—</span>
                  )}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800', color: '#fef08a', fontSize: '14px' }}>
                  Rs. {t.totalPay.toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', color: '#38bdf8' }}>{t.goldLossPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Work Modal */}
      {showModal && (
        <div className="modal-backdrop-luxury">
          <div className="modal-window-luxury" style={{ maxWidth: '680px' }}>
            <h3 style={{ marginBottom: '18px', color: '#fff', fontSize: '19px', fontFamily: 'var(--font-serif)' }}>
              Record Daily Bench Work & Piecework Pay
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Craftsman (From 62 Benches)
                  </label>
                  <select style={{ width: '100%' }} value={craftsmanId} onChange={(e) => setCraftsmanId(e.target.value)}>
                    {craftsmen.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} — {c.name} ({c.empNo}) [{c.skillTier}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Jewellery Design
                  </label>
                  <select style={{ width: '100%' }} value={designCode} onChange={(e) => setDesignCode(e.target.value)}>
                    {designs.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} — {d.name} ({d.totalSMT} min)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Clock-In Time
                  </label>
                  <input type="time" style={{ width: '100%' }} value={clockIn} onChange={(e) => setClockIn(e.target.value)} required />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Clock-Out Time
                  </label>
                  <input type="time" style={{ width: '100%' }} value={clockOut} onChange={(e) => setClockOut(e.target.value)} required />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Breaks (min)
                  </label>
                  <input type="number" style={{ width: '100%' }} min="0" max="180" value={breakMin} onChange={(e) => setBreakMin(parseInt(e.target.value || 0, 10))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Completed Pcs
                  </label>
                  <input type="number" style={{ width: '100%' }} min="0" value={completedQty} onChange={(e) => setCompletedQty(parseInt(e.target.value || 0, 10))} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Passed QA Pcs
                  </label>
                  <input type="number" style={{ width: '100%' }} min="0" value={passedQA} onChange={(e) => setPassedQA(parseInt(e.target.value || 0, 10))} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Rework Pcs
                  </label>
                  <input type="number" style={{ width: '100%' }} min="0" value={reworkQty} onChange={(e) => setReworkQty(parseInt(e.target.value || 0, 10))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Raw Gold Issued (grams)
                  </label>
                  <input type="number" style={{ width: '100%' }} step="0.001" value={goldIssued} onChange={(e) => setGoldIssued(e.target.value)} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Finished + Scrap Returned (g)
                  </label>
                  <input type="number" style={{ width: '100%' }} step="0.001" value={goldReturned} onChange={(e) => setGoldReturned(e.target.value)} />
                </div>
              </div>

              {/* Dynamic Live Calculations Preview */}
              <div style={{ background: '#0a0f1d', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-gold)', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#d4af37', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} />
                  <span>Live Industrial Engineering Calculation:</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div>Actual Working Minutes (AWM): <strong>{previewAWM} min</strong></div>
                  <div>Earned Standard Minutes (ESM): <strong>{previewESM} min</strong></div>
                  <div>Craftsman Efficiency: <strong style={{ color: previewEfficiency >= 85 ? '#34d399' : '#fbbf24' }}>{previewEfficiency}%</strong></div>
                  <div>Base Piece-Rate Pay: <strong>Rs. {previewBasePay.toLocaleString()}</strong></div>
                  <div>Efficiency & QA Bonus: <strong style={{ color: previewBonus > 0 ? '#34d399' : '#94a3b8' }}>+Rs. {previewBonus}</strong></div>
                  <div style={{ color: '#fef08a', fontWeight: '800', fontSize: '15px' }}>
                    Total Day Pay: Rs. {previewTotalPay.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-ghost-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-gold-primary">Save Work Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
