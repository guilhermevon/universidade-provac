import express from "express";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import multer from "multer";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import sql from "mssql"; // Utilize o import em vez do require

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Pool } = pkg;

const pool = new Pool({
  user: "admin_provac",
  host: "192.168.0.232",
  database: "provac_producao",
  password: "Provac@2024",
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

const sqlServerConfig = {
  user: "totvs",
  password: "totvsip",
  server: "192.168.0.236",
  database: "PROTHEUS_PRODUCAO",
  options: {
    encrypt: false, // Para SQL Server sem SSL
    trustServerCertificate: true, // Somente se estiver usando SSL sem certificados válidos
  },
};

const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:4000"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60,
    },
  })
);

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Acesso não autorizado" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret",
    (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Token inválido" });
      }
      req.user = user;
      next();
    }
  );
};

app.post("/api/register", upload.single("foto"), async (req, res) => {
  const {
    usuario,
    email,
    password,
    funcao,
    departamento,
    matricula,
    role = "user",
  } = req.body;
  const foto = req.file ? req.file.buffer.toString("base64") : null;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO educ_system.educ_users (usuario, email, senha, funcao, dp, matricula, role, foto) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        usuario,
        email,
        hashedPassword,
        funcao,
        departamento,
        matricula,
        role,
        foto,
      ]
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
      user: {
        id: newUser.id,
        email: newUser.email,
        usuario: newUser.usuario,
        matricula: newUser.matricula,
      },
      token,
      redirect: "/courses",
    });
  } catch (error) {
    console.error("Erro durante o registro:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Primeiro, consulta o banco de dados PostgreSQL para buscar o usuário pelo email
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

    // Agora que temos o usuário, vamos pegar a matrícula armazenada no banco
    const { matricula } = user;

    if (!matricula) {
      return res
        .status(400)
        .json({ message: "Matrícula não encontrada para o usuário." });
    }

    // Conectando ao banco de dados SQL Server para verificar a matrícula
    const poolSQL = await sql.connect(sqlServerConfig);

    const matriculaResult = await poolSQL
      .request()
      .input("matricula", sql.VarChar, matricula).query(`
        SELECT RA_MAT, RA_NOME
        FROM SRA010
        WHERE D_E_L_E_T_ = ' '   -- Garante que o registro não foi deletado logicamente
        AND RA_TIPOADM <> 'D'    -- Ajuste conforme o código correto para demitido
        AND RA_MAT = @matricula
      `);

    if (matriculaResult.recordset.length === 0) {
      return res.status(403).json({ message: "Você não possui mais acesso" });
    }

    // Se a matrícula for válida, procede com o login normal
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
  } finally {
    // Fechando a conexão com o banco SQL Server
    if (sql.connected) {
      sql.close();
    }
  }
});

app.get("/api/courses", authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, dp, title, subtitle, img
       FROM educ_system.courses
       WHERE status = 'aprovado' 
       ORDER BY dp, title`
    );

    const coursesByDepartment = result.rows.reduce((acc, course) => {
      const { id, dp, title, subtitle, img } = course;
      if (!acc[dp]) {
        acc[dp] = [];
      }
      acc[dp].push({ id, title, subtitle, img });
      return acc;
    }, {});

    res.json(coursesByDepartment);
  } catch (error) {
    console.error("Erro ao buscar cursos:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.post("/api/manage-courses", authenticateJWT, async (req, res) => {
  const { title, subtitle, img, dp } = req.body;
  const { role } = req.user;

  if (role !== "1") {
    return res.status(403).json({ message: "Acesso não autorizado" });
  }

  const status = "em aprovacao";

  try {
    const result = await pool.query(
      "INSERT INTO educ_system.courses (title, subtitle, img, dp, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, subtitle, img, dp, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao adicionar curso:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.get("/api/course/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, dp, title, subtitle, img
       FROM educ_system.courses 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar curso:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.get("/api/course/:id/aulas", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
        m.name AS modulo,
        a.titulo AS aula,
        a.url,
        a.descricao,
        a.nro_aula
       FROM 
        educ_system.courses c
       JOIN 
        educ_system.aulas a ON c.id = a.course_id
       JOIN
        educ_system.modules m ON a.module_id = m.id
       WHERE c.id = $1
       ORDER BY m.name, a.nro_aula`,
      [id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nenhuma aula encontrada para este curso" });
    }

    const aulasPorModulo = result.rows.reduce((acc, aula) => {
      const { modulo, aula: titulo, url, descricao, nro_aula } = aula;
      if (!acc[modulo]) {
        acc[modulo] = [];
      }
      acc[modulo].push({ titulo, url, descricao, nro_aula });
      return acc;
    }, {});

    res.json(aulasPorModulo);
  } catch (error) {
    console.error("Erro ao buscar aulas:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Nova rota para salvar progresso do vídeo
app.post("/api/course/video-progress", authenticateJWT, async (req, res) => {
  const { userId, courseId, nroAula, progress } = req.body;

  console.log("Recebendo progresso do vídeo:", req.body);

  if (!userId || !courseId || nroAula === undefined || progress === undefined) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios" });
  }

  try {
    const userResult = await pool.query(
      "SELECT id FROM educ_system.educ_users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Usuário não encontrado" });
    }

    const result = await pool.query(
      `INSERT INTO educ_system.video_progress (user_id, course_id, nro_aula, progress) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (user_id, course_id, nro_aula) 
       DO UPDATE SET progress = $4, last_watched = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, courseId, nroAula, progress]
    );

    console.log("Progresso salvo:", result.rows[0]);

    res.status(201).json({
      message: "Progresso salvo com sucesso!",
      progress: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao salvar progresso do vídeo:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor", error: error.message });
  }
});

app.get(
  "/api/user/:userId/courses-progress",
  authenticateJWT,
  async (req, res) => {
    const { userId } = req.params;

    console.log(`Recebendo progresso dos cursos para o usuário: ${userId}`);

    try {
      const result = await pool.query(
        `SELECT DISTINCT ON (c.id) vp.course_id, c.title, c.subtitle, c.img, vp.progress, vp.nro_aula, a.url
       FROM educ_system.video_progress vp
       JOIN educ_system.courses c ON vp.course_id = c.id
       JOIN educ_system.aulas a ON vp.nro_aula = a.nro_aula AND vp.course_id = a.course_id
       WHERE vp.user_id = $1 AND vp.progress > 0
       ORDER BY c.id, vp.last_watched DESC`,
        [userId]
      );

      console.log("Progresso dos cursos obtido:", result.rows);

      res.json(result.rows);
    } catch (error) {
      console.error("Erro ao buscar cursos assistidos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);

// Rota para registrar pontuação ao assistir uma aula
app.post(
  "/api/course/:courseId/aula/:aulaId/pontuacao",
  authenticateJWT,
  async (req, res) => {
    const { courseId, aulaId } = req.params;
    const { userId } = req.body;

    console.log("Recebendo pontuação da aula:", req.body);

    try {
      const userResult = await pool.query(
        "SELECT id FROM educ_system.educ_users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const pontuacaoResult = await pool.query(
        "SELECT * FROM educ_system.pontuacoes WHERE user_id = $1 AND course_id = $2 AND nro_aula = $3",
        [userId, courseId, aulaId]
      );

      if (pontuacaoResult.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "Pontuação já registrada para esta aula" });
      }

      const result = await pool.query(
        `INSERT INTO educ_system.pontuacoes (user_id, course_id, nro_aula, pontos_obtidos)
       VALUES ($1, $2, $3, 20)
       RETURNING *`,
        [userId, courseId, aulaId]
      );

      console.log("Pontuação registrada:", result.rows[0]);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Erro ao registrar pontuação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);

// Rota para registrar pontuação ao completar um módulo
app.post(
  "/api/course/:courseId/modulo/:moduloId/pontuacao",
  authenticateJWT,
  async (req, res) => {
    const { courseId, moduloId } = req.params;
    const { userId } = req.body;

    console.log("Recebendo pontuação do módulo:", req.body);

    try {
      const userResult = await pool.query(
        "SELECT id FROM educ_system.educ_users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const aulasResult = await pool.query(
        `SELECT a.nro_aula
       FROM educ_system.aulas a
       WHERE a.course_id = $1 AND a.modulo = $2`,
        [courseId, moduloId]
      );

      const aulas = aulasResult.rows;

      const pontuacoesResult = await pool.query(
        `SELECT p.nro_aula
       FROM educ_system.pontuacoes p
       WHERE p.user_id = $1 AND p.course_id = $2 AND p.nro_aula = ANY($3::INTEGER[])`,
        [userId, courseId, aulas.map((aula) => aula.nro_aula)]
      );

      const pontuacoes = pontuacoesResult.rows;

      if (pontuacoes.length === aulas.length) {
        const result = await pool.query(
          `INSERT INTO educ_system.pontuacoes (user_id, course_id, nro_aula, pontos_obtidos)
         VALUES ($1, $2, NULL, 40)
         RETURNING *`,
          [userId, courseId]
        );

        console.log("Pontuação do módulo registrada:", result.rows[0]);

        res.status(201).json(result.rows[0]);
      } else {
        res
          .status(400)
          .json({ message: "Nem todas as aulas do módulo foram assistidas" });
      }
    } catch (error) {
      console.error("Erro ao registrar pontuação do módulo:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);

app.delete("/api/course/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== "1") {
    return res.status(403).json({ message: "Acesso não autorizado" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Delete from respostas_usuario
    const deleteRespostasUsuarioQuery = `
      DELETE FROM educ_system.respostas_usuario 
      WHERE id_tentativa IN (
        SELECT id_tentativa FROM educ_system.tentativas_prova 
        WHERE id_prova IN (
          SELECT id_prova FROM educ_system.provas 
          WHERE id_modulo IN (
            SELECT id FROM educ_system.modules WHERE course_id = $1
          )
        )
      )
    `;
    await client.query(deleteRespostasUsuarioQuery, [id]);

    // Delete from tentativas_prova
    const deleteTentativasProvaQuery = `
      DELETE FROM educ_system.tentativas_prova 
      WHERE id_prova IN (
        SELECT id_prova FROM educ_system.provas 
        WHERE id_modulo IN (
          SELECT id FROM educ_system.modules WHERE course_id = $1
        )
      )
    `;
    await client.query(deleteTentativasProvaQuery, [id]);

    // Delete from alternativas
    const deleteAlternativasQuery = `
      DELETE FROM educ_system.alternativas 
      WHERE id_questao IN (
        SELECT id_questao FROM educ_system.questoes 
        WHERE id_prova IN (
          SELECT id_prova FROM educ_system.provas 
          WHERE id_modulo IN (
            SELECT id FROM educ_system.modules WHERE course_id = $1
          )
        )
      )
    `;
    await client.query(deleteAlternativasQuery, [id]);

    // Delete from questoes
    const deleteQuestoesQuery = `
      DELETE FROM educ_system.questoes 
      WHERE id_prova IN (
        SELECT id_prova FROM educ_system.provas 
        WHERE id_modulo IN (
          SELECT id FROM educ_system.modules WHERE course_id = $1
        )
      )
    `;
    await client.query(deleteQuestoesQuery, [id]);

    // Delete from provas
    const deleteProvasQuery = `
      DELETE FROM educ_system.provas 
      WHERE id_modulo IN (
        SELECT id FROM educ_system.modules WHERE course_id = $1
      )
    `;
    await client.query(deleteProvasQuery, [id]);

    // Delete from pontuacoes
    const deletePontuacoesQuery =
      "DELETE FROM educ_system.pontuacoes WHERE course_id = $1";
    await client.query(deletePontuacoesQuery, [id]);

    // Delete from video_progress
    const deleteVideoProgressQuery =
      "DELETE FROM educ_system.video_progress WHERE course_id = $1";
    await client.query(deleteVideoProgressQuery, [id]);

    // Delete from aulas
    const deleteAulasQuery =
      "DELETE FROM educ_system.aulas WHERE course_id = $1";
    await client.query(deleteAulasQuery, [id]);

    // Delete from modules
    const deleteModulesQuery =
      "DELETE FROM educ_system.modules WHERE course_id = $1";
    await client.query(deleteModulesQuery, [id]);

    // Finally, delete the course
    const deleteCourseQuery =
      "DELETE FROM educ_system.courses WHERE id = $1 RETURNING *";
    const result = await client.query(deleteCourseQuery, [id]);

    await client.query("COMMIT");

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Curso não encontrado" });
    }

    res
      .status(200)
      .json({ message: "Curso deletado com sucesso", course: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao deletar curso:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  } finally {
    client.release();
  }
});

// Adicionando as rotas de módulos diretamente no server.js

// Rota para listar módulos
app.get("/api/modules", authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM educ_system.modules ORDER BY name"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar módulos:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota para criar um novo módulo
app.post("/api/manage-modules", authenticateJWT, async (req, res) => {
  const { name, description, course_id } = req.body;
  const { role } = req.user;

  if (role !== "1") {
    return res.status(403).json({ message: "Acesso não autorizado" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO educ_system.modules (name, description, course_id) VALUES ($1, $2, $3) RETURNING *",
      [name, description, course_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao adicionar módulo:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota para deletar um módulo
app.delete("/api/module/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== "1") {
    return res.status(403).json({ message: "Acesso não autorizado" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const deleteAulasQuery =
      "UPDATE educ_system.aulas SET module_id = NULL WHERE module_id = $1";
    await client.query(deleteAulasQuery, [id]);

    const deleteModuleQuery =
      "DELETE FROM educ_system.modules WHERE id = $1 RETURNING *";
    const result = await client.query(deleteModuleQuery, [id]);

    await client.query("COMMIT");

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Módulo não encontrado" });
    }

    res
      .status(200)
      .json({ message: "Módulo deletado com sucesso", module: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao deletar módulo:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  } finally {
    client.release();
  }
});

app.post("/api/manage-aulas", authenticateJWT, async (req, res) => {
  const { title, url, description, course_id, module_id } = req.body;
  const { role } = req.user;

  if (role !== "1") {
    return res.status(403).json({ message: "Acesso não autorizado" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO educ_system.aulas (titulo, url, descricao, course_id, module_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, url, description, course_id, module_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao adicionar aula:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota para listar módulos de um curso específico
app.get("/api/courses/:courseId/modules", authenticateJWT, async (req, res) => {
  const { courseId } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, name FROM educ_system.modules WHERE course_id = $1 ORDER BY name",
      [courseId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar módulos:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});
app.delete("/api/aula/:id", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== "1") {
    return res.status(403).json({ message: "Acesso não autorizado" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM educ_system.aulas WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Aula não encontrada" });
    }

    res
      .status(200)
      .json({ message: "Aula deletada com sucesso", aula: result.rows[0] });
  } catch (error) {
    console.error("Erro ao deletar aula:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.get("/api/course/:id/aulas", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const resultAulas = await pool.query(
      `SELECT 
        m.name AS modulo,
        a.titulo AS aula,
        a.url,
        a.descricao,
        a.nro_aula
       FROM 
        educ_system.courses c
       JOIN 
        educ_system.aulas a ON c.id = a.course_id
       JOIN
        educ_system.modules m ON a.module_id = m.id
       WHERE c.id = $1
       ORDER BY m.name, a.nro_aula`,
      [id]
    );

    const resultProvas = await pool.query(
      `SELECT 
        m.name AS modulo,
        p.titulo AS prova,
        p.id_prova,
        p.descricao,
        p.duracao
       FROM 
        educ_system.courses c
       JOIN 
        educ_system.provas p ON c.id = p.id_modulo
       JOIN
        educ_system.modules m ON p.id_modulo = m.id
       WHERE c.id = $1
       ORDER BY m.name, p.titulo`,
      [id]
    );

    const aulasPorModulo = resultAulas.rows.reduce((acc, aula) => {
      const { modulo, aula: titulo, url, descricao, nro_aula } = aula;
      if (!acc[modulo]) {
        acc[modulo] = [];
      }
      acc[modulo].push({ type: "aula", titulo, url, descricao, nro_aula });
      return acc;
    }, {});

    const provasPorModulo = resultProvas.rows.reduce((acc, prova) => {
      const { modulo, prova: titulo, id_prova, descricao, duracao } = prova;
      if (!acc[modulo]) {
        acc[modulo] = [];
      }
      acc[modulo].push({ type: "prova", titulo, id_prova, descricao, duracao });
      return acc;
    }, {});

    const combinedData = { ...aulasPorModulo, ...provasPorModulo };

    res.json(combinedData);
  } catch (error) {
    console.error("Erro ao buscar aulas e provas:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota para buscar questões de uma prova específica
app.get("/api/prova/:id/questoes", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id_questao, tipo_questao, enunciado, pontuacao, ordem
       FROM educ_system.questoes
       WHERE id_prova = $1
       ORDER BY ordem`,
      [id]
    );

    const questoes = result.rows;

    const questoesComAlternativas = await Promise.all(
      questoes.map(async (questao) => {
        const alternativasResult = await pool.query(
          `SELECT id_alternativa, texto_alternativa, correta, ordem
         FROM educ_system.alternativas
         WHERE id_questao = $1
         ORDER BY ordem`,
          [questao.id_questao]
        );
        return { ...questao, alternativas: alternativasResult.rows };
      })
    );

    res.json(questoesComAlternativas);
  } catch (error) {
    console.error("Erro ao buscar questões:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.post("/api/manage-provas", authenticateJWT, async (req, res) => {
  const {
    titulo,
    descricao,
    duracao,
    nota_minima_aprovacao,
    cursoId,
    moduloId,
    questoes,
  } = req.body;
  const { role } = req.user;

  if (role !== "1") {
    return res.status(403).json({ message: "Acesso não autorizado" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const resultProva = await client.query(
      `INSERT INTO educ_system.provas (id_modulo, titulo, descricao, duracao, nota_minima_aprovacao, data_criacao, data_atualizacao) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
      [moduloId, titulo, descricao, duracao, nota_minima_aprovacao]
    );

    const provaId = resultProva.rows[0].id_prova;

    for (const questao of questoes) {
      const resultQuestao = await client.query(
        `INSERT INTO educ_system.questoes (id_prova, tipo_questao, enunciado, pontuacao, ordem) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          provaId,
          questao.tipo_questao,
          questao.enunciado,
          questao.pontuacao,
          questao.ordem || 1,
        ]
      );

      const questaoId = resultQuestao.rows[0].id_questao;

      if (questao.tipo_questao === "multipla_escolha") {
        for (const alternativa of questao.alternativas) {
          await client.query(
            `INSERT INTO educ_system.alternativas (id_questao, texto_alternativa, correta, ordem) 
             VALUES ($1, $2, $3, $4)`,
            [
              questaoId,
              alternativa.texto_alternativa,
              alternativa.correta,
              alternativa.ordem || 1,
            ]
          );
        }
      }
    }

    await client.query("COMMIT");

    res.status(201).json({ message: "Prova cadastrada com sucesso!" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao cadastrar prova:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  } finally {
    client.release();
  }
});

app.get("/api/prova/:id_prova/questoes", authenticateJWT, async (req, res) => {
  const { id_prova } = req.params;

  try {
    const questoesResult = await pool.query(
      "SELECT q.id_questao, q.enunciado, q.tipo_questao, a.id_alternativa, a.texto_alternativa, a.correta FROM educ_system.questoes q LEFT JOIN educ_system.alternativas a ON q.id_questao = a.id_questao WHERE q.id_prova = $1 ORDER BY q.ordem, a.ordem",
      [id_prova]
    );

    const questoesMap = questoesResult.rows.reduce((acc, row) => {
      if (!acc[row.id_questao]) {
        acc[row.id_questao] = {
          id_questao: row.id_questao,
          enunciado: row.enunciado,
          tipo_questao: row.tipo_questao,
          alternativas: [],
        };
      }

      if (row.id_alternativa) {
        acc[row.id_questao].alternativas.push({
          id_alternativa: row.id_alternativa,
          texto_alternativa: row.texto_alternativa,
          correta: row.correta,
        });
      }

      return acc;
    }, {});

    const questoes = Object.values(questoesMap);

    res.json(questoes);
  } catch (error) {
    console.error("Erro ao buscar questões:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.get("/api/course/:id/provas", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  console.log(`Buscando provas para o curso com ID: ${id}`); // Log para depuração
  try {
    const result = await pool.query(
      `SELECT p.id_prova, p.titulo, p.descricao, p.duracao, p.nota_minima_aprovacao, p.data_criacao, p.data_atualizacao, 
              q.id_questao, q.tipo_questao, q.enunciado, q.pontuacao, q.ordem AS questao_ordem, 
              a.id_alternativa, a.texto_alternativa, a.correta, a.ordem AS alternativa_ordem
       FROM educ_system.provas p
       LEFT JOIN educ_system.questoes q ON q.id_prova = p.id_prova
       LEFT JOIN educ_system.alternativas a ON a.id_questao = q.id_questao
       WHERE p.id_modulo IN (
         SELECT m.id
         FROM educ_system.modules m
         WHERE m.course_id = $1
       )`,
      [id]
    );

    if (result.rows.length === 0) {
      console.log("Nenhuma prova encontrada para este curso"); // Log para depuração
      return res
        .status(404)
        .json({ message: "Nenhuma prova encontrada para este curso" });
    }

    const provas = result.rows.reduce((acc, row) => {
      const {
        id_prova,
        titulo,
        descricao,
        duracao,
        nota_minima_aprovacao,
        data_criacao,
        data_atualizacao,
        id_modulo,
        id_questao,
        tipo_questao,
        enunciado,
        pontuacao,
        questao_ordem,
        id_alternativa,
        texto_alternativa,
        correta,
        alternativa_ordem,
      } = row;
      let prova = acc.find((p) => p.id_prova === id_prova);
      if (!prova) {
        prova = {
          id_prova,
          titulo,
          descricao,
          duracao,
          nota_minima_aprovacao,
          data_criacao,
          data_atualizacao,
          id_modulo,
          questoes: [],
        };
        acc.push(prova);
      }
      let questao = prova.questoes.find((q) => q.id_questao === id_questao);
      if (!questao && id_questao) {
        questao = {
          id_questao,
          tipo_questao,
          enunciado,
          pontuacao,
          ordem: questao_ordem,
          alternativas: [],
        };
        prova.questoes.push(questao);
      }
      if (id_alternativa) {
        questao.alternativas.push({
          id_alternativa,
          texto_alternativa,
          correta,
          ordem: alternativa_ordem,
        });
      }
      return acc;
    }, []);

    res.json(provas);
  } catch (error) {
    console.error("Erro ao buscar provas:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.post("/api/respostas", authenticateJWT, async (req, res) => {
  const { userId, provaId, respostas } = req.body;

  try {
    const client = await pool.connect();
    await client.query("BEGIN");

    const insertTentativaQuery = `
      INSERT INTO educ_system.tentativas_prova (id_prova, id_usuario, data_inicio, status)
      VALUES ($1, $2, CURRENT_TIMESTAMP, 'em andamento')
      RETURNING id_tentativa
    `;

    const tentativaResult = await client.query(insertTentativaQuery, [
      provaId,
      userId,
    ]);
    const tentativaId = tentativaResult.rows[0].id_tentativa;

    const insertRespostasQuery = `
      INSERT INTO educ_system.respostas_usuario (id_tentativa, id_questao, id_alternativa, resposta_texto, pontuacao_obtida)
      VALUES ($1, $2, $3, $4, 0)
    `;

    for (const questaoId in respostas) {
      const { alternativaId, respostaTexto } = respostas[questaoId];
      await client.query(insertRespostasQuery, [
        tentativaId,
        questaoId,
        alternativaId || null,
        respostaTexto || null,
      ]);
    }

    await client.query("COMMIT");
    client.release();

    res.status(201).json({ message: "Respostas enviadas com sucesso!" });
  } catch (error) {
    console.error("Erro ao enviar respostas:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.post("/api/exam/start", authenticateJWT, async (req, res) => {
  const { id_prova, id_usuario, data_inicio, status } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO educ_system.tentativas_prova (id_prova, id_usuario, data_inicio, status) VALUES ($1, $2, $3, $4) RETURNING id_tentativa",
      [id_prova, id_usuario, data_inicio, status]
    );

    res.status(201).json({ id_tentativa: result.rows[0].id_tentativa });
  } catch (error) {
    console.error("Erro ao iniciar a tentativa da prova:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.post("/api/exam/submit", authenticateJWT, async (req, res) => {
  const { attemptId, userId, answers, endTime, status } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "UPDATE educ_system.tentativas_prova SET status = $1, data_fim = $2 WHERE id_tentativa = $3 AND id_usuario = $4",
      [status, endTime, attemptId, userId]
    );

    for (const [questionId, answer] of Object.entries(answers)) {
      if (typeof answer === "string") {
        await client.query(
          "INSERT INTO educ_system.respostas_usuario (id_tentativa, id_questao, resposta_texto) VALUES ($1, $2, $3)",
          [attemptId, questionId, answer]
        );
      } else {
        await client.query(
          "INSERT INTO educ_system.respostas_usuario (id_tentativa, id_questao, id_alternativa) VALUES ($1, $2, $3)",
          [attemptId, questionId, answer]
        );
      }
    }

    await client.query("COMMIT");

    res.status(200).json({ message: "Respostas enviadas com sucesso!" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao enviar respostas:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  } finally {
    client.release();
  }
});

app.get("/api/rankings", authenticateJWT, async (req, res) => {
  const { id } = req.user;

  try {
    // Fetch the user details
    const userResult = await pool.query(
      "SELECT dp FROM educ_system.educ_users WHERE id = $1",
      [id]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const { dp } = user;

    // Fetch global rankings
    const globalRankingsResult = await pool.query(
      "SELECT usuario, total_pontos FROM educ_system.educ_users ORDER BY total_pontos DESC LIMIT 3"
    );
    const globalRankings = globalRankingsResult.rows;

    // Fetch personal rank
    const personalRankResult = await pool.query(
      "SELECT usuario, total_pontos FROM educ_system.educ_users WHERE id = $1",
      [id]
    );
    const personalRank = personalRankResult.rows[0];

    // Fetch department rankings
    const departmentRankingsResult = await pool.query(
      "SELECT usuario, total_pontos FROM educ_system.educ_users WHERE dp = $1 ORDER BY total_pontos DESC LIMIT 3",
      [dp]
    );
    const departmentRankings = departmentRankingsResult.rows;

    res.json({ globalRankings, personalRank, departmentRankings });
  } catch (error) {
    console.error("Erro ao buscar rankings:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.delete("/api/prova/:id_prova", authenticateJWT, async (req, res) => {
  const { id_prova } = req.params;
  const { role } = req.user;

  if (role !== "1") {
    return res.status(403).json({ message: "Acesso não autorizado" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Delete from respostas_usuario
    const deleteRespostasUsuarioQuery = `
      DELETE FROM educ_system.respostas_usuario 
      WHERE id_tentativa IN (
        SELECT id_tentativa FROM educ_system.tentativas_prova 
        WHERE id_prova = $1
      )
    `;
    await client.query(deleteRespostasUsuarioQuery, [id_prova]);

    // Delete from tentativas_prova
    const deleteTentativasProvaQuery = `
      DELETE FROM educ_system.tentativas_prova 
      WHERE id_prova = $1
    `;
    await client.query(deleteTentativasProvaQuery, [id_prova]);

    // Delete from alternativas
    const deleteAlternativasQuery = `
      DELETE FROM educ_system.alternativas 
      WHERE id_questao IN (
        SELECT id_questao FROM educ_system.questoes 
        WHERE id_prova = $1
      )
    `;
    await client.query(deleteAlternativasQuery, [id_prova]);

    // Delete from questoes
    const deleteQuestoesQuery = `
      DELETE FROM educ_system.questoes 
      WHERE id_prova = $1
    `;
    await client.query(deleteQuestoesQuery, [id_prova]);

    // Finally, delete the prova
    const deleteProvaQuery =
      "DELETE FROM educ_system.provas WHERE id_prova = $1 RETURNING *";
    const result = await client.query(deleteProvaQuery, [id_prova]);

    await client.query("COMMIT");

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Prova não encontrada" });
    }

    res
      .status(200)
      .json({ message: "Prova deletada com sucesso", prova: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao deletar prova:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  } finally {
    client.release();
  }
});

app.get("/api/course/:courseId/provas", authenticateJWT, async (req, res) => {
  const { courseId } = req.params;

  try {
    const result = await pool.query(
      `SELECT p.id_prova, p.titulo, p.descricao, p.duracao, p.nota_minima_aprovacao, p.data_criacao, p.data_atualizacao, 
              q.id_questao, q.tipo_questao, q.enunciado, q.pontuacao, q.ordem AS questao_ordem, 
              a.id_alternativa, a.texto_alternativa, a.correta, a.ordem AS alternativa_ordem
       FROM educ_system.provas p
       LEFT JOIN educ_system.questoes q ON q.id_prova = p.id_prova
       LEFT JOIN educ_system.alternativas a ON a.id_questao = q.id_questao
       WHERE p.id_modulo IN (
         SELECT m.id
         FROM educ_system.modules m
         WHERE m.course_id = $1
       )`,
      [courseId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nenhuma prova encontrada para este curso" });
    }

    const provas = result.rows.reduce((acc, row) => {
      const {
        id_prova,
        titulo,
        descricao,
        duracao,
        nota_minima_aprovacao,
        data_criacao,
        data_atualizacao,
        id_modulo,
        id_questao,
        tipo_questao,
        enunciado,
        pontuacao,
        questao_ordem,
        id_alternativa,
        texto_alternativa,
        correta,
        alternativa_ordem,
      } = row;
      let prova = acc.find((p) => p.id_prova === id_prova);
      if (!prova) {
        prova = {
          id_prova,
          titulo,
          descricao,
          duracao,
          nota_minima_aprovacao,
          data_criacao,
          data_atualizacao,
          id_modulo,
          questoes: [],
        };
        acc.push(prova);
      }
      let questao = prova.questoes.find((q) => q.id_questao === id_questao);
      if (!questao && id_questao) {
        questao = {
          id_questao,
          tipo_questao,
          enunciado,
          pontuacao,
          ordem: questao_ordem,
          alternativas: [],
        };
        prova.questoes.push(questao);
      }
      if (id_alternativa) {
        questao.alternativas.push({
          id_alternativa,
          texto_alternativa,
          correta,
          ordem: alternativa_ordem,
        });
      }
      return acc;
    }, []);

    res.json(provas);
  } catch (error) {
    console.error("Erro ao buscar provas:", error);
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

// Rota para buscar todas as funções de um departamento específico
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

app.post("/api/mandatory-course", authenticateJWT, async (req, res) => {
  const { courseId, funcaoId } = req.body;
  const { role } = req.user;

  if (role !== "1") {
    return res.status(403).json({ message: "Acesso não autorizado" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO educ_system.cursos_obrigatorios (id_curso, id_funcao) VALUES ($1, $2) RETURNING *",
      [courseId, funcaoId]
    );
    res.status(201).json({
      message: "Curso obrigatório atribuído com sucesso",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atribuir curso obrigatório:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota para buscar todas as funções
app.get("/api/funcoes", authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, funcao, dp FROM educ_system.funcoes ORDER BY dp, funcao"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar funções:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.get("/api/courses/approval", authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, subtitle, img, dp, status
       FROM educ_system.courses 
       WHERE status = 'em aprovacao'`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar cursos em aprovação:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Função para extrair texto de uma URL do YouTube (dummy function, precisa de implementação real)
const extractTextFromYouTube = async (url) => {
  // Implementação fictícia - substitua pela lógica real de extração
  return `Texto extraído de ${url}`;
};
// Função para gerar um PDF a partir do texto extraído
async function generatePDF(text, title) {
  if (typeof text !== "string") {
    throw new Error("Texto não fornecido para gerar o PDF");
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const { width, height } = page.getSize();
  const fontSize = 30;
  page.drawText(title, {
    x: 50,
    y: height - 4 * fontSize,
    size: fontSize,
    color: rgb(0, 0.53, 0.71),
  });
  page.drawText(text, { x: 50, y: height - 100, size: 12 });
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
// Função para encriptar o PDF
function encryptPDF(pdfBytes, password) {
  const cipher = crypto.createCipher("aes-256-cbc", password);
  let encrypted = cipher.update(pdfBytes);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted;
}

// Rota para gerar documentação de um curso aprovado
app.post(
  "/api/generate-course-docs/:courseId",
  authenticateJWT,
  async (req, res) => {
    const { courseId } = req.params;
    const { docTitle, password } = req.body;

    try {
      // Buscar URLs das aulas do curso
      const result = await pool.query(
        "SELECT url FROM educ_system.aulas WHERE course_id = $1",
        [courseId]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Nenhuma aula encontrada para este curso" });
      }

      let fullText = "";

      for (const { url } of result.rows) {
        const text = await extractTextFromYouTube(url);
        if (typeof text === "string") {
          fullText += text + "\n\n";
        } else {
          console.error("Erro: Texto extraído não é do tipo string:", text);
        }
      }

      console.log("fullText antes de gerar PDF:", fullText);

      if (!fullText) {
        throw new Error("Nenhum texto extraído das URLs das aulas");
      }

      const pdfBytes = await generatePDF(fullText, docTitle);
      const encryptedPDF = encryptPDF(pdfBytes, password);

      // Inserir documentação na tabela course_docs
      const docResult = await pool.query(
        "INSERT INTO educ_system.course_docs (course_id, doc_title, doc_content) VALUES ($1, $2, $3) RETURNING id",
        [courseId, docTitle, fullText]
      );
      const docId = docResult.rows[0].id;

      // Inserir PDF encriptado na tabela encrypted_docs
      await pool.query(
        "INSERT INTO educ_system.encrypted_docs (doc_id, encrypted_pdf) VALUES ($1, $2)",
        [docId, encryptedPDF]
      );

      res
        .status(201)
        .json({ message: "Documentação gerada e encriptada com sucesso!" });
    } catch (error) {
      console.error("Erro ao gerar documentação do curso:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);

const saveTempFile = (content, callback) => {
  const tempDir = path.join(__dirname, "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const tempFilePath = path.join(tempDir, `tempfile-${Date.now()}.txt`);
  fs.writeFile(tempFilePath, content, (err) => {
    if (err) {
      console.error("Erro ao salvar arquivo temporário:", err);
      callback(err);
    } else {
      callback(null, tempFilePath);
    }
  });
};

// Atualizar curso para aprovado e gerar documentação automaticamente
app.patch("/api/courses/approve", authenticateJWT, async (req, res) => {
  const { courseIds, docTitle, password } = req.body;

  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    return res
      .status(400)
      .json({ message: "Nenhum curso selecionado para aprovação." });
  }

  if (typeof docTitle !== "string" || docTitle.trim() === "") {
    return res.status(400).json({ message: "Título do documento é inválido." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await pool.query(
      `UPDATE educ_system.courses
       SET status = 'aprovado'
       WHERE id = ANY($1::int[])
       RETURNING *`,
      [courseIds]
    );

    const approvedCourses = result.rows;

    for (const course of approvedCourses) {
      const { id: courseId } = course;

      const resultAulas = await pool.query(
        "SELECT url FROM educ_system.aulas WHERE course_id = $1",
        [courseId]
      );

      let fullText = "";

      for (const { url } of resultAulas.rows) {
        const text = await extractTextFromYouTube(url);
        if (typeof text === "string") {
          fullText += text + "\n\n";
        } else {
          console.error("Erro: Texto extraído não é do tipo string:", text);
        }
      }

      console.log("fullText antes de gerar PDF:", fullText);

      if (!fullText) {
        throw new Error("Nenhum texto extraído das URLs das aulas");
      }

      // Salvar o texto completo em um arquivo temporário
      saveTempFile(fullText, (err, tempFilePath) => {
        if (err) {
          throw new Error("Erro ao salvar arquivo temporário");
        }

        // Executar o script Python passando o caminho do arquivo temporário
        const outputDir = path.join(__dirname, "documentacao");
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir);
        }

        const outputFilePath = path.join(
          outputDir,
          `${docTitle.replace(/ /g, "_")}.pdf`
        );

        execFile(
          "python",
          ["generate_pdf.py", tempFilePath, outputFilePath, password],
          (error, stdout, stderr) => {
            if (error) {
              console.error("Erro ao executar script Python:", error);
              res
                .status(500)
                .json({ message: "Erro ao gerar documentação", error });
              return;
            }

            console.log("Documentação gerada:", stdout);
            res.status(200).json({
              message: "Cursos aprovados e documentação gerada com sucesso!",
              approvedCourses,
            });

            // Remover o arquivo temporário
            fs.unlink(tempFilePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error("Erro ao remover arquivo temporário:", unlinkErr);
              }
            });
          }
        );
      });
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao aprovar cursos e gerar documentação:", error);
    res
      .status(500)
      .json({ message: "Erro ao aprovar cursos e gerar documentação.", error });
  } finally {
    client.release();
  }
});

app.post("/api/course/:courseId/rating", authenticateJWT, async (req, res) => {
  const { courseId } = req.params;
  const { userId, rating } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO educ_system.curso_feedback (course_id, user_id, avaliacao, data_criacao)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *`,
      [courseId, userId, rating]
    );

    res.status(201).json({
      message: "Avaliação enviada com sucesso!",
      feedback: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao enviar avaliação:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
