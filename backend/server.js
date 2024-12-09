import express from "express";
import cors from "cors";
import os from "os";
import dotenv from "dotenv";
import cursos from "./routes/cursos";
import funcoes from "./routes/funcoes";
import provas from "./routes/provas";
import ranking from "./routes/ranking";
import users from "./routes/users";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Pool } = pkg;

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
    release(); // Libera a conexão de volta ao pool
  }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.stack);
    return;
  }

  // Definindo o search_path para o schema educ_system
  client.query("SET search_path TO educ_system", (err, res) => {
    if (err) {
      console.error("Erro ao configurar o search_path:", err.stack);
    }
    // Você agora pode fazer as consultas no schema educ_system
    release();
  });
});
//-------------------------------------------------------------------------------------------

const app = express();
const networkInterfaces = os.networkInterfaces();
const ipv4Address = "192.168.0.232"; // Altere se necessário

// Configuração da porta baseada no ambiente
let port;
if (process.env.API_MODE === "production") {
  port = process.env.PORT_SERVER_PROD || 9310;
} else if (process.env.API_MODE === "test") {
  port = process.env.PORT_SERVER_TEST || 9309;
} else {
  console.error("API_MODE não definido ou inválido");
  process.exit(1);
}

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Limite de payload JSON

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
  console.log(
    `Solicitação processada pelo processo http://${ipv4Address}:${port}`
  );
});

app.listen(port, () => {
  console.log(`Servidor em execução no endereço http://${ipv4Address}:${port}`);
});
