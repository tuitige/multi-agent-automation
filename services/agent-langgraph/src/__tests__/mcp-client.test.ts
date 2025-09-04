import { McpClient } from '../tools/mcp-client';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('McpClient', () => {
  let mcpClient: McpClient;
  
  beforeEach(() => {
    mcpClient = new McpClient('http://localhost:3000', 'test-secret');
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should create instance with correct configuration', () => {
    expect(mcpClient).toBeInstanceOf(McpClient);
  });

  it('should make proper API call with correct headers', async () => {
    const leadData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      company: 'Test Corp'
    };

    const mockResponse = { data: { success: true } };
    mockedAxios.post.mockResolvedValue(mockResponse);

    const result = await mcpClient.createZohoLead(leadData);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/tools/create-zoho-lead',
      leadData,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Signature': expect.any(String),
          'X-Timestamp': expect.any(String),
        }),
        timeout: 10000,
      })
    );
    
    expect(result).toEqual({ success: true });
  });
});