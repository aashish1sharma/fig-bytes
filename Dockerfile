FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY scripts ./scripts
COPY public ./public

ENV HOST=0.0.0.0
ENV PORT=3456

EXPOSE 3456

CMD ["node", "scripts/server.mjs"]
