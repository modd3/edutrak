import { IPaymentProvider, ChargeDTO, PaymentSession, PaymentSessionStatus, PaymentVerification, RefundResult, WebhookPayload } from '../../types/payment-provider.types';

export interface FlutterwaveConfig {
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
  environment: 'sandbox' | 'production';
}

export class FlutterwaveProvider implements IPaymentProvider {
  readonly providerName = 'FLUTTERWAVE';
  private config: FlutterwaveConfig;
  private baseUrl: string;

  constructor(config: FlutterwaveConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'production'
      ? 'https://api.flutterwave.com/v3'
      : 'https://sandbox.flutterwave.com/v3';
  }

  async initiatePayment(charge: ChargeDTO): Promise<PaymentSession> {
    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: charge.transactionRef,
        amount: charge.amount,
        currency: charge.currency,
        redirect_url: charge.callbackUrl,
        customer: {
          email: charge.email || 'customer@example.com',
          name: charge.email || 'Customer',
        },
        meta: charge.metadata,
      }),
    });

    if (!response.ok) {
      const error = (await response.json()) as { message?: string };
      throw new Error(error.message || 'Flutterwave payment initiation failed');
    }

    const data = (await response.json()) as {
      data: {
        tx_ref: string;
        link: string;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    return {
      providerTransactionId: data.data.tx_ref,
      transactionRef: charge.transactionRef,
      status: PaymentSessionStatus.PENDING,
      redirectUrl: data.data.link,
      rawResponse: data.data,
    };
  }

  async verifyPayment(transactionRef: string): Promise<PaymentVerification> {
    const response = await fetch(`${this.baseUrl}/transactions/${transactionRef}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
      },
    });

    if (!response.ok) {
      const error = (await response.json()) as { message?: string };
      throw new Error(error.message || 'Flutterwave verification failed');
    }

    const data = (await response.json()) as {
      data: {
        id: number | string;
        tx_ref: string;
        status: string;
        amount: number;
        flw_ref: string;
        created_at: string;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    const transaction = data.data;

    return {
      providerTransactionId: transaction.id.toString(),
      transactionRef: transaction.tx_ref,
      status: transaction.status === 'successful' ? PaymentSessionStatus.SUCCESS : PaymentSessionStatus.FAILED,
      amountCharged: transaction.amount,
      receiptCode: transaction.flw_ref,
      completedAt: new Date(transaction.created_at),
      rawResponse: transaction,
    };
  }

  async refundPayment(transactionRef: string, amount?: number): Promise<RefundResult> {
    const body: any = { transaction_id: transactionRef };
    if (amount) {
      body.amount = amount;
    }

    const response = await fetch(`${this.baseUrl}/transactions/${transactionRef}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = (await response.json()) as { message?: string };
      throw new Error(error.message || 'Flutterwave refund failed');
    }

    const data = (await response.json()) as {
      data: {
        id: number | string;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    return {
      providerRefundId: String(data.data.id),
      transactionRef,
      amountRefunded: amount || 0,
      status: 'SUCCESS',
      completedAt: new Date(),
    };
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    const event = payload.event;
    const data = payload.rawBody as any;

    if (event === 'charge.completed' || event === 'transfer.completed') {
      // Process successful payment
      console.log('Flutterwave payment completed:', data);
    }
  }

  async validateConfig(): Promise<boolean> {
    if (!this.config.publicKey || !this.config.secretKey) {
      throw new Error('Flutterwave API keys are required');
    }
    return true;
  }
}
