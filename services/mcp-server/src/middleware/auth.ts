import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  isAuthenticated?: boolean;
}

export const hmacAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const signature = req.headers['x-signature'] as string;
    const timestamp = req.headers['x-timestamp'] as string;
    
    if (!signature || !timestamp) {
      res.status(401).json({ error: 'Missing authentication headers' });
      return;
    }

    // Check timestamp to prevent replay attacks (5 minute window)
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
      res.status(401).json({ error: 'Request timestamp too old' });
      return;
    }

    // Get HMAC secret from environment or AWS Secrets Manager
    const hmacSecret = getHmacSecret();
    if (!hmacSecret) {
      res.status(500).json({ error: 'HMAC configuration not available' });
      return;
    }

    // Create expected signature
    const payload = JSON.stringify(req.body) + timestamp;
    const expectedSignature = crypto
      .createHmac('sha256', hmacSecret)
      .update(payload)
      .digest('hex');

    // Compare signatures
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    req.isAuthenticated = true;
    next();
  } catch (error) {
    console.error('HMAC authentication error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

function getHmacSecret(): string | null {
  // In production, this would come from AWS Secrets Manager
  // For now, check environment variable
  const zapierConfig = process.env.ZAPIER_CONFIG;
  if (zapierConfig) {
    try {
      const config = JSON.parse(zapierConfig);
      return config.hmacSecret;
    } catch (error) {
      console.error('Failed to parse ZAPIER_CONFIG:', error);
    }
  }

  // Fallback to direct environment variable for development
  return process.env.HMAC_SECRET || null;
}