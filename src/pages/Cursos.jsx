import React, { useState, useEffect } from "react";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import axios from "axios";
import Navbar from "../components/NavBar/NavBar";
import backgroundImage from "../assets/bg_home.png";

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css?family=Lato:300,400,700&display=swap');

  html, body {
    height: 100%;
    margin: 0;
    font-family: 'Lato', sans-serif;
    background-size: cover;
    color: #1b2735;
    overflow-y: auto;
  }

  ::selection {
    background: #0D47A1; /* Azul marinho para o fundo da seleção */
    color: white;
  }
`;

const generateBoxShadow = (n) => {
  let value = `${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`;
  for (let i = 1; i < n; i++) {
    value += `, ${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`;
  }
  return value;
};

const shadowsSmall = generateBoxShadow(700);
const shadowsMedium = generateBoxShadow(200);
const shadowsBig = generateBoxShadow(100);

const animStar = keyframes`
  from {
    transform: translateY(0px);
  }
  to {
    transform: translateY(-2000px);
  }
`;

const Stars = styled.div`
  width: 1px;
  height: 1px;
  background: transparent;
  box-shadow: ${shadowsSmall};
  animation: ${animStar} 50s linear infinite;

  &:after {
    content: " ";
    position: absolute;
    top: 2000px;
    width: 1px;
    height: 1px;
    background: transparent;
    box-shadow: ${shadowsSmall};
  }
`;

const Stars2 = styled.div`
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: ${shadowsMedium};
  animation: ${animStar} 100s linear infinite;

  &:after {
    content: " ";
    position: absolute;
    top: 2000px;
    width: 2px;
    height: 2px;
    background: transparent;
    box-shadow: ${shadowsMedium};
  }
`;

const Stars3 = styled.div`
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: ${shadowsBig};
  animation: ${animStar} 150s linear infinite;

  &:after {
    content: " ";
    position: absolute;
    top: 2000px;
    width: 3px;
    height: 3px;
    background: transparent;
    box-shadow: ${shadowsBig};
  }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  padding-left: 250px;

  @media (max-width: 768px) {
    padding-left: 0;
  }
`;

const StarWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
`;

const PageContent = styled.div`
  position: relative;
  padding-top: calc(60px + 2rem);
  min-height: calc(100vh - 60px - 2rem);
  z-index: 1;
`;

const FormWrapper = styled.div`
  margin: 2rem;
  padding: 2rem;
  background-color: rgba(0, 0, 0, 0.7); /* Fundo escuro translúcido */
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
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

const SubmitButton = styled.button`
  background-color: #0d47a1; /* Azul escuro */
  border: none;
  color: white;
  padding: 0.75rem 1rem;
  text-align: center;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  margin-top: 1rem;

  &:hover {
    background-color: #002171; /* Azul mais escuro ao passar o mouse */
  }
`;

const DeleteCourseForm = styled.div`
  margin: 2rem;
  padding: 2rem;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
`;

const DeleteButton = styled.button`
  background-color: #e74c3c; /* Vermelho */
  border: none;
  color: white;
  padding: 0.75rem 1rem;
  text-align: center;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  margin-top: 1rem;

  &:hover {
    background-color: #c0392b; /* Vermelho mais escuro ao passar o mouse */
  }
`;

const MandatoryCourseForm = styled.div`
  margin: 2rem;
  padding: 2rem;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
`;

const Cursos = () => {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [img, setImg] = useState("");
  const [dp, setDp] = useState("");
  const [courses, setCourses] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedFuncao, setSelectedFuncao] = useState("");

  const fetchCourses = async () => {
    const token = sessionStorage.getItem("token");

    try {
      const response = await axios.get("http://192.168.0.232:9310/cursos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data;
      // Verifique se os dados estão no formato esperado.
      console.log(data);
      setCourses(data || {}); // Garanta que courses seja sempre um objeto.
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
      setCourses({}); // Fallback para um objeto vazio em caso de erro.
    }
  };

  const fetchFuncoes = async () => {
    const token = sessionStorage.getItem("token");

    try {
      const response = await axios.get("http://192.168.0.232:9310/funcoes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFuncoes(response.data);
    } catch (error) {
      console.error("Erro ao buscar funções:", error);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchFuncoes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://192.168.0.232:9310/cursos/api/manage-courses",
        // "http://192.168.0.232:9310/api/manage-courses",
        { title, subtitle, img, dp },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 201) {
        alert("Curso cadastrado com sucesso!");
        setTitle("");
        setSubtitle("");
        setImg("");
        setDp("");
        fetchCourses();
      }
    } catch (error) {
      console.error("Erro ao cadastrar curso:", error);
      alert("Erro ao cadastrar curso. Por favor, tente novamente.");
    }
  };

  const handleDeleteCourse = async () => {
    const token = sessionStorage.getItem("token");

    try {
      const response = await axios.delete(
        `http://192.168.0.232:9310/cursos/${selectedCourse}`,
        //`http://192.168.0.232:9310/api/course/${selectedCourse}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        alert("Curso deletado com sucesso!");
        setSelectedCourse("");
        fetchCourses();
      }
    } catch (error) {
      console.error("Erro ao deletar curso:", error);
      alert("Erro ao deletar curso. Por favor, tente novamente.");
    }
  };

  const handleMandatoryCourseSubmit = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem("token");

    try {
      const response = await axios.post(
        `http://192.168.0.232:9310/cursos/${selectedCourse}`,
        //"http://192.168.0.232:9310/api/mandatory-course",
        { courseId: selectedCourse, funcaoId: selectedFuncao },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 201) {
        alert("Curso obrigatório atribuído com sucesso!");
        setSelectedCourse("");
        setSelectedFuncao("");
      }
    } catch (error) {
      console.error("Erro ao atribuir curso obrigatório:", error);
      alert("Erro ao atribuir curso obrigatório. Por favor, tente novamente.");
    }
  };
  console.log(courses[dp]);

  return (
    <>
      <GlobalStyle />
      <PageWrapper>
        <Navbar />
        <PageContent>
          <FormWrapper>
            <FormTitle>Cadastro de Curso</FormTitle>
            <Form onSubmit={handleSubmit}>
              <Input
                type="text"
                placeholder="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                type="text"
                placeholder="Subtítulo"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                required
              />
              <Input
                type="text"
                placeholder="Imagem"
                value={img}
                onChange={(e) => setImg(e.target.value)}
                required
              />
              <Select
                value={dp}
                onChange={(e) => setDp(e.target.value)}
                required
              >
                <option value="" disabled>
                  Departamento
                </option>
                <option value="RH">RH</option>
                <option value="PMO">PMO</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Juridico">Juridico</option>
                <option value="Frotas">Frotas</option>
                <option value="Compras">Compras</option>
                <option value="Contratos">Contratos</option>
                <option value="Contavel">Contavel</option>
                <option value="SMS">SMS</option>
              </Select>
              <SubmitButton type="submit">Cadastrar</SubmitButton>
            </Form>
          </FormWrapper>
          <DeleteCourseForm>
            <FormTitle>Apagar Curso</FormTitle>
            <Select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
            >
              <option value="" disabled>
                Selecione um curso
              </option>
              {Array.isArray(courses[dp]) ? (
                courses[dp].map((course) => (
                  <div key={course.id}>{course.title}</div>
                ))
              ) : (
                <p>Não há cursos disponíveis para {dp}</p>
              )}
            </Select>
            <DeleteButton onClick={handleDeleteCourse}>Deletar</DeleteButton>
          </DeleteCourseForm>
          <MandatoryCourseForm>
            <FormTitle>Atribuir Curso Obrigatório</FormTitle>
            <Form onSubmit={handleMandatoryCourseSubmit}>
              <Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione um curso
                </option>
                {Array.isArray(courses[dp]) ? (
                  courses[dp].map((course) => (
                    <div key={course.id}>{course.title}</div>
                  ))
                ) : (
                  <p>Não há cursos disponíveis para {dp}</p>
                )}
              </Select>
              <Select
                value={selectedFuncao}
                onChange={(e) => setSelectedFuncao(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione uma função
                </option>
                {funcoes.map((funcao) => (
                  <option key={funcao.id} value={funcao.id}>
                    {funcao.funcao} - {funcao.dp}
                  </option>
                ))}
              </Select>
              <SubmitButton type="submit">Atribuir</SubmitButton>
            </Form>
          </MandatoryCourseForm>
        </PageContent>
      </PageWrapper>
    </>
  );
};

export default Cursos;
