// src/pages/Areagest.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import styled, { keyframes } from "styled-components";
import Navbar from "../components/NavBar/NavBar";

const Container = styled.div`
  padding: 20px;
  margin-left: 250px; // Adicione margem para não sobrepor o sidebar
  z-index: 1;
  position: relative;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
`;

const Textarea = styled.textarea`
  padding: 10px;
  font-size: 16px;
  height: 100px;
`;

const Button = styled.button`
  padding: 10px;
  font-size: 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
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
`;

const StarWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
`;

const Areagest = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courses, setCourses] = useState([]);
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(
          "http://192.168.0.232:9310/api/manage-courses",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCourses(response.data || []); // Garante que `courses` seja uma array
      } catch (error) {
        console.error("Erro ao buscar cursos:", error);
      }
    };

    fetchCourses();
  }, [token]);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://192.168.0.232:9310/api/manage-courses",
        { title, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourses([...courses, response.data]);
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Erro ao adicionar curso:", error);
    }
  };

  return (
    <>
      <Navbar />
      <PageWrapper>
        <StarWrapper>
          <Stars />
          <Stars2 />
          <Stars3 />
        </StarWrapper>
        <Container>
          <h1>Gerenciar Cursos</h1>
          <Form onSubmit={handleAddCourse}>
            <Input
              type="text"
              placeholder="Título do Curso"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Descrição do Curso"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <Button type="submit">Adicionar Curso</Button>
          </Form>
          <div>
            <h2>Lista de Cursos</h2>
            {Array.isArray(courses) &&
              courses.map((course) => (
                <div key={course.id}>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                </div>
              ))}
          </div>
        </Container>
      </PageWrapper>
    </>
  );
};

export default Areagest;
