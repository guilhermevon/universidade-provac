import express from "express";
import pkg from "pg";
import dotenv from "dotenv";

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
});

const rankingRouter = express.Router();

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

const PORT = process.env.PORT || 5000;
rankingRouter.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

export default rankingRouter; // Exporta apenas a aplicação Express
