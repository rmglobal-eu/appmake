FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY tsconfig.json ./

RUN npm install -g tsx

EXPOSE 3001

CMD ["tsx", "server/ws.ts"]
