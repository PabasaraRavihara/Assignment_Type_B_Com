// Ashadi Jewellers — Daily Bullion & Metal Pricing Engine
// Standard Benchmarks based on Sri Lanka Sea Street & Central Bank Gold Market Rates

export const DEFAULT_GOLD_RATES = {
  currency: 'LKR',
  date: new Date().toISOString().split('T')[0],
  updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  isAutoMarketFeed: true,
  rates: {
    'Gold 24K': {
      purity: '99.9% (Pure Gold)',
      perSovereign: 242000,
      perGram: 30250,
      hallmark: '999',
      color: '#fef08a'
    },
    'Gold 22K': {
      purity: '91.6% (Standard Sovereign)',
      perSovereign: 224500,
      perGram: 28062.50,
      hallmark: '916',
      color: '#fbbf24',
      isFactoryStandard: true
    },
    'Gold 18K': {
      purity: '75.0% (Diamond & Gemstone Setting)',
      perSovereign: 183680,
      perGram: 22960,
      hallmark: '750',
      color: '#f59e0b'
    },
    'Gold 14K': {
      purity: '58.5% (Lightweight Export)',
      perSovereign: 142880,
      perGram: 17860,
      hallmark: '585',
      color: '#d97706'
    },
    'Platinum 950': {
      purity: '95.0% Pure Platinum',
      perSovereign: null,
      perGram: 14200,
      hallmark: 'Pt950',
      color: '#e2e8f0'
    },
    'Silver 925': {
      purity: '92.5% Sterling Silver',
      perSovereign: null,
      perGram: 420,
      hallmark: '925',
      color: '#94a3b8'
    }
  }
};

const STORAGE_KEY = 'ashadi_daily_gold_rates';

export function getDailyGoldRates() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.rates) {
        // If rates are from a previous date, update date flag
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading gold rates from localStorage:', e);
  }
  return DEFAULT_GOLD_RATES;
}

export function saveDailyGoldRates(ratesData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratesData));
  } catch (e) {
    console.error('Error saving gold rates to localStorage:', e);
  }
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
