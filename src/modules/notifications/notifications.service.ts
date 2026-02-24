import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio = require('twilio');

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private twilioClient: twilio.Twilio | null = null;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

    // Only initialize Twilio if credentials are present and valid
    // Valid Twilio account SIDs start with 'AC'
    if (accountSid && authToken && accountSid.startsWith('AC')) {
      this.twilioClient = twilio(accountSid, authToken);
    } else if (accountSid || authToken) {
      this.logger.warn('Twilio credentials are incomplete or invalid. SMS/WhatsApp notifications disabled.');
    }
  }

  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    if (!this.twilioClient) {
      this.logger.warn('Twilio not configured. SMS not sent.');
      return;
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: this.configService.get('TWILIO_PHONE_NUMBER'),
        to: phoneNumber,
      });

      this.logger.log(`SMS sent to ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
    }
  }

  async sendWhatsApp(phoneNumber: string, message: string): Promise<void> {
    if (!this.twilioClient) {
      this.logger.warn('Twilio not configured. WhatsApp message not sent.');
      return;
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: `whatsapp:${this.configService.get('TWILIO_WHATSAPP_NUMBER')}`,
        to: `whatsapp:${phoneNumber}`,
      });

      this.logger.log(`WhatsApp sent to ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp to ${phoneNumber}:`, error);
    }
  }

  async notifyDelivery(sellerId: string, buyerId: string, quantity: number): Promise<void> {
    const message = `Milk delivery recorded: ${quantity}L delivered. Thank you!`;

    // In production, fetch buyer phone number from database and send notification
    // For now, just log
    this.logger.log(`Notification would be sent: ${message}`);
  }

  async notifyPendingPayment(buyerId: string, pendingAmount: number): Promise<void> {
    const message = `You have a pending payment of Rs. ${pendingAmount}. Please pay at your earliest convenience.`;

    // In production, fetch buyer phone number from database and send notification
    this.logger.log(`Notification would be sent: ${message}`);
  }

  async notifySellerDailyReminder(sellerId: string, buyerName: string): Promise<void> {
    const message = `Daily reminder: Add milk delivery for ${buyerName}.`;

    // In production, fetch seller phone number from database and send notification
    this.logger.log(`Notification would be sent: ${message}`);
  }
}
