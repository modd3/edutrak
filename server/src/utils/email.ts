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
    this.transporter = nodemailer.createTransporter({
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
}

export default new EmailService();