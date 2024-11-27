const { Pool } = require("pg");

// Configurações do banco de dados
const pool = new Pool({
  user: "admin_provac",
  host: "192.168.0.232",
  database: "provac_producao",
  password: "Provac@2024",
  port: 5432,
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
