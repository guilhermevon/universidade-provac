import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pkg from "pg";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv"; // Para usar variáveis de ambiente

dotenv.config();

const { Pool } = pkg;

// Configurações do banco de dados
const pool = new Pool({
  user: process.env.DB_USER || "admin_provac",
  host: process.env.DB_HOST || "192.168.0.232",
  database: process.env.DB_NAME || "provac_producao",
  password: process.env.DB_PASSWORD || "Provac@2024",
  port: process.env.DB_PORT || "5432",
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

// Middleware de rate limit para login
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
  // Validação de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "E-mail inválido" });
  }
  next();
};

// ? Rota de autenticação e login
userRouter.post("/login", loginLimiter, async (req, res, next) => {
  const { matricula, senha } = req.body;

  if (!matricula || !senha) {
    return res.status(400).json({ error: "Informe a matrícula e a senha" });
  }

  try {
    const sql = "SELECT * FROM educ_system.educ_users WHERE matricula = $1";
    const result = await pool.query(sql, [matricula]);

    if (result.rows.length === 0) {
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
    next(err); // Envia para o middleware de erro
  }
});

// ? Rota de registro de usuário
userRouter.post("/register", validateRegisterData, async (req, res, next) => {
  const { matricula, senha, usuario, email, funcao, dp, role, foto } = req.body;

  try {
    const checkUserQuery =
      "SELECT id FROM educ_system.educ_users WHERE matricula = $1";
    const userExists = await pool.query(checkUserQuery, [matricula]);

    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: "Usuário já existe" });
    }

    const hashedSenha = await bcrypt.hash(senha, 10);
    const insertUserQuery = `
        INSERT INTO educ_system.educ_users 
        (matricula, senha, usuario, email, funcao, dp, role, foto)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, usuario, matricula, email, funcao, dp, role, foto
      `;

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

    const newUser = result.rows[0];
    res.status(201).json({
      message: "Usuário registrado com sucesso",
      user: newUser,
    });
  } catch (err) {
    next(err); // Envia para o middleware de erro
  }
});

// ? Rota para buscar departamentos
userRouter.get("/departamento", async (req, res, next) => {
  try {
    const sql =
      "SELECT DISTINCT dp AS departamento FROM educ_system.educ_users";
    const result = await pool.query(sql);
    res.status(200).json(result.rows);
  } catch (err) {
    next(err); // Envia para o middleware de erro
  }
});

// ? Rota para buscar funções por departamento
userRouter.get(
  "/departamento/:selectedDepartamento/funcoes",
  async (req, res, next) => {
    const { selectedDepartamento } = req.params;

    if (!selectedDepartamento) {
      return res
        .status(400)
        .json({ error: "Departamento não fornecido na URL" });
    }

    try {
      const sql = `
        SELECT funcao 
        FROM educ_system.educ_users 
        WHERE dp = $1
      `;
      const result = await pool.query(sql, [selectedDepartamento]);
      res.status(200).json(result.rows);
    } catch (err) {
      next(err); // Envia para o middleware de erro
    }
  }
);

// Middleware de erro
userRouter.use((err, req, res, next) => {
  console.error("Erro:", err.stack);
  res.status(500).json({ error: "Erro interno do servidor" });
});

module.exports = userRouter;
export default app; // Exporta apenas a aplicação Express

//------------------------------------------------------------------------------------------------------------------
/*import express from "express";
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
    console.error('Erro ao conectar ao banco de dados:', err.stack);
    return;
  }

  // Definindo o search_path para o schema educ_system
  client.query('SET search_path TO educ_system', (err, res) => {
    if (err) {
      console.error('Erro ao configurar o search_path:', err.stack);
    }
    // Você agora pode fazer as consultas no schema educ_system
    release();
  });
});

const app = express();

app.post("/api/register", async (req, res) => {
  const {
    usuario,
    email,
    senha,
    funcao,
    departamento,
    role = "user",
  } = req.body;

  try {
    const hashedsenha = await bcrypt.hash(senha, 10);

    const result = await pool.query(
      "INSERT INTO educ_system.educ_users (usuario, email, senha, funcao, dp, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [usuario, email, hashedsenha, funcao, departamento, role]
    );

    const newUser = result.rows[0];

    const token = jwt.sign(
      { id: newUser.id },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1h" }
    );

    req.session.token = token;

    console.log("Novo usuário registrado:", newUser);

    res.status(201).json({
      message: "Cadastro realizado com sucesso!",
      user: { id: newUser.id, email: newUser.email, usuario: newUser.usuario },
      token,
    });
  } catch (error) {
    console.error("Erro durante o registro:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM educ_system.educ_users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Usuário não encontrado" });
    }

    const user = result.rows[0];
    const issenhaValid = await bcrypt.compare(senha, user.senha);

    if (!issenhaValid) {
      return res.status(400).json({ message: "Senha inválida" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1h" }
    );

    req.session.token = token;

    console.log("Usuário logado:", user);

    res.json({
      message: "Login efetuado com sucesso!",
      user: {
        id: user.id,
        email: user.email,
        usuario: user.usuario,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Erro durante o login:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.get(
  "/api/user/:userId/mandatory-courses",
  authenticateJWT,
  async (req, res) => {
    const { userId } = req.params;

    try {
      const userResult = await pool.query(
        "SELECT funcao FROM educ_system.educ_users WHERE id = $1",
        [userId]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const userFuncao = userResult.rows[0].funcao;

      const mandatoryCoursesResult = await pool.query(
        `SELECT c.id, c.title, c.subtitle, c.img 
         FROM educ_system.courses c
         JOIN educ_system.cursos_obrigatorios co ON c.id = co.id_curso
         JOIN educ_system.funcoes f ON co.id_funcao = f.id
         WHERE f.funcao = $1`,
        [userFuncao]
      );

      res.json(mandatoryCoursesResult.rows);
    } catch (error) {
      console.error("Erro ao buscar cursos obrigatórios:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
); */
