import crypto from 'crypto';
import { JwtPayload } from './jwt';

// In-memory store for SSO codes (in production, use Redis for multi-instance support)
// Code -> { userId, expiresAt, used }
interface SSOCodeRecord {
  userId: string;
  payload: JwtPayload;
  expiresAt: number;
  used: boolean;
}

const ssoCodes = new Map<string, SSOCodeRecord>();

// Cleanup expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, record] of ssoCodes.entries()) {
    if (record.expiresAt < now) {
      ssoCodes.delete(code);
    }
  }
}, 5 * 60 * 1000);

const SSO_CODE_EXPIRY_MS = 120 * 1000; // 120 seconds

/**
 * Generate a one-time SSO code for LMS
 * Returns the code (to be passed to LMS via redirect) and the payload for storage
 */
export const generateSSOCode = (payload: JwtPayload): string => {
  const code = crypto.randomUUID();
  const record: SSOCodeRecord = {
    userId: payload.userId,
    payload,
    expiresAt: Date.now() + SSO_CODE_EXPIRY_MS,
    used: false,
  };
  ssoCodes.set(code, record);
  return code;
};

/**
 * Consume a one-time SSO code and return the JWT payload
 * Returns null if code is invalid, expired, or already used
 */
export const consumeSSOCode = (code: string): JwtPayload | null => {
  const record = ssoCodes.get(code);
  
  if (!record) {
    return null;
  }
  
  if (record.used) {
    ssoCodes.delete(code);
    return null;
  }
  
  if (Date.now() > record.expiresAt) {
    ssoCodes.delete(code);
    return null;
  }
  
  // Mark as used
  record.used = true;
  ssoCodes.delete(code);
  
  return record.payload;
};

/**
 * Check if SSO code store is empty (for testing)
 */
export const clearSSOStore = (): void => {
  ssoCodes.clear();
};

/**
 * Get LMS backend URL from environment.
 *
 * NOTE: This must point to the LMS **backend** (where /auth/sso/callback is
 * registered), NOT the frontend Vite dev server. In the default dev setup
 * the LMS backend runs on 8080 and the frontend on 5173.
 */
export const getLMSURL = (): string => {
  return process.env.LMS_URL || 'http://localhost:8080';
};
