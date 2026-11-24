import React, { useState } from 'react';
import { X, RefreshCw, Check, Sparkles, TrendingUp, Calculator, ShieldCheck, DollarSign, Clock, Globe } from 'lucide-react';
import { getDailyGoldRates, saveDailyGoldRates, fetchLiveGoldRates, DEFAULT_GOLD_RATES, formatLKR } from '../utils/goldRates';

export default function GoldRateModal({ isOpen, onClose, onRatesChange }) {
  const [ratesData, setRatesData] = useState(() => getDailyGoldRates());
  const [isEditing, setIsEditing] = useState(false);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [calcGrams, setCalcGrams] = useState('8.0');
  const [calcPurity, setCalcPurity] = useState('Gold 22K');

  // Edit form state for 22K & 24K Sovereign rates (Calibrated to 24K = 345,000)
  const [edit24KSovereign, setEdit24KSovereign] = useState(() => ratesData.rates['Gold 24K']?.perSovereign || 345000);
  const [edit22KSovereign, setEdit22KSovereign] = useState(() => ratesData.rates['Gold 22K']?.perSovereign || 316250);
  const [edit18KGram, setEdit18KGram] = useState(() => ratesData.rates['Gold 18K']?.perGram || 32343.75);

  if (!isOpen) return null;

  // Real-Time 1-Click Live Auto-Sync
  const handleRefreshLive = async () => {
    setFetchingLive(true);
    try {
      const fresh = await fetchLiveGoldRates();
      if (fresh) {
        setRatesData(fresh);
        setEdit22KSovereign(fresh.rates['Gold 22K']?.perSovereign || 316250);
        setEdit24KSovereign(fresh.rates['Gold 24K']?.perSovereign || 345000);
        setEdit18KGram(fresh.rates['Gold 18K']?.perGram || 32343.75);
        setIsEditing(false);
        if (onRatesChange) onRatesChange(fresh);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingLive(false);
    }
  };

  const handleSaveCustomRates = (e) => {
    e.preventDefault();
    const updated = JSON.parse(JSON.stringify(ratesData));
    
    // Update 24K
    const s24k = parseFloat(edit24KSovereign) || 345000;
    updated.rates['Gold 24K'].perSovereign = s24k;
    updated.rates['Gold 24K'].perGram = parseFloat((s24k / 8).toFixed(2));

    // Update 22K
    const s22k = parseFloat(edit22KSovereign) || Math.round(s24k * (22 / 24));
    updated.rates['Gold 22K'].perSovereign = s22k;
    updated.rates['Gold 22K'].perGram = parseFloat((s22k / 8).toFixed(2));

    // Update 18K
    const g18k = parseFloat(edit18KGram) || parseFloat((s24k * (18 / 24) / 8).toFixed(2));
    updated.rates['Gold 18K'].perGram = g18k;
    updated.rates['Gold 18K'].perSovereign = Math.round(g18k * 8);

    // Update 14K
    const g14k = parseFloat((s24k * (14 / 24) / 8).toFixed(2));
    if (updated.rates['Gold 14K']) {
      updated.rates['Gold 14K'].perGram = g14k;
      updated.rates['Gold 14K'].perSovereign = Math.round(g14k * 8);
    }

    updated.updatedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    updated.date = new Date().toISOString().split('T')[0];
    updated.isAutoMarketFeed = false;

    saveDailyGoldRates(updated);
    setRatesData(updated);
    setIsEditing(false);
    if (onRatesChange) onRatesChange(updated);
  };

  const handleResetToMarket = () => {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_GOLD_RATES));
    fresh.updatedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    fresh.date = new Date().toISOString().split('T')[0];
    saveDailyGoldRates(fresh);
    setRatesData(fresh);
    setEdit22KSovereign(fresh.rates['Gold 22K'].perSovereign);
    setEdit24KSovereign(fresh.rates['Gold 24K'].perSovereign);
    setEdit18KGram(fresh.rates['Gold 18K'].perGram);
    setIsEditing(false);
    if (onRatesChange) onRatesChange(fresh);
  };

  // Calculator calculation
  const selectedRateObj = ratesData.rates[calcPurity] || ratesData.rates['Gold 22K'];
  const calcTotalRs = Math.round((parseFloat(calcGrams) || 0) * (selectedRateObj?.perGram || 0));

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 18, 0.85)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: 100002,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'linear-gradient(180deg, #101726 0%, #0a0f1d 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.45)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 32px rgba(212, 175, 55, 0.2)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          color: '#f8fafc',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '18px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.4)', color: '#fef08a', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              <Sparkles size={13} color="#fef08a" />
              <span>Ashadi Daily Bullion & Metal Pricing Card</span>
            </div>
            <h2 style={{ fontSize: '22px', fontFamily: "'Cinzel', Georgia, serif", color: '#fef08a', margin: '2px 0 6px 0', textShadow: '0 2px 10px rgba(212, 175, 55, 0.3)' }}>
              Today's Gold Market Rates ({ratesData.date})
            </h2>
            <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={12} color="#38bdf8" />
                Updated at {ratesData.updatedAt}
              </span>
              <span>•</span>
              <span style={{ color: ratesData.isAutoMarketFeed ? '#34d399' : '#fbbf24', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ratesData.isAutoMarketFeed ? '#10b981' : '#f59e0b', boxShadow: `0 0 6px ${ratesData.isAutoMarketFeed ? '#10b981' : '#f59e0b'}`, display: 'inline-block' }} />
                {ratesData.isAutoMarketFeed ? 'Real-Time Auto Feed (Zero Manual Entry)' : 'Manual Custom Rate Active'}
              </span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Auto Feed Status Strip */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(15, 23, 42, 0.8) 100%)', 
          border: '1px solid rgba(16, 185, 129, 0.35)', 
          borderRadius: '12px', 
          padding: '12px 16px', 
          marginBottom: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={18} color="#34d399" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#6ee7b7' }}>
                Automated Live Market Sync Active
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                Global Spot: <strong style={{ color: '#fff' }}>${ratesData.spotUsd || 2948}/oz</strong> • Central Forex: <strong style={{ color: '#fff' }}>Rs. {ratesData.usdToLkr || 298.50}/USD</strong> (Colombo Sea Street +7% Bullion Standard)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefreshLive}
            disabled={fetchingLive}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.2) 100%)',
              border: '1px solid #10b981',
              color: '#6ee7b7',
              fontSize: '11px',
              fontWeight: '700',
              cursor: fetchingLive ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={12} className={fetchingLive ? 'spin-icon' : ''} style={{ animation: fetchingLive ? 'spin 1s linear infinite' : 'none' }} />
            <span>{fetchingLive ? 'Syncing Live...' : 'Refresh Live Feed'}</span>
          </button>
        </div>

        {/* Spotlight Cards: 24K Pure Bullion & 22K Standard Sovereign */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {/* Card 1: 24K Pure Gold */}
          <div style={{ 
            background: 'radial-gradient(ellipse at 50% 0%, rgba(254, 240, 138, 0.22) 0%, rgba(15, 23, 42, 0.95) 75%)', 
            border: '1.5px solid #fef08a', 
            borderRadius: '16px', 
            padding: '18px 20px', 
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(254, 240, 138, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef08a 0%, #eab308 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#000', fontSize: '13px', boxShadow: '0 0 10px rgba(234, 179, 8, 0.5)' }}>
                  24K
                </div>
                <div>
                  <strong style={{ fontSize: '15px', color: '#fef08a' }}>24K Pure Gold (999.9)</strong>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Sea Street Bullion Standard</div>
                </div>
              </div>
              <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.2)', border: '1px solid #fef08a', color: '#fef08a', fontSize: '10px', fontWeight: '800' }}>
                Market Ref
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              <div style={{ background: 'rgba(10, 15, 29, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>1 SOVEREIGN (8G)</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#fef08a', margin: '2px 0' }}>
                  {formatLKR(ratesData.rates['Gold 24K']?.perSovereign || 345000)}
                </div>
                <div style={{ fontSize: '10px', color: '#6ee7b7' }}>8.000g Bullion Bar</div>
              </div>
              <div style={{ background: 'rgba(10, 15, 29, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>PER 1 GRAM</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#38bdf8', margin: '2px 0' }}>
                  {formatLKR(ratesData.rates['Gold 24K']?.perGram || 43125)}
                </div>
                <div style={{ fontSize: '10px', color: '#cbd5e1' }}>Direct Spot Gram</div>
              </div>
            </div>
          </div>

          {/* Card 2: 22K Sovereign (Ashadi Factory Standard) */}
          <div style={{ 
            background: 'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.2) 0%, rgba(15, 23, 42, 0.95) 75%)', 
            border: '1.5px solid rgba(212, 175, 55, 0.5)', 
            borderRadius: '16px', 
            padding: '18px 20px', 
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(212, 175, 55, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#000', fontSize: '13px', boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)' }}>
                  22K
                </div>
                <div>
                  <strong style={{ fontSize: '15px', color: '#fbbf24' }}>22K Sovereign (916)</strong>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Ashadi Factory Bench Standard</div>
                </div>
              </div>
              <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', fontSize: '10px', fontWeight: '800' }}>
                Factory Standard
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              <div style={{ background: 'rgba(10, 15, 29, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>1 SOVEREIGN (8G)</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#fbbf24', margin: '2px 0' }}>
                  {formatLKR(ratesData.rates['Gold 22K']?.perSovereign || 316250)}
                </div>
                <div style={{ fontSize: '10px', color: '#6ee7b7' }}>Standard 22K Pawn Unit</div>
              </div>
              <div style={{ background: 'rgba(10, 15, 29, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>PER 1 GRAM</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#38bdf8', margin: '2px 0' }}>
                  {formatLKR(ratesData.rates['Gold 22K']?.perGram || 39531.25)}
                </div>
                <div style={{ fontSize: '10px', color: '#cbd5e1' }}>Direct Bench Unit</div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Purity Rates Table */}
        <div style={{ background: 'rgba(10, 15, 29, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#fef08a', letterSpacing: '0.06em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={14} color="#f59e0b" />
            <span>Complete Precious Metals Rate Matrix (Colombo Bullion Market)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {Object.entries(ratesData.rates).map(([key, val]) => (
              <div 
                key={key} 
                style={{ 
                  background: 'rgba(15, 23, 42, 0.7)', 
                  border: key === 'Gold 22K' ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '10px', 
                  padding: '12px 14px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: val.color || '#fff' }}>{key}</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.08)', padding: '1px 6px', borderRadius: '4px' }}>{val.hallmark}</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: '2px 0' }}>
                  {formatLKR(val.perGram)} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>/g</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {val.perSovereign ? `${formatLKR(val.perSovereign)} / Sov (8g)` : val.purity}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Gold Weight Cost Calculator */}
        <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calculator size={14} color="#38bdf8" />
            <span>Quick Gold Value Calculator</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '140px' }}>
              <label style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Weight in Grams:</label>
              <input 
                type="number"
                step="0.001"
                value={calcGrams}
                onChange={(e) => setCalcGrams(e.target.value)}
                style={{ width: '100%', background: 'rgba(10, 15, 29, 0.9)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}
              />
            </div>

            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Metal Purity:</label>
              <select 
                value={calcPurity}
                onChange={(e) => setCalcPurity(e.target.value)}
                style={{ width: '100%', background: 'rgba(10, 15, 29, 0.9)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}
              >
                {Object.keys(ratesData.rates).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1.4', minWidth: '180px', background: 'rgba(10, 15, 29, 0.9)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', padding: '8px 14px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Metal Value:</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#34d399' }}>
                {formatLKR(calcTotalRs)}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Rate Edit Form (Collapsible) */}
        {isEditing ? (
          <form onSubmit={handleSaveCustomRates} style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1.5px solid rgba(245, 158, 11, 0.4)', borderRadius: '14px', padding: '20px', marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#fef08a', marginBottom: '14px' }}>
              ✏️ Override Today's Sea Street Rates for Your Factory:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>22K Sovereign (8g) Rate (LKR):</label>
                <input 
                  type="number"
                  value={edit22KSovereign}
                  onChange={(e) => setEdit22KSovereign(e.target.value)}
                  style={{ width: '100%', background: 'rgba(10, 15, 29, 0.9)', border: '1px solid rgba(212, 175, 55, 0.4)', color: '#fef08a', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}
                />
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>Auto per gram: {formatLKR((parseFloat(edit22KSovereign) || 0) / 8)}</span>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>24K Sovereign (8g) Rate (LKR):</label>
                <input 
                  type="number"
                  value={edit24KSovereign}
                  onChange={(e) => setEdit24KSovereign(e.target.value)}
                  style={{ width: '100%', background: 'rgba(10, 15, 29, 0.9)', border: '1px solid rgba(212, 175, 55, 0.4)', color: '#fef08a', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}
                />
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>Auto per gram: {formatLKR((parseFloat(edit24KSovereign) || 0) / 8)}</span>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>18K Rate Per Gram (LKR):</label>
                <input 
                  type="number"
                  value={edit18KGram}
                  onChange={(e) => setEdit18KGram(e.target.value)}
                  style={{ width: '100%', background: 'rgba(10, 15, 29, 0.9)', border: '1px solid rgba(212, 175, 55, 0.4)', color: '#fef08a', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#cbd5e1', cursor: 'pointer', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                style={{ padding: '8px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: '1px solid #d4af37', color: '#000', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}
              >
                Save & Apply Today's Rate
              </button>
            </div>
          </form>
        ) : null}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              type="button"
              onClick={handleRefreshLive}
              disabled={fetchingLive}
              style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', fontSize: '11px', fontWeight: '700', cursor: fetchingLive ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <RefreshCw size={12} style={{ animation: fetchingLive ? 'spin 1s linear infinite' : 'none' }} />
              <span>{fetchingLive ? 'Fetching Live Rate...' : 'Auto-Sync Live Rate'}</span>
            </button>
            {!isEditing && (
              <button 
                type="button"
                onClick={() => setIsEditing(true)}
                style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.35)', color: '#fef08a', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <span>✏️ Set Custom Today's Rate</span>
              </button>
            )}
            <button 
              type="button"
              onClick={handleResetToMarket}
              style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <span>Reset to Standard</span>
            </button>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{ padding: '8px 22px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(180, 130, 20, 0.15) 100%)', border: '1px solid #d4af37', color: '#fef08a', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
