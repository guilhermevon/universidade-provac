const express = require("express");
const cors = require("cors");
const os = require("os");
const dotenv = require("dotenv");
const cursos = require("./routes/cursos");
const funcoes = require("./routes/funcoes");
const provas = require("./routes/provas");
const ranking = require("./routes/ranking");
const users = require("./routes/users");
const { Pool } = require("pg");

dotenv.config();

const pool = new Pool({
  user: "admin_provac",
  host: "192.168.0.232",
  database: "provac_producao",
  password: "Provac@2024",
  port: "5432",
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.stack);
  } else {
    console.log("Conexão bem-sucedida ao banco de dados!");
    release();
  }
});

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

app.use("/cursos", cursos);
app.use("/funcoes", funcoes);
app.use("/provas", provas);
app.use("/ranking", ranking);
app.use("/users", users);

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
