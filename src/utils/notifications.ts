import { Medication } from '@/types/medication';

const NOTIFICATION_STORAGE_KEY = 'pillbuddy-last-notifications';
const NOTIFICATION_SETTINGS_KEY = 'pillbuddy-notification-settings';

export interface NotificationSettings {
  enabled: boolean;
  warningThreshold: number; // days
  urgentThreshold: number; // days
  criticalThreshold: number; // days
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  warningThreshold: 7,
  urgentThreshold: 3,
  criticalThreshold: 0
};

// Get notification settings
export function getNotificationSettings(): NotificationSettings {
  const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  if (stored) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (e) {
      console.error('Failed to parse notification settings:', e);
    }
  }
  return DEFAULT_SETTINGS;
}

// Save notification settings
export function saveNotificationSettings(settings: NotificationSettings): void {
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
}

// Check if browser supports notifications
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// Check if iOS device
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  if (isIOS()) {
    console.warn('iOS has limited notification support');
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

// Get last notification times
function getLastNotifications(): Record<string, number> {
  const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return {};
    }
  }
  return {};
}

// Save last notification time
function saveLastNotification(medicationId: string): void {
  const notifications = getLastNotifications();
  notifications[medicationId] = Date.now();
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
}

// Check if we should send notification (not more than once per day)
function shouldNotify(medicationId: string): boolean {
  const lastNotifications = getLastNotifications();
  const lastNotification = lastNotifications[medicationId];
  
  if (!lastNotification) return true;
  
  const oneDayInMs = 24 * 60 * 60 * 1000;
  return Date.now() - lastNotification > oneDayInMs;
}

// Schedule a notification for a medication
export async function scheduleNotification(
  medication: Medication,
  daysLeft: number
): Promise<boolean> {
  const settings = getNotificationSettings();
  
  if (!settings.enabled) {
    console.log('Notifications disabled in settings');
    return false;
  }

  if (!isNotificationSupported()) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }

  if (!shouldNotify(medication.id)) {
    console.log('Already notified today for:', medication.name);
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    let priority: 'warning' | 'urgent' | 'critical' = 'warning';
    let emoji = '⚠️';
    
    if (daysLeft <= settings.criticalThreshold) {
      priority = 'critical';
      emoji = '🚨';
    } else if (daysLeft <= settings.urgentThreshold) {
      priority = 'urgent';
      emoji = '⏰';
    } else if (daysLeft <= settings.warningThreshold) {
      priority = 'warning';
      emoji = '⚠️';
    } else {
      return false; // Don't notify if above threshold
    }

    const title = 'PillBuddy Erinnerung';
    const body = `${emoji} ${medication.name} - Nur noch ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tage'} Vorrat!`;
    
    await registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: `med-reminder-${medication.id}`,
      requireInteraction: priority === 'critical',
      actions: [
        { action: 'view', title: '👁️ Anzeigen' },
        { action: 'dismiss', title: '❌ Schließen' }
      ],
      data: {
        medicationId: medication.id,
        medicationName: medication.name,
        daysLeft,
        priority
      }
    } as NotificationOptions);

    saveLastNotification(medication.id);
    console.log('Notification scheduled for:', medication.name);
    return true;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return false;
  }
}

// Check all medications and send notifications if needed
export async function checkMedicationLevels(
  medications: Medication[],
  getDaysRemaining: (medication: Medication) => number
): Promise<number> {
  const settings = getNotificationSettings();
  
  if (!settings.enabled) {
    return 0;
  }

  let notificationCount = 0;

  for (const medication of medications) {
    const daysLeft = getDaysRemaining(medication);
    
    if (daysLeft <= settings.warningThreshold) {
      const sent = await scheduleNotification(medication, daysLeft);
      if (sent) notificationCount++;
    }
  }

  console.log(`Sent ${notificationCount} notification(s)`);
  return notificationCount;
}

// Send a test notification
export async function sendTestNotification(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  const permission = Notification.permission;
  if (permission !== 'granted') {
    const newPermission = await requestNotificationPermission();
    if (newPermission !== 'granted') {
      return false;
    }
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification('PillBuddy Test', {
      body: '✅ Benachrichtigungen funktionieren einwandfrei!',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'test-notification'
    } as NotificationOptions);

    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
}

// Setup background check (register periodic sync if available)
export async function setupBackgroundCheck(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Try to register periodic background sync (only available on some platforms)
    if ('periodicSync' in registration) {
      try {
        await (registration as any).periodicSync.register('check-medications', {
          minInterval: 24 * 60 * 60 * 1000 // Once per day
        });
        console.log('Periodic background sync registered');
      } catch (error) {
        console.log('Periodic background sync not available:', error);
      }
    }
  } catch (error) {
    console.error('Error setting up background check:', error);
  }
}
