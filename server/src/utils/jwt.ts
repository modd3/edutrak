import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { Role } from '@prisma/client';
import ms from 'ms';

// EduTrak is the sole signer of these tokens (RS256): it holds the private
// key and never shares it. Any service that only needs to *verify* tokens
// (like LMS) is handed the public key instead, which can confirm a token
// came from EduTrak but can never be used to mint one.
//
// Generate the keypair once with:
//   openssl genrsa -out keys/jwt_private.pem 2048
//   openssl rsa -in keys/jwt_private.pem -pubout -out keys/jwt_public.pem
// Keep jwt_private.pem out of version control and out of anything shared
// with LMS - only jwt_public.pem ever leaves this service.
const JWT_ISSUER = 'edutrak';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const privateKey = readFileSync(
  process.env.JWT_PRIVATE_KEY_PATH || './keys/jwt_private.pem',
  'utf8'
);
const publicKey = readFileSync(
  process.env.JWT_PUBLIC_KEY_PATH || './keys/jwt_public.pem',
  'utf8'
);

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  schoolId?: string | null;
  // Distinguishes token kinds - access, refresh, and password-reset tokens
  // are all signed with this same key/issuer, so this field is the only
  // thing telling them apart. Any verifier trusting these tokens (this
  // service's own middleware, or LMS) MUST check this explicitly rather
  // than assuming a token is an access token just because the signature
  // checks out.
  type?: 'access' | 'refresh' | 'password-reset';
}

/**
 * Generate JWT token, signed with EduTrak's private key (RS256).
 */
export const generateToken = (
  payload: Partial<JwtPayload>,
  expiresIn = JWT_EXPIRES_IN as ms.StringValue
): string => {
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    issuer: JWT_ISSUER,
    expiresIn,
  });
};

/**
 * Verify JWT token against EduTrak's own public key.
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: JWT_ISSUER,
    }) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Decode JWT token without verification (useful for debugging)
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiration date
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};