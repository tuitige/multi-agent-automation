import { z } from 'zod';

export const ZohoLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  company: z.string().min(1, 'Company is required'),
  phone: z.string().optional(),
  leadSource: z.string().optional().default('API'),
  description: z.string().optional(),
});

export type ZohoLeadData = z.infer<typeof ZohoLeadSchema>;