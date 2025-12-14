# Build stage
FROM node:20-alpine AS build

RUN npm install -g pnpm

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client and build the application
RUN pnpm run db:generate && pnpm run build && pnpm prune --production

# Production stage
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Copy built application and dependencies from build stage
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package*.json ./

# Expose the application port
EXPOSE 3000/tcp

# Command to run the application
CMD ["node", "dist/src/main.js"]