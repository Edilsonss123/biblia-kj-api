# Stage 1: build
FROM node:18 AS build

WORKDIR /app

COPY ./src/package*.json ./
RUN npm install

COPY ./src .

# Stage 2: produção
FROM node:18-slim

WORKDIR /app

COPY --from=build /app/index.js .
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json .

# Copia o banco de dados (se for necessário no container)
COPY ./src/bible.db .

EXPOSE 3000

CMD ["node", "index.js"]
