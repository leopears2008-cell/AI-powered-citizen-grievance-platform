# Container image for the full NivaranAI app (Express API + built React client).
# Suited to any Node/container host (Cloud Run, Render, Railway, Fly.io).
# NOTE: the compiled server still requires `vite` at start-up (it is imported at the
# top of server.ts), so dev dependencies are intentionally kept in the image.
FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
RUN npm install --include=dev --no-audit --no-fund

COPY . .
RUN npm run build

USER node
EXPOSE 3000
CMD ["node", "scripts/start-server.mjs"]
