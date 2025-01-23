import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import pool from "../db/dbConnection.js"; // Certifique-se de que o pool está funcionando
import validator from "validator";

dotenv.config();

const userRouter = express.Router();

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

// Rota GET para retornar todos os usuários
userRouter.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM educ_system.educ_users"); // Usando pool.query diretamente

    if (result.rows.length > 0) {
      return res.json(result.rows);
    } else {
      return res.status(404).json({ message: "Nenhum usuário encontrado." });
    }
  } catch (err) {
    console.error("Erro ao consultar o banco de dados:", err.stack);
    res.status(500).send("Erro ao consultar o banco de dados");
  }
});

/*userRouter.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body; // Receber email e senha do corpo da requisição

    // Consultar usuário pelo email
    const result = await pool.query(
      "SELECT senha FROM educ_system.educ_users WHERE email = $1",
      [email]
    );

    // Verificar se o email existe
    if (!result.rows.length) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }

    const senhaCorreta = result.rows[0].senha;

    // Verificar se a senha corresponde
    if (senha !== senhaCorreta) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }

    // Retorna uma resposta simples indicando sucesso
    res.status(200).json({ message: "Login realizado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});*/

const SECRET_KEY = "tokenCursos"; // Substitua pela sua chave secreta

function generateToken(userId) {
  return jwt.sign({ id: userId }, SECRET_KEY, { expiresIn: "3h" }); // Token válido por 1 hora
}

userRouter.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const result = await pool.query(
      "SELECT id, usuario, email, role, funcao, total_pontos, dp FROM educ_system.educ_users WHERE email = $1 AND senha = $2",
      [email, senha]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const user = result.rows[0];

    // Gera o token (exemplo)
    const token = generateToken(user.id); // Substitua pela sua lógica de geração de token

    res.json({
      token,
      user: {
        id: user.id,
        usuario: user.usuario,
        email: user.email,
        role: user.role,
        funcao: user.funcao,
        total_pontos: user.total_pontos,
        dp: user.dp,
      },
    });
  } catch (err) {
    console.error("Erro ao consultar o banco de dados:", err.stack);
    res.status(500).send("Erro ao consultar o banco de dados");
  }
});

// Rota GET para retornar todos os usuários
userRouter.get("/departamento", async (req, res) => {
  try {
    const result = await pool.query("SELECT dp FROM educ_system.educ_users"); // Usando pool.query diretamente

    if (result.rows.length > 0) {
      return res.json(result.rows);
    } else {
      return res.status(404).json({ message: "Nenhum usuário encontrado." });
    }
  } catch (err) {
    console.error("Erro ao consultar o banco de dados:", err.stack);
    res.status(500).send("Erro ao consultar o banco de dados");
  }
});

// Rota GET para retornar role de todos os usuários
userRouter.get("/role", async (req, res) => {
  try {
    const result = await pool.query("SELECT role FROM educ_system.educ_users"); // Usando pool.query diretamente

    if (result.rows.length > 0) {
      return res.json(result.rows);
    } else {
      return res.status(404).json({ message: "Nenhum usuário encontrado." });
    }
  } catch (err) {
    console.error("Erro ao consultar o banco de dados:", err.stack);
    res.status(500).send("Erro ao consultar o banco de dados");
  }
});

userRouter.post("/register", async (req, res) => {
  const { matricula, senha, usuario, email, funcao, dp, foto, role } = req.body;

  console.log("Dados recebidos no registro:", req.body);

  try {
    // Verifica se todos os campos obrigatórios foram preenchidos
    if (!matricula || !senha || !usuario || !email || !funcao || !dp || !role) {
      return res
        .status(400)
        .json({ error: "Preencha todos os campos obrigatórios." });
    }

    // Valida o formato do email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Email inválido." });
    }

    // Valida o formato da matrícula (exemplo: apenas números)
    if (!/^\d+$/.test(matricula)) {
      return res.status(400).json({ error: "Matrícula inválida." });
    }

    // Verifica duplicidade de email e matrícula
    const checkQuery = `
      SELECT 1 FROM educ_system.educ_users 
      WHERE matricula = $1 OR email = $2
    `;
    const result = await pool.query(checkQuery, [matricula, email]);
    if (result.rows.length > 0) {
      return res.status(409).json({ error: "Usuário ou email já registrado." });
    }

    // Query para inserir o usuário no banco de dados sem hash
    const query = `
      INSERT INTO educ_system.educ_users 
      (matricula, senha, usuario, email, funcao, dp, foto, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await pool.query(query, [
      matricula,
      senha, // Senha armazenada como texto simples
      usuario,
      email,
      funcao,
      dp,
      foto || null,
      role,
    ]);

    res.status(201).json({ message: "Usuário registrado com sucesso." });
  } catch (err) {
    console.error("Erro ao registrar usuário:", err);
    res
      .status(500)
      .json({ error: "Erro ao cadastrar. Detalhes no log do servidor." });
  }
});

userRouter.get(
  "/users/departamento/:departamento_id/funcoes",
  async (req, res) => {
    const departamentoId = req.params.departamento_id;
    console.log("Departamento ID recebido:", departamentoId); // Adicionar log
    try {
      const result = await db.query(
        "SELECT dp, funcao, departamento_id FROM educ_system.funcoes WHERE departamento_id = $1",
        [departamentoId]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .send({ error: "Nenhuma função ou departamento encontrado" });
      }

      const departamento = result.rows[0].dp;

      res.json({
        departamento,
        funcoes: result.rows.map((funcao) => ({
          id: funcao.departamento_id,
          funcao: funcao.funcao,
        })),
      });
    } catch (error) {
      console.error("Erro ao buscar funções:", error);
      res.status(500).send({ error: "Erro ao buscar funções" });
    }
  }
);

export default userRouter;
