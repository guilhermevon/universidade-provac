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

// Middleware para logar as requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Configuração de CORS
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:4000"], // Adicione todas as origens necessárias
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
      "INSERT INTO departamento_pessoal.educ_users (usuario, email, senha, funcao, dp, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
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
      "SELECT * FROM departamento_pessoal.educ_users WHERE email = $1",
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

app.get("/api/courses", authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, dp, title, subtitle, img
       FROM departamento_pessoal.courses 
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

  try {
    const result = await pool.query(
      "INSERT INTO departamento_pessoal.courses (title, subtitle, img, dp) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, subtitle, img, dp]
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
       FROM departamento_pessoal.courses 
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
        departamento_pessoal.courses c
       JOIN 
        departamento_pessoal.aulas a ON c.id = a.course_id
       JOIN
        departamento_pessoal.modules m ON a.module_id = m.id
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
      "SELECT id FROM departamento_pessoal.educ_users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Usuário não encontrado" });
    }

    const result = await pool.query(
      `INSERT INTO departamento_pessoal.video_progress (user_id, course_id, nro_aula, progress) 
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
       FROM departamento_pessoal.video_progress vp
       JOIN departamento_pessoal.courses c ON vp.course_id = c.id
       JOIN departamento_pessoal.aulas a ON vp.nro_aula = a.nro_aula AND vp.course_id = a.course_id
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
        "SELECT id FROM departamento_pessoal.educ_users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const pontuacaoResult = await pool.query(
        "SELECT * FROM departamento_pessoal.pontuacoes WHERE user_id = $1 AND course_id = $2 AND nro_aula = $3",
        [userId, courseId, aulaId]
      );

      if (pontuacaoResult.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "Pontuação já registrada para esta aula" });
      }

      const result = await pool.query(
        `INSERT INTO departamento_pessoal.pontuacoes (user_id, course_id, nro_aula, pontos_obtidos)
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
        "SELECT id FROM departamento_pessoal.educ_users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const aulasResult = await pool.query(
        `SELECT a.nro_aula
       FROM departamento_pessoal.aulas a
       WHERE a.course_id = $1 AND a.modulo = $2`,
        [courseId, moduloId]
      );

      const aulas = aulasResult.rows;

      const pontuacoesResult = await pool.query(
        `SELECT p.nro_aula
       FROM departamento_pessoal.pontuacoes p
       WHERE p.user_id = $1 AND p.course_id = $2 AND p.nro_aula = ANY($3::INTEGER[])`,
        [userId, courseId, aulas.map((aula) => aula.nro_aula)]
      );

      const pontuacoes = pontuacoesResult.rows;

      if (pontuacoes.length === aulas.length) {
        const result = await pool.query(
          `INSERT INTO departamento_pessoal.pontuacoes (user_id, course_id, nro_aula, pontos_obtidos)
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
      DELETE FROM departamento_pessoal.respostas_usuario 
      WHERE id_tentativa IN (
        SELECT id_tentativa FROM departamento_pessoal.tentativas_prova 
        WHERE id_prova IN (
          SELECT id_prova FROM departamento_pessoal.provas 
          WHERE id_modulo IN (
            SELECT id FROM departamento_pessoal.modules WHERE course_id = $1
          )
        )
      )
    `;
    await client.query(deleteRespostasUsuarioQuery, [id]);

    // Delete from tentativas_prova
    const deleteTentativasProvaQuery = `
      DELETE FROM departamento_pessoal.tentativas_prova 
      WHERE id_prova IN (
        SELECT id_prova FROM departamento_pessoal.provas 
        WHERE id_modulo IN (
          SELECT id FROM departamento_pessoal.modules WHERE course_id = $1
        )
      )
    `;
    await client.query(deleteTentativasProvaQuery, [id]);

    // Delete from alternativas
    const deleteAlternativasQuery = `
      DELETE FROM departamento_pessoal.alternativas 
      WHERE id_questao IN (
        SELECT id_questao FROM departamento_pessoal.questoes 
        WHERE id_prova IN (
          SELECT id_prova FROM departamento_pessoal.provas 
          WHERE id_modulo IN (
            SELECT id FROM departamento_pessoal.modules WHERE course_id = $1
          )
        )
      )
    `;
    await client.query(deleteAlternativasQuery, [id]);

    // Delete from questoes
    const deleteQuestoesQuery = `
      DELETE FROM departamento_pessoal.questoes 
      WHERE id_prova IN (
        SELECT id_prova FROM departamento_pessoal.provas 
        WHERE id_modulo IN (
          SELECT id FROM departamento_pessoal.modules WHERE course_id = $1
        )
      )
    `;
    await client.query(deleteQuestoesQuery, [id]);

    // Delete from provas
    const deleteProvasQuery = `
      DELETE FROM departamento_pessoal.provas 
      WHERE id_modulo IN (
        SELECT id FROM departamento_pessoal.modules WHERE course_id = $1
      )
    `;
    await client.query(deleteProvasQuery, [id]);

    // Delete from pontuacoes
    const deletePontuacoesQuery =
      "DELETE FROM departamento_pessoal.pontuacoes WHERE course_id = $1";
    await client.query(deletePontuacoesQuery, [id]);

    // Delete from video_progress
    const deleteVideoProgressQuery =
      "DELETE FROM departamento_pessoal.video_progress WHERE course_id = $1";
    await client.query(deleteVideoProgressQuery, [id]);

    // Delete from aulas
    const deleteAulasQuery =
      "DELETE FROM departamento_pessoal.aulas WHERE course_id = $1";
    await client.query(deleteAulasQuery, [id]);

    // Delete from modules
    const deleteModulesQuery =
      "DELETE FROM departamento_pessoal.modules WHERE course_id = $1";
    await client.query(deleteModulesQuery, [id]);

    // Finally, delete the course
    const deleteCourseQuery =
      "DELETE FROM departamento_pessoal.courses WHERE id = $1 RETURNING *";
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
      "SELECT * FROM departamento_pessoal.modules ORDER BY name"
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
      "INSERT INTO departamento_pessoal.modules (name, description, course_id) VALUES ($1, $2, $3) RETURNING *",
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
      "UPDATE departamento_pessoal.aulas SET module_id = NULL WHERE module_id = $1";
    await client.query(deleteAulasQuery, [id]);

    const deleteModuleQuery =
      "DELETE FROM departamento_pessoal.modules WHERE id = $1 RETURNING *";
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
      "INSERT INTO departamento_pessoal.aulas (titulo, url, descricao, course_id, module_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
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
      "SELECT id, name FROM departamento_pessoal.modules WHERE course_id = $1 ORDER BY name",
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
      "DELETE FROM departamento_pessoal.aulas WHERE id = $1 RETURNING *",
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
        departamento_pessoal.courses c
       JOIN 
        departamento_pessoal.aulas a ON c.id = a.course_id
       JOIN
        departamento_pessoal.modules m ON a.module_id = m.id
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
        departamento_pessoal.courses c
       JOIN 
        departamento_pessoal.provas p ON c.id = p.id_modulo
       JOIN
        departamento_pessoal.modules m ON p.id_modulo = m.id
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
       FROM departamento_pessoal.questoes
       WHERE id_prova = $1
       ORDER BY ordem`,
      [id]
    );

    const questoes = result.rows;

    const questoesComAlternativas = await Promise.all(
      questoes.map(async (questao) => {
        const alternativasResult = await pool.query(
          `SELECT id_alternativa, texto_alternativa, correta, ordem
         FROM departamento_pessoal.alternativas
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
      `INSERT INTO departamento_pessoal.provas (id_modulo, titulo, descricao, duracao, nota_minima_aprovacao, data_criacao, data_atualizacao) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
      [moduloId, titulo, descricao, duracao, nota_minima_aprovacao]
    );

    const provaId = resultProva.rows[0].id_prova;

    for (const questao of questoes) {
      const resultQuestao = await client.query(
        `INSERT INTO departamento_pessoal.questoes (id_prova, tipo_questao, enunciado, pontuacao, ordem) 
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
            `INSERT INTO departamento_pessoal.alternativas (id_questao, texto_alternativa, correta, ordem) 
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
      "SELECT q.id_questao, q.enunciado, q.tipo_questao, a.id_alternativa, a.texto_alternativa, a.correta FROM departamento_pessoal.questoes q LEFT JOIN departamento_pessoal.alternativas a ON q.id_questao = a.id_questao WHERE q.id_prova = $1 ORDER BY q.ordem, a.ordem",
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
       FROM departamento_pessoal.provas p
       LEFT JOIN departamento_pessoal.questoes q ON q.id_prova = p.id_prova
       LEFT JOIN departamento_pessoal.alternativas a ON a.id_questao = q.id_questao
       WHERE p.id_modulo IN (
         SELECT m.id
         FROM departamento_pessoal.modules m
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
      INSERT INTO departamento_pessoal.tentativas_prova (id_prova, id_usuario, data_inicio, status)
      VALUES ($1, $2, CURRENT_TIMESTAMP, 'em andamento')
      RETURNING id_tentativa
    `;

    const tentativaResult = await client.query(insertTentativaQuery, [
      provaId,
      userId,
    ]);
    const tentativaId = tentativaResult.rows[0].id_tentativa;

    const insertRespostasQuery = `
      INSERT INTO departamento_pessoal.respostas_usuario (id_tentativa, id_questao, id_alternativa, resposta_texto, pontuacao_obtida)
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
      "INSERT INTO departamento_pessoal.tentativas_prova (id_prova, id_usuario, data_inicio, status) VALUES ($1, $2, $3, $4) RETURNING id_tentativa",
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
      "UPDATE departamento_pessoal.tentativas_prova SET status = $1, data_fim = $2 WHERE id_tentativa = $3 AND id_usuario = $4",
      [status, endTime, attemptId, userId]
    );

    for (const [questionId, answer] of Object.entries(answers)) {
      if (typeof answer === "string") {
        await client.query(
          "INSERT INTO departamento_pessoal.respostas_usuario (id_tentativa, id_questao, resposta_texto) VALUES ($1, $2, $3)",
          [attemptId, questionId, answer]
        );
      } else {
        await client.query(
          "INSERT INTO departamento_pessoal.respostas_usuario (id_tentativa, id_questao, id_alternativa) VALUES ($1, $2, $3)",
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
      "SELECT dp FROM departamento_pessoal.educ_users WHERE id = $1",
      [id]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const { dp } = user;

    // Fetch global rankings
    const globalRankingsResult = await pool.query(
      "SELECT usuario, total_pontos FROM departamento_pessoal.educ_users ORDER BY total_pontos DESC LIMIT 3"
    );
    const globalRankings = globalRankingsResult.rows;

    // Fetch personal rank
    const personalRankResult = await pool.query(
      "SELECT usuario, total_pontos FROM departamento_pessoal.educ_users WHERE id = $1",
      [id]
    );
    const personalRank = personalRankResult.rows[0];

    // Fetch department rankings
    const departmentRankingsResult = await pool.query(
      "SELECT usuario, total_pontos FROM departamento_pessoal.educ_users WHERE dp = $1 ORDER BY total_pontos DESC LIMIT 3",
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
      DELETE FROM departamento_pessoal.respostas_usuario 
      WHERE id_tentativa IN (
        SELECT id_tentativa FROM departamento_pessoal.tentativas_prova 
        WHERE id_prova = $1
      )
    `;
    await client.query(deleteRespostasUsuarioQuery, [id_prova]);

    // Delete from tentativas_prova
    const deleteTentativasProvaQuery = `
      DELETE FROM departamento_pessoal.tentativas_prova 
      WHERE id_prova = $1
    `;
    await client.query(deleteTentativasProvaQuery, [id_prova]);

    // Delete from alternativas
    const deleteAlternativasQuery = `
      DELETE FROM departamento_pessoal.alternativas 
      WHERE id_questao IN (
        SELECT id_questao FROM departamento_pessoal.questoes 
        WHERE id_prova = $1
      )
    `;
    await client.query(deleteAlternativasQuery, [id_prova]);

    // Delete from questoes
    const deleteQuestoesQuery = `
      DELETE FROM departamento_pessoal.questoes 
      WHERE id_prova = $1
    `;
    await client.query(deleteQuestoesQuery, [id_prova]);

    // Finally, delete the prova
    const deleteProvaQuery =
      "DELETE FROM departamento_pessoal.provas WHERE id_prova = $1 RETURNING *";
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
       FROM departamento_pessoal.provas p
       LEFT JOIN departamento_pessoal.questoes q ON q.id_prova = p.id_prova
       LEFT JOIN departamento_pessoal.alternativas a ON a.id_questao = q.id_questao
       WHERE p.id_modulo IN (
         SELECT m.id
         FROM departamento_pessoal.modules m
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
      "SELECT DISTINCT dp FROM departamento_pessoal.funcoes ORDER BY dp"
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
      "SELECT id, funcao FROM departamento_pessoal.funcoes WHERE dp = $1 ORDER BY funcao",
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
        "SELECT funcao FROM departamento_pessoal.educ_users WHERE id = $1",
        [userId]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const userFuncao = userResult.rows[0].funcao;

      const mandatoryCoursesResult = await pool.query(
        `SELECT c.id, c.title, c.subtitle, c.img 
       FROM departamento_pessoal.courses c
       JOIN departamento_pessoal.cursos_obrigatorios co ON c.id = co.id_curso
       JOIN departamento_pessoal.funcoes f ON co.id_funcao = f.id
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
