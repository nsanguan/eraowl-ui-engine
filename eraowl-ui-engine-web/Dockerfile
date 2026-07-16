# ---- Build stage ----
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Build both designer and library
RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine AS runtime

# Copy built assets
COPY --from=builder /app/dist/designer /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
