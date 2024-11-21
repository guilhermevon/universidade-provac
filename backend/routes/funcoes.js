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
  port: 5432,
});

const app = express();

app.get("/api/departamentos/:dp/funcoes", authenticateJWT, async (req, res) => {
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
});

app.get("/api/departamentos", authenticateJWT, async (req, res) => {
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
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));