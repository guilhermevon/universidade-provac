import express from "express";
//import pkg from "pg";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import pool from "../db/dbConnection.js";

dotenv.config();

/*const { Pool } = pkg;

const pool = new Pool({
  user: "admin_provac",
  host: "192.168.0.232",
  database: "provac_producao",
  password: "Provac@2024",
  port: "5432",
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.stack);
  } else {
    console.log("Conexão bem-sucedida ao banco de dados!");
    release(); // Libera a conexão de volta ao pool
  }
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
});*/

const provasRouter = express.Router();

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

provasRouter.get("/", async (req, res) => {
  try {
    // Conexão com o banco e execução da query
    const result = await pool.query("SELECT * FROM educ_system.provas");

    res.json(result.rows); // Retorna apenas os dados das linhas
  } catch (err) {
    console.error("Erro ao consultar o banco de dados:", err);
    res.status(500).send("Erro ao consultar o banco de dados");
  }
});

provasRouter.post("/api/manage-provas", async (req, res) => {
  const {
    titulo,
    descricao,
    duracao,
    nota_minima_aprovacao,
    cursoId,
    moduloId,
    questoes,
  } = req.body;

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

provasRouter.get(
  "/api/prova/:id_prova/questoes",
  authenticateJWT,
  async (req, res) => {
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
  }
);

provasRouter.get("/api/course/:id/provas", async (req, res) => {
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

//rota para buscar as provas com base no course_id e no modulo_id
provasRouter.get(
  "/api/course/:courseId/module/:moduleId/provas",
  async (req, res) => {
    const { courseId, moduleId } = req.params;

    try {
      const query = `
      SELECT 
        m.name AS modulo,
        p.titulo AS prova,
        p.descricao,
        p.duracao,
        p.nota_minima_aprovacao,
        p.data_criacao,
        p.data_atualizacao
      FROM 
        educ_system.courses c
      JOIN 
        educ_system.provas p ON c.id = p.id_modulo
      JOIN
        educ_system.modules m ON p.id_modulo = m.id
      WHERE c.id = $1 AND m.id = $2
      ORDER BY m.name, p.data_criacao;
    `;

      const result = await pool.query(query, [courseId, moduleId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Nenhuma prova encontrada para este curso e módulo",
        });
      }

      const provas = result.rows.map((prova) => ({
        modulo: prova.modulo,
        prova: prova.prova,
        descricao: prova.descricao,
        duracao: prova.duracao,
        nota_minima_aprovacao: prova.nota_minima_aprovacao,
        data_criacao: prova.data_criacao,
        data_atualizacao: prova.data_atualizacao,
      }));

      res.json(provas);
    } catch (error) {
      console.error("Erro ao buscar provas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);
//---------------------------------------------------------------------------------------------

provasRouter.post("/api/respostas", authenticateJWT, async (req, res) => {
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

provasRouter.post("/api/exam/start", authenticateJWT, async (req, res) => {
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

provasRouter.post("/api/exam/submit", authenticateJWT, async (req, res) => {
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

provasRouter.delete("/api/prova/:id_prova", async (req, res) => {
  const { id_prova } = req.params;
  {
    /*const { role } = req.user;

    if (role !== "1") {
      return res.status(403).json({ message: "Acesso não autorizado" });
    } */
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

provasRouter.get(
  "/api/prova/:id/questoes",
  authenticateJWT,
  async (req, res) => {
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
  }
);

// Rota para buscar questões de uma prova específica
provasRouter.get(
  "/api/prova/:id/questoes",
  authenticateJWT,
  async (req, res) => {
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
  }
);

export default provasRouter; // Exporta apenas a aplicação Express
