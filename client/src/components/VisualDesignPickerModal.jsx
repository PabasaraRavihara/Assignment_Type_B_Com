import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Sparkles, 
  Gem, 
  Check, 
  Layers, 
  Clock, 
  Coins, 
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getDesignDisplayImage, getLuxuryJewellerySvg } from '../utils/designImages';
import { getCraftingMethodInfo } from '../utils/craftingRoutes';

export default function VisualDesignPickerModal({
  isOpen,
  onClose,
  onSelect,
  designs = [],
  craftsman = {},
  currentDesignCode = ''
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('MATCH'); // 'MATCH' | 'ALL'
  const [metalFilter, setMetalFilter] = useState('ALL');  // 'ALL' | 'GOLD' | 'SILVER' | 'PLATINUM'
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const craftsmanTier = craftsman?.skillTier || 'Grade B';

  // Metal categorization helper
  const getMetalType = (d) => {
    const m = (d.metalType || d.goldKarat || '').toLowerCase();
    if (m.includes('platinum') || m.includes('950')) return 'PLATINUM';
    if (m.includes('silver') || m.includes('925')) return 'SILVER';
    return 'GOLD';
  };

  const getMetalBadge = (d) => {
    const type = getMetalType(d);
    if (type === 'PLATINUM') {
      return { label: '💎 Platinum 950', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' };
    }
    if (type === 'SILVER') {
      return { label: '⚪ 925 Silver', color: '#cbd5e1', bg: 'rgba(203, 213, 225, 0.15)', border: 'rgba(203, 213, 225, 0.4)' };
    }
    return { label: '🟡 22K Gold', color: '#fde047', bg: 'rgba(253, 224, 71, 0.15)', border: 'rgba(253, 224, 71, 0.4)' };
  };

  // Count matches for badge
  const matchedTierCount = useMemo(() => {
    return (designs || []).filter(d => (d.skillTier || 'Grade B') === craftsmanTier).length;
  }, [designs, craftsmanTier]);

  // Filtered designs list
  const filteredDesigns = useMemo(() => {
    return (designs || []).filter(d => {
      // 1. Skill Tier filter
      if (tierFilter === 'MATCH') {
        const dTier = d.skillTier || 'Grade B';
        if (dTier !== craftsmanTier) return false;
      }

      // 2. Metal filter
      if (metalFilter !== 'ALL') {
        const type = getMetalType(d);
        if (type !== metalFilter) return false;
      }

      // 3. Category filter
      if (categoryFilter !== 'ALL') {
        if ((d.category || '').toLowerCase() !== categoryFilter.toLowerCase()) return false;
      }

      // 4. Live Search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = (d.code || '').toLowerCase().includes(q);
        const nameMatch = (d.name || '').toLowerCase().includes(q);
        const metalMatch = (d.metalType || d.goldKarat || '').toLowerCase().includes(q);
        const descMatch = (d.description || '').toLowerCase().includes(q);
        if (!codeMatch && !nameMatch && !metalMatch && !descMatch) return false;
      }

      return true;
    });
  }, [designs, tierFilter, metalFilter, categoryFilter, searchQuery, craftsmanTier]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop-luxury"
      onClick={onClose}
      style={{ zIndex: 12000 }}
    >
      <div 
        className="modal-window-luxury visual-design-picker-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '920px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          background: 'var(--bg-card, #0f172a)',
          border: '1.5px solid #d4af37',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Gem size={20} color="#d4af37" />
              <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-primary, #fff)' }}>
                Visual Jewellery Design Selector
              </h2>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary, #cbd5e1)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>Bench Allocation Target:</span>
              <strong style={{ color: '#d4af37', fontSize: '13px' }}>
                {craftsman.id ? `${craftsman.id} • ${craftsman.name || 'Craftsman'}` : 'Workshop Bench'}
              </strong>
              <span className={`badge ${craftsmanTier === 'Grade A' ? 'badge-tier-a' : craftsmanTier === 'Grade B' ? 'badge-tier-b' : 'badge-tier-c'}`} style={{ padding: '2px 8px', fontSize: '10.5px' }}>
                {craftsmanTier} Skill Level
              </span>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="btn-ghost-secondary"
            style={{ padding: '6px', borderRadius: '50%', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            title="Close Design Picker"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div style={{
          padding: '12px 20px',
          background: 'rgba(10, 16, 32, 0.65)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Row 1: Search & Tier Filter */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Live Search */}
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                autoFocus
                placeholder="Search jewellery by code, name, metal, or route (e.g. RNG, Solitaire, 22K)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  fontSize: '12.5px',
                  borderRadius: '6px',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  background: 'var(--bg-input, #070b16)',
                  color: 'var(--text-primary, #fff)'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '11px' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Craftsman Skill Tier Match Filter Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setTierFilter('MATCH')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  border: tierFilter === 'MATCH' ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: tierFilter === 'MATCH' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.15))' : 'rgba(255, 255, 255, 0.04)',
                  color: tierFilter === 'MATCH' ? '#34d399' : 'var(--text-secondary, #cbd5e1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>⭐ Match {craftsmanTier}</span>
                <span style={{ 
                  background: tierFilter === 'MATCH' ? '#10b981' : 'rgba(255, 255, 255, 0.15)', 
                  color: tierFilter === 'MATCH' ? '#042f2e' : '#fff',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '10px'
                }}>
                  {matchedTierCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTierFilter('ALL')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  border: tierFilter === 'ALL' ? '1.5px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: tierFilter === 'ALL' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: tierFilter === 'ALL' ? 'var(--gold-primary, #fef08a)' : 'var(--text-secondary, #cbd5e1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🌐 All Designs</span>
                <span style={{ 
                  background: tierFilter === 'ALL' ? '#d4af37' : 'rgba(255, 255, 255, 0.15)', 
                  color: tierFilter === 'ALL' ? '#171003' : '#fff',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '10px'
                }}>
                  {(designs || []).length}
                </span>
              </button>
            </div>
          </div>

          {/* Row 2: Metal Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Precious Metal:
            </span>
            {[
              { id: 'ALL', label: 'All Metals' },
              { id: 'GOLD', label: '🟡 22K Gold' },
              { id: 'SILVER', label: '⚪ 925 Silver' },
              { id: 'PLATINUM', label: '💎 950 Platinum' }
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetalFilter(m.id)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '5px',
                  fontSize: '11px',
                  fontWeight: metalFilter === m.id ? '800' : '600',
                  cursor: 'pointer',
                  border: metalFilter === m.id ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: metalFilter === m.id ? 'rgba(212, 175, 55, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                  color: metalFilter === m.id ? '#fef08a' : '#cbd5e1'
                }}
              >
                {m.label}
              </button>
            ))}

            {/* Category Quick Filter */}
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', marginLeft: '8px' }}>
              Type:
            </span>
            {['ALL', 'Ring', 'Bracelet', 'Necklace', 'Coin'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '5px',
                  fontSize: '10.5px',
                  fontWeight: categoryFilter === cat ? '800' : '500',
                  cursor: 'pointer',
                  border: categoryFilter === cat ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid rgba(255, 255, 255, 0.06)',
                  background: categoryFilter === cat ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: categoryFilter === cat ? '#38bdf8' : '#94a3b8'
                }}
              >
                {cat === 'ALL' ? 'All Types' : `${cat}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Cards Grid Section */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 20px',
          background: 'var(--bg-app, #0a0f1d)'
        }}>
          {filteredDesigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <AlertCircle size={36} color="#f59e0b" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                No designs match the current filter.
              </p>
              <p style={{ fontSize: '12px', marginBottom: '14px' }}>
                Try switching to <strong>Show All Designs</strong> or clearing the search keyword.
              </p>
              <button
                type="button"
                onClick={() => { setTierFilter('ALL'); setMetalFilter('ALL'); setCategoryFilter('ALL'); setSearchQuery(''); }}
                className="btn-gold-primary"
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                Reset Filters & Show All Designs
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {filteredDesigns.map(d => {
                const metalBadge = getMetalBadge(d);
                const routeInfo = getCraftingMethodInfo(d.craftingMethod);
                const isSelected = d.code === currentDesignCode;
                const isSkillMatch = (d.skillTier || 'Grade B') === craftsmanTier;

                return (
                  <div
                    key={d.code}
                    onClick={() => onSelect(d)}
                    className="design-catalogue-card"
                    style={{
                      background: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'var(--bg-card, #0f172a)',
                      border: isSelected ? '2px solid #d4af37' : isSkillMatch ? '1.5px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      boxShadow: isSelected ? '0 0 16px rgba(212, 175, 55, 0.35)' : '0 4px 12px rgba(0, 0, 0, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Photo Box */}
                    <div className="design-card-photo-box" style={{ height: '140px' }}>
                      <img 
                        src={getDesignDisplayImage(d)} 
                        alt={d.name}
                        loading="lazy"
                        className="design-img-hover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getLuxuryJewellerySvg(d.category, d.metalType);
                        }}
                      />
                      <div className="design-card-photo-overlay" />

                      {/* Top Badges */}
                      <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 2 }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          color: '#d4af37',
                          background: 'rgba(10, 15, 29, 0.88)',
                          border: '1px solid rgba(212, 175, 55, 0.5)'
                        }}>
                          {d.code}
                        </span>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '9.5px',
                          fontWeight: '800',
                          color: metalBadge.color,
                          background: 'rgba(10, 15, 29, 0.88)',
                          border: `1px solid ${metalBadge.border}`
                        }}>
                          {metalBadge.label}
                        </span>
                      </div>

                      {/* Top Right Skill Tier Match Indicator */}
                      <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2 }}>
                        {isSkillMatch ? (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9.5px',
                            fontWeight: '800',
                            color: '#34d399',
                            background: 'rgba(6, 78, 59, 0.92)',
                            border: '1px solid #10b981',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <CheckCircle2 size={10} />
                            <span>⭐ Match: {d.skillTier}</span>
                          </span>
                        ) : (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9px',
                            fontWeight: '700',
                            color: '#cbd5e1',
                            background: 'rgba(15, 23, 42, 0.88)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}>
                            Req: {d.skillTier}
                          </span>
                        )}
                      </div>

                      {/* Route Pill at bottom of image */}
                      <div style={{ position: 'absolute', bottom: '6px', left: '8px', zIndex: 2 }}>
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '3px',
                          fontSize: '9.5px',
                          fontWeight: '700',
                          color: routeInfo.color,
                          background: 'rgba(10, 15, 29, 0.88)',
                          border: `1px solid ${routeInfo.border}`
                        }}>
                          {routeInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary, #fff)', marginBottom: '4px', lineHeight: '1.3' }}>
                          {d.name}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.description || `${d.category} Master Design`}
                        </div>
                      </div>

                      {/* Metrics Pill Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '6px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Bench Time</div>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fef08a' }}>
                            {d.totalSMT} min <span style={{ fontSize: '9.5px', color: '#64748b' }}>({(d.totalSMT / 60).toFixed(1)}h)</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Allowable Loss</div>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: metalBadge.color }}>
                            {d.allowableLossPct ?? d.allowableGoldLossPct ?? 3.0}%
                          </div>
                        </div>
                      </div>

                      {/* Select Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(d);
                        }}
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          background: isSelected ? 'linear-gradient(135deg, #f59e0b, #d97706)' : isSkillMatch ? 'rgba(16, 185, 129, 0.2)' : 'rgba(212, 175, 55, 0.15)',
                          color: isSelected ? '#0b0f19' : isSkillMatch ? '#34d399' : '#fef08a',
                          border: isSelected ? '1px solid #d4af37' : isSkillMatch ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(212, 175, 55, 0.35)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSelected ? <Check size={12} /> : isSkillMatch ? <CheckCircle2 size={12} /> : <Sparkles size={12} />}
                        <span>{isSelected ? '✓ Currently Assigned' : `Assign to Bench ${craftsman.id || ''}`}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(10, 16, 32, 0.95)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            💡 Tip: Green badges show designs matching <strong>{craftsmanTier}</strong> skill requirements for {craftsman.name || 'this craftsman'}.
          </span>
          <button
            type="button"
            className="btn-ghost-secondary"
            onClick={onClose}
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
