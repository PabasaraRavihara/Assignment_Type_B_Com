import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Code2, Download, Copy, Check, ExternalLink, Zap, ShieldCheck, Layers, Terminal } from 'lucide-react';

export default function ApiDocsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('endpoints'); // 'overview' | 'endpoints' | 'auth'
  const [copiedSnippet, setCopiedSnippet] = useState(null);

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

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const baseUrl = 'https://assignmenttypebcom-eight.vercel.app/api';

  const modalContent = (
    <div className="modal-backdrop-luxury" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-window-luxury" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1000px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(90deg, rgba(20, 28, 48, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', padding: '5px 8px', borderRadius: '8px' }}>
                <Code2 size={20} color="#38bdf8" />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
                Enterprise REST API & Integration Specification
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Connect Company ERP, Showroom POS, Inventory, and Accounting systems directly with the 63-Bench Workshop Floor
            </p>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="btn-ghost-secondary"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Download & Base URL Bar */}
        <div style={{ padding: '12px 24px', background: 'rgba(10, 15, 29, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Production API Base URL:</span>
            <code style={{ background: '#0a1020', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', color: '#38bdf8', fontFamily: 'monospace' }}>
              {baseUrl}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(baseUrl, 'baseurl')}
              style={{ background: 'transparent', border: 'none', color: copiedSnippet === 'baseurl' ? '#34d399' : '#94a3b8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}
            >
              {copiedSnippet === 'baseurl' ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedSnippet === 'baseurl' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <a 
            href="/Ashadi_Workshop_REST_API.postman_collection.json" 
            download="Ashadi_Workshop_REST_API.postman_collection.json"
            className="btn-gold-primary"
            style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            <span>Download Postman Collection (.json)</span>
          </a>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '10px 24px 0 24px', background: 'rgba(15, 23, 42, 0.4)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {[
            { id: 'endpoints', label: '📡 Core Endpoints & Payloads', desc: 'Dispatch & status' },
            { id: 'overview', label: '🔄 Factory Integration Flow', desc: 'ERP to bench' },
            { id: 'auth', label: '🔒 Security & Headers', desc: 'Tokens & SSL' }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderBottom: activeTab === t.id ? '2px solid #d4af37' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === t.id ? '#fef08a' : '#94a3b8',
                fontWeight: activeTab === t.id ? 'bold' : 'normal',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TAB 1: CORE ENDPOINTS */}
          {activeTab === 'endpoints' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Endpoint 1: Dispatch Order */}
              <div style={{ background: 'rgba(10, 15, 29, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#15803d', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>POST</span>
                    <code style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>/allocations</code>
                  </div>
                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Dispatches incoming order to bench craftsman</span>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px 0' }}>
                  Used when Pushpa Jewellers or Showroom places an order. Allocates to Maduranga (Bench C055) with 2H SMT and 2.19g gold.
                </p>

                <div style={{ position: 'relative' }}>
                  <pre style={{ background: '#070b14', padding: '12px', borderRadius: '6px', fontSize: '11.5px', color: '#cbd5e1', overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.05)', margin: 0 }}>
{`// Example Request Body (JSON)
{
  "date": "2026-11-13",
  "workOrder": "2026110956",
  "channel": "EXTERNAL_SHOP",
  "channelName": "Pushpa Jewellers",
  "craftsmanId": "C055",
  "designCode": "PND-22K-01",
  "metalType": "Gold 22K",
  "qtyAllocated": 1,
  "assumedHours": 2.0,
  "goldIssuedGrams": 2.19,
  "dispatchTime": "08:00 AM"
}`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`{\n  "date": "2026-11-13",\n  "workOrder": "2026110956",\n  "channel": "EXTERNAL_SHOP",\n  "channelName": "Pushpa Jewellers",\n  "craftsmanId": "C055",\n  "designCode": "PND-22K-01",\n  "metalType": "Gold 22K",\n  "qtyAllocated": 1,\n  "assumedHours": 2.0,\n  "goldIssuedGrams": 2.19,\n  "dispatchTime": "08:00 AM"\n}`, 'ep1')}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '4px', color: copiedSnippet === 'ep1' ? '#34d399' : '#94a3b8', padding: '4px 8px', fontSize: '10.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedSnippet === 'ep1' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedSnippet === 'ep1' ? 'Copied' : 'Copy Payload'}</span>
                  </button>
                </div>
              </div>

              {/* Endpoint 2: Vault Return & Scrap Loss Reconciliation */}
              <div style={{ background: 'rgba(10, 15, 29, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#b45309', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>PUT</span>
                    <code style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>/allocations/:workOrder</code>
                  </div>
                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Updates actual hours & gold return (Vault Checkin)</span>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px 0' }}>
                  When craftsman brings finished piece to the scale, update actual hours and metal returned. Scrap loss % is calculated automatically!
                </p>

                <div style={{ position: 'relative' }}>
                  <pre style={{ background: '#070b14', padding: '12px', borderRadius: '6px', fontSize: '11.5px', color: '#cbd5e1', overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.05)', margin: 0 }}>
{`// Request Body to: PUT /api/allocations/2026110956
{
  "status": "Completed",
  "actualHours": 2.1,
  "goldIssuedGrams": 2.19,
  "goldReturnedGrams": 2.12
}

// Server Response automatically computes:
// goldLossPct: 3.20% (Within 3.5% allowable ceiling ✅)`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`{\n  "status": "Completed",\n  "actualHours": 2.1,\n  "goldIssuedGrams": 2.19,\n  "goldReturnedGrams": 2.12\n}`, 'ep2')}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '4px', color: copiedSnippet === 'ep2' ? '#34d399' : '#94a3b8', padding: '4px 8px', fontSize: '10.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedSnippet === 'ep2' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedSnippet === 'ep2' ? 'Copied' : 'Copy Payload'}</span>
                  </button>
                </div>
              </div>

              {/* Endpoint 3: Query Floor Status */}
              <div style={{ background: 'rgba(10, 15, 29, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#1d4ed8', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>GET</span>
                    <code style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>/allocations?date=YYYY-MM-DD</code>
                  </div>
                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Queries live status of all 63 workshop benches</span>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Supports query filters: <code>?date=2026-11-13</code>, <code>?status=In Progress</code>, <code>?craftsmanId=C055</code>, <code>?workOrder=2026110956</code>.
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: OVERVIEW & FLOW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '14px' }}>
                <strong style={{ color: '#38bdf8' }}>💡 What this integration achieves:</strong>
                <p style={{ margin: '6px 0 0 0' }}>
                  Eliminates double data entry! When your showroom or sales manager takes an order for Pushpa Jewellers, it is dispatched to the craftsman bench floor via API. When the craftsman finishes and scans their card at the Floor Kiosk, your company ERP receives the final labour cost and metal reconciliation automatically.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '14px' }}>
                  <h4 style={{ color: '#fef08a', margin: '0 0 6px 0', fontSize: '13px' }}>📥 Inbound: Company ERP ➔ Workshop</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#94a3b8' }}>
                    <li>Sales Orders (e.g. Order #2026110956)</li>
                    <li>Design codes & target pieces</li>
                    <li>Gold alloy issued grams</li>
                    <li>Target customer delivery dates</li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '14px' }}>
                  <h4 style={{ color: '#34d399', margin: '0 0 6px 0', fontSize: '13px' }}>📤 Outbound: Workshop ➔ Company ERP</h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#94a3b8' }}>
                    <li>Job completion timestamps</li>
                    <li>Direct Labour Cost (SMT × Minute Rate)</li>
                    <li>Exact scrap loss % (e.g. 3.20%)</li>
                    <li>Readiness for customer dispatch</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUTHENTICATION */}
          {activeTab === 'auth' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
              <div style={{ background: 'rgba(10, 15, 29, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ShieldCheck size={18} color="#34d399" />
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>Security & Transport Encryption</h3>
                </div>
                <p style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '12px' }}>
                  All API traffic is strictly served over <strong>HTTPS (TLS 1.3 / SSL)</strong> powered by Vercel serverless infrastructure.
                </p>

                <h4 style={{ color: '#fef08a', margin: '14px 0 6px 0', fontSize: '12.5px' }}>Standard Request Headers</h4>
                <pre style={{ background: '#070b14', padding: '10px', borderRadius: '6px', fontSize: '11.5px', color: '#cbd5e1', margin: 0 }}>
{`Content-Type: application/json
Accept: application/json
Authorization: Bearer <API_SECRET_KEY>`}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: '#070b14', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Specification Version 2.0 • Ashadi Jewellers Labour Costing System
          </span>
          <button type="button" className="btn-ghost-secondary" onClick={onClose} style={{ padding: '5px 16px', fontSize: '12px' }}>
            Close
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}