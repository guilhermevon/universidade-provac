# Dockerfile para o Frontend (React com Nginx)

# Etapa 1: Build do frontend com Node.js
FROM node:17.9.1 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# Etapa 2: Servir o frontend com Nginx
FROM nginx:1.19
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx-novo.conf /etc/nginx/conf.d/default.conf
EXPOSE 9220
CMD ["nginx", "-g", "daemon off;"]
