import React, { useRef, useEffect, useState } from 'react';
import { 
  Gem, 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  Download, 
  UserX, 
  FileText,
  Activity,
  Key,
  LogOut,
  Crown,
  QrCode,
  Code2,
  Palette
} from 'lucide-react';

export const THEMES = [
  {
    id: 'obsidian',
    name: 'Midnight Gold',
    subtitle: 'Classic 22K Obsidian (Default)',
    dot: '#d4af37',
    gradient: 'linear-gradient(135deg, #151e34 0%, #d4af37 100%)',
    icon: '✨'
  },
  {
    id: 'emerald',
    name: 'Royal Emerald',
    subtitle: 'Ceylon Emerald & Mint Jade',
    dot: '#10b981',
    gradient: 'linear-gradient(135deg, #02140d 0%, #10b981 100%)',
    icon: '💎'
  },
  {
    id: 'sapphire',
    name: 'Sapphire Night',
    subtitle: 'Ceylon Blue Sapphire & Platinum',
    dot: '#38bdf8',
    gradient: 'linear-gradient(135deg, #020b18 0%, #38bdf8 100%)',
    icon: '🌊'
  },
  {
    id: 'ruby',
    name: 'Imperial Ruby',
    subtitle: 'Velvet Ruby & Rose Gold',
    dot: '#fb7185',
    gradient: 'linear-gradient(135deg, #130408 0%, #fb7185 100%)',
    icon: '👑'
  },
  {
    id: 'ivory',
    name: 'Ivory Atelier',
    subtitle: 'Champagne Pearl & Daylight Mode',
    dot: '#d97706',
    gradient: 'linear-gradient(135deg, #f1f5f9 0%, #d97706 100%)',
    icon: '☀️'
  }
];

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  craftsmenCount = 63, 
  todayAbsentCount = 3,
  adminUser,
  currentTheme = 'obsidian',
  onThemeChange,
  onOpenKiosk,
  onOpenApiDocs,
  onOpenChangePassword,
  onLogout
}) {
  const handleDownloadExcel = () => {
    window.open('http://localhost:5000/api/dashboard/download-excel', '_blank');
  };

  const activeBenches = Math.max(0, craftsmenCount - todayAbsentCount);
  const navTabsRef = useRef(null);

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeButtonRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 60, right: 20 });

  const updateDropdownPos = () => {
    if (themeButtonRef.current) {
      const rect = themeButtonRef.current.getBoundingClientRect();
      const rightOffset = Math.max(12, Math.round(window.innerWidth - rect.right));
      setDropdownPos({
        top: Math.round(rect.bottom + 8),
        right: rightOffset
      });
    }
  };

  const handleToggleThemeMenu = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!showThemeMenu) {
      updateDropdownPos();
    }
    setShowThemeMenu(prev => !prev);
  };

  // Keep dropdown aligned if resized or scrolled while open
  useEffect(() => {
    if (!showThemeMenu) return;
    const handleScrollOrResize = () => {
      updateDropdownPos();
    };
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [showThemeMenu]);

  const activeThemeObj = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  // Smoothly center active tab into view when active tab changes (especially on mobile)
  useEffect(() => {
    if (navTabsRef.current) {
      const activeBtn = navTabsRef.current.querySelector('.nav-pill-btn.active');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  const handleScrollTabs = (direction) => {
    if (navTabsRef.current) {
      navTabsRef.current.scrollBy({ left: direction * 180, behavior: 'smooth' });
    }
  };

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        {/* 1. Brand Block */}
        <div className="brand-block" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <div className="brand-emblem">
            <Gem size={24} />
          </div>
          <div>
            <div className="brand-text-h1">ASHADI JEWELLERS</div>
            <div className="brand-text-sub">Labour Costing & Production System</div>
          </div>
        </div>

        {/* 2. Nav Pills Carousel Bar */}
        <div className="nav-pills-carousel-wrap">
          <button 
            type="button" 
            className="nav-carousel-arrow nav-carousel-prev" 
            onClick={() => handleScrollTabs(-1)}
            title="Scroll navigation tabs left"
            aria-label="Scroll left"
          >
            ‹
          </button>

          <nav className="nav-pills-bar" ref={navTabsRef}>
          <button 
            className={`nav-pill-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={14} />
            <span>Dashboard</span>
          </button>

          <button 
            className={`nav-pill-btn ${activeTab === 'craftsmen' ? 'active' : ''}`}
            onClick={() => setActiveTab('craftsmen')}
          >
            <Users size={14} />
            <span>Craftsmen ({craftsmenCount})</span>
          </button>

          <button 
            className={`nav-pill-btn ${activeTab === 'leaves' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaves')}
          >
            <UserX size={14} />
            <span>Leaves</span>
          </button>

          <button 
            className={`nav-pill-btn ${activeTab === 'designs' ? 'active' : ''}`}
            onClick={() => setActiveTab('designs')}
          >
            <Gem size={14} />
            <span>Designs</span>
          </button>

          <button 
            className={`nav-pill-btn ${(activeTab === 'allocations' || activeTab === 'floor') ? 'active' : ''}`}
            onClick={() => setActiveTab('allocations')}
          >
            <Calendar size={14} />
            <span>Dispatch</span>
          </button>

          <button 
            className={`nav-pill-btn ${activeTab === 'tracker' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracker')}
          >
            <Clock size={14} />
            <span>Piecework</span>
          </button>

          {adminUser?.role !== 'SUPERVISOR' && (
            <button 
              className={`nav-pill-btn ${activeTab === 'monthlyReport' ? 'active' : ''}`}
              onClick={() => setActiveTab('monthlyReport')}
              style={{ 
                borderColor: activeTab === 'monthlyReport' ? '#d4af37' : 'rgba(212, 175, 55, 0.4)',
                background: activeTab === 'monthlyReport' ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(180, 130, 20, 0.2) 100%)' : 'rgba(212, 175, 55, 0.08)',
                color: '#fef08a'
              }}
            >
              <FileText size={14} color="#d4af37" />
              <span>Report</span>
            </button>
          )}

          {onOpenKiosk && (
            <button 
              className="nav-pill-btn"
              onClick={onOpenKiosk}
              style={{ 
                borderColor: '#eab308',
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.28) 0%, rgba(202, 138, 4, 0.16) 100%)',
                color: '#fef08a',
                fontWeight: '800',
                boxShadow: '0 0 12px rgba(234, 179, 8, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Open Touchless Floor Kiosk Scanner (Use Phone / Tablet Camera)"
            >
              <QrCode size={14} color="#fde047" />
              <span>Floor Kiosk</span>
            </button>
          )}
          </nav>

          <button 
            type="button" 
            className="nav-carousel-arrow nav-carousel-next" 
            onClick={() => handleScrollTabs(1)}
            title="Scroll navigation tabs right"
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>

        {/* 3. Top Actions */}
        <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="status-pill-pulse" title={`${todayAbsentCount} craftsmen on approved leave today`}>
            <div className="pulse-dot"></div>
            <span>{activeBenches} Active</span>
          </div>

          <button className="btn-export-excel" onClick={handleDownloadExcel} title="Download Excel Production System (.xlsx)">
            <Download size={13} />
            <span>Export</span>
          </button>

          {/* Theme Customizer Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              ref={themeButtonRef}
              type="button" 
              onClick={handleToggleThemeMenu}
              style={{
                background: showThemeMenu ? 'var(--nav-pill-active)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-gold)',
                color: 'var(--gold-light)',
                padding: '5px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: showThemeMenu ? 'var(--shadow-glow)' : 'none'
              }}
              title="Customize Interface Theme"
            >
              <Palette size={13} color="var(--gold-primary)" />
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: activeThemeObj.dot,
                boxShadow: `0 0 6px ${activeThemeObj.dot}`,
                display: 'inline-block'
              }} />
              <span className="theme-btn-label">{activeThemeObj.name}</span>
              <span style={{ fontSize: '8px', opacity: 0.7 }}>▼</span>
            </button>

            {showThemeMenu && (
              <>
                {/* Full-screen click interceptor to catch any outside click */}
                <div 
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999998,
                    background: 'transparent'
                  }}
                  onClick={() => setShowThemeMenu(false)}
                />

                <div style={{
                  position: 'fixed',
                  top: `${dropdownPos.top}px`,
                  right: `${dropdownPos.right}px`,
                  width: '280px',
                  maxWidth: 'calc(100vw - 24px)',
                  background: 'var(--modal-bg, #0f1627)',
                  border: '1.5px solid var(--border-gold-bright)',
                  borderRadius: '14px',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), var(--shadow-glow)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  padding: '10px',
                  zIndex: 999999,
                  animation: 'fadeInScale 0.18s ease-out'
                }}>
                  <div style={{
                    padding: '6px 8px 8px 8px',
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: 'var(--gold-light)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>🎨 Select Interface Theme</span>
                    <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--text-muted)' }}>Ashadi Studio</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                    {THEMES.map(t => {
                      const isSelected = (currentTheme || 'obsidian') === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onThemeChange) onThemeChange(t.id);
                            try {
                              document.documentElement.setAttribute('data-theme', t.id);
                              localStorage.setItem('ashadi_theme', t.id);
                            } catch (err) {}
                            setShowThemeMenu(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: isSelected ? 'var(--nav-pill-active)' : 'transparent',
                            border: isSelected ? '1px solid var(--border-gold-bright)' : '1px solid transparent',
                            color: isSelected ? 'var(--gold-light)' : 'var(--text-main)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                        >
                          <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            background: t.gradient,
                            border: `1.5px solid ${t.dot}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            flexShrink: 0,
                            boxShadow: `0 0 8px ${t.dot}40`
                          }}>
                            {t.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: isSelected ? '800' : '600' }}>
                              {t.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.subtitle}
                            </div>
                          </div>
                          {isSelected && (
                            <span style={{ color: t.dot, fontWeight: 'bold', fontSize: '14px' }}>✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Role Badge */}
          {adminUser?.role === 'SUPER_ADMIN' ? (
            <span style={{ 
              fontSize: '10.5px', 
              fontWeight: '700', 
              background: 'rgba(212, 175, 55, 0.15)', 
              color: '#fef08a', 
              border: '1px solid rgba(212, 175, 55, 0.4)', 
              padding: '4px 8px', 
              borderRadius: '6px',
              letterSpacing: '0.3px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }} title="Owner / Super Admin Account">
              👑 Owner
            </span>
          ) : (
            <span style={{ 
              fontSize: '10.5px', 
              fontWeight: '700', 
              background: 'rgba(56, 189, 248, 0.15)', 
              color: '#38bdf8', 
              border: '1px solid rgba(56, 189, 248, 0.4)', 
              padding: '4px 8px', 
              borderRadius: '6px',
              letterSpacing: '0.3px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }} title="Workshop Floor Supervisor Account">
              🛠️ Workshop
            </span>
          )}

          {/* Admin Account Controls (Only visible to Super Admin / Owner) */}
          {onOpenChangePassword && adminUser?.role === 'SUPER_ADMIN' && (
            <button 
              className="btn-ghost-secondary btn-password" 
              onClick={onOpenChangePassword}
              style={{ fontSize: '11px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              title="Change Admin Password"
            >
              <Key size={13} color="#d4af37" />
              <span>Password</span>
            </button>
          )}

          {onLogout && (
            <button 
              className="btn-ghost-secondary" 
              onClick={onLogout}
              style={{ fontSize: '11px', padding: '6px 10px', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              title={`Sign out (${adminUser?.username || 'user'})`}
            >
              <LogOut size={13} color="#f87171" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
