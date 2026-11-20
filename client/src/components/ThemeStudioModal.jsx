import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Sun, Moon, Palette, X, ShieldCheck } from 'lucide-react';

export const THEMES = [
  {
    id: 'obsidian',
    name: 'Midnight Obsidian',
    tagline: 'Signature 22K Gold & Black',
    description: 'Deep midnight space with 22K Ceylon Gold metallic sheen and glowing amber benches.',
    mode: 'Dark',
    dot: '#d4af37',
    accent: '#d4af37',
    glow: '#f59e0b',
    wallpaper: 'radial-gradient(circle at 80% 25%, #d4af37 0%, rgba(212, 175, 55, 0.28) 35%, transparent 70%), linear-gradient(135deg, #1f1807 0%, #0d0f17 50%, #05070c 100%)',
    contrastBadge: 'WCAG AAA Dark'
  },
  {
    id: 'emerald',
    name: 'Royal Ceylon Emerald',
    tagline: 'Imperial Jade & Mint Gold',
    description: 'Deep forest green canvas inspired by Ceylon gemstones, glowing mint trims and gold.',
    mode: 'Dark',
    dot: '#10b981',
    accent: '#10b981',
    glow: '#34d399',
    wallpaper: 'radial-gradient(circle at 80% 25%, #10b981 0%, rgba(16, 185, 129, 0.3) 35%, transparent 70%), linear-gradient(135deg, #052619 0%, #03140e 50%, #010a06 100%)',
    contrastBadge: 'WCAG AAA Dark'
  },
  {
    id: 'sapphire',
    name: 'Sapphire Night',
    tagline: 'Royal Blue Sapphire & Platinum',
    description: 'Ceylon blue sapphire midnight navy with ice cyan platinum borders and crystal aurora.',
    mode: 'Dark',
    dot: '#38bdf8',
    accent: '#38bdf8',
    glow: '#60a5fa',
    wallpaper: 'radial-gradient(circle at 80% 25%, #38bdf8 0%, rgba(56, 189, 248, 0.3) 35%, transparent 70%), linear-gradient(135deg, #062047 0%, #030f24 50%, #010712 100%)',
    contrastBadge: 'WCAG AAA Dark'
  },
  {
    id: 'ruby',
    name: 'Imperial Ruby',
    tagline: 'Velvet Garnet & Rose Gold',
    description: 'Deep velvet crimson and Ceylon star ruby canvas with warm rose gold metallic accents.',
    mode: 'Dark',
    dot: '#fb7185',
    accent: '#fb7185',
    glow: '#f43f5e',
    wallpaper: 'radial-gradient(circle at 80% 25%, #fb7185 0%, rgba(251, 113, 133, 0.3) 35%, transparent 70%), linear-gradient(135deg, #380a15 0%, #1a050a 50%, #080103 100%)',
    contrastBadge: 'WCAG AAA Dark'
  },
  {
    id: 'titanium',
    name: 'Titanium Carbon',
    tagline: 'Ultra-Contrast Tech & Indigo',
    description: 'Industrial high-contrast carbon black with electric indigo highlights and ultra-sharp white text.',
    mode: 'Dark',
    dot: '#818cf8',
    accent: '#818cf8',
    glow: '#6366f1',
    wallpaper: 'radial-gradient(circle at 80% 25%, #818cf8 0%, rgba(129, 140, 248, 0.3) 35%, transparent 70%), linear-gradient(135deg, #181829 0%, #0d0d14 50%, #050507 100%)',
    contrastBadge: 'Ultra-Contrast Dark'
  },
  {
    id: 'ivory',
    name: 'Ivory Atelier (Daylight)',
    tagline: 'Daylight Pearl & Bronze Gold',
    description: 'Crisp high-contrast daylight mode with deep charcoal text, pearl cream cards and bronze gold trims.',
    mode: 'Light',
    dot: '#b45309',
    accent: '#b45309',
    glow: '#d97706',
    wallpaper: 'radial-gradient(circle at 80% 25%, #fef3c7 0%, rgba(254, 243, 199, 0.8) 40%, transparent 75%), linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #e2e8f0 100%)',
    contrastBadge: '100% Crisp Legibility'
  }
];

export default function ThemeStudioModal({
  isOpen,
  onClose,
  currentTheme = 'obsidian',
  onSelectTheme
}) {
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'DARK' | 'LIGHT'

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredThemes = THEMES.filter(t => {
    if (activeFilter === 'DARK') return t.mode === 'Dark';
    if (activeFilter === 'LIGHT') return t.mode === 'Light';
    return true;
  });

  return (
    <div className="modal-backdrop-luxury" style={{ zIndex: 9999999 }} onClick={onClose}>
      <div 
        className="modal-window-luxury" 
        style={{ 
          maxWidth: '920px', 
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 26px',
          borderRadius: '20px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Palette size={20} color="var(--gold-primary)" />
              <h2 style={{ 
                fontFamily: 'var(--font-serif)', 
                fontSize: '22px', 
                fontWeight: '700', 
                color: 'var(--text-main)',
                letterSpacing: '0.5px' 
              }}>
                Current Theme Studio
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Choose a combination of wallpapers, contrast modes, and luxury materials to give your production cockpit more personality.
            </p>
          </div>

          <button 
            type="button" 
            className="modal-luxury-close" 
            onClick={onClose}
            title="Close Theme Studio"
            style={{ flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer',
              background: activeFilter === 'ALL' ? 'var(--gold-metallic)' : 'rgba(255, 255, 255, 0.05)',
              color: activeFilter === 'ALL' ? '#0b0f19' : 'var(--text-secondary)',
              border: '1px solid ' + (activeFilter === 'ALL' ? 'var(--gold-primary)' : 'var(--border-subtle)'),
              transition: 'all 0.2s ease'
            }}
          >
            ✨ All Themes (6)
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('DARK')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: activeFilter === 'DARK' ? 'var(--gold-metallic)' : 'rgba(255, 255, 255, 0.05)',
              color: activeFilter === 'DARK' ? '#0b0f19' : 'var(--text-secondary)',
              border: '1px solid ' + (activeFilter === 'DARK' ? 'var(--gold-primary)' : 'var(--border-subtle)'),
              transition: 'all 0.2s ease'
            }}
          >
            <Moon size={13} />
            <span>Dark Luxury (5)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('LIGHT')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: activeFilter === 'LIGHT' ? 'var(--gold-metallic)' : 'rgba(255, 255, 255, 0.05)',
              color: activeFilter === 'LIGHT' ? '#0b0f19' : 'var(--text-secondary)',
              border: '1px solid ' + (activeFilter === 'LIGHT' ? 'var(--gold-primary)' : 'var(--border-subtle)'),
              transition: 'all 0.2s ease'
            }}
          >
            <Sun size={13} />
            <span>Daylight Mode (1)</span>
          </button>
        </div>

        {/* Windows 11-style Theme Cards Grid */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          paddingRight: '6px',
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
          gap: '16px' 
        }}>
          {filteredThemes.map((t) => {
            const isSelected = currentTheme === t.id;

            return (
              <div
                key={t.id}
                onClick={() => onSelectTheme(t.id)}
                style={{
                  background: 'var(--bg-card, rgba(16, 24, 40, 0.85))',
                  border: isSelected 
                    ? `2px solid ${t.dot}` 
                    : '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected 
                    ? `0 0 25px ${t.dot}50, 0 10px 30px rgba(0, 0, 0, 0.7)` 
                    : '0 4px 16px rgba(0, 0, 0, 0.3)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = t.dot;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }
                }}
              >
                {/* Wallpaper Canvas Preview Thumbnail */}
                <div style={{
                  height: '115px',
                  width: '100%',
                  background: t.wallpaper,
                  position: 'relative',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden'
                }}>
                  {/* Miniature UI simulation */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: t.dot }} />
                    <div style={{ 
                      height: '6px', 
                      width: '45px', 
                      borderRadius: '3px', 
                      background: t.mode === 'Light' ? '#0f172a' : '#ffffff', 
                      opacity: 0.8 
                    }} />
                    <div style={{ 
                      height: '6px', 
                      width: '28px', 
                      borderRadius: '3px', 
                      background: t.dot, 
                      opacity: 0.9 
                    }} />
                  </div>

                  {/* Miniature Table/Card mockup */}
                  <div style={{
                    background: t.mode === 'Light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.45)',
                    border: `1px solid ${t.mode === 'Light' ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)'}`,
                    borderRadius: '6px',
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ height: '5px', width: '38px', borderRadius: '2px', background: t.mode === 'Light' ? '#0f172a' : '#ffffff' }} />
                      <div style={{ height: '5px', width: '22px', borderRadius: '2px', background: t.dot }} />
                    </div>
                    <div style={{ height: '4px', width: '60px', borderRadius: '2px', background: t.mode === 'Light' ? '#475569' : '#94a3b8' }} />
                  </div>

                  {/* Floating Colored Pill in bottom-right (Exact Windows 11 style) */}
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    width: '32px',
                    height: '20px',
                    borderRadius: '9999px',
                    background: t.mode === 'Light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.9)',
                    border: `1.5px solid ${t.dot}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)'
                  }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.dot }} />
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>
                      {t.name}
                    </div>
                    {isSelected && (
                      <span style={{
                        background: t.dot,
                        color: t.mode === 'Light' ? '#ffffff' : '#0b0f19',
                        padding: '2px 7px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: '900',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <Check size={11} strokeWidth={3} /> ACTIVE
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '11px', color: t.dot, fontWeight: '700', marginBottom: '6px' }}>
                    {t.tagline}
                  </div>

                  <p style={{ 
                    fontSize: '11px', 
                    color: 'var(--text-muted)', 
                    lineHeight: '1.45', 
                    marginBottom: '12px',
                    flex: 1 
                  }}>
                    {t.description}
                  </p>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '10.5px'
                  }}>
                    <span style={{ 
                      color: 'var(--text-dim)', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      fontWeight: '600'
                    }}>
                      <ShieldCheck size={12} color={t.dot} /> {t.contrastBadge}
                    </span>

                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      fontWeight: '700',
                      color: 'var(--text-secondary)'
                    }}>
                      {t.mode}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info Tip */}
        <div style={{
          marginTop: '18px',
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid var(--border-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11.5px',
          color: 'var(--text-secondary)'
        }}>
          <div>
            <strong style={{ color: 'var(--gold-light)' }}>💡 Readability Tip:</strong> If letters are difficult to read in bright daylight or on printed tables, select <strong style={{ color: '#d97706' }}>Ivory Atelier (Daylight Mode)</strong> for crisp 100% black text on paper-white cards.
          </div>
          <button
            type="button"
            className="btn-gold-primary"
            onClick={onClose}
            style={{ fontSize: '11px', padding: '6px 14px', flexShrink: 0, marginLeft: '12px' }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
