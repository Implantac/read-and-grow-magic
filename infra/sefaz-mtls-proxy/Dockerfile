# Dockerfile mínimo para o proxy mTLS SEFAZ.
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
ENV NODE_ENV=production
ENV PORT=8443
EXPOSE 8443
USER node
CMD ["node", "server.js"]
