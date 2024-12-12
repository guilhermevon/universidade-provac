import express from "express";
import pkg from "pg";
import jwt from "jsonwebtoken";
//import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const funcoesRouter = express.Router();

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

funcoesRouter.get(
  "/api/departamentos/:dp/funcoes",
  authenticateJWT,
  async (req, res) => {
    const { dp } = req.params;
    try {
      const result = await pool.query(
        "SELECT id, funcao FROM educ_system.funcoes WHERE dp = $1 ORDER BY funcao",
        [dp]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Erro ao buscar funções:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);

funcoesRouter.get("/api/departamentos", authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT dp FROM educ_system.funcoes ORDER BY dp"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar departamentos:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

const PORT = process.env.PORT || 5000;
funcoesRouter.listen(PORT, () =>
  console.log(`Servidor rodando na porta ${PORT}`)
);

export default funcoesRouter; // Exporta apenas a aplicação Express
