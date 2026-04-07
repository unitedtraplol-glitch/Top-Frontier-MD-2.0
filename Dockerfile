FROM node:20-slim

# Install required system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        git \
        ffmpeg \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy the rest of the app
COPY . .

# Expose port (Render uses dynamic ports but this is fine)
EXPOSE 5000

# Start the bot
CMD ["npm", "start"]
