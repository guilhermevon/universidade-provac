# Universidade Provac - Sistema com vários cursos e aulas e ranking de pontuação

## Passo a passo para inicialização na universidade provac

### 1.abrir terminal entrar com 'ssh root@192.168.0.232'e parar o container da universidade conforme necessário
### 2.cd universidade-provac
### 3.docker build -t universidade-provac .
### 4.docker run -d -p 9220:9220 universidade-provac

#### Sempre que for alterar o projeto entre no arquivo server_backup.js e altere a linha 46 para false, pois aí voce alterara apenas o ambiente de teste, porem para subir as alteracoes desfaça e muude para true, para subir para ambiente de desenvolvimento em produção.
