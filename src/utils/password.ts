import bcrypt from 'bcrypt';
import { env } from '../config/env';

/**
 * Hash a plain text password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
};

/**
 * Compare plain text password with hashed password
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Hash a refresh token for secure storage
 */
export const hashToken = async (token: string): Promise<string> => {
  return bcrypt.hash(token, env.BCRYPT_SALT_ROUNDS);
};

/**
 * Compare raw token with stored hash
 */
export const compareToken = async (
  token: string,
  hashedToken: string,
): Promise<boolean> => {
  return bcrypt.compare(token, hashedToken);
};
