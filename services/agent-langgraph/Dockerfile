FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S agent -u 1001

USER agent

EXPOSE 3001

CMD ["npm", "start"]