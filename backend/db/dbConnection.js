import pkg from "pg"; // Importação do módulo como padrão
const { Pool } = pkg; // Desestruturação para obter Pool

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
    console.error("Erro ao conectar ao banco de dados:", err.stack);
    process.exit(1); // Encerra o processo em caso de erro
  }
};

// Exemplo de consulta utilizando pool diretamente
const fetchData = async () => {
  const client = await pool.connect(); // Obtém um cliente do pool
  try {
    const result = await client.query("SELECT * FROM educ_system.educ_users"); // Usa o client para executar a query
    console.log(result.rows);
  } catch (err) {
    console.error("Erro ao executar a consulta:", err.stack);
  } finally {
    client.release(); // Libera a conexão de volta ao pool
  }
};

// Exporta o pool diretamente
export { pool, connectDB, fetchData };
