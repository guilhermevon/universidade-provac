const ipv4Address = "192.168.0.232"; // Defina o IP correto
const port = 9310;

app.get("/", (req, res) => {
  res.json({
    solicitacao: "Hello world!",
    mensagem: "Olá, eu sou o servidor!",
    routes: ["/cursos", "/funcoes", "/provas", "/ranking", "/users"].map(
      (route) => `http://${ipv4Address}:${port}${route}`
    ),
  });
  console.log(`Solicitação processada em http://${ipv4Address}:${port}`);
});

// Defina outras rotas conforme necessário
app.get("/cursos", (req, res) => {
  res.send("Cursos route");
});

app.get("/funcoes", (req, res) => {
  res.send("Funções route");
});

app.get("/provas", (req, res) => {
  res.send("Provas route");
});

app.get("/ranking", (req, res) => {
  res.send("Ranking route");
});

app.get("/users", (req, res) => {
  res.send("Users route");
});

// Iniciando o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://${ipv4Address}:${port}`);
});
