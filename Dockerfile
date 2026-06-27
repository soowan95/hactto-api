# 1. Build stage
FROM node:22-alpine

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Add NPM_TOKEN argument for private packages
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc && \
    npm install && \
    rm -f .npmrc

# Copy source code
COPY . .

ENV NODE_ENV=production

# Generate Prisma Client (Provide dummy DATABASE_URL to avoid PrismaConfigEnvError)
RUN DATABASE_URL="mysql://dummy:dummy@dummy:3306/dummy" npx prisma generate --schema=./prisma/schema/

# Build NestJS application
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
