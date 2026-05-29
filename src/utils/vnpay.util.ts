import crypto from 'crypto';

/**
 * Sorts an object alphabetically by key and URL encodes the values.
 * Replaces %20 with + as required by VNPay.
 */
export function sortObject(obj: Record<string, any>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null && val !== '') {
      // Do not URL encode the key if it is already safe, but to be sure we do standard encode
      // VNPay standard helper encodes keys and values
      const encodedKey = encodeURIComponent(key).replace(/%20/g, '+');
      const encodedVal = encodeURIComponent(String(val)).replace(/%20/g, '+');
      sorted[encodedKey] = encodedVal;
    }
  }
  return sorted;
}

/**
 * Generates the secure hash for VNPay.
 */
export function generateVNPaySecureHash(params: Record<string, any>, secret: string): string {
  const sortedParams = sortObject(params);
  const signData = Object.entries(sortedParams)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');
  
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
  
  return calculatedHash.toLowerCase() === String(secureHash).toLowerCase();
}
