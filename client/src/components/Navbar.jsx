import React from 'react';
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
  QrCode
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  craftsmenCount = 63, 
  todayAbsentCount = 3,
  adminUser,
  onOpenKiosk,
  onOpenChangePassword,
  onLogout
}) {
  const handleDownloadExcel = () => {
    window.open('http://localhost:5000/api/dashboard/download-excel', '_blank');
  };

  const activeBenches = Math.max(0, craftsmenCount - todayAbsentCount);

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <div className="brand-block" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <div className="brand-emblem">
            <Gem size={24} />
          </div>
          <div>
            <div className="brand-text-h1">ASHADI JEWELLERS</div>
            <div className="brand-text-sub">Labour Costing & Production System</div>
          </div>
        </div>

        <nav className="nav-pills-bar">
          <button 
            className={`nav-pill-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </button>

          <button 
            className={`nav-pill-btn ${activeTab === 'craftsmen' ? 'active' : ''}`}
            onClick={() => setActiveTab('craftsmen')}
          >
            <Users size={15} />
            <span>{craftsmenCount} Craftsmen</span>
          </button>

          <button 
            className={`nav-pill-btn ${activeTab === 'leaves' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaves')}
          >
            <UserX size={15} />
            <span>Daily Leaves</span>
          </button>

          <button 
            className={`nav-pill-btn ${activeTab === 'designs' ? 'active' : ''}`}
            onClick={() => setActiveTab('designs')}
          >
            <Gem size={15} />
            <span>Designs & Operations</span>
          </button>

          <button 
            className={`nav-pill-btn ${activeTab === 'allocations' ? 'active' : ''}`}
            onClick={() => setActiveTab('allocations')}
          >
            <Calendar size={15} />
            <span>Daily Dispatch</span>
          </button>

          <button 
            className={`nav-pill-btn ${activeTab === 'tracker' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracker')}
          >
            <Clock size={15} />
            <span>Time & Piecework</span>
          </button>

          <button 
            className={`nav-pill-btn ${activeTab === 'monthlyReport' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthlyReport')}
            style={{ 
              borderColor: activeTab === 'monthlyReport' ? '#d4af37' : 'rgba(212, 175, 55, 0.4)',
              background: activeTab === 'monthlyReport' ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(180, 130, 20, 0.2) 100%)' : 'rgba(212, 175, 55, 0.08)',
              color: '#fef08a'
            }}
          >
            <FileText size={15} color="#d4af37" />
            <span>Monthly Report</span>
          </button>

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
                gap: '6px'
              }}
              title="Open Touchless Floor Kiosk Scanner (Use Phone / Tablet Camera)"
            >
              <QrCode size={15} color="#fde047" />
              <span>⚡ Floor Kiosk</span>
            </button>
          )}
        </nav>

        <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="status-pill-pulse" title={`${todayAbsentCount} craftsmen on approved leave today`}>
            <div className="pulse-dot"></div>
            <span>{activeBenches} Active Benches</span>
          </div>

          <button className="btn-export-excel" onClick={handleDownloadExcel} title="Download Excel Production System (.xlsx)">
            <Download size={14} />
            <span>Export Excel</span>
          </button>

          {/* Admin Account Controls */}
          {onOpenChangePassword && (
            <button 
              className="btn-ghost-secondary" 
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
              title={`Sign out of Admin session (${adminUser?.username || 'admin'})`}
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
