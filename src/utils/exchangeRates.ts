import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExchangeRates {
  USD: number; // 1 TRY kac USD
  EUR: number;
  GBP: number;
  TRY: number;
  GAU: number; // Gram Altin (TL)
  [key: string]: number;
}

const CACHE_KEY = 'exchange_rates_cache_v2';
const TIMESTAMP_KEY = 'exchange_rates_timestamp_v2';
const ONE_HOUR_MS = 60 * 60 * 1000;

// Varsayilan Guvenli Yedek Kurlar (Internet yoksa)
const FALLBACK_RATES: ExchangeRates = {
  TRY: 1,
  USD: 0.021, // ~47.7 TL
  EUR: 0.018, // ~55.0 TL
  GBP: 0.015,
  GAU: 6540,  // Gram Altin ~6.540 TL
};

/**
 * Saatte 1 güncellenen canlı döviz ve gram altın kurlarını getirir (Truncgil + OpenER API)
 */
export async function getLiveExchangeRates(): Promise<{ rates: ExchangeRates; lastUpdated: string; isLive: boolean }> {
  try {
    const cachedRatesStr = await AsyncStorage.getItem(CACHE_KEY);
    const cachedTimestampStr = await AsyncStorage.getItem(TIMESTAMP_KEY);

    const now = Date.now();
    const lastTimestamp = cachedTimestampStr ? parseInt(cachedTimestampStr, 10) : 0;
    const isCacheValid = now - lastTimestamp < ONE_HOUR_MS;

    if (isCacheValid && cachedRatesStr) {
      const parsedRates = JSON.parse(cachedRatesStr);
      return {
        rates: parsedRates,
        lastUpdated: new Date(lastTimestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        isLive: true,
      };
    }

    // 1. Önce Canlı Türkiye Finans API'den (Truncgil) Gram Altın ve Döviz Çek
    try {
      const truncgilRes = await fetch('https://finans.truncgil.com/today.json');
      if (truncgilRes.ok) {
        const tData = await truncgilRes.json();
        if (tData && (tData['gram-altin'] || tData.USD)) {
          const parseVal = (strVal: string) => parseFloat((strVal || '0').replace('.', '').replace(',', '.'));
          const usdTry = tData.USD?.Satış ? parseVal(tData.USD.Satış) : 47.7;
          const eurTry = tData.EUR?.Satış ? parseVal(tData.EUR.Satış) : 55.0;
          const gbpTry = tData.GBP?.Satış ? parseVal(tData.GBP.Satış) : 64.2;
          const gauTry = tData['gram-altin']?.Satış ? parseVal(tData['gram-altin'].Satış) : 6540;

          const liveRates: ExchangeRates = {
            TRY: 1,
            USD: usdTry > 0 ? 1 / usdTry : FALLBACK_RATES.USD,
            EUR: eurTry > 0 ? 1 / eurTry : FALLBACK_RATES.EUR,
            GBP: gbpTry > 0 ? 1 / gbpTry : FALLBACK_RATES.GBP,
            GAU: gauTry > 0 ? gauTry : FALLBACK_RATES.GAU,
          };

          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(liveRates));
          await AsyncStorage.setItem(TIMESTAMP_KEY, now.toString());

          return {
            rates: liveRates,
            lastUpdated: new Date(now).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            isLive: true,
          };
        }
      }
    } catch (e) {
      console.log('[ExchangeRates] Truncgil fetch error, trying OpenER API:', e);
    }

    // 2. Yedek API (Open Exchange Rates)
    const response = await fetch('https://open.er-api.com/v6/latest/TRY');
    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        const liveRates: ExchangeRates = {
          TRY: 1,
          USD: data.rates.USD || FALLBACK_RATES.USD,
          EUR: data.rates.EUR || FALLBACK_RATES.EUR,
          GBP: data.rates.GBP || FALLBACK_RATES.GBP,
          GAU: FALLBACK_RATES.GAU,
        };

        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(liveRates));
        await AsyncStorage.setItem(TIMESTAMP_KEY, now.toString());

        return {
          rates: liveRates,
          lastUpdated: new Date(now).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          isLive: true,
        };
      }
    }

    // API çekimi başarısızsa önbelleği dene
    if (cachedRatesStr) {
      return {
        rates: JSON.parse(cachedRatesStr),
        lastUpdated: new Date(lastTimestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        isLive: false,
      };
    }
  } catch (error) {
    console.log('[ExchangeRates] Fetch error, using fallback:', error);
  }

  return {
    rates: FALLBACK_RATES,
    lastUpdated: 'Varsayılan',
    isLive: false,
  };
}
