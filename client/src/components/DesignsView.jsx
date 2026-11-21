import React, { useState } from 'react';
import { 
  Gem, Layers, Clock, DollarSign, ChevronRight, Scale, Info, Sparkles, Filter, 
  Plus, X, Save, CheckCircle2, Hammer, Flame, Zap, Edit3, Image as ImageIcon, 
  Upload, Camera, ZoomIn, Trash2, Link as LinkIcon 
} from 'lucide-react';
import { CRAFTING_METHODS, getCraftingMethodInfo } from '../utils/craftingRoutes';
import { DEFAULT_DESIGN_PHOTOS, getDesignDisplayImage, getLuxuryJewellerySvg, processImageFile } from '../utils/designImages';

export default function DesignsView({ designs, onAddDesign, onUpdateDesign }) {
  const [selectedMetal, setSelectedMetal] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedRoute, setSelectedRoute] = useState('ALL');
  const [selectedDesign, setSelectedDesign] = useState(designs && designs.length > 0 ? designs[0] : null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Design Modal State
  const [editingDesign, setEditingDesign] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Image Preview Lightbox State
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // New Design Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Ring',
    metalType: 'Gold 22K',
    craftingMethod: 'HANDMADE',
    skillTier: 'Grade A',
    totalSMT: 90,
    allowableLossPct: 3.0,
    imageUrl: '',
    description: ''
  });

  const handleImageFileUpload = async (file, isEdit = false) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const dataUrl = await processImageFile(file);
      if (dataUrl) {
        if (isEdit) {
          setEditFormData(prev => ({ ...prev, imageUrl: dataUrl }));
        } else {
          setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to process image');
    } finally {
      setIsUploadingImage(false);
    }
  };

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
      color: 'var(--gold-primary, #fef08a)', 
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
    const matchRoute = selectedRoute === 'ALL' || (d.craftingMethod || 'HANDMADE') === selectedRoute;
    return matchMetal && matchCat && matchRoute;
  });

  const handleCreateDesign = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return;

    setIsSubmitting(true);
    try {
      if (onAddDesign) {
        const parsedLoss = parseFloat(formData.allowableLossPct);
        const result = await onAddDesign({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          category: formData.category,
          metalType: formData.metalType,
          craftingMethod: formData.craftingMethod || 'HANDMADE',
          skillTier: formData.skillTier,
          totalSMT: parseFloat(formData.totalSMT) || 60,
          allowableLossPct: !isNaN(parsedLoss) ? parsedLoss : 3.0,
          imageUrl: formData.imageUrl || '',
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
        craftingMethod: 'HANDMADE',
        skillTier: 'Grade A',
        totalSMT: 90,
        allowableLossPct: 3.0,
        imageUrl: '',
        description: ''
      });
    } catch (err) {
      console.error('Failed to create design:', err);
      alert('Failed to save design. Please check code uniqueness.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (design, e) => {
    if (e) e.stopPropagation();
    const activePhoto = design.imageUrl || DEFAULT_DESIGN_PHOTOS[design.code?.toUpperCase()] || '';
    setEditingDesign(design);
    setEditFormData({
      code: design.code,
      name: design.name,
      category: design.category || 'Ring',
      metalType: design.metalType || design.goldKarat || 'Gold 22K',
      craftingMethod: design.craftingMethod || 'HANDMADE',
      skillTier: design.skillTier || 'Grade B',
      totalSMT: design.totalSMT || 60,
      allowableLossPct: design.allowableLossPct ?? design.allowableGoldLossPct ?? 3.0,
      imageUrl: activePhoto,
      description: design.description || ''
    });
  };

  const handleSaveEditDesign = async (e) => {
    e.preventDefault();
    if (!editFormData || !editFormData.name) return;

    setIsUpdating(true);
    try {
      if (onUpdateDesign) {
        const parsedLoss = parseFloat(editFormData.allowableLossPct);
        const activeImg = (editFormData.imageUrl && editFormData.imageUrl.trim() !== '') 
          ? editFormData.imageUrl.trim() 
          : (editingDesign.imageUrl || DEFAULT_DESIGN_PHOTOS[editingDesign.code?.toUpperCase()] || '');
        const result = await onUpdateDesign(editingDesign.code, {
          name: editFormData.name.trim(),
          category: editFormData.category,
          metalType: editFormData.metalType,
          craftingMethod: editFormData.craftingMethod || 'HANDMADE',
          skillTier: editFormData.skillTier,
          totalSMT: parseFloat(editFormData.totalSMT) || 60,
          allowableLossPct: !isNaN(parsedLoss) ? parsedLoss : 3.0,
          imageUrl: activeImg,
          description: editFormData.description
        });

        if (result && result.success && result.design) {
          if (selectedDesign?.code === editingDesign.code) {
            setSelectedDesign(result.design);
          }
        }
      }
      setEditingDesign(null);
      setEditFormData(null);
    } catch (err) {
      console.error('Failed to update design:', err);
      alert('Failed to update design.');
    } finally {
      setIsUpdating(false);
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
          {['ALL', 'Ring', 'Bracelet', 'Necklace', 'Earring', 'Pendant', 'Chain', 'Coin', 'Custom'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`design-category-pill ${selectedCategory === cat ? 'active' : ''}`}
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
              {cat === 'ALL' ? 'All Types' : cat === 'Custom' ? 'Custom' : `${cat}s`}
            </button>
          ))}
        </div>

        {/* Manufacturing Route / Method Filter Pills */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          flexWrap: 'wrap', 
          width: '100%', 
          paddingTop: '10px', 
          marginTop: '6px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.08)' 
        }}>
          <span className="design-route-label" style={{ fontSize: '12px', color: '#fef08a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Manufacturing Route:
          </span>
          {[
            { id: 'ALL', label: 'All Routes (10)' },
            { id: 'HANDMADE', label: '🔨 Fully Handmade' },
            { id: 'CASTING', label: '🔥 Casting ➔ Bench' },
            { id: 'CNC_LASER', label: '⚡ CNC / Laser ➔ Bench' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRoute(r.id)}
              className={`design-route-pill ${selectedRoute === r.id ? 'active' : ''}`}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: selectedRoute === r.id ? 'rgba(212, 175, 55, 0.25)' : 'rgba(10, 15, 29, 0.6)',
                color: selectedRoute === r.id ? '#fef08a' : '#cbd5e1',
                border: selectedRoute === r.id ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.15s ease'
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Designs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {filteredDesigns.map((d) => {
          const metal = getMetalInfo(d);
          const routeInfo = getCraftingMethodInfo(d.craftingMethod);
          const isSelected = selectedDesign?.code === d.code;

          return (
            <div 
              key={d.code}
              className="luxury-box design-catalogue-card"
              onClick={() => setSelectedDesign(d)}
              style={{ 
                cursor: 'pointer',
                borderColor: isSelected ? '#d4af37' : 'var(--border-subtle)',
                background: isSelected ? 'rgba(212, 175, 55, 0.08)' : 'var(--bg-card)',
                transition: 'all 0.25s ease',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: '0'
              }}
            >
              {/* Card Photo Preview Section */}
              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '180px',
                  background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.6) 0%, rgba(10, 15, 29, 0.95) 100%)',
                  borderBottom: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img 
                  src={getDesignDisplayImage(d)}
                  alt={d.name}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  className="design-img-hover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getLuxuryJewellerySvg(d.category, d.metalType);
                  }}
                />

                {/* Subtle bottom gradient shadow */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(10, 15, 29, 0.88) 0%, rgba(10, 15, 29, 0.05) 55%, rgba(10, 15, 29, 0.45) 100%)',
                  pointerEvents: 'none'
                }} />

                {/* Top Overlay Badges */}
                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', zIndex: 2 }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#d4af37',
                    background: 'rgba(10, 15, 29, 0.88)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(212, 175, 55, 0.5)'
                  }}>
                    {d.code}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '800',
                    color: metal.color,
                    background: 'rgba(10, 15, 29, 0.88)',
                    backdropFilter: 'blur(6px)',
                    border: `1px solid ${metal.border}`
                  }}>
                    {metal.label}
                  </span>
                </div>

                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 2 }}>
                  <span className={`badge ${d.skillTier === 'Grade A' ? 'badge-tier-a' : d.skillTier === 'Grade B' ? 'badge-tier-b' : 'badge-tier-c'}`} style={{ backdropFilter: 'blur(6px)', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                    {d.skillTier}
                  </span>
                </div>

                {/* Image Bottom Action Pills */}
                <div style={{ position: 'absolute', bottom: '8px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '700',
                    color: routeInfo.color,
                    background: 'rgba(10, 15, 29, 0.88)',
                    backdropFilter: 'blur(6px)',
                    border: `1px solid ${routeInfo.border}`
                  }}>
                    {routeInfo.label}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImageModal({
                        url: getDesignDisplayImage(d),
                        title: d.name,
                        code: d.code,
                        metal: metal.label,
                        category: d.category,
                        craftingMethod: routeInfo.label,
                        totalSMT: d.totalSMT,
                        labourCost: d.labourCost,
                        desc: d.description
                      });
                    }}
                    style={{
                      background: 'rgba(15, 23, 42, 0.88)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '5px',
                      padding: '3px 8px',
                      color: '#f8fafc',
                      fontSize: '11px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      backdropFilter: 'blur(6px)',
                      transition: 'all 0.2s ease'
                    }}
                    title="View Full-Screen Jewellery Photo"
                  >
                    <ZoomIn size={12} color="#fef08a" />
                    <span>Zoom</span>
                  </button>
                </div>
              </div>

              {/* Card Body Details */}
              <div style={{ padding: '16px 18px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1, paddingRight: '8px' }}>
                      <h3 className="design-card-title" style={{ fontSize: '17px', color: 'var(--text-main, #fff)', margin: '0 0 3px 0', fontFamily: 'var(--font-serif)', lineHeight: '1.25' }}>
                        {d.name}
                      </h3>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {d.category} • {metal.purity}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn-ghost-secondary btn-edit-design"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(d, e);
                      }}
                      style={{
                        padding: '4px 9px',
                        fontSize: '11px',
                        borderRadius: '5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      title={`Edit specifications & photo for ${d.name} (${d.code})`}
                    >
                      <Edit3 size={11} />
                      <span>Edit</span>
                    </button>
                  </div>

                  <p style={{ fontSize: '12.5px', color: '#cbd5e1', marginBottom: '16px', minHeight: '36px', lineHeight: '1.4' }}>
                    {d.description}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>Standard Time</div>
                    <div className="design-card-smt-min" style={{ fontSize: '16px', fontWeight: '800', color: 'var(--gold-primary, #fef08a)' }}>{d.totalSMT} min</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)' }}>{(d.totalSMT / 60).toFixed(2)} hrs</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Std Labour Cost</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#34d399' }}>Rs. {d.labourCost.toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Rs. {d.minuteRate.toFixed(2)}/min</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Allowable Loss</div>
                    <div className="design-allowable-loss" style={{ fontSize: '16px', fontWeight: '800', color: metal.color }}>
                      {d.allowableLossPct ?? d.allowableGoldLossPct ?? 3.0}%
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Ceiling limit</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Design Operational Routing Breakdown */}
      {selectedDesign && (
        <div className="luxury-box">
          <div className="luxury-box-header" style={{ flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              {/* Thumbnail of selected design */}
              <div 
                onClick={() => setPreviewImageModal({
                  url: getDesignDisplayImage(selectedDesign),
                  title: selectedDesign.name,
                  code: selectedDesign.code,
                  metal: getMetalInfo(selectedDesign).label,
                  category: selectedDesign.category,
                  craftingMethod: getCraftingMethodInfo(selectedDesign.craftingMethod).label,
                  totalSMT: selectedDesign.totalSMT,
                  labourCost: selectedDesign.labourCost,
                  desc: selectedDesign.description
                })}
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1.5px solid #d4af37',
                  position: 'relative',
                  cursor: 'pointer',
                  background: '#0a0f1d',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
                title="Click to zoom photograph"
              >
                <img 
                  src={getDesignDisplayImage(selectedDesign)} 
                  alt={selectedDesign.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getLuxuryJewellerySvg(selectedDesign.category, selectedDesign.metalType);
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  background: 'rgba(10, 15, 29, 0.85)',
                  borderRadius: '3px',
                  padding: '2px 4px',
                  color: '#fef08a'
                }}>
                  <ZoomIn size={10} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Layers size={18} color="#d4af37" />
                  <h3 className="luxury-box-title" style={{ margin: 0 }}>
                    Operation Routing Breakdown: {selectedDesign.name} ({selectedDesign.code})
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Precious Metal: <strong style={{ color: getMetalInfo(selectedDesign).color }}>{getMetalInfo(selectedDesign).label}</strong> • Melting Point: <strong>{getMetalInfo(selectedDesign).meltingPoint}</strong> • Allowable Scrap: <strong>{selectedDesign.allowableLossPct !== undefined && selectedDesign.allowableLossPct !== null ? `${selectedDesign.allowableLossPct}%` : getMetalInfo(selectedDesign).lossCeiling}</strong>
                </p>
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: getCraftingMethodInfo(selectedDesign.craftingMethod).color,
                    background: getCraftingMethodInfo(selectedDesign.craftingMethod).bg,
                    border: `1px solid ${getCraftingMethodInfo(selectedDesign.craftingMethod).border}`
                  }}>
                    {getCraftingMethodInfo(selectedDesign.craftingMethod).label}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary, #cbd5e1)' }}>
                    {getCraftingMethodInfo(selectedDesign.craftingMethod).desc}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-ghost-secondary btn-edit-selected-design"
                onClick={() => handleOpenEditModal(selectedDesign)}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 'bold',
                  borderColor: '#d4af37',
                  color: 'var(--gold-primary, #fef08a)'
                }}
                title={`Edit specifications & photo for ${selectedDesign.name} (${selectedDesign.code})`}
              >
                <Edit3 size={13} color="#d4af37" />
                <span>Edit This Design</span>
              </button>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #cbd5e1)' }}>
                Formula: <code>ST = Observed Time × (Rating / 100) × (1 + Allowance)</code>
              </div>
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
                    <td style={{ fontWeight: '600', color: 'var(--text-main, #fff)' }}>{op.opName}</td>
                    <td style={{ textAlign: 'right' }}>{op.ot.toFixed(1)} min</td>
                    <td style={{ textAlign: 'right' }}>{op.rating}%</td>
                    <td style={{ textAlign: 'right' }}>{(op.allowance * 100).toFixed(1)}%</td>
                    <td className="design-op-st-min" style={{ textAlign: 'right', fontWeight: '700', color: 'var(--gold-primary, #fef08a)' }}>
                      {op.st.toFixed(2)} min
                    </td>
                    <td style={{ textAlign: 'right', color: '#10b981', fontWeight: '700' }}>
                      Rs. {(op.st * selectedDesign.minuteRate).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="smt-table-footer" style={{ background: '#0a0f1d', fontWeight: 'bold' }}>
                  <td colSpan="6" style={{ textAlign: 'right', color: 'var(--text-main, #fff)', fontSize: '14px' }}>
                    TOTAL DESIGN SMT & LABOUR VALUE:
                  </td>
                  <td className="smt-table-footer-min" style={{ textAlign: 'right', color: 'var(--gold-primary, #fef08a)', fontSize: '16px', fontWeight: '800' }}>
                    {selectedDesign.totalSMT} min ({(selectedDesign.totalSMT / 60).toFixed(2)} hrs)
                  </td>
                  <td style={{ textAlign: 'right', color: '#10b981', fontSize: '16px', fontWeight: '800' }}>
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
                    <option value="Chain">Chain (Mala)</option>
                    <option value="Coin">Coin (Kasi)</option>
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

              {/* Jewellery Photograph & Visual Preview */}
              <div style={{ marginBottom: '16px', padding: '14px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#fef08a', marginBottom: '8px' }}>
                  📸 Jewellery Photograph & Visual Preview
                </label>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Image Preview Box */}
                  <div style={{
                    width: '95px',
                    height: '95px',
                    borderRadius: '8px',
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    background: '#070a13',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                  }}>
                    <img 
                      src={formData.imageUrl || getDesignDisplayImage(formData)} 
                      alt="Jewellery Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getLuxuryJewellerySvg(formData.category, formData.metalType);
                      }}
                    />
                    {formData.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                        title="Remove custom photo and reset to default"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <label 
                        className="btn-ghost-secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: isUploadingImage ? 'wait' : 'pointer',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#fef08a',
                          borderColor: 'rgba(212, 175, 55, 0.4)'
                        }}
                      >
                        <Upload size={14} color="#d4af37" />
                        <span>{isUploadingImage ? 'Optimizing photo...' : '📁 Upload Photo from Device'}</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageFileUpload(e.target.files[0], false);
                            }
                          }}
                        />
                      </label>
                      <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                        Supports JPG, PNG, WEBP (auto-compressed for fast workshop loading)
                      </span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <LinkIcon size={12} color="#94a3b8" />
                        <input 
                          type="url"
                          placeholder="Or paste image URL (https://...)"
                          value={formData.imageUrl || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manufacturing Route Selection */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#fef08a', marginBottom: '6px' }}>
                  Manufacturing Route / Crafting Method *
                </label>
                <select 
                  value={formData.craftingMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, craftingMethod: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    fontSize: '13px', 
                    fontWeight: 'bold',
                    color: formData.craftingMethod === 'CASTING' ? '#fb923c' : formData.craftingMethod === 'CNC_LASER' ? '#38bdf8' : '#fbbf24',
                    background: '#0a0f1d'
                  }}
                >
                  <option value="HANDMADE">🔨 Fully Handmade (100% Traditional bench fabrication)</option>
                  <option value="CASTING">🔥 Casting ➔ Bench (Wax tree investment casting ➔ bench cleanup)</option>
                  <option value="CNC_LASER">⚡ CNC / Laser ➔ Bench (Laser 3D printing / CNC milled ➔ bench finishing)</option>
                </select>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                  {formData.craftingMethod === 'HANDMADE' 
                    ? 'Traditional 100% manual bench fabrication: Ingot rolling, wire draw, hand piercing, flame soldering, claw setting.' 
                    : formData.craftingMethod === 'CASTING'
                    ? 'Wax tree vacuum induction casting ➔ sprue grinding ➔ craftsman bench setting & polish.'
                    : 'Direct Metal Laser 3D printing / CNC 5-axis ➔ craftsman micro-finishing & laser welding inspection.'}
                </span>
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
                    min="1"
                    step="any"
                    value={formData.totalSMT}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalSMT: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', fontWeight: 'bold', color: '#93c5fd' }}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    = {((parseFloat(formData.totalSMT) || 0) / 60).toFixed(2)} Working Hours
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Scrap Ceiling (%)
                  </label>
                  <input 
                    type="number"
                    step="any"
                    min="0"
                    max="25"
                    value={formData.allowableLossPct}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowableLossPct: e.target.value }))}
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
                  <span>Standard Labor Cost: <strong style={{ color: '#34d399' }}>Rs. {((parseFloat(formData.totalSMT) || 0) * (formData.skillTier === 'Grade A' ? 11.50 : formData.skillTier === 'Grade B' ? 9.50 : 7.50)).toFixed(2)}</strong></span>
                  <span>Bench Time Required: <strong style={{ color: '#fef08a' }}>{((parseFloat(formData.totalSMT) || 0) / 60).toFixed(2)} hrs / piece</strong></span>
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

      {/* Edit Design Modal */}
      {editingDesign && editFormData && (
        <div className="modal-backdrop-luxury">
          <div className="modal-window-luxury" style={{ maxWidth: '640px', width: '92vw', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit3 size={20} color="#d4af37" />
                <div>
                  <h3 style={{ fontSize: '18px', color: 'var(--text-main, #fff)', margin: 0, fontFamily: 'var(--font-serif)' }}>
                    Edit Jewellery Design: <span style={{ color: '#d4af37' }}>{editFormData.code}</span>
                  </h3>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Update design specifications, manufacturing route, SMT timing & scrap allowance</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => { setEditingDesign(null); setEditFormData(null); }}
                className="btn-ghost-secondary"
                style={{ padding: '4px 8px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditDesign}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                    Design Code (Primary Key)
                  </label>
                  <input 
                    type="text"
                    disabled
                    value={editFormData.code}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.05)', cursor: 'not-allowed' }}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Primary identifier code cannot be changed</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                    Jewellery Name / Title *
                  </label>
                  <input 
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                    Jewellery Category
                  </label>
                  <select 
                    value={editFormData.category}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                  >
                    <option value="Ring">Ring (Mudhu)</option>
                    <option value="Bracelet">Bracelet / Bangle (Walalu)</option>
                    <option value="Necklace">Necklace / Chain (Mala)</option>
                    <option value="Earring">Earring (Karabu)</option>
                    <option value="Pendant">Pendant (Padakkama)</option>
                    <option value="Chain">Chain (Mala)</option>
                    <option value="Coin">Coin (Kasi)</option>
                    <option value="Custom">Custom Order</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                    Precious Metal
                  </label>
                  <select 
                    value={editFormData.metalType}
                    onChange={(e) => {
                      const metal = e.target.value;
                      let defaultLoss = 3.0;
                      if (metal.includes('Platinum')) defaultLoss = 2.0;
                      else if (metal.includes('Silver')) defaultLoss = 5.0;
                      setEditFormData(prev => ({ ...prev, metalType: metal, allowableLossPct: defaultLoss }));
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

              {/* Jewellery Photograph & Visual Preview (Edit Mode) */}
              <div style={{ marginBottom: '16px', padding: '14px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--gold-primary, #fef08a)', marginBottom: '8px' }}>
                  📸 Jewellery Photograph & Visual Preview
                </label>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Image Preview Box */}
                  <div style={{
                    width: '95px',
                    height: '95px',
                    borderRadius: '8px',
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    background: '#070a13',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                  }}>
                    <img 
                      src={editFormData.imageUrl || getDesignDisplayImage(editFormData)} 
                      alt="Jewellery Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getLuxuryJewellerySvg(editFormData.category, editFormData.metalType);
                      }}
                    />
                    {editFormData.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, imageUrl: '' }))}
                        title="Remove custom photo and reset to default"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <label 
                        className="btn-ghost-secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: isUploadingImage ? 'wait' : 'pointer',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: 'var(--gold-primary, #fef08a)',
                          borderColor: 'rgba(212, 175, 55, 0.4)'
                        }}
                      >
                        <Upload size={14} color="#d4af37" />
                        <span>{isUploadingImage ? 'Optimizing photo...' : '📁 Upload Photo from Device'}</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageFileUpload(e.target.files[0], true);
                            }
                          }}
                        />
                      </label>
                      <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                        Supports JPG, PNG, WEBP (auto-compressed for fast workshop loading)
                      </span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <LinkIcon size={12} color="#94a3b8" />
                        <input 
                          type="url"
                          placeholder="Or paste image URL (https://...)"
                          value={editFormData.imageUrl || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manufacturing Route Selection */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--gold-primary, #fef08a)', marginBottom: '6px' }}>
                  Manufacturing Route / Crafting Method *
                </label>
                <select 
                  value={editFormData.craftingMethod}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, craftingMethod: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    fontSize: '13px', 
                    fontWeight: 'bold',
                    color: editFormData.craftingMethod === 'CASTING' ? '#fb923c' : editFormData.craftingMethod === 'CNC_LASER' ? '#38bdf8' : '#fbbf24',
                    background: '#0a0f1d'
                  }}
                >
                  <option value="HANDMADE">🔨 Fully Handmade (100% Traditional bench fabrication)</option>
                  <option value="CASTING">🔥 Casting ➔ Bench (Wax tree investment casting ➔ bench cleanup)</option>
                  <option value="CNC_LASER">⚡ CNC / Laser ➔ Bench (Laser 3D printing / CNC milled ➔ bench finishing)</option>
                </select>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                  {editFormData.craftingMethod === 'HANDMADE' 
                    ? 'Traditional 100% manual bench fabrication: Ingot rolling, wire draw, hand piercing, flame soldering, claw setting.' 
                    : editFormData.craftingMethod === 'CASTING'
                    ? 'Wax tree vacuum induction casting ➔ sprue grinding ➔ craftsman bench setting & polish.'
                    : 'Direct Metal Laser 3D printing / CNC 5-axis ➔ craftsman micro-finishing & laser welding inspection.'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                    Skill Tier Required
                  </label>
                  <select 
                    value={editFormData.skillTier}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, skillTier: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                  >
                    <option value="Grade A">Grade A (Master • Rs. 11.50/m)</option>
                    <option value="Grade B">Grade B (Skilled • Rs. 9.50/m)</option>
                    <option value="Grade C">Grade C (Junior • Rs. 7.50/m)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                    Total SMT (Minutes) *
                  </label>
                  <input 
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={editFormData.totalSMT}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, totalSMT: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', fontWeight: 'bold', color: '#93c5fd' }}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    = {((parseFloat(editFormData.totalSMT) || 0) / 60).toFixed(2)} Working Hours
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                    Scrap Ceiling (%)
                  </label>
                  <input 
                    type="number"
                    step="any"
                    min="0"
                    max="25"
                    value={editFormData.allowableLossPct}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, allowableLossPct: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Max allowable loss</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary, #cbd5e1)', marginBottom: '6px' }}>
                  Design Notes / Technical Specifications
                </label>
                <textarea 
                  rows="2"
                  placeholder="e.g. Micro-claw prongs for 0.50ct central diamond with wire hand filigree on sides"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12px' }}
                />
              </div>

              {/* Live Cost & Engineering Calculation Preview */}
              <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '18px' }}>
                <div style={{ fontSize: '11px', color: '#d4af37', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Live Engineering Output Preview:
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary, #cbd5e1)', flexWrap: 'wrap', gap: '8px' }}>
                  <span>Standard Labor Cost: <strong style={{ color: '#34d399' }}>Rs. {((parseFloat(editFormData.totalSMT) || 0) * (editFormData.skillTier === 'Grade A' ? 11.50 : editFormData.skillTier === 'Grade B' ? 9.50 : 7.50)).toFixed(2)}</strong></span>
                  <span>Bench Time Required: <strong style={{ color: 'var(--gold-primary, #fef08a)' }}>{((parseFloat(editFormData.totalSMT) || 0) / 60).toFixed(2)} hrs / piece</strong></span>
                  <span>Rate: <strong style={{ color: '#38bdf8' }}>Rs. {editFormData.skillTier === 'Grade A' ? '11.50' : editFormData.skillTier === 'Grade B' ? '9.50' : '7.50'}/min</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-ghost-secondary"
                  onClick={() => { setEditingDesign(null); setEditFormData(null); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="btn-gold-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={15} />
                  <span>{isUpdating ? 'Updating Design...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* High-Resolution Jewellery Photo Lightbox Modal */}
      {previewImageModal && (
        <div 
          className="modal-backdrop-luxury"
          onClick={() => setPreviewImageModal(null)}
          style={{ zIndex: 10000 }}
        >
          <div 
            className="modal-window-luxury"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '92vw',
              padding: '0',
              overflow: 'hidden',
              background: 'var(--bg-card, #0f172a)',
              border: '1.5px solid #d4af37',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)'
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: '340px', background: '#050811', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={previewImageModal.url} 
                alt={previewImageModal.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="btn-ghost-secondary"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#d4af37', fontWeight: 'bold' }}>{previewImageModal.code}</span>
                  <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontFamily: 'var(--font-serif)', color: 'var(--text-main, #fff)' }}>
                    {previewImageModal.title}
                  </h3>
                </div>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#fef08a',
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.4)'
                }}>
                  {previewImageModal.metal}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary, #cbd5e1)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                {previewImageModal.desc}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn-gold-primary" 
                  onClick={() => setPreviewImageModal(null)}
                  style={{ padding: '7px 18px', fontSize: '12px' }}
                >
                  Close Photo Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
