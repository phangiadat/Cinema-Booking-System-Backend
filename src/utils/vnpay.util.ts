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
      // VNPay standard helper encodes keys and values
      const encodedKey = encodeURIComponent(key).replace(/%20/g, '+');
      const encodedVal = encodeURIComponent(String(val)).replace(/%20/g, '+');
      sorted[encodedKey] = encodedVal;
    }
  }
  return sorted;
}

/**
 * Canonical helper to build the signData string for VNPay.
 * It sorts keys alphabetically and joins them without further encoding.
 */
export function buildVnpaySignData(params: Record<string, any>): string {
  const sorted = sortObject(params);
  return Object.entries(sorted)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');
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

  const sortedParams = sortObject(params);
  const signData = buildVnpaySignData(params);
  const calculatedHash = generateVNPaySecureHash(params, secret);

  console.log('=== VNPAY SIGNATURE VERIFICATION DEBUG ===');
  console.log('Received query params:', JSON.stringify(queryParams, null, 2));
  console.log('Cleaned params for verification:', JSON.stringify(params, null, 2));
  console.log('Sorted params (single-encoded):', JSON.stringify(sortedParams, null, 2));
  console.log('signData string:', signData);
  console.log('Received hash:', secureHash);
  console.log('Calculated hash:', calculatedHash);
  console.log('Signature matches:', calculatedHash.toLowerCase() === String(secureHash).toLowerCase());
  console.log('==========================================');

  return calculatedHash.toLowerCase() === String(secureHash).toLowerCase();
}

/**
 * Generates the redirect query string for VNPay URL.
 * Just joins the already single-encoded keys and values of the sorted object.
 */
export function stringifyVNPayParams(sortedParams: Record<string, string>): string {
  return Object.entries(sortedParams)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');
}

