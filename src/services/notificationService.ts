import Platform from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Akıllı Motivasyon Bildirim Motoru (Duolingo Style)
 * 09:00 - Sabah Kahve & Tasarruf Teşviki ☕
 * 13:30 - Öğle Bütçe & Limit Kontrolü 🎯
 * 21:00 - Akşam Sıfır Harcama Serisi 🔥
 */

const NOTIFICATION_STORAGE_KEY = 'birikimyap_notifications_enabled';

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    let Notifications: any = null;
    try {
      Notifications = require('expo-notifications');
    } catch (e) {
      console.log('expo-notifications package not loaded, fallback to native');
    }

    if (Notifications) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus === 'granted') {
        await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, 'true');
        await scheduleSmartDailyNotifications();
        return true;
      }
    }
    return false;
  } catch (err) {
    console.log('Notification permission request error:', err);
    return false;
  }
}

export async function scheduleSmartDailyNotifications() {
  try {
    let Notifications: any = null;
    try {
      Notifications = require('expo-notifications');
    } catch (e) {
      return;
    }

    if (!Notifications) return;

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Cancel all existing to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 1. Sabah Kahve & Tasarruf Teşviki (09:00)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '☕ Sabah Tasarruf Fırsatı!',
        body: 'Bugün kahveyi dışarıdan almak yerine evde demleyip ₺120 biriktirmeye ne dersin? ✨',
        sound: true,
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });

    // 2. Öğle Bütçe & Limit Kontrolü (13:30)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 Gün Ortası Limit Kontrolü',
        body: 'Günün yarısı bitti! Günlük bütçen kontrol altında. Harika gidiyorsun! 💪',
        sound: true,
      },
      trigger: {
        hour: 13,
        minute: 30,
        repeats: true,
      },
    });

    // 3. Akşam Sıfır Harcama Serisi (21:00)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Akşam Sıfır Harcama Serisi',
        body: 'Bugün harcama yapmadın mı? Sıfır harcama serini koru ve hedefine yaklaş! 🏆✨',
        sound: true,
      },
      trigger: {
        hour: 21,
        minute: 0,
        repeats: true,
      },
    });

    console.log('Smart Duolingo-style notifications scheduled successfully (09:00, 13:30, 21:00)!');
  } catch (err) {
    console.log('Error scheduling notifications:', err);
  }
}
