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