# Usar a imagem do Node.js
FROM node:18 AS backend

# Instalar dependências do backend
WORKDIR /usr/src/app
COPY ../package*.json ./
RUN npm install
COPY . .

# Baixar e configurar o PostgreSQL
FROM postgres:15 AS db

# Configurar o banco de dados no mesmo contêiner
ENV POSTGRES_USER=admin_provac
ENV POSTGRES_PASSWORD=Provac@2024
ENV POSTGRES_DB=provac_producao

# Expor as portas do backend e do banco de dados
EXPOSE 9301 5432

# Rodar o banco e o backend
CMD ["sh", "-c", "pg_ctlcluster 15 main start && npm start"]
