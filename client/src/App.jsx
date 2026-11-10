import React, { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState(null);
  const [craftsmen, setCraftsmen] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [clientShops, setClientShops] = useState([]);
  const [loading, setLoading] = useState(true);

  // JWT Authentication States
  const [authToken, setAuthToken] = useState(() => {
    try {
      return localStorage.getItem('ashadi_jwt_token') || null;
    } catch (e) {
      return null;
    }
  });

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ashadi_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

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
    } catch (e) {}
    setAuthToken(null);
    setAdminUser(null);
  };

  const handleLoginSuccess = (user, token) => {
    setAuthToken(token);
    setAdminUser(user);
    loadData();
  };

  useEffect(() => {
    const verifyExistingAuth = async () => {
      const token = localStorage.getItem('ashadi_jwt_token');
      if (!token) {
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
    // Optimistic UI update so table updates immediately
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
      console.error('Failed to update allocation', err);
      alert('Notice: Could not update order: ' + formatApiError(err));
      loadData();
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

          {activeTab === 'allocations' && (
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
        </main>
      </ErrorBoundary>

      {/* Admin Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordModal 
          isOpen={showChangePasswordModal} 
          onClose={() => setShowChangePasswordModal(false)} 
        />
      )}
    </div>
  );
}
