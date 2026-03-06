FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

# Copy workspace configuration
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./

# Copy project package.json files
COPY apps/link/package.json ./apps/link/
COPY packages/constants/package.json ./packages/constants/

# Install all deps for build
RUN npm config set registry https://registry.npmmirror.com/
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/link ./apps/link
COPY packages/constants ./packages/constants

# Build constants + link
RUN pnpm turbo run build --filter=link

# ==========================================

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

# Copy workspace config and node_modules for runtime
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules

# Copy link dist (including assets) and package.json
COPY --from=builder /app/apps/link/dist ./apps/link/dist
COPY --from=builder /app/apps/link/package.json ./apps/link/
COPY --from=builder /app/apps/link/node_modules ./apps/link/node_modules

# Copy constants dist
COPY --from=builder /app/packages/constants/dist ./packages/constants/dist
COPY --from=builder /app/packages/constants/package.json ./packages/constants/

WORKDIR /app/apps/link

EXPOSE 9800

CMD ["node", "dist/main.js"]
