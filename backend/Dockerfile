# Dockerfile para o Backend e Banco de Dados (PostgreSQL) no mesmo contêiner

# Etapa 1: Configuração do Backend com Node.js
FROM node:18 AS backend

# Instalar dependências do backend
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

# Etapa 2: Configuração do PostgreSQL
FROM postgres:15 AS db

# Configurar o PostgreSQL
ENV POSTGRES_USER=admin_provac
ENV POSTGRES_PASSWORD=Provac@2024
ENV POSTGRES_DB=provac_producao

# Expor as portas do backend e do PostgreSQL
EXPOSE 9301 5432

# Rodar o PostgreSQL e o Backend
CMD ["sh", "-c", "pg_ctlcluster 15 main start && npm start"]
