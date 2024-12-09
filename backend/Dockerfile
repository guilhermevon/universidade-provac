# Use a imagem base do Node.js
FROM node:18 AS backend

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copiar os arquivos package.json e package-lock.json da raiz do projeto para o contêiner
COPY ../package*.json ./

# Instalar as dependências
RUN npm install

# Copiar o restante dos arquivos do backend para o contêiner
COPY ./backend .

# Expor a porta que a aplicação irá usar
EXPOSE 9301

# Comando para iniciar o servidor
CMD ["npm", "start"]
