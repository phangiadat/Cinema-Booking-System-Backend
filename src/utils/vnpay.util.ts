import crypto from 'crypto';
import qs from 'qs';

/**
 * Sorts an object alphabetically by key.
 * Only removes null/undefined/empty values and preserves original keys and values.
 */
export function sortObject(obj: Record<string, any>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== '') {
      sorted[key] = String(val);
    }
  }
  return sorted;
}

/**
 * Canonical helper to build the signData string for VNPay.
 * It sorts keys alphabetically and stringifies using qs with encode: false.
 */
export function buildVnpaySignData(params: Record<string, any>): string {
  const sorted = sortObject(params);
  return qs.stringify(sorted, { encode: false });
}

/**
 * Generates the secure hash for VNPay.
 */
export function generateVNPaySecureHash(params: Record<string, any>, secret: string): string {
  const signData = buildVnpaySignData(params);
  const hmac = crypto.createHmac('sha512', secret);
  return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
}

/**
 * Verifies the secure hash returned from VNPay.
 */
export function verifyVNPaySignature(queryParams: Record<string, any>, secret: string): boolean {
  const secureHash = queryParams['vnp_SecureHash'];
  if (!secureHash) return false;

  // Clone parameters and remove secure hash params
  const params = { ...queryParams };
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];

  const calculatedHash = generateVNPaySecureHash(params, secret);

  // Debug log in development mode
  if (process.env.NODE_ENV === 'development') {
    const sortedParams = sortObject(params);
    const signData = buildVnpaySignData(params);
    console.log('=== VNPAY SIGNATURE VERIFICATION DEBUG ===');
    console.log('Received query params:', JSON.stringify(queryParams, null, 2));
    console.log('Cleaned params for verification:', JSON.stringify(params, null, 2));
    console.log('Sorted params:', JSON.stringify(sortedParams, null, 2));
    console.log('signData string:', signData);
    console.log('Received hash:', secureHash);
    console.log('Calculated hash:', calculatedHash);
    console.log('Signature matches:', calculatedHash.toLowerCase() === String(secureHash).toLowerCase());
    console.log('==========================================');
  }

  return calculatedHash.toLowerCase() === String(secureHash).toLowerCase();
}

/**
 * Generates the redirect query string for VNPay URL.
 * Stringifies the sorted parameters using qs with encode: false.
 */
export function stringifyVNPayParams(sortedParams: Record<string, string>): string {
  return qs.stringify(sortedParams, { encode: false });
}

