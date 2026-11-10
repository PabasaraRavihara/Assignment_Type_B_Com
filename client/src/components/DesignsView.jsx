import React, { useState } from 'react';
import { Gem, Layers, Clock, DollarSign, ChevronRight, Scale, Info, Sparkles, Filter, Plus, X, Save, CheckCircle2 } from 'lucide-react';

export default function DesignsView({ designs, onAddDesign }) {
  const [selectedMetal, setSelectedMetal] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDesign, setSelectedDesign] = useState(designs && designs.length > 0 ? designs[0] : null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Design Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Ring',
    metalType: 'Gold 22K',
    skillTier: 'Grade A',
    totalSMT: 90,
    allowableLossPct: 3.0,
    description: ''
  });

  const getMetalInfo = (d) => {
    if (d.metalType?.includes('Platinum') || d.code.startsWith('PLT') || d.goldKarat?.includes('Platinum')) {
      return { 
        type: 'PLATINUM',
        label: '💎 Platinum 950', 
        purity: '950 Pure Platinum',
        color: '#67e8f9', 
        bg: 'rgba(6, 182, 212, 0.18)', 
        border: 'rgba(6, 182, 212, 0.5)',
        lossCeiling: '1.5% – 2.0% (Strict VIP Tolerance)',
        meltingPoint: '1,768°C (High-Temp Hydro-Torch)'
      };
    }
    if (d.metalType?.includes('Silver') || d.code.startsWith('SLV') || d.goldKarat?.includes('Silver')) {
      return { 
        type: 'SILVER',
        label: '⚪ Silver 925', 
        purity: '925 Sterling Silver',
        color: '#e2e8f0', 
        bg: 'rgba(226, 232, 240, 0.15)', 
        border: 'rgba(226, 232, 240, 0.4)',
        lossCeiling: '4.5% – 5.5% (High Buffing Allowance)',
        meltingPoint: '961°C (Standard Crucible Torch)'
      };
    }
    return { 
      type: 'GOLD',
      label: '🟡 Gold 22K', 
      purity: '22K Sovereign Gold',
      color: '#fef08a', 
      bg: 'rgba(212, 175, 55, 0.18)', 
      border: 'rgba(212, 175, 55, 0.5)',
      lossCeiling: '2.5% – 3.5% (Standard Workshop Loss)',
      meltingPoint: '1,064°C (Induction Crucible Station)'
    };
  };

  const filteredDesigns = (designs || []).filter(d => {
    const metal = getMetalInfo(d);
    const matchMetal = selectedMetal === 'ALL' || metal.type === selectedMetal;
    const matchCat = selectedCategory === 'ALL' || d.category === selectedCategory;
    return matchMetal && matchCat;
  });

  const handleCreateDesign = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return;

    setIsSubmitting(true);
    try {
      if (onAddDesign) {
        const result = await onAddDesign({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          category: formData.category,
          metalType: formData.metalType,
          skillTier: formData.skillTier,
          totalSMT: parseFloat(formData.totalSMT) || 60,
          allowableLossPct: parseFloat(formData.allowableLossPct) || 3.0,
          description: formData.description
        });

        if (result && result.success && result.design) {
          setSelectedDesign(result.design);
        }
      }
      setShowAddModal(false);
      setFormData({
        code: '',
        name: '',
        category: 'Ring',
        metalType: 'Gold 22K',
        skillTier: 'Grade A',
        totalSMT: 90,
        allowableLossPct: 3.0,
        description: ''
      });
    } catch (err) {
      console.error('Failed to create design:', err);
      alert('Failed to save design. Please check code uniqueness.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="executive-header">
        <div>
          <h1 className="executive-title">
            <Gem size={24} color="#d4af37" />
            <span>Precious Metals Catalogue & Standard Manufacturing Time (SMT)</span>
          </h1>
          <p className="executive-subtitle">
            Multi-Metal Engineering Operations: <strong>Gold (22K)</strong>, <strong>Sterling Silver (925)</strong>, and <strong>Platinum (950)</strong> • Ashadi Jewellers
          </p>
        </div>
        <button 
          className="btn-gold-primary"
          onClick={() => setShowAddModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
        >
          <Plus size={16} />
          <span>+ Add New Design / Item</span>
        </button>
      </div>

      {/* Metal & Category Filters */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid var(--border-gold)',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Metal Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Precious Metal:
          </span>
          {[
            { id: 'ALL', label: 'All Metals (10)' },
            { id: 'GOLD', label: '🟡 22K Gold (5)' },
            { id: 'SILVER', label: '⚪ 925 Silver (3)' },
            { id: 'PLATINUM', label: '💎 950 Platinum (2)' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMetal(m.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: selectedMetal === m.id ? 'var(--gold-metallic)' : 'rgba(10, 15, 29, 0.7)',
                color: selectedMetal === m.id ? '#0b0f19' : '#cbd5e1',
                border: selectedMetal === m.id ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.15s ease'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Category:</span>
          {['ALL', 'Ring', 'Bracelet', 'Necklace'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                background: selectedCategory === cat ? 'rgba(212, 175, 55, 0.25)' : 'rgba(10, 15, 29, 0.6)',
                color: selectedCategory === cat ? '#fef08a' : '#94a3b8',
                border: selectedCategory === cat ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              {cat === 'ALL' ? 'All Types' : `${cat}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Designs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {filteredDesigns.map((d) => {
          const metal = getMetalInfo(d);
          const isSelected = selectedDesign?.code === d.code;

          return (
            <div 
              key={d.code}
              className="luxury-box"
              onClick={() => setSelectedDesign(d)}
              style={{ 
                cursor: 'pointer',
                borderColor: isSelected ? '#d4af37' : 'var(--border-subtle)',
                background: isSelected ? 'rgba(212, 175, 55, 0.08)' : 'var(--bg-card)',
                transition: 'all 0.25s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#d4af37', fontWeight: 'bold' }}>{d.code}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '800',
                      color: metal.color,
                      background: metal.bg,
                      border: `1px solid ${metal.border}`
                    }}>
                      {metal.label}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '17px', color: '#fff', marginTop: '2px', fontFamily: 'var(--font-serif)' }}>{d.name}</h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{d.category} • {metal.purity}</span>
                </div>
                <span className={`badge ${d.skillTier === 'Grade A' ? 'badge-tier-a' : d.skillTier === 'Grade B' ? 'badge-tier-b' : 'badge-tier-c'}`}>
                  {d.skillTier}
                </span>
              </div>

              <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px', minHeight: '38px', lineHeight: '1.4' }}>
                {d.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Standard Time</div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#fef08a' }}>{d.totalSMT} min</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{(d.totalSMT / 60).toFixed(2)} hrs</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Std Labour Cost</div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#34d399' }}>Rs. {d.labourCost.toLocaleString()}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Rs. {d.minuteRate.toFixed(2)}/min</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Allowable Loss</div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: metal.color }}>
                    {d.allowableLossPct || d.allowableGoldLossPct || 3.0}%
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Ceiling limit</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Design Operational Routing Breakdown */}
      {selectedDesign && (
        <div className="luxury-box">
          <div className="luxury-box-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Layers size={18} color="#d4af37" />
                <h3 className="luxury-box-title" style={{ margin: 0 }}>
                  Operation Routing Breakdown: {selectedDesign.name} ({selectedDesign.code})
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                Precious Metal: <strong style={{ color: getMetalInfo(selectedDesign).color }}>{getMetalInfo(selectedDesign).label}</strong> • Melting Point: <strong>{getMetalInfo(selectedDesign).meltingPoint}</strong> • Allowable Scrap: <strong>{getMetalInfo(selectedDesign).lossCeiling}</strong>
              </p>
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Formula: <code>ST = Observed Time × (Rating / 100) × (1 + Allowance)</code>
            </div>
          </div>

          <div className="table-luxury-wrap">
            <table className="table-luxury">
              <thead>
                <tr>
                  <th>Seq</th>
                  <th>Operation ID</th>
                  <th>Operation Name</th>
                  <th style={{ textAlign: 'right' }}>Observed Time (OT min)</th>
                  <th style={{ textAlign: 'right' }}>Performance Rating (%)</th>
                  <th style={{ textAlign: 'right' }}>Allowance (%)</th>
                  <th style={{ textAlign: 'right' }}>Standard Time (ST min)</th>
                  <th style={{ textAlign: 'right' }}>Operation Cost</th>
                </tr>
              </thead>
              <tbody>
                {selectedDesign.operations && selectedDesign.operations.map((op) => (
                  <tr key={op.seq}>
                    <td>{op.seq}</td>
                    <td><strong style={{ color: '#d4af37' }}>{op.opId}</strong></td>
                    <td style={{ fontWeight: '600', color: '#fff' }}>{op.opName}</td>
                    <td style={{ textAlign: 'right' }}>{op.ot.toFixed(1)} min</td>
                    <td style={{ textAlign: 'right' }}>{op.rating}%</td>
                    <td style={{ textAlign: 'right' }}>{(op.allowance * 100).toFixed(1)}%</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#fef08a' }}>
                      {op.st.toFixed(2)} min
                    </td>
                    <td style={{ textAlign: 'right', color: '#34d399', fontWeight: '700' }}>
                      Rs. {(op.st * selectedDesign.minuteRate).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#0a0f1d', fontWeight: 'bold' }}>
                  <td colSpan="6" style={{ textAlign: 'right', color: '#fff', fontSize: '14px' }}>
                    TOTAL DESIGN SMT & LABOUR VALUE:
                  </td>
                  <td style={{ textAlign: 'right', color: '#fef08a', fontSize: '16px', fontWeight: '800' }}>
                    {selectedDesign.totalSMT} min ({(selectedDesign.totalSMT / 60).toFixed(2)} hrs)
                  </td>
                  <td style={{ textAlign: 'right', color: '#34d399', fontSize: '16px', fontWeight: '800' }}>
                    Rs. {selectedDesign.labourCost.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
      {/* Add New Design Modal */}
      {showAddModal && (
        <div className="modal-backdrop-luxury">
          <div className="modal-window-luxury" style={{ maxWidth: '640px', width: '92vw', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Gem size={20} color="#d4af37" />
                <h3 style={{ fontSize: '18px', color: '#fff', margin: 0, fontFamily: 'var(--font-serif)' }}>
                  Register New Jewellery Design & SMT
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="btn-ghost-secondary"
                style={{ padding: '4px 8px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDesign}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Design Code *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. RNG-DET-03, NCK-DIA-02"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', color: '#fef08a' }}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Must be unique identifier code</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Jewellery Name / Title *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Three-Stone Diamond Ring"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Jewellery Category
                  </label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                  >
                    <option value="Ring">Ring (Mudhu)</option>
                    <option value="Bracelet">Bracelet / Bangle (Walalu)</option>
                    <option value="Necklace">Necklace / Chain (Mala)</option>
                    <option value="Earring">Earring (Karabu)</option>
                    <option value="Pendant">Pendant (Padakkama)</option>
                    <option value="Chain">Chain (Gira)</option>
                    <option value="Custom">Custom Order</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Precious Metal
                  </label>
                  <select 
                    value={formData.metalType}
                    onChange={(e) => {
                      const metal = e.target.value;
                      let defaultLoss = 3.0;
                      if (metal.includes('Platinum')) defaultLoss = 2.0;
                      else if (metal.includes('Silver')) defaultLoss = 5.0;
                      setFormData(prev => ({ ...prev, metalType: metal, allowableLossPct: defaultLoss }));
                    }}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                  >
                    <option value="Gold 22K">🟡 Gold 22K (Sovereign)</option>
                    <option value="Gold 18K Yellow">🟡 Gold 18K Yellow</option>
                    <option value="Gold 18K White">⚪ Gold 18K White</option>
                    <option value="Gold 18K Rose">🌸 Gold 18K Rose</option>
                    <option value="Gold 14K Yellow">🟡 Gold 14K</option>
                    <option value="Gold 9K">🟡 Gold 9K</option>
                    <option value="Silver 925">⚪ Silver 925 (Sterling)</option>
                    <option value="Platinum 950">💎 Platinum 950</option>
                    <option value="Palladium 950">💎 Palladium 950</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Skill Tier Required
                  </label>
                  <select 
                    value={formData.skillTier}
                    onChange={(e) => setFormData(prev => ({ ...prev, skillTier: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                  >
                    <option value="Grade A">Grade A (Master • Rs. 11.50/m)</option>
                    <option value="Grade B">Grade B (Skilled • Rs. 9.50/m)</option>
                    <option value="Grade C">Grade C (Junior • Rs. 7.50/m)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Total SMT (Minutes) *
                  </label>
                  <input 
                    type="number"
                    required
                    min="5"
                    step="0.5"
                    value={formData.totalSMT}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalSMT: parseFloat(e.target.value) || 0 }))}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', fontWeight: 'bold', color: '#93c5fd' }}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    = {((formData.totalSMT || 0) / 60).toFixed(2)} Working Hours
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Scrap Ceiling (%)
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    value={formData.allowableLossPct}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowableLossPct: parseFloat(e.target.value) || 0 }))}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Max allowable loss</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                  Design Notes / Technical Specifications
                </label>
                <textarea 
                  rows="2"
                  placeholder="e.g. Micro-claw prongs for 0.50ct central diamond with wire hand filigree on sides"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12px' }}
                />
              </div>

              {/* Live Cost & Engineering Calculation Preview */}
              <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '18px' }}>
                <div style={{ fontSize: '11px', color: '#d4af37', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Live Engineering Output Preview:
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', flexWrap: 'wrap', gap: '8px' }}>
                  <span>Standard Labor Cost: <strong style={{ color: '#34d399' }}>Rs. {((formData.totalSMT || 0) * (formData.skillTier === 'Grade A' ? 11.50 : formData.skillTier === 'Grade B' ? 9.50 : 7.50)).toFixed(2)}</strong></span>
                  <span>Bench Time Required: <strong style={{ color: '#fef08a' }}>{((formData.totalSMT || 0) / 60).toFixed(2)} hrs / piece</strong></span>
                  <span>Operations: <strong style={{ color: '#38bdf8' }}>5-Step Standard Route (Auto-Generated)</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-ghost-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-gold-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={15} />
                  <span>{isSubmitting ? 'Saving Design...' : 'Save & Add to Catalogue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
