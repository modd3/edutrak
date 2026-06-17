/**
 * Payment Provider Types
 *
 * Core types for the payment provider abstraction layer.
 * These types define the contract between the fee module and
 * external payment gateways (Daraja, Flutterwave, Stripe, etc.).
 */

// ─── DTOs ──────────────────────────────────────────────────────────────────────

export interface ChargeDTO {
  /** Amount in minor units (e.g., 50000 = 500.00 KES) */
  amount: number;
  /** ISO 4217 currency code */
  currency: string;
  /** Unique reference for this transaction */
  transactionRef: string;
  /** Description shown on payment prompt */
  description: string;
  /** Customer phone number (E.164 format) */
  phoneNumber?: string;
  /** Customer email */
  email?: string;
  /** Additional provider-specific metadata */
  metadata?: Record<string, unknown>;
  /** Callback URL for async payment notifications */
  callbackUrl?: string;
}

export interface PaymentSession {
  /** Provider-assigned transaction ID */
  providerTransactionId: string;
  /** Reference our system uses */
  transactionRef: string;
  /** Current status of the session */
  status: PaymentSessionStatus;
  /** URL to redirect user to (for CARD/REDIRECT methods) */
  redirectUrl?: string;
  /** STK Push prompt request ID (Daraja-specific) */
  merchantRequestId?: string;
  /** Raw provider response for audit */
  rawResponse?: Record<string, unknown>;
}

export enum PaymentSessionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  /** Waiting for user to enter PIN on their phone */
  AWAITING_PIN = 'AWAITING_PIN',
  /** Waiting for callback/webhook confirmation */
  AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION',
}

export interface PaymentVerification {
  providerTransactionId: string;
  transactionRef: string;
  status: PaymentSessionStatus;
  /** Amount that was actually charged (may differ from requested) */
  amountCharged: number;
  /** Provider receipt/conformation code */
  receiptCode?: string;
  /** When the payment was completed */
  completedAt?: Date;
  /** Raw provider response */
  rawResponse?: Record<string, unknown>;
}

export interface RefundResult {
  providerRefundId: string;
  transactionRef: string;
  amountRefunded: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  completedAt?: Date;
}

export interface WebhookPayload<T = Record<string, unknown>> {
  provider: string;
  event: string;
  rawBody: T;
  signature?: string;
  timestamp?: string;
}

// ─── Provider Interface ─────────────────────────────────────────────────────────

export interface IPaymentProvider {
  /**
   * Unique identifier for this provider (e.g., "MPESA", "FLUTTERWAVE", "STRIPE")
   */
  readonly providerName: string;

  /**
   * Initiate a payment charge.
   * For synchronous providers (CARD), this returns the final status.
   * For async providers (MPESA STK Push), this returns AWAITING_CONFIRMATION.
   */
  initiatePayment(charge: ChargeDTO): Promise<PaymentSession>;

  /**
   * Verify the status of a transaction.
   * Called from the idempotency layer or manual reconciliation.
   */
  verifyPayment(transactionRef: string): Promise<PaymentVerification>;

  /**
   * Process a refund for a completed transaction.
   */
  refundPayment(transactionRef: string, amount?: number): Promise<RefundResult>;

  /**
   * Handle an incoming webhook from the provider.
   * The implementing class should parse, validate signature, and process the event.
   */
  handleWebhook(payload: WebhookPayload): Promise<void>;

  /**
   * Validate the provider configuration (API keys, secrets, etc.)
   * Throws if configuration is invalid.
   */
  validateConfig(): Promise<boolean>;
}

// ─── Provider Config ────────────────────────────────────────────────────────────

export interface ProviderConfig {
  id: string;
  tenantId: string;
  provider: string;
  apiKey: string;
  secretKey: string;
  callbackUrl?: string;
  webhookSecret?: string;
  isActive: boolean;
  /** Provider-specific extra settings (e.g., Daraja passkey, shortcode) */
  extraConfig?: Record<string, string>;
}

// ─── Online Payment Request (for API) ───────────────────────────────────────────

export interface OnlinePaymentRequest {
  invoiceId: string;
  phoneNumber: string;
  provider?: string; // defaults to school's primary active provider
  callbackUrl?: string;
}

export interface OnlinePaymentResponse {
  paymentSession: PaymentSession;
  invoiceId: string;
  receiptNo?: string;
}

// ─── Idempotency ────────────────────────────────────────────────────────────────

export interface IdempotencyRecord {
  key: string;
  response: unknown;
  createdAt: Date;
  ttl: number;
}

export interface IdempotencyOptions {
  ttl?: number; // seconds, default 86400 (24h)
  prefix?: string;
}