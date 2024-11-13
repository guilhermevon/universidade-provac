# Etapa 1: Build do projeto React
FROM node:14 as build

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia o package.json e o package-lock.json para instalar as dependências
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia todos os arquivos do projeto para o diretório de trabalho do container
COPY . .

# Compila o projeto React para produção
RUN npm run build

# Etapa 2: Servir a aplicação com Nginx
FROM nginx:alpine

# Copia os arquivos de build do React para o diretório padrão do Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Expor a porta 80 para o Nginx
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]
