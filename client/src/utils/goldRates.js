// Ashadi Jewellers — Daily Bullion & Metal Pricing Engine
// Calibrated to Sri Lanka Colombo Sea Street Market Standard (24K Sovereign = Rs. 345,000)

export const DEFAULT_GOLD_RATES = {
  currency: 'LKR',
  date: new Date().toISOString().split('T')[0],
  updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  isAutoMarketFeed: true,
  spotUsd: 2948,
  usdToLkr: 298.50,
  rates: {
    'Gold 24K': {
      purity: '99.9% (Pure Bullion Benchmark)',
      perSovereign: 345000,
      perGram: 43125,
      hallmark: '999',
      color: '#fef08a'
    },
    'Gold 22K': {
      purity: '91.6% (Standard Sovereign)',
      perSovereign: 316250,
      perGram: 39531.25,
      hallmark: '916',
      color: '#fbbf24',
      isFactoryStandard: true
    },
    'Gold 18K': {
      purity: '75.0% (Diamond & Gemstone Setting)',
      perSovereign: 258750,
      perGram: 32343.75,
      hallmark: '750',
      color: '#f59e0b'
    },
    'Gold 14K': {
      purity: '58.5% (Lightweight Export)',
      perSovereign: 201250,
      perGram: 25156.25,
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

const STORAGE_KEY = 'ashadi_daily_gold_rates';

export function getDailyGoldRates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate from older lower test rates to the active Rs. 345,000 standard
      if (parsed && parsed.rates && parsed.rates['Gold 24K']?.perSovereign >= 340000) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading gold rates from localStorage:', e);
  }
  // Save active 345,000 benchmark to localStorage
  saveDailyGoldRates(DEFAULT_GOLD_RATES);
  return DEFAULT_GOLD_RATES;
}

export function saveDailyGoldRates(ratesData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratesData));
  } catch (e) {
    console.error('Error saving gold rates to localStorage:', e);
  }
}

// Automated Zero-Touch Real-Time Gold Rate Fetcher
// Calibrated to Colombo Sea Street physical bullion benchmark (24K = 345,000 LKR)
export async function fetchLiveGoldRates() {
  try {
    const goldPromise = fetch('https://api.gold-api.com/price/XAU')
      .then(res => res.ok ? res.json() : null)
      .catch(() => null);

    const fxPromise = fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.ok ? res.json() : null)
      .catch(() => null);

    const [goldData, fxData] = await Promise.all([goldPromise, fxPromise]);

    if (goldData && goldData.price && fxData && fxData.rates && fxData.rates.LKR) {
      const spotUsd = parseFloat(goldData.price);
      const lkrRate = parseFloat(fxData.rates.LKR);

      // Sea Street Colombo Physical Gold standard baseline:
      // When live spot fluctuates, the 345,000 24K benchmark adjusts with live spot movement
      const baseSpotUsd = 2948; // reference spot
      const spotRatio = spotUsd / baseSpotUsd;

      // Base 24K Sovereign is Rs. 345,000
      const sov24K = Math.round(345000 * (spotRatio > 0.8 && spotRatio < 1.3 ? spotRatio : 1));
      const gram24K = parseFloat((sov24K / 8).toFixed(2));

      // 22K (91.66% Sovereign) = 22/24 * 24K
      const sov22K = Math.round(sov24K * (22 / 24));
      const gram22K = parseFloat((sov22K / 8).toFixed(2));

      // 18K (75% Sovereign) = 18/24 * 24K
      const sov18K = Math.round(sov24K * (18 / 24));
      const gram18K = parseFloat((sov18K / 8).toFixed(2));

      // 14K (58.33% Sovereign) = 14/24 * 24K
      const sov14K = Math.round(sov24K * (14 / 24));
      const gram14K = parseFloat((sov14K / 8).toFixed(2));

      const now = new Date();
      const updatedRates = {
        currency: 'LKR',
        date: now.toISOString().split('T')[0],
        updatedAt: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isAutoMarketFeed: true,
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
    }
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
