import crypto from 'crypto';

export function generateIdempotencyKey(data: any): string {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function createZapierSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}