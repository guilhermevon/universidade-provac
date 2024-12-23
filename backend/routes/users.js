import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import pool from "../db/dbConnection.js"; // Certifique-se de que o pool está funcionando

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

/*userRouter.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, senha } = req.body; // Recebe o email e senha

    // Verifique se a senha é uma string, caso contrário, converta-a para string
    const senhaStr = String(senha);

    // Consultar usuário pelo email
    const result = await pool.query(
      "SELECT * FROM educ_system.educ_users WHERE email = $1", // Busca pelo email
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const user = result.rows[0];

    // Verificar se a senha é válida, usando bcrypt
    const isSenhaValid = await bcrypt.compare(senhaStr, user.senha); // Aqui comparamos a senha

    if (!isSenhaValid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Gerar o token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "defaultSecret",
      { expiresIn: "1h" }
    );

    // Retornar o token e as informações do usuário
    res.json({ message: "Login bem-sucedido", token, user });
  } catch (err) {
    next(err);
  }
});*/

userRouter.post("/login", async (req, res) => {
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

// Registro
/*userRouter.post("/register", async (req, res) => {
  const { matricula, senha, usuario, email, funcao, dp, role, foto } = req.body;

  // Log para verificar os dados recebidos
  console.log("Dados recebidos no registro:", req.body);

  try {
    // Verifica se todos os campos obrigatórios foram preenchidos
    if (!matricula || !senha || !usuario || !email || !funcao || !dp) {
      return res
        .status(400)
        .json({ error: "Preencha todos os campos obrigatórios." });
    }

    // Gera o hash da senha
    const hashedSenha = await bcrypt.hash(senha, 10);

    // Query para inserir o usuário no banco de dados
    const query = `
      INSERT INTO educ_system.educ_users 
      (matricula, senha, usuario, email, funcao, dp, role, foto)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await pool.query(query, [
      matricula,
      hashedSenha,
      usuario,
      email,
      funcao,
      dp,
      role || "user", // Define 'user' como padrão se 'role' não for fornecido
      foto || null, // Permite que 'foto' seja nulo
    ]);

    // Resposta de sucesso
    res.status(201).json({ message: "Usuário registrado com sucesso." });
  } catch (err) {
    console.error("Erro ao registrar usuário:", err);

    if (err.code === "23505") {
      // Erro de duplicidade
      return res.status(409).json({ error: "Usuário ou email já registrado." });
    }

    // Resposta para outros erros
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});*/

userRouter.post("/register", async (req, res) => {
  const { matricula, senha, usuario, email, funcao, dp, foto } = req.body;

  // Log para verificar os dados recebidos
  console.log("Dados recebidos no registro:", req.body);

  try {
    // Verifica se todos os campos obrigatórios foram preenchidos
    if (!matricula || !senha || !usuario || !email || !funcao || !dp) {
      return res
        .status(400)
        .json({ error: "Preencha todos os campos obrigatórios." });
    }

    // Gera o hash da senha
    const hashedSenha = await bcrypt.hash(senha, 10);

    // Query para inserir o usuário no banco de dados
    const query = `
      INSERT INTO educ_system.educ_users 
      (matricula, senha, usuario, email, funcao, dp, foto)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await pool.query(query, [
      matricula,
      hashedSenha,
      usuario,
      email,
      funcao,
      dp,
      foto || null, // Permite que 'foto' seja nulo
    ]);

    // Resposta de sucesso
    res.status(201).json({ message: "Usuário registrado com sucesso." });
  } catch (err) {
    console.error("Erro ao registrar usuário:", err);

    if (err.code === "23505") {
      // Erro de duplicidade
      return res.status(409).json({ error: "Usuário ou email já registrado." });
    }

    // Resposta para outros erros
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

export default userRouter;
