import express from "express";
import pkg from "pg";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../db/dbConnection.js"; // Alterando para importação nomeada

dotenv.config();

const cursosRouter = express.Router();

cursosRouter.get("/", async (req, res) => {
  try {
    // Conexão com o banco e execução da query
    const result = await pool.query("SELECT * FROM educ_system.courses");

    res.json(result.rows); // Retorna apenas os dados das linhas
  } catch (err) {
    console.error("Erro ao consultar o banco de dados:", err);
    res.status(500).send("Erro ao consultar o banco de dados");
  }
});

cursosRouter.get("/buscar", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, dp, title, subtitle, img
         FROM educ_system.courses 
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

cursosRouter.post("/api/manage-courses", async (req, res) => {
  const { title, subtitle, img, dp } = req.body;
  const { role } = req.user;

  if (role !== "Gestor") {
    return res.status(403).json({ message: "Acesso não autorizado" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO educ_system.courses (title, subtitle, img, dp) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, subtitle, img, dp]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao adicionar curso:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

cursosRouter.get("/api/course/:id", async (req, res) => {
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

cursosRouter.get("/api/course/:id/aulas", async (req, res) => {
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
cursosRouter.post(
  "/api/course/video-progress",

  async (req, res) => {
    const { userId, courseId, nroAula, progress } = req.body;

    console.log("Recebendo progresso do vídeo:", req.body);

    if (
      !userId ||
      !courseId ||
      nroAula === undefined ||
      progress === undefined
    ) {
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
  }
);

cursosRouter.get(
  "/api/user/:userId/courses-progress",

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
cursosRouter.post(
  "/api/course/:courseId/aula/:aulaId/pontuacao",
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

cursosRouter.get("/api/course/:courseId/provas", async (req, res) => {
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

// Rota para buscar todas as funções de um departamento específico
cursosRouter.get("/api/course/:id/aulas", async (req, res) => {
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

cursosRouter.delete("/api/aula/:id", async (req, res) => {
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

cursosRouter.delete("/api/course/:id", async (req, res) => {
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
cursosRouter.get("/api/modules", async (req, res) => {
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
cursosRouter.post("/api/manage-modules", async (req, res) => {
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
cursosRouter.delete("/api/module/:id", async (req, res) => {
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

cursosRouter.post("/api/manage-aulas", async (req, res) => {
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
cursosRouter.get("/api/courses/:courseId/modules", async (req, res) => {
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

export default cursosRouter; // Exporta apenas a aplicação Express
