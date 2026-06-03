# aiTA grading worker — Cloud Run service (Phase 4).
FROM node:20-slim
WORKDIR /app
COPY package.json ./
# No dependencies (uses Node built-in fetch + http); npm ci is a no-op but keeps the layer explicit.
RUN npm install --omit=dev || true
COPY index.mjs ./
ENV PORT=8080
EXPOSE 8080
CMD ["node", "index.mjs"]
