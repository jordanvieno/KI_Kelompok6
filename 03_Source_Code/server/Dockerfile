FROM node:22-slim

# Install OpenSSL (dibutuhkan oleh Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Hugging Face Spaces exposes port 7860 by default
ENV PORT=7860
EXPOSE 7860

# Start the application
CMD ["npm", "start"]

# Trigger HF sync

