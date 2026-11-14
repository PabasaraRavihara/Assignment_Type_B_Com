import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import CraftsmenView from './components/CraftsmenView';
import LeavesView from './components/LeavesView';
import DesignsView from './components/DesignsView';
import AllocationsView from './components/AllocationsView';
import TimeTrackerView from './components/TimeTrackerView';
import MonthlyReportView from './components/MonthlyReportView';
import AdminLoginView from './components/AdminLoginView';
import ChangePasswordModal from './components/ChangePasswordModal';
import ShopFloorQRScannerModal from './components/ShopFloorQRScannerModal';
import ApiDocsModal from './components/ApiDocsModal';
import ErrorBoundary from './components/ErrorBoundary';
import { Crown } from 'lucide-react';
import api from './api';
import './App.css'; // Luxury gold styling

const formatApiError = (err) => {
  if (!err) return 'Unknown error occurred.';
  const resErr = err.response?.data?.error;
  if (typeof resErr === 'string') return resErr;
  if (resErr && typeof resErr === 'object') {
    return resErr.message || JSON.stringify(resErr);
  }
  if (typeof err.response?.data?.message === 'string') return err.response.data.message;
  return err.message || 'Operation failed.';
};

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const search = window.location.search || '';
      if (search.includes('wo=')) {
        return 'allocations';
      }
    } catch (e) {}
    return 'dashboard';
  });
  const [metrics, setMetrics] = useState(null);
  const [craftsmen, setCraftsmen] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [clientShops, setClientShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFloorKioskModal, setShowFloorKioskModal] = useState(() => {
    try {
      const search = window.location.search || '';
      return search.includes('kiosk');
    } catch (e) {
      return false;
    }
  });

  // Local Date String (YYYY-MM-DD in user's timezone)
  const getLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // JWT Authentication States (Enforces Daily Morning Shift Re-authentication)
  const [authToken, setAuthToken] = useState(() => {
    try {
      const loginDate = localStorage.getItem('ashadi_login_date');
      const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
      if (!loginDate || loginDate !== todayStr) return null;
      return localStorage.getItem('ashadi_jwt_token') || null;
    } catch (e) {
      return null;
    }
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const loginDate = localStorage.getItem('ashadi_login_date');
      const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
      if (!loginDate || loginDate !== todayStr) return null;
      const stored = localStorage.getItem('ashadi_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showApiDocsModal, setShowApiDocsModal] = useState(() => {
    try {
      const search = window.location.search || '';
      return search.includes('api=true') || search.includes('dev=true');
    } catch (e) {
      return false;
    }
  });

  // Global Real-Time Floor QR Scan Toast Notification (Appears on all tabs)
  const [globalScanNotification, setGlobalScanNotification] = useState(null);
  const globalToastTimerRef = useRef(null);

  const triggerGlobalScanNotification = (notif) => {
    if (!notif) return;
    setGlobalScanNotification(notif);

    // Subtle audio chime
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(notif.actionColor === '#f59e0b' ? 587.33 : 880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.22);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.22);
    } catch (e) {}

    if (globalToastTimerRef.current) clearTimeout(globalToastTimerRef.current);
    globalToastTimerRef.current = setTimeout(() => {
      setGlobalScanNotification(null);
    }, 4200);
  };

  useEffect(() => {
    const handleGlobalFloorScan = (e) => {
      if (e.detail) {
        triggerGlobalScanNotification(e.detail);
      }
    };
    window.addEventListener('ashadi:floor_scan_event', handleGlobalFloorScan);
    return () => {
      window.removeEventListener('ashadi:floor_scan_event', handleGlobalFloorScan);
      if (globalToastTimerRef.current) clearTimeout(globalToastTimerRef.current);
    };
  }, []);

  // Fetch all data
  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/dashboard/metrics'),
        api.get('/craftsmen'),
        api.get('/leaves'),
        api.get('/designs'),
        api.get('/allocations'),
        api.get('/timelogs'),
        api.get('/client-shops')
      ]);

      const [metricsRes, craftsRes, leavesRes, designsRes, allocRes, logsRes, shopsRes] = results;

      if (metricsRes.status === 'fulfilled' && metricsRes.value?.data) {
        setMetrics(metricsRes.value.data);
      }
      if (craftsRes.status === 'fulfilled' && craftsRes.value?.data) {
        setCraftsmen(craftsRes.value.data.craftsmen || []);
      }
      if (leavesRes.status === 'fulfilled' && leavesRes.value?.data) {
        setLeaves(leavesRes.value.data.leaves || []);
      }
      if (designsRes.status === 'fulfilled' && designsRes.value?.data) {
        setDesigns(designsRes.value.data.designs || []);
      }
      if (allocRes.status === 'fulfilled' && allocRes.value?.data) {
        setAllocations(allocRes.value.data.allocations || []);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value?.data) {
        setTimeLogs(logsRes.value.data.timeLogs || []);
      }
      if (shopsRes.status === 'fulfilled' && shopsRes.value?.data) {
        setClientShops(shopsRes.value.data.shops || []);
      }
    } catch (err) {
      console.error('API load notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('ashadi_jwt_token');
      localStorage.removeItem('ashadi_admin_user');
      localStorage.removeItem('ashadi_login_date');
    } catch (e) {}
    setAuthToken(null);
    setAdminUser(null);
  };

  const handleLoginSuccess = (user, token) => {
    try {
      localStorage.setItem('ashadi_login_date', getLocalDateStr());
    } catch (e) {}
    setAuthToken(token);
    setAdminUser(user);
    loadData();
  };

  useEffect(() => {
    const verifyExistingAuth = async () => {
      const token = localStorage.getItem('ashadi_jwt_token');
      const loginDate = localStorage.getItem('ashadi_login_date');
      const todayStr = getLocalDateStr();

      // Daily Morning Shift Lock:
      // If the session was created on a previous day (or no loginDate recorded),
      // require the user to log in afresh with password for today's morning shift!
      if (!token || !loginDate || loginDate !== todayStr) {
        if (token) {
          handleLogout();
        }
        setIsAuthChecking(false);
        setLoading(false);
        return;
      }

      const storedUser = localStorage.getItem('ashadi_admin_user');
      if (storedUser) {
        try {
          setAdminUser(JSON.parse(storedUser));
          loadData();
        } catch (e) {}
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data) {
          setAdminUser(res.data);
          if (!storedUser) loadData();
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          handleLogout();
        }
      } finally {
        setIsAuthChecking(false);
      }
    };

    verifyExistingAuth();

    const onAuthExpired = () => {
      handleLogout();
    };
    window.addEventListener('ashadi:auth_expired', onAuthExpired);
    return () => window.removeEventListener('ashadi:auth_expired', onAuthExpired);
  }, []);

  // Auto-detect day rollover (e.g. when laptop is opened the next morning or past midnight)
  useEffect(() => {
    const checkDayRollover = () => {
      const savedDate = localStorage.getItem('ashadi_login_date');
      const todayStr = getLocalDateStr();
      if (savedDate && savedDate !== todayStr && authToken) {
        handleLogout();
      }
    };

    window.addEventListener('focus', checkDayRollover);
    const interval = setInterval(checkDayRollover, 60000); // Check once a minute
    return () => {
      window.removeEventListener('focus', checkDayRollover);
      clearInterval(interval);
    };
  }, [authToken]);

  // Multi-Device Cloud Auto-Sync (Real-time synchronization between Phone Kiosk & Laptop Floor Monitor)
  useEffect(() => {
    let isSubscribed = true;

    const silentSync = async () => {
      // Skip background polling if tab is minimized or user switched applications
      if (typeof document !== 'undefined' && document.hidden) return;

      try {
        const res = await api.get('/allocations');
        if (!isSubscribed) return;
        if (res.data?.allocations && Array.isArray(res.data.allocations)) {
          setAllocations(prev => {
            const newAllocs = res.data.allocations;

            // Detect if any specific craftsman had their status changed remotely from another phone or kiosk
            if (prev && prev.length > 0) {
              newAllocs.forEach(na => {
                const pa = prev.find(p => (p.id && p.id === na.id) || (p.workOrder && p.workOrder === na.workOrder));
                if (pa && pa.status !== na.status) {
                  let actionTitle = na.status;
                  let actionIcon = '⚡';
                  let actionColor = '#38bdf8';
                  if (na.status && na.status.includes('Paused')) {
                    actionTitle = na.status;
                    actionIcon = '☕';
                    actionColor = '#f59e0b';
                  } else if (na.status === 'In Progress' && pa.status && pa.status.includes('Paused')) {
                    actionTitle = 'Resumed Bench Work';
                    actionIcon = '▶';
                    actionColor = '#4ade80';
                  } else if (na.status === 'Completed') {
                    actionTitle = 'Completed & Vault Return';
                    actionIcon = '✅';
                    actionColor = '#10b981';
                  } else if (na.status === 'In Progress' && (!pa.dispatchTime || pa.status === 'Standby')) {
                    actionTitle = 'Started Morning Shift';
                    actionIcon = '▶';
                    actionColor = '#4ade80';
                  }

                  const now = new Date();
                  const timeStr = `${String(now.getHours() % 12 || 12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

                  window.dispatchEvent(new CustomEvent('ashadi:floor_scan_event', {
                    detail: {
                      craftsmanName: na.craftsmanName,
                      craftsmanId: na.craftsmanId,
                      skillTier: na.skillTier,
                      workOrder: na.workOrder,
                      designName: na.designName || na.designCode,
                      actionTitle,
                      actionIcon,
                      actionColor,
                      timeStr,
                      allocationId: na.id || na._id,
                      source: 'PHONE_CLOUD'
                    }
                  }));
                }
              });
            }

            // Detect if any order's status, hours, or times changed remotely on another device
            const hasChanged = newAllocs.length !== prev.length || newAllocs.some(na => {
              const pa = prev.find(p => (p.id && p.id === na.id) || (p.workOrder && p.workOrder === na.workOrder));
              return !pa || 
                     pa.status !== na.status || 
                     pa.actualHours !== na.actualHours || 
                     pa.dispatchTime !== na.dispatchTime || 
                     pa.qtyAllocated !== na.qtyAllocated ||
                     pa.goldReturnedGrams !== na.goldReturnedGrams;
            });
            return hasChanged ? newAllocs : prev;
          });
        }
      } catch (err) {
        // Silently ignore transient network drops
      }
    };

    // Fast 3.5s cloud polling interval for seamless multi-device floor updates
    const syncTimer = setInterval(silentSync, 3500);

    // Instantly sync the moment user switches back to the browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        silentSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isSubscribed = false;
      clearInterval(syncTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleAddCraftsman = async (newCraftsmanData) => {
    try {
      const res = await api.post('/craftsmen', newCraftsmanData);
      setCraftsmen(prev => [res.data, ...prev]);
      loadData();
    } catch (err) {
      console.error('Failed to add craftsman', err);
    }
  };

  const handleUpdateCraftsman = async (craftsmanId, updatedData) => {
    try {
      const res = await api.put(`/craftsmen/${craftsmanId}`, updatedData);
      setCraftsmen(prev => prev.map(c => c.id === craftsmanId ? res.data : c));
      loadData();
    } catch (err) {
      console.error('Failed to update craftsman', err);
    }
  };

  const handleDeleteCraftsman = async (craftsmanId) => {
    try {
      await api.delete(`/craftsmen/${craftsmanId}`);
      setCraftsmen(prev => prev.filter(c => c.id !== craftsmanId));
      loadData();
    } catch (err) {
      console.error('Failed to delete craftsman', err);
    }
  };

  const handleAddLeave = async (newLeaveData) => {
    try {
      const res = await api.post('/leaves', newLeaveData);
      setLeaves(prev => [res.data, ...prev]);
      loadData();
    } catch (err) {
      console.error('Failed to add leave', err);
    }
  };

  const handleDeleteLeave = async (leaveId) => {
    try {
      await api.delete(`/leaves/${leaveId}`);
      setLeaves(prev => prev.filter(l => l.id !== leaveId));
      loadData();
    } catch (err) {
      console.error('Failed to delete leave', err);
    }
  };

  const handleAddDesign = async (newDesignData) => {
    try {
      const res = await api.post('/designs', newDesignData);
      setDesigns(prev => [res.data, ...prev.filter(d => d.code !== res.data.code)]);
      loadData();
      return { success: true, design: res.data };
    } catch (err) {
      console.error('Failed to add design', err);
      return { success: false, error: err.response?.data?.error || err.message };
    }
  };

  const handleAddAllocation = async (newAllocData) => {
    if (!newAllocData) {
      loadData();
      return;
    }
    try {
      const res = await api.post('/allocations', newAllocData);
      if (res.data) {
        setAllocations(prev => [res.data, ...prev]);
      }
      setTimeout(() => {
        loadData();
      }, 350);
    } catch (err) {
      console.error('Failed to add allocation', err);
      alert('Notice: Could not dispatch order: ' + formatApiError(err));
    }
  };

  const handleUpdateAllocation = async (allocId, updatedData) => {
    // Optimistic UI update so table and floor monitor update immediately
    setAllocations(prev => prev.map(a => {
      if (a.id === allocId || a._id === allocId || String(a._id) === allocId || (updatedData?.workOrder && a.workOrder === updatedData.workOrder)) {
        return { ...a, ...updatedData };
      }
      return a;
    }));

    try {
      const res = await api.put(`/allocations/${allocId}`, updatedData);
      if (res.data) {
        setAllocations(prev => prev.map(a => {
          if (a.id === allocId || a._id === allocId || String(a._id) === allocId || (updatedData?.workOrder && a.workOrder === updatedData.workOrder)) {
            return res.data;
          }
          return a;
        }));
      }
      setTimeout(() => {
        loadData();
      }, 500);
    } catch (err) {
      console.warn('Update allocation network notice:', err.message);
      // If server returned a business validation error (e.g. 400), inform the user
      if (err.response && err.response.status >= 400 && err.response.status < 500) {
        alert('Notice: Could not update order: ' + formatApiError(err));
        loadData();
      }
      // For transient network hiccups, preserve the optimistic update in UI without popping modal alert
    }
  };

  const handleDeleteAllocation = async (allocId) => {
    try {
      await api.delete(`/allocations/${allocId}`);
      setAllocations(prev => prev.filter(a => a.id !== allocId));
      loadData();
    } catch (err) {
      console.error('Failed to delete allocation', err);
    }
  };

  const handleClearAllAllocations = async () => {
    try {
      await api.post('/allocations/clear-all');
      setAllocations([]);
      loadData();
    } catch (err) {
      console.error('Failed to clear allocations', err);
    }
  };

  const handleAddTimeLog = async (newLogData) => {
    try {
      const res = await api.post('/timelogs', newLogData);
      setTimeLogs(prev => [res.data, ...prev]);
      loadData();
    } catch (err) {
      console.error('Failed to record time log', err);
    }
  };

  const handleAddClientShop = async (newShopData) => {
    try {
      const res = await api.post('/client-shops', newShopData);
      setClientShops(prev => [...prev, res.data]);
      loadData();
      return res.data;
    } catch (err) {
      console.error('Failed to add client shop', err);
      throw err;
    }
  };

  const handleUpdateClientShop = async (shopId, updatedData) => {
    try {
      const res = await api.put(`/client-shops/${shopId}`, updatedData);
      setClientShops(prev => prev.map(s => s.id === shopId ? res.data : s));
      loadData();
    } catch (err) {
      console.error('Failed to update client shop', err);
    }
  };

  const handleDeleteClientShop = async (shopId) => {
    try {
      await api.delete(`/client-shops/${shopId}`);
      setClientShops(prev => prev.filter(s => s.id !== shopId));
      loadData();
    } catch (err) {
      console.error('Failed to delete client shop', err);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayLeavesCount = (leaves || []).filter(l => l.date === today).length;

  if (isAuthChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080c16',
        color: '#fef08a'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Crown size={38} color="#d4af37" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Verifying Admin Session...
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated via JWT, present the Luxury Admin Login Screen
  if (!authToken || !adminUser) {
    return <AdminLoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-shell">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        craftsmenCount={craftsmen.length || 63}
        todayAbsentCount={todayLeavesCount}
        adminUser={adminUser}
        onOpenKiosk={() => setShowFloorKioskModal(true)}
        onOpenApiDocs={() => setShowApiDocsModal(true)}
        onOpenChangePassword={() => setShowChangePasswordModal(true)}
        onLogout={handleLogout}
      />
      
      <ErrorBoundary onReset={() => setActiveTab('dashboard')}>
        <main className="page-container">
          {activeTab === 'dashboard' && (
            <DashboardView 
              metrics={metrics} 
              loading={loading} 
              craftsmen={craftsmen}
              designs={designs}
              timeLogs={timeLogs}
              leaves={leaves}
              allocations={allocations}
              onOpenKiosk={() => setShowFloorKioskModal(true)}
              onNavigateTab={(tab) => setActiveTab(tab)} 
            />
          )}

          {activeTab === 'craftsmen' && (
            <CraftsmenView 
              craftsmen={craftsmen} 
              onAddCraftsman={handleAddCraftsman} 
              onUpdateCraftsman={handleUpdateCraftsman}
              onDeleteCraftsman={handleDeleteCraftsman}
            />
          )}

          {activeTab === 'leaves' && (
            <LeavesView 
              leaves={leaves}
              craftsmen={craftsmen}
              onAddLeave={handleAddLeave}
              onDeleteLeave={handleDeleteLeave}
              metrics={metrics}
            />
          )}

          {activeTab === 'designs' && (
            <DesignsView 
              designs={designs} 
              onAddDesign={handleAddDesign}
            />
          )}

          {(activeTab === 'allocations' || activeTab === 'floor') && (
            <AllocationsView 
              allocations={allocations} 
              craftsmen={craftsmen} 
              designs={designs} 
              leaves={leaves}
              clientShops={clientShops}
              onAddAllocation={handleAddAllocation}
              onUpdateAllocation={handleUpdateAllocation}
              onDeleteAllocation={handleDeleteAllocation}
              onClearAllAllocations={handleClearAllAllocations}
              onAddClientShop={handleAddClientShop}
              onUpdateClientShop={handleUpdateClientShop}
              onDeleteClientShop={handleDeleteClientShop}
            />
          )}

          {activeTab === 'tracker' && (
            <TimeTrackerView 
              timeLogs={timeLogs} 
              craftsmen={craftsmen} 
              designs={designs} 
              onAddTimeLog={handleAddTimeLog} 
            />
          )}

          {activeTab === 'monthlyReport' && (
            <MonthlyReportView 
              onNavigateTab={(tab) => setActiveTab(tab)} 
            />
          )}

          {/* Discreet Footer with Hidden Developer API Trigger */}
          <footer style={{ 
            marginTop: '45px', 
            padding: '20px 10px 10px 10px', 
            borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '10px',
            fontSize: '11px',
            color: '#475569'
          }}>
            <span>Ashadi Jewellers Workshop Production & Labour Costing System • 63 Benches</span>
            <button
              type="button"
              onClick={() => setShowApiDocsModal(true)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#475569', 
                fontSize: '11px', 
                cursor: 'pointer',
                opacity: 0.6
              }}
              title="Open Enterprise Developer REST API & Postman Specification"
            >
              ⚙️ Developer API & Postman
            </button>
          </footer>
        </main>
      </ErrorBoundary>

      {/* Global Real-Time Shop Floor QR Scan Notification Toast (Visible Across All Tabs) */}
      {globalScanNotification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 999999,
          minWidth: '340px',
          maxWidth: '430px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 17, 40, 0.98) 100%)',
          border: `1.5px solid ${globalScanNotification.actionColor || '#f59e0b'}`,
          borderRadius: '12px',
          boxShadow: `0 14px 40px rgba(0, 0, 0, 0.8), 0 0 30px ${globalScanNotification.actionColor ? `${globalScanNotification.actionColor}40` : 'rgba(245, 158, 11, 0.3)'}`,
          padding: '14px 18px',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          backdropFilter: 'blur(16px)',
          color: '#ffffff',
          overflow: 'hidden'
        }}>
          {/* Top Line: Badge, Timestamp & Dismiss Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: globalScanNotification.actionColor ? `${globalScanNotification.actionColor}20` : 'rgba(245, 158, 11, 0.2)',
                color: globalScanNotification.actionColor || '#fbbf24',
                border: `1px solid ${globalScanNotification.actionColor || '#fbbf24'}`,
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: '900',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span>{globalScanNotification.actionIcon || '📷'}</span>
                <span>QR SCAN DETECTED</span>
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {globalScanNotification.timeStr}
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => setGlobalScanNotification(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                lineHeight: 1
              }}
              title="Close notification"
            >
              ✕
            </button>
          </div>

          {/* Craftsman Name & Bench Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#f8fafc', letterSpacing: '-0.2px' }}>
              {globalScanNotification.craftsmanName}
            </div>
            <div style={{
              background: 'rgba(212, 175, 55, 0.2)',
              color: '#fef08a',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '900'
            }}>
              Bench {globalScanNotification.craftsmanId}
            </div>
          </div>

          {/* Work Order, Design & Action Pill */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '6px',
            padding: '6px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div style={{ fontSize: '11px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#d4af37', fontWeight: 'bold' }}>{globalScanNotification.workOrder}</span>
              {globalScanNotification.designName && <span style={{ color: '#94a3b8' }}> • {globalScanNotification.designName}</span>}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: globalScanNotification.actionColor || '#38bdf8',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>{globalScanNotification.actionIcon || '⚡'}</span>
              <span>{globalScanNotification.actionTitle}</span>
            </div>
          </div>

          {/* Quick Action to view bench on Live Floor Monitor */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('allocations');
              setGlobalScanNotification(null);
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('ashadi:highlight_bench', { 
                  detail: { craftsmanId: globalScanNotification.craftsmanId } 
                }));
              }, 150);
            }}
            style={{
              width: '100%',
              padding: '6px 10px',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '6px',
              color: '#fef08a',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>🔍 View Bench {globalScanNotification.craftsmanId} in Live Floor Monitor</span>
          </button>

          {/* 4.2s Countdown Shrink Bar */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              height: '100%',
              background: globalScanNotification.actionColor || '#f59e0b',
              width: '100%',
              animation: 'shrinkBar 4.2s linear forwards'
            }} />
          </div>
        </div>
      )}

      {/* Admin Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordModal 
          isOpen={showChangePasswordModal} 
          onClose={() => setShowChangePasswordModal(false)} 
        />
      )}

      {/* Global Touchless Shop Floor QR Kiosk Modal */}
      {showFloorKioskModal && (
        <ShopFloorQRScannerModal
          isOpen={showFloorKioskModal}
          onClose={() => setShowFloorKioskModal(false)}
          allocations={allocations}
          onUpdateAllocation={handleUpdateAllocation}
        />
      )}
      {/* Enterprise REST API Integration Specification & Postman Collection Modal */}
      {showApiDocsModal && (
        <ApiDocsModal
          isOpen={showApiDocsModal}
          onClose={() => setShowApiDocsModal(false)}
        />
      )}
    </div>
  );
}
