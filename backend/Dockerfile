# Use a imagem base do Node.js
FROM node:18

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copie apenas o package.json e package-lock.json para instalar dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar todos os arquivos do backend
COPY ./backend .

# Copiar o resto dos arquivos do projeto para o diretório de trabalho
COPY . .

# Remover o diretório node_modules de qualquer pasta não usada para evitar conflitos
RUN rm -rf node_modules

# Expondo a porta que a aplicação usará
# 9109 para teste, 9301 para produção
EXPOSE 9301

# Definindo a variável de ambiente API_MODE
# test = teste, production = produção
ENV API_MODE=production

# Comando para iniciar o servidor
CMD ["npm", "start"]
