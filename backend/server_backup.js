import express from "express";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";

dotenv.config();

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

const app = express();

// Middleware para logar as requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Configuração de CORS
app.use(
  cors({
    origin: ["http://192.168.0.232:9220"], // Adicione todas as origens necessárias
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true em produção, false em desenvolvimento
      maxAge: 1000 * 60 * 60, // 1 hora
    },
  })
);

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log("Acesso não autorizado: Cabeçalho de autorização ausente");
    return res.status(401).json({ message: "Acesso não autorizado" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret",
    (err, user) => {
      if (err) {
        console.log("Token inválido:", err.message);
        return res.status(403).json({ message: "Token inválido" });
      }
      req.user = user;
      next();
    }
  );
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
