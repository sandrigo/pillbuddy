import { useState, useEffect } from 'react';
import { Medication } from '@/types/medication';

interface EmailNotification {
  medicationId: string;
  medicationName: string;
  daysRemaining: number;
  lastSent: Date;
  type: 'two-weeks' | 'one-week' | 'daily';
}

const NOTIFICATION_STORAGE_KEY = 'email_notifications';

export const useEmailNotifications = () => {
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [webhookUrl, setWebhookUrl] = useState<string>('');

  useEffect(() => {
    // Load notifications from localStorage
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setNotifications(parsed.map((notif: any) => ({
        ...notif,
        lastSent: new Date(notif.lastSent)
      })));
    }

    // Load webhook URL
    const storedWebhook = localStorage.getItem('zapier_webhook_url');
    if (storedWebhook) {
      setWebhookUrl(storedWebhook);
    }
  }, []);

  const saveNotifications = (newNotifications: EmailNotification[]) => {
    setNotifications(newNotifications);
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(newNotifications));
  };

  const saveWebhookUrl = (url: string) => {
    setWebhookUrl(url);
    localStorage.setItem('zapier_webhook_url', url);
  };

  const shouldSendNotification = (medication: Medication, daysRemaining: number): 'two-weeks' | 'one-week' | 'daily' | null => {
    const existing = notifications.find(n => n.medicationId === medication.id);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check if we should send 2-week warning
    if (daysRemaining <= 14 && daysRemaining > 7) {
      if (!existing || existing.type !== 'two-weeks') {
        return 'two-weeks';
      }
    }

    // Check if we should send 1-week warning
    if (daysRemaining <= 7 && daysRemaining > 0) {
      if (!existing || existing.type === 'two-weeks' || 
          (existing.type === 'one-week' && existing.lastSent < oneDayAgo)) {
        return daysRemaining === 7 ? 'one-week' : 'daily';
      }
      
      // Send daily notifications when <= 7 days
      if (existing && existing.type === 'daily' && existing.lastSent < oneDayAgo) {
        return 'daily';
      }
    }

    return null;
  };

  const sendEmailNotification = async (
    medication: Medication, 
    daysRemaining: number, 
    type: 'two-weeks' | 'one-week' | 'daily'
  ): Promise<boolean> => {
    if (!webhookUrl) {
      console.error('No webhook URL configured');
      return false;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          medicationName: medication.name,
          daysRemaining: daysRemaining,
          currentAmount: medication.currentAmount,
          notificationType: type,
          timestamp: new Date().toISOString(),
          message: getNotificationMessage(medication.name, daysRemaining, type)
        }),
      });

      // Update notification tracking
      const updatedNotifications = notifications.filter(n => n.medicationId !== medication.id);
      updatedNotifications.push({
        medicationId: medication.id,
        medicationName: medication.name,
        daysRemaining,
        lastSent: new Date(),
        type
      });
      
      saveNotifications(updatedNotifications);
      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  };

  const getNotificationMessage = (medicationName: string, daysRemaining: number, type: string): string => {
    switch (type) {
      case 'two-weeks':
        return `⚠️ Tabletten-Erinnerung: ${medicationName} reicht noch ${daysRemaining} Tage. Zeit zum Nachbestellen!`;
      case 'one-week':
        return `🚨 Wichtige Erinnerung: ${medicationName} reicht nur noch ${daysRemaining} Tage! Bitte dringend nachbestellen.`;
      case 'daily':
        return `🔴 DRINGEND: ${medicationName} reicht nur noch ${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''}! Sofort nachbestellen!`;
      default:
        return `Tabletten-Erinnerung für ${medicationName}`;
    }
  };

  const checkAndSendNotifications = async (medications: Medication[], getDaysRemaining: (med: Medication) => number) => {
    const results = [];
    
    for (const medication of medications) {
      const daysRemaining = getDaysRemaining(medication);
      const notificationType = shouldSendNotification(medication, daysRemaining);
      
      if (notificationType) {
        const success = await sendEmailNotification(medication, daysRemaining, notificationType);
        results.push({
          medication: medication.name,
          success,
          type: notificationType,
          daysRemaining
        });
      }
    }
    
    return results;
  };

  return {
    notifications,
    webhookUrl,
    saveWebhookUrl,
    shouldSendNotification,
    sendEmailNotification,
    checkAndSendNotifications,
    getNotificationMessage
  };
};