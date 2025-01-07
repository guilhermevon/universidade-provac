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

const rankingRouter = express.Router();

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

rankingRouter.get("/", async (req, res) => {
  try {
    // Conexão com o banco e execução da query
    const result = await pool.query(
      "SELECT * FROM educ_system.ranking_usuarios"
    );

    res.json(result.rows); // Retorna apenas os dados das linhas
  } catch (err) {
    console.error("Erro ao consultar o banco de dados:", err);
    res.status(500).send("Erro ao consultar o banco de dados");
  }
});

rankingRouter.get("/api/rankings", authenticateJWT, async (req, res) => {
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

// Rota para registrar pontuação ao completar um módulo
rankingRouter.post(
  "/api/course/:courseId/modulo/:moduloId/pontuacao",
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

export default rankingRouter; // Exporta apenas a aplicação Express
