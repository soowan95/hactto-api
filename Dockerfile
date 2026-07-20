# 1. Build stage
FROM node:22-alpine

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Use BuildKit secrets to securely pass NPM_TOKEN without leaving it in the image history
RUN --mount=type=secret,id=npm_token \
    if [ -f /run/secrets/npm_token ]; then echo "//registry.npmjs.org/:_authToken=$(cat /run/secrets/npm_token)" > .npmrc; fi && \
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
