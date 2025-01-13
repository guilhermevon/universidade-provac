import React, { useState, useEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";
import axios from "axios";
import Navbar from "../components/NavBar/NavBar";

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css?family=Lato:300,400,700&display=swap');

  html, body {
    height: 100%;
    margin: 0;
    font-family: 'Lato', sans-serif;
  }

  body {
    background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
    background-attachment: fixed;
    overflow-y: auto;
  }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  position: relative;
  overflow: hidden;
`;

const PageContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: calc(60px + 2rem);
  min-height: calc(100vh - 60px - 2rem);
  z-index: 1;
  padding-left: 2rem;
  padding-right: 2rem;
`;

const FormWrapper = styled.div`
  margin: 2rem;
  padding: 2rem;
  background-color: #2c2c2c;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  width: 80%;
  max-width: 800px;
`;

const FormTitle = styled.h2`
  color: #fff;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #333;
  color: #fff;
  font-size: 1rem;

  &::placeholder {
    color: #bbb;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #333;
  color: #fff;
  font-size: 1rem;

  &::placeholder {
    color: #bbb;
  }
`;

const Button = styled.button`
  background-color: #4caf50;
  border: none;
  color: white;
  padding: 0.75rem 1rem;
  text-align: center;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  margin-top: 1rem;

  &:hover {
    background-color: #45a049;
  }
`;

const DeleteButton = styled.button`
  background-color: #e74c3c;
  border: none;
  color: white;
  padding: 0.75rem 1rem;
  text-align: center;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  margin-top: 1rem;

  &:hover {
    background-color: #c0392b;
  }
`;

const AlternativaWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const FlagLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const Provas = () => {
  const [prova, setProva] = useState({
    titulo: "",
    descricao: "",
    duracao: "",
    nota_minima_aprovacao: "",
    cursoId: "",
    moduloId: "",
  });
  const [questoes, setQuestoes] = useState([
    {
      enunciado: "",
      tipo_questao: "multipla_escolha",
      pontuacao: "",
      alternativas: [{ texto_alternativa: "", correta: false }],
    },
  ]);
  const [cursoId, setCursoId] = useState("");
  const [moduloId, setModuloId] = useState("");
  const [provaId, setProvaId] = useState("");
  const [cursos, setCursos] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [provas, setProvas] = useState([]);

  useEffect(() => {
    const fetchCursos = async () => {
      const token = sessionStorage.getItem("token");
      try {
        const response = await axios.get(
          "http://192.168.0.232:9310/cursos/api/courses",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const cursosData = Object.keys(response.data).flatMap(
          (key) => response.data[key]
        );
        setCursos(cursosData);
      } catch (error) {
        console.error("Erro ao buscar cursos:", error);
      }
    };

    fetchCursos();
  }, []);

  useEffect(() => {
    if (prova.cursoId) {
      const fetchModulos = async () => {
        const token = sessionStorage.getItem("token");
        try {
          const response = await axios.get(
            `http://192.168.0.232:9310/cursos/api/courses/${prova.cursoId}/modules`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setModulos(response.data);
        } catch (error) {
          console.error("Erro ao buscar módulos:", error);
        }
      };

      fetchModulos();
    }
  }, [prova.cursoId]);

  useEffect(() => {
    if (cursoId) {
      const fetchModulos = async () => {
        const token = sessionStorage.getItem("token");
        try {
          const response = await axios.get(
            `http://192.168.0.232:9310/cursos/api/courses/${cursoId}/modules`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setModulos(response.data);
        } catch (error) {
          console.error("Erro ao buscar módulos:", error);
        }
      };

      fetchModulos();
    }
  }, [cursoId]);

  useEffect(() => {
    if (moduloId) {
      const fetchProvas = async () => {
        const token = sessionStorage.getItem("token");
        try {
          const response = await axios.get(
            `http://192.168.0.232:9310/api/course/${cursoId}/provas`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setProvas(response.data.filter((p) => p.id_modulo === moduloId));
        } catch (error) {
          console.error("Erro ao buscar provas:", error);
        }
      };

      fetchProvas();
    }
  }, [cursoId, moduloId]);

  const handleProvaChange = (e) => {
    const { name, value } = e.target;
    setProva((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleQuestaoChange = (qIndex, e) => {
    const { name, value } = e.target;
    const newQuestoes = [...questoes];
    newQuestoes[qIndex] = { ...newQuestoes[qIndex], [name]: value };
    setQuestoes(newQuestoes);
  };

  const handleAlternativaChange = (qIndex, aIndex, e) => {
    const { name, value, checked, type } = e.target;
    const newQuestoes = [...questoes];
    newQuestoes[qIndex].alternativas[aIndex] = {
      ...newQuestoes[qIndex].alternativas[aIndex],
      [name]: type === "checkbox" ? checked : value,
    };
    setQuestoes(newQuestoes);
  };

  const addQuestao = () => {
    setQuestoes([
      ...questoes,
      {
        enunciado: "",
        tipo_questao: "multipla_escolha",
        pontuacao: "",
        alternativas: [{ texto_alternativa: "", correta: false }],
      },
    ]);
  };

  const deleteQuestao = (qIndex) => {
    setQuestoes(questoes.filter((_, index) => index !== qIndex));
  };

  const addAlternativa = (qIndex) => {
    const newQuestoes = [...questoes];
    newQuestoes[qIndex].alternativas.push({
      texto_alternativa: "",
      correta: false,
    });
    setQuestoes(newQuestoes);
  };

  const deleteAlternativa = (qIndex, aIndex) => {
    const newQuestoes = [...questoes];
    newQuestoes[qIndex].alternativas = newQuestoes[qIndex].alternativas.filter(
      (_, index) => index !== aIndex
    );
    setQuestoes(newQuestoes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem("token");

    try {
      const responseProva = await axios.post(
        "http://192.168.0.232:9310/provas/api/manage-provas",
        { ...prova, questoes },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (responseProva.status === 201) {
        alert("Prova cadastrada com sucesso!");
        setProva({
          titulo: "",
          descricao: "",
          duracao: "",
          nota_minima_aprovacao: "",
          cursoId: "",
          moduloId: "",
        });
        setQuestoes([
          {
            enunciado: "",
            tipo_questao: "multipla_escolha",
            pontuacao: "",
            alternativas: [{ texto_alternativa: "", correta: false }],
          },
        ]);
      }
    } catch (error) {
      console.error("Erro ao cadastrar prova:", error);
      alert("Erro ao cadastrar prova. Por favor, tente novamente.");
    }
  };

  const handleDeleteProva = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem("token");

    try {
      await axios.delete(`http://192.168.0.232:9310/api/prova/${provaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Prova deletada com sucesso!");
      setProvaId("");
      setProvas(provas.filter((p) => p.id_prova !== provaId));
    } catch (error) {
      console.error("Erro ao deletar prova:", error);
      alert("Erro ao deletar prova. Por favor, tente novamente.");
    }
  };

  return (
    <>
      <GlobalStyle />
      <PageWrapper>
        <Navbar />
        <PageContent>
          <FormWrapper>
            <FormTitle>Cadastro de Prova</FormTitle>
            <Form onSubmit={handleSubmit}>
              <Input
                type="text"
                placeholder="Título"
                name="titulo"
                value={prova.titulo}
                onChange={handleProvaChange}
                required
              />
              <Input
                type="text"
                placeholder="Descrição"
                name="descricao"
                value={prova.descricao}
                onChange={handleProvaChange}
                required
              />
              <Input
                type="text"
                placeholder="Duração (em minutos)"
                name="duracao"
                value={prova.duracao}
                onChange={handleProvaChange}
                required
              />
              <Input
                type="text"
                placeholder="Nota mínima para aprovação"
                name="nota_minima_aprovacao"
                value={prova.nota_minima_aprovacao}
                onChange={handleProvaChange}
                required
              />
              <Select
                value={prova.cursoId}
                name="cursoId"
                onChange={handleProvaChange}
                required
              >
                <option value="" disabled>
                  Selecione um curso
                </option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.title}
                  </option>
                ))}
              </Select>
              <Select
                value={prova.moduloId}
                name="moduloId"
                onChange={handleProvaChange}
                required
              >
                <option value="" disabled>
                  Selecione um módulo
                </option>
                {modulos.map((modulo) => (
                  <option key={modulo.id} value={modulo.id}>
                    {modulo.name}
                  </option>
                ))}
              </Select>

              {questoes.map((questao, qIndex) => (
                <div key={qIndex}>
                  <Input
                    type="text"
                    placeholder="Enunciado"
                    name="enunciado"
                    value={questao.enunciado}
                    onChange={(e) => handleQuestaoChange(qIndex, e)}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Pontuação"
                    name="pontuacao"
                    value={questao.pontuacao}
                    onChange={(e) => handleQuestaoChange(qIndex, e)}
                    required
                  />
                  <Select
                    name="tipo_questao"
                    value={questao.tipo_questao}
                    onChange={(e) => handleQuestaoChange(qIndex, e)}
                    required
                  >
                    <option value="multipla_escolha">Múltipla Escolha</option>
                    <option value="discursiva">Discursiva</option>
                  </Select>

                  {questao.tipo_questao === "multipla_escolha" &&
                    questao.alternativas.map((alternativa, aIndex) => (
                      <AlternativaWrapper key={aIndex}>
                        <Input
                          type="text"
                          placeholder="Texto da Alternativa"
                          name="texto_alternativa"
                          value={alternativa.texto_alternativa}
                          onChange={(e) =>
                            handleAlternativaChange(qIndex, aIndex, e)
                          }
                          required
                        />
                        <FlagLabel>
                          <input
                            type="checkbox"
                            name="correta"
                            checked={alternativa.correta}
                            onChange={(e) =>
                              handleAlternativaChange(qIndex, aIndex, e)
                            }
                          />
                          Correta
                        </FlagLabel>
                        <DeleteButton
                          type="button"
                          onClick={() => deleteAlternativa(qIndex, aIndex)}
                        >
                          Apagar
                        </DeleteButton>
                      </AlternativaWrapper>
                    ))}
                  {questao.tipo_questao === "multipla_escolha" && (
                    <ButtonGroup>
                      <Button
                        type="button"
                        onClick={() => addAlternativa(qIndex)}
                      >
                        Adicionar Alternativa
                      </Button>
                      <DeleteButton
                        type="button"
                        onClick={() => deleteQuestao(qIndex)}
                      >
                        Apagar Questão
                      </DeleteButton>
                    </ButtonGroup>
                  )}
                </div>
              ))}
              <Button type="button" onClick={addQuestao}>
                Adicionar Questão
              </Button>
              <Button type="submit">Cadastrar Prova</Button>
            </Form>
          </FormWrapper>
          <FormWrapper>
            <FormTitle>Excluir Prova</FormTitle>
            <Form onSubmit={handleDeleteProva}>
              <Select
                value={cursoId}
                onChange={(e) => setCursoId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione um curso
                </option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.title}
                  </option>
                ))}
              </Select>
              <Select
                value={moduloId}
                onChange={(e) => setModuloId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione um módulo
                </option>
                {modulos.map((modulo) => (
                  <option key={modulo.id} value={modulo.id}>
                    {modulo.name}
                  </option>
                ))}
              </Select>
              <Select
                value={provaId}
                onChange={(e) => setProvaId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione uma prova
                </option>
                {provas.map((prova) => (
                  <option key={prova.id_prova} value={prova.id_prova}>
                    {prova.titulo}
                  </option>
                ))}
              </Select>
              <DeleteButton type="submit">Excluir Prova</DeleteButton>
            </Form>
          </FormWrapper>
        </PageContent>
      </PageWrapper>
    </>
  );
};

export default Provas;
