import React, { useState, useEffect } from "react";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import axios from "axios";
import Navbar from "../components/NavBar/NavBar";
import { useNavigate } from "react-router-dom";
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

const DeleteModuleForm = styled.div`
  margin: 2rem;
  padding: 2rem;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
`;

const SelectWithMargin = styled(Select)`
  margin-bottom: 1rem;
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

const Modulos = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [deleteCourse, setDeleteCourse] = useState("");
  const [deleteModules, setDeleteModules] = useState([]);
  const navigate = useNavigate();

 /* useEffect(() => {
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
    } catch (error) {
      console.error("Erro ao verificar o token:", error);
    }
  }, [navigate]);*/

  const fetchModules = async () => {
    const token = sessionStorage.getItem("token");

    try {
      const response = await axios.get("http://192.168.0.232:9310/cursos/api/modules");
      setModules(response.data);
    } catch (error) {
      console.error("Erro ao buscar módulos:", error);
    }
  };

  const fetchCourses = async () => {
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
      const coursesData = Object.keys(response.data).flatMap(
        (key) => response.data[key]
      );
      setCourses(coursesData);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
    }
  };

  const fetchDeleteModules = async (courseId) => {
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
      setDeleteModules(response.data);
    } catch (error) {
      console.error("Erro ao buscar módulos para exclusão:", error);
    }
  };

  useEffect(() => {
    fetchModules();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (deleteCourse) {
      fetchDeleteModules(deleteCourse);
    }
  }, [deleteCourse]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://192.168.0.232:9310/cursos/api/manage-modules",
        { name, description, course_id: selectedCourse },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 201) {
        alert("Módulo cadastrado com sucesso!");
        setName("");
        setDescription("");
        setSelectedCourse("");
        fetchModules();
      }
    } catch (error) {
      console.error("Erro ao cadastrar módulo:", error);
      alert("Erro ao cadastrar módulo. Por favor, tente novamente.");
    }
  };

  const handleDeleteModule = async () => {
    const token = sessionStorage.getItem("token");

    try {
      const response = await axios.delete(
        `http://192.168.0.232:9310/cursos/api/module/${selectedModule}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        alert("Módulo deletado com sucesso!");
        setSelectedModule("");
        fetchModules();
      }
    } catch (error) {
      console.error("Erro ao deletar módulo:", error);
      alert("Erro ao deletar módulo. Por favor, tente novamente.");
    }
  };

  return (
    <>
      <GlobalStyle />
      <PageWrapper>
        <Navbar />
       
        <PageContent>
          <FormWrapper>
            <FormTitle>Cadastro de Módulo</FormTitle>
            <Form onSubmit={handleSubmit}>
              <Input
                type="text"
                placeholder="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                    {course.title}
                  </option>
                ))}
              </Select>
              <SubmitButton type="submit">Cadastrar</SubmitButton>
            </Form>
          </FormWrapper>
          <DeleteModuleForm>
            <FormTitle>Apagar Módulo</FormTitle>
            <SelectWithMargin
              value={deleteCourse}
              onChange={(e) => setDeleteCourse(e.target.value)}
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
            </SelectWithMargin>
            <SelectWithMargin
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              required
              disabled={!deleteCourse}
            >
              <option value="" disabled>
                Selecione um módulo
              </option>
              {deleteModules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </SelectWithMargin>
            <DeleteButton onClick={handleDeleteModule}>Deletar</DeleteButton>
          </DeleteModuleForm>
        </PageContent>
      </PageWrapper>
    </>
  );
};

export default Modulos;
