import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pkg from "pg"; // Importando como um pacote CommonJS
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg; // Extraindo Pool do módulo pg

const pool = new Pool({
  user: process.env.DB_USER || "admin_provac",
  host: process.env.DB_HOST || "192.168.0.232",
  database: process.env.DB_NAME || "provac_producao",
  password: process.env.DB_PASSWORD || "Provac@2024",
  port: process.env.DB_PORT || 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.stack);
  } else {
    console.log("Conexão bem-sucedida ao banco de dados!");
    release();
  }
});

const userRouter = express.Router();
const app = express();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limite de 10 requisições por IP
  message: { error: "Muitas tentativas de login. Tente novamente mais tarde." },
});

// Middleware para validação de dados
const validateRegisterData = (req, res, next) => {
  const { matricula, senha, usuario, email, funcao, dp, role, foto } = req.body;
  if (
    !matricula ||
    !senha ||
    !usuario ||
    !email ||
    !funcao ||
    !dp ||
    !role ||
    !foto
  ) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "E-mail inválido" });
  }
  next();
};

// Login
userRouter.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { matricula, senha } = req.body;
    const result = await pool.query(
      "SELECT * FROM educ_system.educ_users WHERE matricula = $1",
      [matricula]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const user = result.rows[0];
    const isSenhaValid = await bcrypt.compare(senha, user.senha);

    if (!isSenhaValid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { id: user.id, matricula: user.matricula },
      process.env.JWT_SECRET || "defaultSecret",
      { expiresIn: "1h" }
    );

    res.json({ message: "Login bem-sucedido", token, user });
  } catch (err) {
    next(err);
  }
});

// Registro
userRouter.post("/register", validateRegisterData, async (req, res, next) => {
  const { matricula, senha, usuario, email, funcao, dp, role, foto } = req.body;

  try {
    const hashedSenha = await bcrypt.hash(senha, 10);
    const insertUserQuery = `
      INSERT INTO educ_system.educ_users 
      (matricula, senha, usuario, email, funcao, dp, role, foto)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`;

    const result = await pool.query(insertUserQuery, [
      matricula,
      hashedSenha,
      usuario,
      email,
      funcao,
      dp,
      role || "user",
      foto,
    ]);

    res.status(201).json({
      message: "Usuário registrado com sucesso",
      user: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error("Erro:", err.stack);
  res.status(500).json({ error: "Erro interno do servidor" });
});f

export default userRouter;
