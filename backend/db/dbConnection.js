const { Pool } = require("pg");

// Configurações do banco de dados
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

// Função para conectar ao banco de dados
const connectDB = async () => {
  try {
    await pool.connect();
    console.log("Conexão com o banco de dados estabelecida com sucesso!");
  } catch (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
    process.exit(1); // Encerra o processo em caso de erro
  }
};

// Exporta o pool e a função de conexão
module.exports = {
  pool,
  connectDB,
};
