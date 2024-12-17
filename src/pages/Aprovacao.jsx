import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import axios from 'axios';
import Navbar from '../components/NavBar/NavBar';

const GlobalStyle = createGlobalStyle`
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

const ListWrapper = styled.div`
  margin: 2rem;
  padding: 2rem;
  background-color: #2c2c2c;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
`;

const ListTitle = styled.h2`
  color: #FFF;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #444;
    color: #fff;
  }

  th {
    background-color: #333;
  }

  tr:hover {
    background-color: #3c3c3c;
  }
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
`;

const Button = styled.button`
  background-color: ${(props) => props.bgColor || '#4CAF50'};
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  text-align: center;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  margin: 0 0.25rem;

  &:hover {
    background-color: ${(props) => props.hoverColor || '#45a049'};
  }
`;

const ApproveButton = styled(Button)`
  margin-top: 1rem;
  align-self: center;
`;

const Aprovacao = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const token = sessionStorage.getItem('token');
      try {
        const response = await axios.get('http://192.168.0.232:9310/api/courses/approval', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCourses(response.data);
      } catch (error) {
        console.error('Erro ao buscar cursos:', error);
      }
    };

    fetchCourses();
  }, []);

  const handleCheckboxChange = (courseId) => {
    setSelectedCourses((prevSelected) =>
      prevSelected.includes(courseId)
        ? prevSelected.filter((id) => id !== courseId)
        : [...prevSelected, courseId]
    );
  };

  const handleApproveCourses = async () => {
    const token = sessionStorage.getItem('token');
    try {
      await axios.patch(
        'http://192.168.0.232:9310/api/courses/approve',
        { courseIds: selectedCourses },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      alert('Cursos aprovados com sucesso!');
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          selectedCourses.includes(course.id) ? { ...course, status: 'aprovado' } : course
        )
      );
      setSelectedCourses([]);
    } catch (error) {
      console.error('Erro ao aprovar cursos:', error);
      alert('Erro ao aprovar cursos. Por favor, tente novamente.');
    }
  };

  const handleViewCourse = (courseId) => {
    window.location.href = `/course/${courseId}`;
  };

  const handleDeleteCourse = async (courseId) => {
    const token = sessionStorage.getItem('token');
    try {
      await axios.delete(`http://192.168.0.232:9310/api/course/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCourses((prevCourses) => prevCourses.filter((course) => course.id !== courseId));
      alert('Curso deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar curso:', error);
      alert('Erro ao deletar curso. Por favor, tente novamente.');
    }
  };

  return (
    <>
      <GlobalStyle />
      <PageWrapper>
        <Navbar />
        <StarWrapper>
          <Stars />
          <Stars2 />
          <Stars3 />
        </StarWrapper>
        <PageContent>
          <ListWrapper>
            <ListTitle>Cursos em Aprovação</ListTitle>
            <Table>
              <thead>
                <tr>
                  <th>Selecionar</th>
                  <th>Título</th>
                  <th>Subtítulo</th>
                  <th>Departamento</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <Checkbox
                        type="checkbox"
                        checked={selectedCourses.includes(course.id)}
                        onChange={() => handleCheckboxChange(course.id)}
                      />
                    </td>
                    <td>{course.title}</td>
                    <td>{course.subtitle}</td>
                    <td>{course.dp}</td>
                    <td>{course.status}</td>
                    <td>
                      <Button bgColor="#2196F3" hoverColor="#1976D2" onClick={() => handleViewCourse(course.id)}>
                        Visualizar
                      </Button>
                      <Button bgColor="#f44336" hoverColor="#d32f2f" onClick={() => handleDeleteCourse(course.id)}>
                        Apagar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <ApproveButton onClick={handleApproveCourses}>Aprovar</ApproveButton>
          </ListWrapper>
        </PageContent>
      </PageWrapper>
    </>
  );
};

export default Aprovacao;
