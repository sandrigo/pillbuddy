import { useState, useEffect } from 'react';
import { Medication } from '@/types/medication';
import emailjs from '@emailjs/browser';

interface EmailNotification {
  medicationId: string;
  medicationName: string;
  daysRemaining: number;
  lastSent: Date;
  type: 'two-weeks' | 'one-week' | 'daily';
}

const NOTIFICATION_STORAGE_KEY = 'email_notifications';
const SMTP_CONFIG_KEY = 'smtp_config';

interface SMTPConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  toEmail: string;
  notificationTime?: string; // Format: "HH:MM"
}

export const useEmailNotifications = () => {
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [smtpConfig, setSMTPConfig] = useState<SMTPConfig | null>(null);

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

    // Load SMTP config
    const storedConfig = localStorage.getItem(SMTP_CONFIG_KEY);
    if (storedConfig) {
      setSMTPConfig(JSON.parse(storedConfig));
    }
  }, []);

  const saveNotifications = (newNotifications: EmailNotification[]) => {
    setNotifications(newNotifications);
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(newNotifications));
  };

  const saveSMTPConfig = (config: SMTPConfig | null) => {
    setSMTPConfig(config);
    if (config) {
      localStorage.setItem(SMTP_CONFIG_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(SMTP_CONFIG_KEY);
    }
  };

  const shouldSendNotification = (medication: Medication, daysRemaining: number): 'two-weeks' | 'one-week' | 'daily' | null => {
    const now = new Date();
    const today = now.toDateString();
    
    // Check if notification time is set and if current time matches
    if (smtpConfig?.notificationTime) {
      const [hours, minutes] = smtpConfig.notificationTime.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Only send notifications at the specified time (within a 5-minute window)
      const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (hours * 60 + minutes));
      if (timeDiff > 5) {
        return null;
      }
    }
    
    // Find existing notification for this medication
    const existingNotification = notifications.find(n => n.medicationId === medication.id);
    
    if (daysRemaining <= 7) {
      // Daily notifications for 1-7 days
      if (!existingNotification || existingNotification.lastSent.toDateString() !== today || existingNotification.type !== 'daily') {
        return 'daily';
      }
    } else if (daysRemaining <= 14 && daysRemaining > 7) {
      // One week warning
      if (!existingNotification || existingNotification.type !== 'one-week') {
        return 'one-week';
      }
    } else if (daysRemaining <= 21 && daysRemaining > 14) {
      // Two weeks warning
      if (!existingNotification || existingNotification.type !== 'two-weeks') {
        return 'two-weeks';
      }
    }
    
    return null;
  };

  const sendEmailNotification = async (
    medication: Medication, 
    daysRemaining: number, 
    type: 'two-weeks' | 'one-week' | 'daily'
  ): Promise<boolean> => {
    if (!smtpConfig) {
      console.error('No SMTP configuration found');
      return false;
    }

    try {
      const templateParams = {
        to_email: smtpConfig.toEmail,
        subject: getEmailSubject(medication.name, daysRemaining, type),
        message: getNotificationMessage(medication.name, daysRemaining, type),
        medication_name: medication.name,
        days_remaining: daysRemaining.toString(),
        current_amount: medication.currentAmount.toString(),
        notification_type: type,
        timestamp: new Date().toLocaleString('de-DE'),
      };

      await emailjs.send(
        smtpConfig.serviceId,
        smtpConfig.templateId,
        templateParams,
        smtpConfig.publicKey
      );

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

  const getEmailSubject = (medicationName: string, daysRemaining: number, type: string): string => {
    switch (type) {
      case 'two-weeks':
        return `📋 Tabletten-Erinnerung: ${medicationName} (${daysRemaining} Tage)`;
      case 'one-week':
        return `⚠️ Wichtig: ${medicationName} bald leer (${daysRemaining} Tage)`;
      case 'daily':
        return `🚨 DRINGEND: ${medicationName} (${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''})`;
      default:
        return `Tabletten-Erinnerung: ${medicationName}`;
    }
  };

  const getNotificationMessage = (medicationName: string, daysRemaining: number, type: string): string => {
    switch (type) {
      case 'two-weeks':
        return `⚠️ Hallo!\n\nIhre Tabletten "${medicationName}" reichen noch ${daysRemaining} Tage. Es wird Zeit, diese nachzubestellen!\n\nBitte wenden Sie sich an Ihren Arzt oder Ihre Apotheke.\n\nViele Grüße\nIhr Tabletten-Tracker`;
      case 'one-week':
        return `🚨 Wichtige Erinnerung!\n\nIhre Tabletten "${medicationName}" reichen nur noch ${daysRemaining} Tage! Bitte bestellen Sie diese dringend nach.\n\nKontaktieren Sie umgehend Ihren Arzt oder Ihre Apotheke.\n\nViele Grüße\nIhr Tabletten-Tracker`;
      case 'daily':
        return `🔴 DRINGENDE WARNUNG!\n\nIhre Tabletten "${medicationName}" reichen nur noch ${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''}! Sie müssen diese SOFORT nachbestellen.\n\nRufen Sie heute noch Ihren Arzt oder Ihre Apotheke an!\n\nViele Grüße\nIhr Tabletten-Tracker`;
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
    smtpConfig,
    saveSMTPConfig,
    shouldSendNotification,
    sendEmailNotification,
    checkAndSendNotifications,
    getNotificationMessage,
    getEmailSubject
  };
};