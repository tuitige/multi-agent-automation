import { ZohoLeadSchema } from '../utils/schemas';

describe('ZohoLeadSchema', () => {
  it('should validate correct lead data', () => {
    const validLead = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      company: 'ACME Corp',
      phone: '+1234567890',
      leadSource: 'Website',
      description: 'Interested in our services',
    };

    const result = ZohoLeadSchema.safeParse(validLead);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const invalidLead = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
      company: 'ACME Corp',
    };

    const result = ZohoLeadSchema.safeParse(invalidLead);
    expect(result.success).toBe(false);
  });

  it('should require required fields', () => {
    const incompleteLead = {
      firstName: 'John',
      // Missing lastName, email, company
    };

    const result = ZohoLeadSchema.safeParse(incompleteLead);
    expect(result.success).toBe(false);
  });

  it('should set default leadSource', () => {
    const leadData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      company: 'ACME Corp',
    };

    const result = ZohoLeadSchema.parse(leadData);
    expect(result.leadSource).toBe('API');
  });
});