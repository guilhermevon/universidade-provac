const express = require("express");
const cors = require("cors");

const server = express();

// Defina o IP e porta fixos
const ipv4Address = "192.168.0.232";
let port;

switch (process.env.API_MODE) {
  case "production":
    port = process.env.PORT_SERVER_PROD || 9301;
    break;
  case "test":
    port = process.env.PORT_SERVER_TEST || 9300;
    break;
  default:
    console.warn("API_MODE não definido. Usando modo de desenvolvimento.");
    port = 3000;
}

// Middleware para processar dados JSON
server.use(cors());
server.use(express.json({ limit: "10mb" })); // Ajuste o limite de payload, se necessário

const cursosRouter = require("./routes/cursos.js");
const funcoesRouter = require("./routes/funcoes.js");
const provasRouter = require("./routes/provas.js");
const rankingRouter = require("./routes/ranking.js");
const usersRouter = require("./routes/users.js");

server.use("/cursos", cursosRouter);
server.use("/funcoes", funcoesRouter);
server.use("/provas", provasRouter);
server.use("/ranking", rankingRouter);
server.use("/users", usersRouter);

server.get("/", (req, res) => {
  res.json({
    solicitacao: "Hello world!",
    mensagem: "Olá, eu sou o servidor!",
    routes: ["/cursos", "/funcoes", "/provas", "/ranking", "/users"].map(
      (route) => `http://${ipv4Address}:${port}${route}`
    ),
  });
  console.log(`Solicitação processada em http://${ipv4Address}:${port}`);
});

// Inicie o servidor na porta e IP fixos
server.listen(port, ipv4Address, () => {
  console.log(`Servidor em execução em http://${ipv4Address}:${port}`);
});
