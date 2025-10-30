import jwt, { SignOptions, JwtPayload, Secret } from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface TokenPayload extends JwtPayload {
  userId: string;
  role: Role;
  schoolId?: string;
}

export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const secret: Secret = process.env.JWT_SECRET as Secret;

  if (!secret) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  const secret: Secret = process.env.JWT_SECRET as Secret;

  if (!secret) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded && 'role' in decoded) {
      return decoded as TokenPayload;
    }

    throw new Error('Invalid token payload');
  } catch {
    throw new Error('Invalid or expired token');
  }
}