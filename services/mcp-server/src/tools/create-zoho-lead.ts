import { Request, Response } from 'express';
import axios from 'axios';
import { ZohoLeadSchema, ZohoLeadData } from '../utils/schemas';
import { generateIdempotencyKey, createZapierSignature } from '../utils/crypto';

interface ZapierConfig {
  webhookUrl: string;
  hmacSecret: string;
}

export const createZohoLeadTool = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request data
    const validationResult = ZohoLeadSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Invalid request data',
        details: validationResult.error.errors,
      });
      return;
    }

    const leadData: ZohoLeadData = validationResult.data;

    // Get Zapier configuration
    const zapierConfig = getZapierConfig();
    if (!zapierConfig) {
      res.status(500).json({ error: 'Zapier configuration not available' });
      return;
    }

    // Generate idempotency key to prevent duplicate requests
    const idempotencyKey = generateIdempotencyKey(leadData);

    // Prepare payload for Zapier
    const zapierPayload = {
      ...leadData,
      timestamp: new Date().toISOString(),
      idempotencyKey,
      source: 'multi-agent-automation',
    };

    const payloadString = JSON.stringify(zapierPayload);

    // Create HMAC signature for Zapier
    const signature = createZapierSignature(payloadString, zapierConfig.hmacSecret);

    // Send to Zapier webhook
    const zapierResponse = await axios.post(zapierConfig.webhookUrl, zapierPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-Idempotency-Key': idempotencyKey,
      },
      timeout: 10000, // 10 second timeout
    });

    // Return success response
    res.status(200).json({
      success: true,
      leadId: idempotencyKey,
      message: 'Zoho lead created successfully',
      zapierStatus: zapierResponse.status,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error creating Zoho lead:', error);
    
    if (axios.isAxiosError(error)) {
      res.status(502).json({
        error: 'Failed to send to Zapier',
        details: error.message,
        status: error.response?.status,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
};

function getZapierConfig(): ZapierConfig | null {
  // In production, this comes from AWS Secrets Manager
  const zapierConfigEnv = process.env.ZAPIER_CONFIG;
  if (zapierConfigEnv) {
    try {
      const config = JSON.parse(zapierConfigEnv);
      if (config.webhookUrl && config.hmacSecret) {
        return config;
      }
    } catch (error) {
      console.error('Failed to parse ZAPIER_CONFIG:', error);
    }
  }

  // Fallback to individual environment variables for development
  const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;
  const hmacSecret = process.env.ZAPIER_HMAC_SECRET;

  if (webhookUrl && hmacSecret) {
    return { webhookUrl, hmacSecret };
  }

  return null;
}