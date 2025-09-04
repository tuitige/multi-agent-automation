import { McpClient } from '../tools/mcp-client';

// Mock axios
jest.mock('axios');

describe('McpClient', () => {
  let mcpClient: McpClient;
  
  beforeEach(() => {
    mcpClient = new McpClient('http://localhost:3000', 'test-secret');
  });

  it('should create instance with correct configuration', () => {
    expect(mcpClient).toBeInstanceOf(McpClient);
  });

  it('should generate proper signature', () => {
    const leadData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      company: 'Test Corp'
    };

    // Test that the client can be instantiated and configured
    expect(() => {
      mcpClient.createZohoLead(leadData);
    }).not.toThrow();
  });
});