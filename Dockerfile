# Stage 1: build
FROM node:18 AS build

WORKDIR /app

# Copia só os package.json e package-lock.json (para cache)
COPY ./src/package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do código fonte
COPY ./src .

# Stage 2: produção
FROM node:18-slim

WORKDIR /app

# Copia do estágio build apenas o node_modules e o código fonte
COPY --from=build /app .

EXPOSE 3000

CMD ["node", "index.js"]
