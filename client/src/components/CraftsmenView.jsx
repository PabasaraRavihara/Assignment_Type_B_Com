import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Users, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  Edit3, 
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Award,
  SlidersHorizontal
} from 'lucide-react';

export default function CraftsmenView({ craftsmen, onAddCraftsman, onUpdateCraftsman, onDeleteCraftsman }) {
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('All');
  const [sortBy, setSortBy] = useState('empNoAsc'); // Default: Seniority (lowest employee number first!)
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCraftsman, setSelectedCraftsman] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    empNo: '',
    skillTier: 'Grade B',
    specialization: 'Forming & Assembly',
    nvqLevel: 'NVQ Level 3',
    status: 'Active'
  });

  // Natural numeric parser for employee numbers (e.g. "20", "536", "1018", "APPR-70")
  const extractNumericEmpNo = (empNo) => {
    if (!empNo) return 999999;
    const str = String(empNo).trim();
    if (str.toUpperCase().startsWith('APPR')) {
      const num = str.replace(/\D/g, '');
      return 50000 + (parseInt(num, 10) || 0); // Put apprentices at the bottom
    }
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : 999999;
  };

  const handleToggleSort = (field) => {
    if (field === 'empNo') {
      setSortBy(prev => prev === 'empNoAsc' ? 'empNoDesc' : 'empNoAsc');
    } else if (field === 'id') {
      setSortBy(prev => prev === 'idAsc' ? 'idDesc' : 'idAsc');
    } else if (field === 'name') {
      setSortBy(prev => prev === 'nameAsc' ? 'nameDesc' : 'nameAsc');
    } else if (field === 'tier') {
      setSortBy(prev => prev === 'tierAsc' ? 'tierDesc' : 'tierAsc');
    }
  };

  const filteredCraftsmen = (craftsmen || []).filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      (c.empNo && c.empNo.toLowerCase().includes(search.toLowerCase()));
    const matchesSkill = skillFilter === 'All' || c.skillTier === skillFilter;
    return matchesSearch && matchesSkill;
  });

  const sortedCraftsmen = [...filteredCraftsmen].sort((a, b) => {
    if (sortBy === 'empNoAsc') {
      return extractNumericEmpNo(a.empNo) - extractNumericEmpNo(b.empNo);
    }
    if (sortBy === 'empNoDesc') {
      return extractNumericEmpNo(b.empNo) - extractNumericEmpNo(a.empNo);
    }
    if (sortBy === 'idAsc') {
      return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
    }
    if (sortBy === 'idDesc') {
      return (b.id || '').localeCompare(a.id || '', undefined, { numeric: true });
    }
    if (sortBy === 'nameAsc') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'nameDesc') {
      return (b.name || '').localeCompare(a.name || '');
    }
    if (sortBy === 'tierAsc') {
      const tierRank = { 'Grade A': 1, 'Grade B': 2, 'Grade C': 3 };
      return (tierRank[a.skillTier] || 4) - (tierRank[b.skillTier] || 4);
    }
    if (sortBy === 'tierDesc') {
      const tierRank = { 'Grade A': 1, 'Grade B': 2, 'Grade C': 3 };
      return (tierRank[b.skillTier] || 4) - (tierRank[a.skillTier] || 4);
    }
    return 0;
  });

  const handleInlineTierChange = (c, newTier) => {
    if (!onUpdateCraftsman) return;
    const minuteRate = newTier === 'Grade A' ? 11.50 : newTier === 'Grade B' ? 9.50 : 7.50;
    onUpdateCraftsman(c.id, {
      ...c,
      skillTier: newTier,
      minuteRate
    });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    onAddCraftsman(formData);
    setShowAddModal(false);
    setFormData({ name: '', empNo: '', skillTier: 'Grade B', specialization: 'Forming & Assembly', nvqLevel: 'NVQ Level 3', status: 'Active' });
  };

  const handleOpenEdit = (c) => {
    setSelectedCraftsman(c);
    setFormData({
      name: c.name,
      empNo: c.empNo || '',
      skillTier: c.skillTier || 'Grade B',
      specialization: c.specialization || 'General Goldsmith',
      nvqLevel: c.nvqLevel || 'NVQ Level 3',
      status: c.status || 'Active'
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedCraftsman || !onUpdateCraftsman) return;
    onUpdateCraftsman(selectedCraftsman.id, formData);
    setShowEditModal(false);
    setSelectedCraftsman(null);
  };

  const handleDelete = () => {
    if (!selectedCraftsman || !onDeleteCraftsman) return;
    if (window.confirm(`Are you sure you want to remove craftsman ${selectedCraftsman.id} - ${selectedCraftsman.name}?`)) {
      onDeleteCraftsman(selectedCraftsman.id);
      setShowEditModal(false);
      setSelectedCraftsman(null);
    }
  };

  return (
    <div>
      <div className="executive-header">
        <div>
          <h1 className="executive-title">
            <Users size={24} color="#d4af37" />
            <span>Workshop Craftsmen Directory (63 Verified Benches)</span>
          </h1>
          <p className="executive-subtitle">
            Complete master roster for Ashadi Jewellers. You can <strong>edit any name, employ number, or skill tier</strong> to match your factory's exact real records.
          </p>
        </div>
        <button className="btn-gold-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>Register New Craftsman</span>
        </button>
      </div>

      {/* Filter, Search and Sorting Bar */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            style={{ width: '100%', paddingLeft: '38px' }}
            placeholder="Search by Craftsman Name or Employ Number (e.g. 20, 22, 1018, Sunil)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Sort Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={15} color="#d4af37" />
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>Sort By:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: '#0d1322',
              border: '1px solid #d4af37',
              color: '#fef08a',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            <option value="empNoAsc">🎖️ Seniority: Employ No (Lowest First: 20 → 1300)</option>
            <option value="empNoDesc">Employ No (Highest First: 1300 → 20)</option>
            <option value="tierAsc">Skill Tier (Grade A → B → C)</option>
            <option value="tierDesc">Skill Tier (Grade C → B → A)</option>
            <option value="idAsc">Craftsman ID (C001 → C063)</option>
            <option value="nameAsc">Name (A → Z)</option>
          </select>
        </div>

        {/* Tier Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['All', 'Grade A', 'Grade B', 'Grade C'].map(tier => (
            <button
              key={tier}
              onClick={() => setSkillFilter(tier)}
              className="btn-ghost-secondary"
              style={{
                borderColor: skillFilter === tier ? '#d4af37' : 'rgba(255, 255, 255, 0.08)',
                color: skillFilter === tier ? '#fef08a' : '#cbd5e1',
                background: skillFilter === tier ? 'rgba(212, 175, 55, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                padding: '5px 10px',
                fontSize: '12px'
              }}
            >
              {tier === 'All' ? 'All Tiers' : tier}
            </button>
          ))}
        </div>
      </div>

      {/* Seniority Tip / Explanation Banner */}
      <div style={{ 
        background: 'rgba(212, 175, 55, 0.08)', 
        border: '1px solid rgba(212, 175, 55, 0.25)', 
        borderRadius: '8px', 
        padding: '10px 14px', 
        marginBottom: '16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fef08a' }}>
          <Award size={16} color="#d4af37" />
          <span>
            <strong>Seniority-Based Ordering Active:</strong> Lowest Employ Numbers (e.g. <strong>20, 22, 23, 24, 26, 28, 30...</strong>) are your oldest veteran craftsmen. You can change any craftsman's <strong>Skill Tier</strong> directly via the dropdown in each row!
          </span>
        </div>
        <button 
          onClick={() => setSortBy('empNoAsc')}
          className="btn-ghost-secondary"
          style={{ 
            borderColor: sortBy === 'empNoAsc' ? '#d4af37' : 'rgba(255, 255, 255, 0.1)', 
            color: sortBy === 'empNoAsc' ? '#fef08a' : '#94a3b8',
            background: sortBy === 'empNoAsc' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
            padding: '4px 10px',
            fontSize: '11px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Award size={13} color="#d4af37" />
          <span>Reset to Seniority Order</span>
        </button>
      </div>

      {/* Summary Counts */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '13px', color: '#94a3b8', flexWrap: 'wrap' }}>
        <span>Showing <strong>{sortedCraftsmen.length}</strong> of 63 craftsmen</span>
        <span>•</span>
        <span style={{ color: '#fef08a' }}>Grade A (Master): Rs. 11.50/min</span>
        <span>•</span>
        <span style={{ color: '#93c5fd' }}>Grade B (Senior): Rs. 9.50/min</span>
        <span>•</span>
        <span style={{ color: '#cbd5e1' }}>Grade C (Assistant): Rs. 7.50/min</span>
      </div>

      {/* Table */}
      <div className="table-luxury-wrap">
        <table className="table-luxury">
          <thead>
            <tr>
              <th onClick={() => handleToggleSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by ID">
                Craftsman ID {sortBy === 'idAsc' ? '▲' : sortBy === 'idDesc' ? '▼' : ''}
              </th>
              <th onClick={() => handleToggleSort('empNo')} style={{ cursor: 'pointer', userSelect: 'none', color: '#fef08a' }} title="Click to sort by Employ Number (Seniority)">
                Employ No. {sortBy === 'empNoAsc' ? '▲ (Senior First)' : sortBy === 'empNoDesc' ? '▼ (Newest First)' : '⇅'}
              </th>
              <th onClick={() => handleToggleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Name">
                Full Name {sortBy === 'nameAsc' ? '▲' : sortBy === 'nameDesc' ? '▼' : ''}
              </th>
              <th>Department</th>
              <th>Specialization</th>
              <th onClick={() => handleToggleSort('tier')} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by Skill Tier">
                Skill Tier (Quick Change) {sortBy === 'tierAsc' ? '▲' : sortBy === 'tierDesc' ? '▼' : ''}
              </th>
              <th>Approved Minute Rate</th>
              <th>NVQ Level</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedCraftsmen.map((c) => {
              const numericNo = extractNumericEmpNo(c.empNo);
              const isVeteran = numericNo < 100;

              return (
                <tr key={c.id}>
                  <td><strong style={{ color: '#d4af37' }}>{c.id}</strong></td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ 
                        background: '#0d1322', 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        fontWeight: '700',
                        fontSize: '13px',
                        color: isVeteran ? '#fef08a' : c.empNo && c.empNo.startsWith('APPR') ? '#94a3b8' : '#38bdf8',
                        border: `1px solid ${isVeteran ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`
                      }}>
                        {c.empNo || '—'}
                      </span>
                      {isVeteran && (
                        <span title="Veteran Senior Master (Earliest Employ No.)" style={{ fontSize: '11px', color: '#fef08a', fontWeight: 'bold' }}>
                          ★ Master
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontWeight: '600', color: '#fff' }}>{c.name}</td>
                  <td>{c.dept || 'Workshop'}</td>
                  <td style={{ color: '#cbd5e1' }}>{c.specialization}</td>
                  <td>
                    {/* Interactive Quick Skill Tier Dropdown */}
                    <select
                      value={c.skillTier}
                      onChange={(e) => handleInlineTierChange(c, e.target.value)}
                      style={{
                        background: c.skillTier === 'Grade A' ? 'rgba(212, 175, 55, 0.25)' : c.skillTier === 'Grade B' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                        color: c.skillTier === 'Grade A' ? '#fef08a' : c.skillTier === 'Grade B' ? '#38bdf8' : '#cbd5e1',
                        border: `1px solid ${c.skillTier === 'Grade A' ? '#d4af37' : c.skillTier === 'Grade B' ? '#38bdf8' : '#64748b'}`,
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                      title="Quick change skill grade (instantly recalculates hourly minute rate)"
                    >
                      <option value="Grade A" style={{ background: '#0f172a', color: '#fef08a' }}>Grade A (Rs. 11.50/m)</option>
                      <option value="Grade B" style={{ background: '#0f172a', color: '#38bdf8' }}>Grade B (Rs. 9.50/m)</option>
                      <option value="Grade C" style={{ background: '#0f172a', color: '#cbd5e1' }}>Grade C (Rs. 7.50/m)</option>
                    </select>
                  </td>
                  <td style={{ fontWeight: '700', color: '#fef08a' }}>
                    Rs. {c.minuteRate ? c.minuteRate.toFixed(2) : (c.skillTier === 'Grade A' ? '11.50' : c.skillTier === 'Grade B' ? '9.50' : '7.50')} / min
                  </td>
                  <td>{c.nvqLevel}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: c.status === 'Active' ? '#34d399' : '#f87171', fontSize: '12px', fontWeight: 'bold' }}>
                      <Check size={13} />
                      <span>{c.status || 'Active'}</span>
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleOpenEdit(c)}
                      className="btn-ghost-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', borderColor: '#d4af37', color: '#fef08a' }}
                      title="Edit Name, Employ No, Tier"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Craftsman Modal */}
      {showAddModal && (
        <div className="modal-backdrop-luxury">
          <div className="modal-window-luxury">
            <h3 style={{ marginBottom: '18px', color: '#fff', fontSize: '19px', fontFamily: 'var(--font-serif)' }}>
              Register New Master Craftsman
            </h3>
            <form onSubmit={handleAddSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input 
                  type="text" 
                  required
                  style={{ width: '100%' }}
                  placeholder="e.g. Mr. K.P. Sunil Perera"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Employ Number (Punch Card / ID)
                  </label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }}
                    placeholder="e.g. 1301"
                    value={formData.empNo}
                    onChange={(e) => setFormData({ ...formData, empNo: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Skill Tier (Pay Grade)
                  </label>
                  <select 
                    style={{ width: '100%' }}
                    value={formData.skillTier}
                    onChange={(e) => setFormData({ ...formData, skillTier: e.target.value })}
                  >
                    <option value="Grade A">Grade A (Master: Rs. 11.50/min)</option>
                    <option value="Grade B">Grade B (Senior: Rs. 9.50/min)</option>
                    <option value="Grade C">Grade C (Assistant: Rs. 7.50/min)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Primary Specialization
                  </label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }}
                    placeholder="e.g. Filigree, Stone Setting, Casting"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    NVQ Certification Level
                  </label>
                  <select 
                    style={{ width: '100%' }}
                    value={formData.nvqLevel}
                    onChange={(e) => setFormData({ ...formData, nvqLevel: e.target.value })}
                  >
                    <option value="NVQ Level 2">NVQ Level 2</option>
                    <option value="NVQ Level 3">NVQ Level 3</option>
                    <option value="NVQ Level 4">NVQ Level 4</option>
                    <option value="Master Craftsman">Master Craftsman</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-ghost-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-gold-primary">
                  Save Craftsman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Craftsman Modal */}
      {showEditModal && selectedCraftsman && (
        <div className="modal-backdrop-luxury">
          <div className="modal-window-luxury" style={{ maxWidth: '520px' }}>
            <h3 style={{ marginBottom: '14px', color: '#fff', fontSize: '18px', fontFamily: 'var(--font-serif)' }}>
              Edit Craftsman Profile: <span style={{ color: '#d4af37' }}>{selectedCraftsman.id}</span>
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
              Update real names, employ numbers, and pay grades directly. Changes reflect immediately across the entire system.
            </p>

            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                  Full Name (Real Name)
                </label>
                <input 
                  type="text" 
                  required
                  style={{ width: '100%', fontSize: '15px', fontWeight: 'bold', color: '#fff' }}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Employ Number (Card #)
                  </label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }}
                    value={formData.empNo}
                    onChange={(e) => setFormData({ ...formData, empNo: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Skill Tier
                  </label>
                  <select 
                    style={{ width: '100%' }}
                    value={formData.skillTier}
                    onChange={(e) => setFormData({ ...formData, skillTier: e.target.value })}
                  >
                    <option value="Grade A">Grade A (Master: Rs. 11.50/min)</option>
                    <option value="Grade B">Grade B (Senior: Rs. 9.50/min)</option>
                    <option value="Grade C">Grade C (Assistant: Rs. 7.50/min)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Specialization
                  </label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }}
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select 
                    style={{ width: '100%' }}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  type="button" 
                  onClick={handleDelete}
                  className="btn-ghost-secondary"
                  style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '6px 12px', fontSize: '12px' }}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn-ghost-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-gold-primary">
                    Update Profile
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
