# Use a imagem base do Node.js
FROM node:18 AS build

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install --legacy-peer-deps

# Copiar o código-fonte do frontend
COPY . .

# Construir a aplicação
RUN npm run build

# Usar o nginx para servir a aplicação
FROM nginx:1.19
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx-novo.conf /etc/nginx/conf.d/default.conf
EXPOSE 9220
CMD ["nginx", "-g", "daemon off;"]
