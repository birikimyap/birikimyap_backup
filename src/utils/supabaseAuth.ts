import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { useFinanceStore } from '@/store/financeStore';

export const REDIRECT_URI = 'birikimyap://auth/callback';

/**
 * Supabase Google OAuth Giriş Akışı (Safe Crash-Free)
 */
export async function signInWithGoogle() {
  try {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase URL ve Anon Key tanımlanmamış. Lütfen ayarları kontrol edin.' };
    }

    WebBrowser.maybeCompleteAuthSession();

    // 1. Supabase OAuth URL'sini al
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: REDIRECT_URI,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      throw error || new Error('OAuth URL alınamadı');
    }

    // 2. In-App WebBrowser ile Google Giriş Sayfasını Aç
    const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URI);

    if (result.type === 'success' && result.url) {
      // 3. Callback URL'sinden tokens veya code değerlerini ayrıştır
      const url = result.url;
      const parsedUrl = Linking.parse(url);

      const hashParams = url.includes('#') ? url.split('#')[1] : '';
      const params = new URLSearchParams(hashParams || (parsedUrl.queryParams as any));

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const code = params.get('code');

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) throw sessionError;

        return { success: true, user: sessionData.user, session: sessionData.session };
      } else if (code) {
        const { data: codeData, error: codeError } = await supabase.auth.exchangeCodeForSession(code);
        if (codeError) throw codeError;
        return { success: true, user: codeData.user, session: codeData.session };
      } else {
        throw new Error('Giriş doğrulama bilgisi alınamadı.');
      }
    }

    return { success: false, message: 'Giriş işlemi iptal edildi.' };
  } catch (err: any) {
    console.error('Google Sign In Error:', err);
    return { success: false, error: err?.message || err };
  }
}

/**
 * Mevcut Oturum Kontrolü (Auto Login)
 */
export async function getCheckSession() {
  try {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
  } catch (e) {
    console.log('Session check error:', e);
    return null;
  }
}

/**
 * Oturumu Kapatma
 */
export async function signOutUser() {
  try {
    // 1. Önce buluta ve cihaza son halini kaydet ki hiç veri kaybolmasın!
    await saveUserPlanToCloud();

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    await AsyncStorage.removeItem('birikim-yap-finance-storage');
    await AsyncStorage.removeItem('latest_local_plan');
    useFinanceStore.getState().resetAllData();
  } catch (e) {
    console.log('Signout error:', e);
  }
}

/**
 * Hesabı Tamamen Sil — Supabase'deki profil verisini siler, yerel depolamayı temizler ve oturumu kapatır.
 */
export async function deleteUserAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase yapılandırılmamış.' };
    }

    // 1. Aktif kullanıcıyı al
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Aktif oturum bulunamadı.' };
    }

    // 2. Supabase profiles tablosundan kullanıcı verisini sil
    await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    // 3. Cihaz üzerindeki tüm yerel depolamayı temizle
    const allKeys = await AsyncStorage.getAllKeys();
    const userKeys = allKeys.filter(k => 
      k.includes('birikim') || 
      k.includes('user_plan') || 
      k.includes('finance') || 
      k.includes('latest_local')
    );
    if (userKeys.length > 0) {
      await AsyncStorage.multiRemove(userKeys);
    }

    // 4. Store'u sıfırla
    useFinanceStore.getState().resetAllData();

    // 5. Oturumu kapat
    await supabase.auth.signOut();

    return { success: true };
  } catch (e: any) {
    console.error('[deleteUserAccount] Hata:', e);
    return { success: false, error: e?.message || 'Bilinmeyen hata' };
  }
}

/**
 * E-posta & Şifre ile Yeni Kullanıcı Kaydı (Sign Up)
 */
export async function signUpWithEmail(email: string, password: string) {
  try {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase URL ve Anon Key tanımlanmamış.' };
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    if (error) throw error;

    // Eğer oturum yoksa e-posta doğrulama linki gönderilmiştir
    const requiresConfirmation = !!(data.user && !data.session);

    return {
      success: true,
      user: data.user,
      session: data.session,
      requiresConfirmation,
      message: requiresConfirmation
        ? 'Hesabınız oluşturuldu! Lütfen e-posta kutunuzu (Spam dahil) kontrol ederek doğrulama bağlantısına tıklayın.'
        : 'Kayıt başarılı!'
    };
  } catch (err: any) {
    console.error('Email Sign Up Error:', err);
    let errMsg = err?.message || err;
    if (typeof errMsg === 'string' && errMsg.toLowerCase().includes('user already registered')) {
      errMsg = 'Bu e-posta adresiyle zaten kayıtlı bir hesap var. Lütfen giriş yapmayı deneyin.';
    }
    return { success: false, error: errMsg };
  }
}

/**
 * E-posta & Şifre ile Giriş Yapma (Sign In)
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase URL ve Anon Key tanımlanmamış.' };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) throw error;

    return { success: true, user: data.user, session: data.session };
  } catch (err: any) {
    console.error('Email Sign In Error:', err);
    let errMsg = err?.message || err;
    if (typeof errMsg === 'string') {
      if (errMsg.toLowerCase().includes('email not confirmed')) {
        errMsg = 'E-posta adresiniz henüz doğrulanmamış. Lütfen e-posta kutunuza (veya Spam klasörüne) gelen doğrulama bağlantısına tıklayın ya da Şifremi Unuttum seçeneğini kullanın.';
      } else if (errMsg.toLowerCase().includes('invalid login credentials')) {
        errMsg = 'E-posta adresi veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.';
      }
    }
    return { success: false, error: errMsg };
  }
}

/**
 * E-posta ile Şifre Sıfırlama Bağlantısı Gönderme (Forgot Password)
 */
export async function resetPasswordForEmail(email: string) {
  try {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase ayarları eksik.' };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw error;

    return {
      success: true,
      message: 'Şifre sıfırlama e-postası başarıyla gönderildi. Lütfen e-posta kutunuzu (Spam dahil) kontrol edin.'
    };
  } catch (err: any) {
    console.error('Reset Password Error:', err);
    let errMsg = err?.message || err;
    if (typeof errMsg === 'string' && errMsg.toLowerCase().includes('rate limit')) {
      errMsg = 'Çok fazla istek gönderildi. Lütfen birkaç dakika bekleyip tekrar deneyin.';
    }
    return { success: false, error: errMsg };
  }
}

/**
 * Kullanıcının bütçe planını Supabase veritabanına kaydeder (Cloud Sync)
 */
export async function saveUserPlanToCloud() {
  try {
    const client = getSupabase();
    if (!client) return { success: false, error: 'No client' };

    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData?.session?.user;
    const state = useFinanceStore.getState();

    const userId = user?.id || state.userProfile?.id;
    if (!userId) return { success: false, error: 'No user ID' };

    const payload = {
      incomes: state.incomes,
      expenses: state.expenses,
      savingsGoal: state.savingsGoal,
      selectedPeriod: state.selectedPeriod,
      monthlyArchives: state.monthlyArchives,
      userProfile: state.userProfile,
      hasCompletedOnboarding: true,
      updated_at: new Date().toISOString()
    };

    const payloadString = JSON.stringify(payload);

    // 1. Cihaza Senkronize Kaydet (Hem ID mühürlü hem genel yedek)
    await AsyncStorage.setItem(`user_plan_${userId}`, payloadString);
    await AsyncStorage.setItem('latest_local_plan', payloadString);

    // 2. Supabase Bulut Veritabanına YAZ (Cloud Primary)
    const { error } = await client.from('profiles').upsert({
      id: userId,
      email: user?.email || state.userProfile?.email || '',
      full_name: state.userProfile?.fullName || 'Kullanıcı',
      user_data: payload,
      website: payloadString,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.log('[CloudSave] Supabase upsert error:', error.message);
    } else {
      console.log('[CloudSave] Successfully saved to Supabase profiles for:', userId);
    }

    return { success: true };
  } catch (e: any) {
    console.log('[CloudSave] Exception:', e);
    return { success: false, error: e?.message || e };
  }
}

/**
 * Kullanıcı profilinin veritabanında veya cihaz hafızasında var olup olmadığını kontrol eder.
 */
export async function checkUserProfileExist(userId?: string): Promise<boolean> {
  try {
    if (!userId) return false;

    // 1. Önce Supabase Profiles tablosuna bak
    const client = getSupabase();
    if (client) {
      const { data } = await client
        .from('profiles')
        .select('id, full_name, user_data')
        .eq('id', userId)
        .maybeSingle();

      if (data && (data.full_name || data.user_data)) {
        return true;
      }
    }

    // 2. Cihaz Hafızasında bu kullanıcının planı veya profili var mı?
    const localUserPlan = await AsyncStorage.getItem(`user_plan_${userId}`);
    if (localUserPlan) {
      return true;
    }

    return false;
  } catch (e) {
    console.log('Profile check exception:', e);
    return false;
  }
}

/**
 * Kullanıcının bütçe planını ve profilini geri yükler (Professional Auth Restore)
 */
export async function loadUserPlanFromCloud(userId: string): Promise<boolean> {
  try {
    if (!userId) return false;
    console.log('[CloudRestore] Professional Auth Check for User ID:', userId);

    // A) ÖNCE SUPABASE VERİTABANINA BAK (Primary Source)
    const client = getSupabase();
    if (client) {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        let rawUserData = data.user_data;
        if (!rawUserData && data.website) {
          try { rawUserData = JSON.parse(data.website); } catch (e) {}
        }

        const fullName = data.full_name || rawUserData?.userProfile?.fullName || 'Kullanıcı';
        const userEmail = data.email || rawUserData?.userProfile?.email || '';

        // EĞER VERİTABANINDA ADI VEYA VERİSİ VARSA -> KULLANICIYI GERİ YÜKLE VE TRUE DÖN!
        useFinanceStore.setState({
          incomes: rawUserData?.incomes || [],
          expenses: rawUserData?.expenses || [],
          savingsGoal: rawUserData?.savingsGoal || useFinanceStore.getState().savingsGoal,
          selectedPeriod: rawUserData?.selectedPeriod || 'daily',
          monthlyArchives: rawUserData?.monthlyArchives || [],
          userProfile: { id: userId, email: userEmail, fullName: fullName },
          hasCompletedOnboarding: true
        });
        useFinanceStore.getState().refreshPlan();

        // Yerel diski de mühürle
        const syncPayload = rawUserData || { userProfile: { id: userId, email: userEmail, fullName }, hasCompletedOnboarding: true };
        await AsyncStorage.setItem(`user_plan_${userId}`, JSON.stringify(syncPayload));
        console.log('[CloudRestore] SUCCESS: Existing User restored from Supabase Cloud!');
        return true;
      }
    }

    // B) EĞER BULUTTA BULUNAMADIYSA, BU KULLANICININ CİHAZ YEDEĞİNE BAK (user_plan_${userId})
    const localPlanStr = await AsyncStorage.getItem(`user_plan_${userId}`);
    if (localPlanStr) {
      try {
        const localData = JSON.parse(localPlanStr);
        if (localData && (localData.userProfile?.fullName || localData.hasCompletedOnboarding)) {
          useFinanceStore.setState({
            incomes: localData.incomes || [],
            expenses: localData.expenses || [],
            savingsGoal: localData.savingsGoal || useFinanceStore.getState().savingsGoal,
            selectedPeriod: localData.selectedPeriod || 'daily',
            monthlyArchives: localData.monthlyArchives || [],
            userProfile: localData.userProfile || { id: userId, email: '', fullName: 'Kullanıcı' },
            hasCompletedOnboarding: true
          });
          useFinanceStore.getState().refreshPlan();
          console.log('[CloudRestore] SUCCESS: Restored from user-specific local disk!');
          return true;
        }
      } catch (e) {}
    }

    // C) EĞER SUPABASE'DEN HESAP SİLİNMİŞSE VEYA YEPYENİ BİR HESAPSA -> ESKİ SİLİNMİŞ HESABIN VERİLERİNİ GÖRSELE HORTLATMA!
    console.log('[CloudRestore] Fresh / Deleted User detected! No cloud or user-specific profile found.');
    return false;
  } catch (e) {
    console.log('[CloudRestore] Exception:', e);
    return false;
  }
}
