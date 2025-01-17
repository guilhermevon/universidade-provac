import express from "express";
import cors from "cors";
import cursosRouter from "./routes/cursos.js";
import funcoesRouter from "./routes/funcoes.js";
import provasRouter from "./routes/provas.js";
import rankingRouter from "./routes/ranking.js";
import usersRouter from "./routes/users.js";
import dotenv from "dotenv";

dotenv.config(); // Carrega variáveis do .env
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

const allowedOrigins = [
  "http://localhost:4000", // Frontend em ambiente de desenvolvimento
  "http://192.168.0.232:9220", // Frontend em produção
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        // Permite requisições sem origin (ex.: tools internas) ou de origens válidas
        callback(null, true);
      } else {
        callback(new Error("Não permitido pela política de CORS"));
      }
    },
    credentials: true, // Permite envio de cookies e autenticação
  })
);

app.use(express.json({ limit: "10mb" }));

// Rotas
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
