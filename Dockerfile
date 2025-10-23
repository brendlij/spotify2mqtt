# ---- Base image ----
FROM node:22-alpine

# Optional: Patch Alpine packages (security updates)
RUN apk upgrade --no-cache

# ---- App setup ----
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Copy source ----
COPY . .

# ---- Environment ----
ENV NODE_ENV=production
EXPOSE 9999

# ---- Start ----
CMD ["node", "index.js"]
