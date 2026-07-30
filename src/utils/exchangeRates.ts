import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExchangeRates {
  USD: number; // 1 TRY kac USD (veya tam tersi)
  EUR: number;
  GBP: number;
  TRY: number;
  [key: string]: number;
}

const CACHE_KEY = 'exchange_rates_cache';
const TIMESTAMP_KEY = 'exchange_rates_timestamp';
const ONE_HOUR_MS = 60 * 60 * 1000;

// Varsayilan Guvenli Yedek Kurlar (Internet yoksa)
const FALLBACK_RATES: ExchangeRates = {
  TRY: 1,
  USD: 0.025, // ~40 TL
  EUR: 0.023, // ~43.5 TL
  GBP: 0.019,
};

/**
 * Saatte 1 güncellenen canlı döviz kurlarını getirir
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

    // 60 dakika geçtiyse CANLI API'den çek (Open Exchange Rates API - Ücretsiz & Hızlı)
    const response = await fetch('https://open.er-api.com/v6/latest/TRY');
    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        const liveRates: ExchangeRates = {
          TRY: 1,
          USD: data.rates.USD || FALLBACK_RATES.USD,
          EUR: data.rates.EUR || FALLBACK_RATES.EUR,
          GBP: data.rates.GBP || FALLBACK_RATES.GBP,
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
