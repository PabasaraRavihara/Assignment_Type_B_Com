// Ashadi Jewellers — Daily Bullion & Metal Pricing Engine
// Real-Time XAU/USD + USD/LKR Live Sync Calibrated to Colombo Sea Street Bullion Market

export const DEFAULT_GOLD_RATES = {
  currency: 'LKR',
  date: new Date().toLocaleDateString('en-CA'),
  updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  isAutoMarketFeed: true,
  manualOverrideDate: null,
  spotUsd: 2950,
  usdToLkr: 299.00,
  rates: {
    'Gold 24K': {
      purity: '99.9% (Pure Bullion Benchmark)',
      perSovereign: 346000,
      perGram: 43250,
      hallmark: '999',
      color: '#fef08a'
    },
    'Gold 22K': {
      purity: '91.6% (Standard Sovereign)',
      perSovereign: 317167,
      perGram: 39645.88,
      hallmark: '916',
      color: '#fbbf24',
      isFactoryStandard: true
    },
    'Gold 18K': {
      purity: '75.0% (Diamond & Gemstone Setting)',
      perSovereign: 259500,
      perGram: 32437.50,
      hallmark: '750',
      color: '#f59e0b'
    },
    'Gold 14K': {
      purity: '58.5% (Lightweight Export)',
      perSovereign: 201833,
      perGram: 25229.13,
      hallmark: '585',
      color: '#d97706'
    },
    'Platinum 950': {
      purity: '95.0% Pure Platinum',
      perSovereign: null,
      perGram: 18500,
      hallmark: 'Pt950',
      color: '#e2e8f0'
    },
    'Silver 925': {
      purity: '92.5% Sterling Silver',
      perSovereign: null,
      perGram: 520,
      hallmark: '925',
      color: '#94a3b8'
    }
  }
};

// Updated key to automatically flush old 345,000 browser cache
const STORAGE_KEY = 'ashadi_daily_gold_rates_v2';
const TROY_OZ_TO_GRAMS = 31.1034768;
// Colombo Sea Street physical bullion duty, tax & dealer spread factor over international spot
const COLOMBO_BULLION_MULTIPLIER = 1.485;

export function getDailyGoldRates() {
  const todayStr = new Date().toLocaleDateString('en-CA');
  try {
    // Remove legacy cache key if present
    localStorage.removeItem('ashadi_daily_gold_rates');

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const current24K = parsed?.rates?.['Gold 24K']?.perSovereign;

      // Preserve user's manual custom rate for TODAY only
      if (!parsed.isAutoMarketFeed && parsed.manualOverrideDate === todayStr && current24K > 0) {
        return parsed;
      }

      // Reset manual override once the date changes
      if (!parsed.isAutoMarketFeed && parsed.manualOverrideDate !== todayStr) {
        const resetRates = JSON.parse(JSON.stringify(DEFAULT_GOLD_RATES));
        resetRates.date = todayStr;
        resetRates.updatedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        saveDailyGoldRates(resetRates);
        return resetRates;
      }

      if (current24K && current24K >= 200000 && current24K <= 800000) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading gold rates from localStorage:', e);
  }

  const freshDefault = JSON.parse(JSON.stringify(DEFAULT_GOLD_RATES));
  freshDefault.date = todayStr;
  saveDailyGoldRates(freshDefault);
  return freshDefault;
}

export function saveDailyGoldRates(ratesData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratesData));
  } catch (e) {
    console.error('Error saving gold rates to localStorage:', e);
  }
}

// Fetch live XAU/USD from multiple CORS-friendly public feeds
async function fetchLiveSpotXauUsd() {
  // Primary: GoldPrice.org live ticker feed (CORS-enabled)
  try {
    const res = await fetch('https://data-asg.goldprice.org/dbXRates/USD', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const xauPrice = data?.items?.[0]?.xauPrice;
      if (xauPrice && !isNaN(xauPrice)) return parseFloat(xauPrice);
    }
  } catch (e) {}

  // Secondary fallback: gold-api.com
  try {
    const res = await fetch('https://api.gold-api.com/price/XAU', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data?.price && !isNaN(data.price)) return parseFloat(data.price);
    }
  } catch (e) {}

  return null;
}

// Fetch live USD/LKR exchange rate
async function fetchLiveUsdToLkr() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.LKR && !isNaN(data.rates.LKR)) {
        return parseFloat(data.rates.LKR);
      }
    }
  } catch (e) {}
  return null;
}

// Automated Real-Time Gold Rate Fetcher
export async function fetchLiveGoldRates(forceLive = false) {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const currentCached = getDailyGoldRates();

    // Respect today's manual custom rate unless user explicitly clicks "Refresh Live Feed"
    if (!forceLive && !currentCached.isAutoMarketFeed && currentCached.manualOverrideDate === todayStr) {
      return currentCached;
    }

    const [liveSpotUsd, liveLkrRate] = await Promise.all([
      fetchLiveSpotXauUsd(),
      fetchLiveUsdToLkr()
    ]);

    const spotUsd = liveSpotUsd || currentCached.spotUsd || 2950;
    const lkrRate = liveLkrRate || currentCached.usdToLkr || 299.00;

    // Live calculation: (Spot USD / 31.1034768g) * 8g * USD_to_LKR * Colombo Sea Street Factor
    const rawSovereignLkr = (spotUsd / TROY_OZ_TO_GRAMS) * 8 * lkrRate * COLOMBO_BULLION_MULTIPLIER;
    // Round to nearest Rs. 500 per Colombo bullion market standard
    const sov24K = Math.round(rawSovereignLkr / 500) * 500;
    const gram24K = parseFloat((sov24K / 8).toFixed(2));

    // 22K (91.66% Standard Sovereign)
    const sov22K = Math.round(sov24K * (22 / 24));
    const gram22K = parseFloat((sov22K / 8).toFixed(2));

    // 18K (75% Sovereign)
    const sov18K = Math.round(sov24K * (18 / 24));
    const gram18K = parseFloat((sov18K / 8).toFixed(2));

    // 14K (58.33% Sovereign)
    const sov14K = Math.round(sov24K * (14 / 24));
    const gram14K = parseFloat((sov14K / 8).toFixed(2));

    const now = new Date();

    const updatedRates = {
      currency: 'LKR',
      date: todayStr,
      updatedAt: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isAutoMarketFeed: true,
      manualOverrideDate: null,
      spotUsd: Math.round(spotUsd),
      usdToLkr: parseFloat(lkrRate.toFixed(2)),
      rates: {
        'Gold 24K': {
          purity: '99.9% (Pure Bullion Benchmark)',
          perSovereign: sov24K,
          perGram: gram24K,
          hallmark: '999',
          color: '#fef08a'
        },
        'Gold 22K': {
          purity: '91.6% (Standard Sovereign)',
          perSovereign: sov22K,
          perGram: gram22K,
          hallmark: '916',
          color: '#fbbf24',
          isFactoryStandard: true
        },
        'Gold 18K': {
          purity: '75.0% (Diamond & Gem Setting)',
          perSovereign: sov18K,
          perGram: gram18K,
          hallmark: '750',
          color: '#f59e0b'
        },
        'Gold 14K': {
          purity: '58.5% (Lightweight Export)',
          perSovereign: sov14K,
          perGram: gram14K,
          hallmark: '585',
          color: '#d97706'
        },
        'Platinum 950': {
          purity: '95.0% Pure Platinum',
          perSovereign: null,
          perGram: 18500,
          hallmark: 'Pt950',
          color: '#e2e8f0'
        },
        'Silver 925': {
          purity: '92.5% Sterling Silver',
          perSovereign: null,
          perGram: 520,
          hallmark: '925',
          color: '#94a3b8'
        }
      }
    };

    saveDailyGoldRates(updatedRates);
    return updatedRates;
  } catch (err) {
    console.warn('Auto-fetch live gold rates failed, using cached fallback:', err.message);
  }
  return getDailyGoldRates();
}

export function calculateGoldValue(grams, metalPurity = 'Gold 22K', currentRates = null) {
  const data = currentRates || getDailyGoldRates();
  const metalKey = Object.keys(data.rates).find(k => k.toLowerCase() === metalPurity.toLowerCase()) || 'Gold 22K';
  const rateInfo = data.rates[metalKey] || data.rates['Gold 22K'];
  const totalValue = (parseFloat(grams) || 0) * (rateInfo.perGram || 0);
  return {
    grams: parseFloat(grams) || 0,
    metal: metalKey,
    perGramRate: rateInfo.perGram,
    perSovereignRate: rateInfo.perSovereign,
    totalValueRs: Math.round(totalValue)
  };
}

export function formatLKR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rs. 0';
  return `Rs. ${Number(amount).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
}
