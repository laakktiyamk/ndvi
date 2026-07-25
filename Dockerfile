# Stage 1 — Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# Stage 2 — Build backend
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend ./
RUN npm run build

# Stage 3 — Final image
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=frontend-build /app/frontend/dist ./dist/frontend
COPY backend/package*.json ./
RUN npm install --omit=dev
EXPOSE 8000
CMD ["node", "dist/server.js"]