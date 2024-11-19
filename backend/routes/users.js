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

app.post("/api/register", async (req, res) => {
  const {
    usuario,
    email,
    password,
    funcao,
    departamento,
    role = "user",
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO educ_system.educ_users (usuario, email, senha, funcao, dp, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [usuario, email, hashedPassword, funcao, departamento, role]
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
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM educ_system.educ_users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Usuário não encontrado" });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.senha);

    if (!isPasswordValid) {
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
);
