import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { hmacAuthMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { createZohoLeadTool } from './tools/create-zoho-lead';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Tool endpoints with HMAC authentication
app.use('/tools', hmacAuthMiddleware);
app.post('/tools/create-zoho-lead', createZohoLeadTool);

// Error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`MCP Server running on port ${port}`);
});