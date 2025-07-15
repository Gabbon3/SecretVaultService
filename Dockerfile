# Fase di build
FROM node:20-alpine AS builder

WORKDIR /app

# Installa le dipendenze prima per caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copia il resto del codice
COPY . .

# Fase di runtime
FROM node:20-alpine

WORKDIR /app

# Copia solo il necessario dal builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

# Variabili d'ambiente di default
ENV NODE_ENV=production
ENV PORT=3000

# Esponi la porta e avvia l'app
EXPOSE ${PORT}
CMD ["node", "--no-deprecation", "./src/server.js"]