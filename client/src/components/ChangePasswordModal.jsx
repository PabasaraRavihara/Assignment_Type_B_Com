import React, { useState, useEffect } from 'react';
import { Key, Lock, CheckCircle2, AlertTriangle, X, ShieldCheck } from 'lucide-react';
import api from '../api';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill out all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (res.data && res.data.success) {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update password. Please check your current password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop-luxury" onClick={onClose}>
      <div 
        className="modal-window-luxury" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', background: '#0c1222', border: '1px solid rgba(212, 175, 55, 0.45)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(212, 175, 55, 0.15)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <Key size={18} color="#fef08a" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fef08a', fontSize: '16px', fontWeight: 'bold' }}>
                Change Admin Password
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                Update your secure credentials for the executive portal
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-ghost-secondary"
            style={{ padding: '4px 8px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
          >
            <X size={15} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '14px',
            color: '#fca5a5',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={14} color="#ef4444" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(52, 211, 153, 0.15)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            borderRadius: '6px',
            padding: '10px 12px',
            marginBottom: '14px',
            color: '#34d399',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} color="#34d399" />
            <span>Password updated successfully! Closing...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '5px' }}>
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password..."
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '5px' }}>
              New Password (min 6 characters)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password..."
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '5px' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password..."
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost-secondary"
              style={{ padding: '8px 14px', fontSize: '12px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="btn-gold-primary"
              style={{ padding: '8px 18px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ShieldCheck size={14} />
              <span>{loading ? 'Saving...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
