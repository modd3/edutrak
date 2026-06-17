/**
 * DarajaProvider
 *
 * Safaricom M-Pesa Daraja API integration.
 * Implements STK Push (Lipia Na M-Pesa Online) for payment initiation,
 * query status for verification, and handles incoming callbacks.
 *
 * @see https://developer.safaricom.co.ke/APIs
 */
import axios, { AxiosInstance } from 'axios';
import logger from '../../utils/logger';
import {
  IPaymentProvider,
  ChargeDTO,
  PaymentSession,
  PaymentSessionStatus,
  PaymentVerification,
  RefundResult,
  WebhookPayload,
  ProviderConfig,
} from '../../types/payment-provider.types';

interface DarajaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  businessShortcode: string; // Paybill/Till number
  callbackUrl: string;
  environment: 'sandbox' | 'production';
}

interface DarajaTokenResponse {
  access_token: string;
  expires_in: string;
}

interface DarajaSTKPushRequest {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  TransactionType: string;
  Amount: string;
  PartyA: string;
  PartyB: string;
  PhoneNumber: string;
  CallBackURL: string;
  AccountReference: string;
  TransactionDesc: string;
}

interface DarajaSTKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface DarajaQueryRequest {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  CheckoutRequestID: string;
}

interface DarajaQueryResponse {
  ResponseCode: string;
  ResultCode: string;
  ResultDesc: string;
  CheckoutRequestID: string;
}

interface DarajaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value?: string | number;
        }>;
      };
    };
  };
}

export class DarajaProvider implements IPaymentProvider {
  readonly providerName = 'MPESA';

  private config: DarajaConfig;
  private httpClient: AxiosInstance;
  private tokenExpiresAt: number = 0;
  private currentToken: string = '';

  constructor(providerConfig: ProviderConfig) {
    const extra = providerConfig.extraConfig ?? {};
    this.config = {
      consumerKey: providerConfig.apiKey,
      consumerSecret: providerConfig.secretKey,
      passkey: extra.passkey || '',
      shortcode: extra.shortcode || providerConfig.apiKey,
      businessShortcode: extra.businessShortcode || extra.shortcode || providerConfig.apiKey,
      callbackUrl: providerConfig.callbackUrl || '',
      environment: (extra.environment as 'sandbox' | 'production') || 'sandbox',
    };

    const baseURL =
      this.config.environment === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

    this.httpClient = axios.create({
      baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    logger.info('DarajaProvider initialized', {
      environment: this.config.environment,
      shortcode: this.config.shortcode,
    });
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.getToken();
      return true;
    } catch (error: any) {
      logger.error('Daraja config validation failed', { error: error.message });
      return false;
    }
  }

  async initiatePayment(charge: ChargeDTO): Promise<PaymentSession> {
    const token = await this.getToken();
    const timestamp = this.generateTimestamp();
    const password = this.generatePassword(timestamp);

    const phoneNumber = this.formatPhoneNumber(charge.phoneNumber || '');
    if (!phoneNumber) {
      throw new Error('Valid phone number is required for M-Pesa payments');
    }

    const amount = charge.amount.toString();

    const request: DarajaSTKPushRequest = {
      BusinessShortCode: this.config.businessShortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: this.config.businessShortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: this.config.callbackUrl,
      AccountReference: charge.transactionRef.slice(0, 12),
      TransactionDesc: charge.description.slice(0, 13),
    };

    try {
      logger.info('Initiating M-Pesa STK Push', {
        amount: charge.amount,
        phone: phoneNumber,
        reference: charge.transactionRef,
      });

      const response = await this.httpClient.post<DarajaSTKPushResponse>(
        '/mpesa/stkpush/v1/processrequest',
        request,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;

      if (data.ResponseCode !== '0') {
        throw new Error(`M-Pesa STK Push failed: ${data.ResponseDescription}`);
      }

      logger.info('M-Pesa STK Push initiated', {
        merchantRequestId: data.MerchantRequestID,
        checkoutRequestId: data.CheckoutRequestID,
      });

      return {
        providerTransactionId: data.CheckoutRequestID,
        transactionRef: charge.transactionRef,
        status: PaymentSessionStatus.AWAITING_CONFIRMATION,
        merchantRequestId: data.MerchantRequestID,
        rawResponse: data as unknown as Record<string, unknown>,
      };
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        logger.error('M-Pesa API error', {
          status: error.response.status,
          data: error.response.data,
        });
      } else {
        logger.error('M-Pesa STK Push error', { error: error.message });
      }
      throw error;
    }
  }

  async verifyPayment(transactionRef: string): Promise<PaymentVerification> {
    const token = await this.getToken();
    const timestamp = this.generateTimestamp();
    const password = this.generatePassword(timestamp);

    const request: DarajaQueryRequest = {
      BusinessShortCode: this.config.businessShortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: transactionRef,
    };

    try {
      const response = await this.httpClient.post<DarajaQueryResponse>(
        '/mpesa/stkpushquery/v1/query',
        request,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;
      const success = data.ResultCode === '0';

      return {
        providerTransactionId: data.CheckoutRequestID,
        transactionRef,
        status: success ? PaymentSessionStatus.SUCCESS : PaymentSessionStatus.FAILED,
        amountCharged: 0, // Not available from query
        receiptCode: success ? data.ResultDesc : undefined,
        rawResponse: data as unknown as Record<string, unknown>,
      };
    } catch (error: any) {
      logger.error('M-Pesa payment verification failed', { transactionRef, error: error.message });
      throw error;
    }
  }

  async refundPayment(transactionRef: string, amount?: number): Promise<RefundResult> {
    // M-Pesa B2C (Business to Customer) for reversals
    const token = await this.getToken();
    const timestamp = this.generateTimestamp();
    const password = this.generatePassword(timestamp);

    const request = {
      InitiatorName: process.env.MPESA_INITIATOR_NAME || 'TestInitiator',
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || '',
      CommandID: 'BusinessPayment',
      Amount: amount?.toString() || '0',
      PartyA: this.config.shortcode,
      PartyB: '', // Will be filled from the original payment
      Remarks: 'Refund',
      QueueTimeOutURL: `${this.config.callbackUrl}/timeout`,
      ResultURL: `${this.config.callbackUrl}/result`,
    };

    try {
      const response = await this.httpClient.post(
        '/mpesa/b2c/v1/paymentrequest',
        request,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return {
        providerRefundId: response.data.ConversationID || '',
        transactionRef,
        amountRefunded: amount || 0,
        status: 'PENDING',
      };
    } catch (error: any) {
      logger.error('M-Pesa refund failed', { transactionRef, error: error.message });
      throw error;
    }
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    const rawBody = payload.rawBody as unknown as DarajaCallbackBody;
    const callback = rawBody.Body?.stkCallback;

    if (!callback) {
      logger.warn('Received invalid M-Pesa callback', { payload });
      return;
    }

    logger.info('Processing M-Pesa callback', {
      checkoutRequestId: callback.CheckoutRequestID,
      resultCode: callback.ResultCode,
      resultDesc: callback.ResultDesc,
    });

    const success = callback.ResultCode === 0;

    if (success && callback.CallbackMetadata?.Item) {
      const metadata = this.extractCallbackMetadata(callback.CallbackMetadata.Item);
      logger.info('M-Pesa payment successful', {
        transactionRef: callback.CheckoutRequestID,
        receiptCode: metadata.MpesaReceiptNumber,
        phoneNumber: metadata.PhoneNumber,
        amount: metadata.Amount,
      });
    } else {
      logger.warn('M-Pesa payment failed', {
        checkoutRequestId: callback.CheckoutRequestID,
        resultCode: callback.ResultCode,
        reason: callback.ResultDesc,
      });
    }
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    if (this.currentToken && Date.now() < this.tokenExpiresAt) {
      return this.currentToken;
    }

    const auth = Buffer.from(
      `${this.config.consumerKey}:${this.config.consumerSecret}`
    ).toString('base64');

    try {
      const response = await this.httpClient.get<DarajaTokenResponse>(
        '/oauth/v1/generate?grant_type=client_credentials',
        { headers: { Authorization: `Basic ${auth}` } }
      );

      this.currentToken = response.data.access_token;
      // Set expiry 60 seconds before actual to be safe
      this.tokenExpiresAt = Date.now() + (parseInt(response.data.expires_in) - 60) * 1000;

      logger.info('M-Pesa token acquired');
      return this.currentToken;
    } catch (error: any) {
      logger.error('Failed to get M-Pesa token', { error: error.message });
      throw error;
    }
  }

  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private generatePassword(timestamp: string): string {
    const str = `${this.config.businessShortcode}${this.config.passkey}${timestamp}`;
    return Buffer.from(str).toString('base64');
  }

  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Convert 07XX XXX XXX → 2547XX XXX XXX
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1);
    }

    // Convert +2547XX XXX XXX → 2547XX XXX XXX
    if (cleaned.startsWith('254')) {
      return cleaned;
    }

    // If it's 7XX XXX XXX, add 254
    if (cleaned.startsWith('7') && cleaned.length === 9) {
      return '254' + cleaned;
    }

    return cleaned;
  }

  private extractCallbackMetadata(items: DarajaCallbackBody['Body']['stkCallback']['CallbackMetadata']['Item']) {
    const metadata: Record<string, string | number> = {};
    for (const item of items) {
      if (item.Value !== undefined) {
        metadata[item.Name] = item.Value;
      }
    }
    return metadata;
  }
}