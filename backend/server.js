import express from "express";
import cors from "cors";
import cursosRouter from "./routes/cursos.js";
import funcoesRouter from "./routes/funcoes.js";
import provasRouter from "./routes/provas.js";
import rankingRouter from "./routes/ranking.js";
import usersRouter from "./routes/users.js";

const app = express();
const ipv4Address = "192.168.0.232";

let port;
if (process.env.API_MODE === "production") {
  port = process.env.PORT_SERVER_PROD || 9310;
} else if (process.env.API_MODE === "test") {
  port = process.env.PORT_SERVER_TEST || 9309;
} else {
  console.error("API_MODE não definido ou inválido");
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/cursos", cursosRouter);
app.use("/funcoes", funcoesRouter);
app.use("/provas", provasRouter);
app.use("/ranking", rankingRouter);
app.use("/users", usersRouter);

app.get("/", (req, res) => {
  res.json({
    solicitacao: "Hello world!",
    mensagem: "Olá, eu sou o servidor!",
    routes: [
      `http://${ipv4Address}:${port}/cursos`,
      `http://${ipv4Address}:${port}/funcoes`,
      `http://${ipv4Address}:${port}/provas`,
      `http://${ipv4Address}:${port}/ranking`,
      `http://${ipv4Address}:${port}/users`,
    ],
  });
});

app.listen(port, () => {
  console.log(`Servidor em execução no endereço http://${ipv4Address}:${port}`);
});

export default express;
