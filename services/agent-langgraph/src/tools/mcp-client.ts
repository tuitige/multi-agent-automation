import crypto from 'crypto';
import axios from 'axios';

export interface McpToolRequest {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone?: string;
  leadSource?: string;
  description?: string;
}

export class McpClient {
  private baseUrl: string;
  private hmacSecret: string;

  constructor(baseUrl: string, hmacSecret: string) {
    this.baseUrl = baseUrl;
    this.hmacSecret = hmacSecret;
  }

  private createSignature(payload: string, timestamp: string): string {
    const data = payload + timestamp;
    return crypto.createHmac('sha256', this.hmacSecret).update(data).digest('hex');
  }

  async createZohoLead(leadData: McpToolRequest): Promise<any> {
    const timestamp = Date.now().toString();
    const payload = JSON.stringify(leadData);
    const signature = this.createSignature(payload, timestamp);

    const response = await axios.post(
      `${this.baseUrl}/tools/create-zoho-lead`,
      leadData,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
          'X-Timestamp': timestamp,
        },
        timeout: 10000,
      }
    );

    return response.data;
  }
}