import React, { useRef, useEffect } from 'react';
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
  Code2
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  craftsmenCount = 63, 
  todayAbsentCount = 3,
  adminUser,
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
