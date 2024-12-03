# Use uma imagem base do Node.js
FROM node:18

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copie os arquivos necessários
COPY package*.json ./
RUN npm install

COPY ./backend .

# Remover o diretório node_modules para evitar conflitos
RUN rm -rf node_modules

# Copiando arquivos do projeto para o diretório de trabalho
COPY . .

# Expondo a porta que a aplicação usará
# 9109 para teste 9301 para produção
EXPOSE 9301

# Definindo a variável de ambiente API_MODE
# test = teste produção = production
ENV API_MODE=production

# Comando para iniciar o servidor
CMD ["npm", "configs.js"]
