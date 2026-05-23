import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';

// ========================
// JWT Payload Types
// ========================

export interface AccessTokenPayload {
  maTaiKhoan: string;
  tenDangNhap: string;
  vaiTro: string;
}

export interface RefreshTokenPayload {
  maTaiKhoan: string;
  maRefreshToken: string;
}

// ========================
// Token Generation
// ========================

/**
 * Sign an access token (short-lived)
 */
export const signAccessToken = (payload: AccessTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, options);
};

/**
 * Sign a refresh token (long-lived)
 */
export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, options);
};

// ========================
// Token Verification
// ========================

/**
 * Verify an access token and return the payload
 */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload &
    AccessTokenPayload;
  return {
    maTaiKhoan: decoded.maTaiKhoan,
    tenDangNhap: decoded.tenDangNhap,
    vaiTro: decoded.vaiTro,
  };
};

/**
 * Verify a refresh token and return the payload
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtPayload &
    RefreshTokenPayload;
  return {
    maTaiKhoan: decoded.maTaiKhoan,
    maRefreshToken: decoded.maRefreshToken,
  };
};

/**
 * Calculate expiry Date from duration string (e.g. "7d", "15m")
 */
export const calculateExpiry = (duration: string): Date => {
  const now = Date.now();
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Định dạng thời gian không hợp lệ: ${duration}`);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(now + value * multipliers[unit]);
};
