import React, { useState, useEffect } from "react";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import axios from "axios";
import Navbar from "../components/NavBar/NavBar";
import { useParams, useNavigate } from "react-router-dom";
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

const DeleteAulaForm = styled.div`
  margin: 2rem;
  padding: 2rem;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

const Aulas = () => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedAula, setSelectedAula] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      const user = JSON.parse(jsonPayload);
      console.log("User payload:", user);
      console.log("User role:", user.role);
      console.log("selected", selectedCourse);
    } catch (error) {
      console.error("Erro ao verificar o token:", error);
    }
  }, []);

  const fetchCourses = async () => {
    const token = sessionStorage.getItem("token");

    try {
      const response = await axios.get("http://192.168.0.232:9310/cursos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const coursesData = Object.keys(response.data).flatMap(
        (key) => response.data[key]
      );
      setCourses(coursesData);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
    }
  };

  const fetchModules = async (courseId) => {
    const token = sessionStorage.getItem("token");

    try {
      const response = await axios.get(
        `http://192.168.0.232:9310/cursos/api/courses/${courseId}/modules`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setModules(response.data);
    } catch (error) {
      console.error("Erro ao buscar módulos:", error);
    }
  };

  const fetchAulas = async () => {
    const token = sessionStorage.getItem("token");

    if (!selectedCourse || !selectedModule) {
      console.error("Curso ou módulo não selecionado.");
      return;
    }

    try {
      const response = await axios.get(
        `http://192.168.0.232:9310/cursos/api/course/${selectedCourse}/module/${selectedModule}/aulas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        setAulas(response.data);
      } else {
        console.error("Nenhuma aula encontrada.");
        setAulas([]);
      }
    } catch (error) {
      console.error("Erro ao buscar aulas:", error);
      setAulas([]);
    }
  };

  useEffect(() => {
    if (selectedCourse && selectedModule) {
      fetchAulas();
    }
  }, [selectedCourse, selectedModule]);

  useEffect(() => {
    if (selectedCourse && selectedModule) {
      fetchAulas();
    }
  }, [selectedCourse, selectedModule]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedModule) {
      fetchAulas(selectedCourse, selectedModule);
    }
  }, [selectedCourse, selectedModule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://192.168.0.232:9310/cursos/api/manage-aulas",
        {
          title,
          url,
          description,
          course_id: selectedCourse,
          module_id: selectedModule,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 201) {
        alert("Aula cadastrada com sucesso!");
        setTitle("");
        setUrl("");
        setDescription("");
        setSelectedCourse("");
        setSelectedModule("");
      }
    } catch (error) {
      console.error("Erro ao cadastrar aula:", error);
      alert("Erro ao cadastrar aula. Por favor, tente novamente.");
    }
  };

  const handleDeleteAula = async () => {
    const token = sessionStorage.getItem("token");

    try {
      const response = await axios.delete(
        `http://192.168.0.232:9310/cursos/api/aulas/${selectedAula}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        alert("Aula deletada com sucesso!");
        setSelectedAula("");
        fetchAulas(selectedModule);
      }
    } catch (error) {
      console.error("Erro ao deletar aula:", error);
      alert("Erro ao deletar aula. Por favor, tente novamente.");
    }
  };

  return (
    <>
      <GlobalStyle />
      <PageWrapper>
        <Navbar />
        <PageContent>
          <FormWrapper>
            <FormTitle>Cadastro de Aula</FormTitle>
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
                placeholder="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <Input
                type="text"
                placeholder="Descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione um curso
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title || course.id}
                  </option>
                ))}
              </Select>
              <Select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione um módulo
                </option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </Select>
              <SubmitButton type="submit">Cadastrar</SubmitButton>
            </Form>
          </FormWrapper>
          <DeleteAulaForm>
            <FormTitle>Apagar Aula</FormTitle>
            <Select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
            >
              <option value="" disabled>
                Selecione um curso
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </Select>
            <Select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              required
            >
              <option value="" disabled>
                Selecione um módulo
              </option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </Select>
            <Select
              value={selectedAula}
              onChange={(e) => setSelectedAula(e.target.value)}
              required
            >
              <option value="" disabled>
                Selecione uma aula
              </option>
              <Select
                value={selectedAula}
                onChange={(e) => setSelectedAula(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione uma aula
                </option>
                {aulas.map((aula) => (
                  <option key={aula.id} value={aula.id}>
                    {aula.title || aula.titulo}
                  </option>
                ))}
              </Select>
            </Select>
            <DeleteButton onClick={handleDeleteAula}>Deletar</DeleteButton>
          </DeleteAulaForm>
        </PageContent>
      </PageWrapper>
    </>
  );
};

export default Aulas;
