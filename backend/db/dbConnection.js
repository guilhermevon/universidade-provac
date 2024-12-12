const { Pool } = require("pg");

// Configurações do banco de dados
const pool = new Pool({
  user: "admin_provac",
  host: "192.168.0.232",
  database: "provac_producao",
  password: "Provac@2024",
  port: 5432,
});

// Função para configurar o search_path para o schema educ_system
const setSearchPath = async () => {
  const client = await pool.connect();
  try {
    await client.query("SET search_path TO educ_system");
    console.log("search_path configurado para educ_system.");
  } catch (err) {
    console.error("Erro ao configurar o search_path:", err.stack);
  } finally {
    client.release(); // Libera a conexão de volta ao pool
  }
};

// Função para conectar ao banco de dados
const connectDB = async () => {
  try {
    await pool.connect();
    console.log("Conexão com o banco de dados estabelecida com sucesso!");
    // Configura o search_path logo após a conexão
    await setSearchPath();
  } catch (err) {
    console.error("Erro ao conectar ao banco de dados:", err.stack);
    process.exit(1); // Encerra o processo em caso de erro
  }
};

// Exemplo de consulta
const fetchData = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM some_table");
    console.log(result.rows);
  } catch (err) {
    console.error("Erro ao executar a consulta:", err.stack);
  } finally {
    client.release(); // Libera a conexão de volta ao pool
  }
};

export { pool, connectDB, fetchData };
