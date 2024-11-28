const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/dbConnection.js"); // Importe o pool de conexão

const userRouter = express.Router();

// ? Rota de autenticação e login
userRouter.post("/login", async (req, res) => {
  const { matricula, senha } = req.body;

  if (!matricula || !senha) {
    return res.status(400).send("Informe a matrícula e a senha");
  }

  try {
    // Consulta ao banco de dados para obter o usuário
    const sql = "SELECT * FROM educ_system.educ_users WHERE matricula = $1";
    const result = await pool.query(sql, [matricula]);

    if (result.rows.length === 0) {
      return res.status(401).send("Credenciais inválidas");
    }

    const user = result.rows[0];

    // Verifica a senha utilizando bcrypt
    const issenhaValid = await bcrypt.compare(senha, user.senha);
    if (!issenhaValid) {
      return res.status(401).send("Credenciais inválidas");
    }

    // Gera um token JWT para autenticação
    const token = jwt.sign(
      { id: user.id, matricula: user.matricula },
      process.env.JWT_SECRET || "fghdfghdfghdfghsfgdfgdfsgsdfhfgchdfghfdg",
      { expiresIn: "1h" }
    );

    res.json({ message: "Login bem-sucedido", token, user });
  } catch (err) {
    console.error("Erro ao realizar login:", err);
    res.status(500).send("Erro ao realizar o login");
  }
});

userRouter.post("/register", async (req, res) => {
  const { matricula, senha, usuario, email, funcao, dp, role, foto } = req.body;

  // Verificar se todos os campos obrigatórios foram fornecidos
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
    return res.status(400).send("Todos os campos são obrigatórios");
  }

  try {
    // Verificar se o usuário já existe
    const checkUserQuery =
      "SELECT id FROM educ_system.educ_users WHERE matricula = $1";
    const userExists = await pool.query(checkUserQuery, [matricula]);

    if (userExists.rows.length > 0) {
      return res.status(409).send("Usuário já existe");
    }

    // Criptografar a senha
    const hashedSenha = await bcrypt.hash(senha, 10);

    // Inserir o novo usuário no banco de dados
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
      role,
      foto,
    ]);

    const newUser = result.rows[0];

    // Retornar sucesso com os dados do usuário recém-criado
    res.status(201).json({
      message: "Usuário registrado com sucesso",
      user: newUser,
    });
  } catch (err) {
    console.error("Erro ao registrar o usuário:", err);
    res.status(500).send("Erro interno do servidor");
  }
});

userRouter.get("/departamento", async (req, res) => {
  try {
    // Consulta para buscar departamentos distintos
    const sql =
      "SELECT DISTINCT dp AS departamento FROM educ_system.educ_users";
    const result = await pool.query(sql);

    // Retorna os resultados em JSON
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao consultar os departamentos:", err);
    res.status(500).send("Erro ao consultar o banco de dados");
  }
});

userRouter.get(
  "/departamento/:selectedDepartamento/funcoes",
  async (req, res) => {
    const { selectedDepartamento } = req.params;

    try {
      // Exemplo de consulta ao banco de dados
      const sql = `
      SELECT funcao 
      FROM educ_system.educ_users 
      WHERE dp = $1
    `;
      const result = await pool.query(sql, [selectedDepartamento]);

      // Retorna as funções relacionadas ao departamento selecionado
      res.status(200).json(result.rows);
    } catch (err) {
      console.error("Erro ao consultar as funções:", err);
      res.status(500).send("Erro ao consultar o banco de dados");
    }
  }
);

module.exports = userRouter;

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
  senha: "Provac@2024",
  port: 5432,
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
