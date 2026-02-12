FROM public.ecr.aws/docker/library/node:22-slim
WORKDIR /app

# Environment variables
ENV DOCKER_CONTAINER=1 \
    AWS_REGION=us-east-1 \
    AWS_DEFAULT_REGION=us-east-1 \
    PORT=8080

# Copy source files
COPY . .

# Install all dependencies (including devDependencies for build)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Build TypeScript
RUN npm run build

# Prune dev dependencies and set production mode
RUN npm prune --production
ENV NODE_ENV=production

# Run as non-root user
USER node

# AgentCore HTTPプロトコル要件: Port 8080
EXPOSE 8080

CMD ["node", "--require", "@opentelemetry/auto-instrumentations-node/register", "dist/index.js"]
