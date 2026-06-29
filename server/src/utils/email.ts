import nodemailer from 'nodemailer';
import logger from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Kenya School Management" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { to: options.to, subject: options.subject });
      return true;
    } catch (error) {
      logger.error('Failed to send email', { error, to: options.to });
      return false;
    }
  }

  // Template methods
  async sendWelcomeEmail(to: string, name: string, temporaryPassword?: string) {
    const subject = 'Welcome to EduTrak School Management System';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Welcome to Kenya School Management System!</h2>
        <p>Hello ${name},</p>
        <p>Your account has been created successfully.</p>
        ${temporaryPassword ? `
          <p>Your temporary password is: <strong>${temporaryPassword}</strong></p>
          <p>Please change your password after your first login.</p>
        ` : ''}
        <p>You can access the system using your email address.</p>
        <br>
        <p>Best regards,<br>EduTrak Management Team</p>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  async sendPasswordResetEmail(to: string, name: string, resetToken: string) {
    const subject = 'Password Reset Request';
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>You requested to reset your password. Click the link below to reset your password:</p>
        <p><a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <br>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Kenya School Management Team</p>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  // ─── Subscription / Billing Email Templates ─────────────────────────────────

  async sendSubscriptionExpiryReminder(
    to: string,
    schoolName: string,
    daysUntilExpiry: number,
    planName: string,
    expiryDate: Date,
    subscriptionId: string,
  ) {
    const subject =
      daysUntilExpiry <= 1
        ? '⚠️ Your subscription expires tomorrow — renew now!'
        : `⏰ Your subscription expires in ${daysUntilExpiry} days`;

    const billingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing/my-subscription`;
    const formattedDate = expiryDate.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const urgencyColor = daysUntilExpiry <= 1 ? '#dc2626' : daysUntilExpiry <= 3 ? '#ea580c' : '#2563eb';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <h2 style="color: #1f2937;">EduTrak School Management</h2>
        </div>
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; border: 1px solid #e5e7eb;">
          <h3 style="color: ${urgencyColor}; margin-top: 0;">Subscription Renewal Reminder</h3>
          <p>Hello <strong>${schoolName}</strong>,</p>
          <p>Your <strong>${planName}</strong> subscription is set to expire on <strong>${formattedDate}</strong>.</p>
          <p style="font-size: 14px; color: #6b7280;">You have <strong>${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}</strong> remaining.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${billingUrl}" style="background-color: ${urgencyColor}; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              ${daysUntilExpiry <= 1 ? 'Renew Now — Urgent' : 'Review Subscription'}
            </a>
          </div>
          <p style="font-size: 13px; color: #9ca3af;">If you have any questions, please contact your account manager or reply to this email.</p>
        </div>
        <div style="text-align: center; padding: 16px; font-size: 12px; color: #9ca3af;">
          <p>EduTrak School Management System</p>
          <p>Subscription ID: ${subscriptionId}</p>
        </div>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  async sendSubscriptionExpiredNotice(
    to: string,
    schoolName: string,
    planName: string,
  ) {
    const subject = '❌ Your subscription has expired';
    const billingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing/my-subscription`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <h2 style="color: #1f2937;">EduTrak School Management</h2>
        </div>
        <div style="background-color: #fef2f2; border-radius: 8px; padding: 24px; border: 1px solid #fecaca;">
          <h3 style="color: #dc2626; margin-top: 0;">Subscription Expired</h3>
          <p>Hello <strong>${schoolName}</strong>,</p>
          <p>Your <strong>${planName}</strong> subscription has expired. Access to EduTrak features has been suspended.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${billingUrl}" style="background-color: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reactivate Subscription
            </a>
          </div>
          <p style="font-size: 13px; color: #6b7280;">Don't lose your data — reactivate today to restore full access.</p>
        </div>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  async sendPaymentDueReminder(
    to: string,
    schoolName: string,
    amountMinor: number,
    currency: string,
    dueDate: Date,
    invoiceNumber: string,
  ) {
    const amount = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency || 'KES',
    }).format(amountMinor / 100);

    const formattedDate = dueDate.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `💰 Payment of ${amount} due for invoice ${invoiceNumber}`;
    const billingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing/my-subscription`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <h2 style="color: #1f2937;">EduTrak School Management</h2>
        </div>
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; border: 1px solid #e5e7eb;">
          <h3 style="color: #1f2937; margin-top: 0;">Payment Due</h3>
          <p>Hello <strong>${schoolName}</strong>,</p>
          <p>Invoice <strong>${invoiceNumber}</strong> for <strong>${amount}</strong> is due on <strong>${formattedDate}</strong>.</p>
          <div style="background-color: #f3f4f6; border-radius: 6px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; font-size: 14px;">
              <tr><td style="padding: 4px 0; color: #6b7280;">Invoice</td><td style="text-align: right;">${invoiceNumber}</td></tr>
              <tr><td style="padding: 4px 0; color: #6b7280;">Amount</td><td style="text-align: right; font-weight: bold;">${amount}</td></tr>
              <tr><td style="padding: 4px 0; color: #6b7280;">Due Date</td><td style="text-align: right;">${formattedDate}</td></tr>
            </table>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${billingUrl}" style="background-color: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Pay Now with M-Pesa
            </a>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }
}

export default new EmailService();