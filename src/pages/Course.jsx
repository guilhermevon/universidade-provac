import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import Navbar from "../components/NavBar/NavBar";
import ReactPlayer from "react-player";
import axios from "axios";
import { FaStar } from "react-icons/fa";

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
  justify-content: space-between;
  padding-top: calc(60px + 2rem);
  min-height: calc(100vh - 60px - 2rem);
  z-index: 1;
  padding-left: 2rem;
  padding-right: 2rem;
`;

const VideoWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 800px;
  max-width: 1300px;
  background-color: #222;
  border-radius: 8px;
  position: relative;
  left: 3rem;
  padding: 1rem;
`;

const ReactPlayerWrapper = styled.div`
  width: 1300px;
  height: 600px;
  aspect-ratio: 16 / 9;
`;

const ReactPlayerStyled = styled(ReactPlayer)`
  width: 100% !important;
  height: 100% !important;
`;

const CourseTitle = styled.div`
  color: #fff;
  background-color: #222;
  font-size: 1.5rem;
  margin-top: 1rem;
  text-align: center;
  padding: 0.5rem;
`;

const CourseDescription = styled.div`
  color: #ccc;
  background-color: #222;
  font-size: 1.2rem;
  margin-top: 0.5rem;
  text-align: center;
  padding: 0.5rem;
`;

const ListWrapper = styled.div`
  width: 21.8rem;
  height: 34.8rem;
  padding: 1rem;
  background-color: #222;
  border-radius: 8px;
  color: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  position: absolute;
  top: 5.8rem;
  right: 4rem;
  bottom: 2rem;
  left: auto;
`;

const ListTitle = styled.h2`
  margin: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  text-align: center;
`;

const ModuleItem = styled.div`
  margin-bottom: 1rem;
`;

const ModuleTitle = styled.div`
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  background-color: ${(props) => (props.active ? "#948f8f" : "transparent")};
  border-radius: 4px;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${(props) => (props.active ? "#634949" : "#333")};
  }
`;

const AulaItem = styled.div`
  display: flex;
  align-items: flex-start;
  text-align: left;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  margin-left: 1rem;
  margin-top: 1rem;
  background-color: ${(props) => (props.active ? "#555" : "transparent")};
  border-radius: 4px;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${(props) => (props.active ? "#666" : "#444")};
  }
`;

const ExamItem = styled.div`
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  margin-left: 1rem;
  margin-top: 1rem;
  background-color: ${(props) => (props.active ? "#555" : "transparent")};
  border-radius: 4px;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${(props) => (props.active ? "#666" : "#444")};
  }
`;

const RatingWrapper = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StarRating = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const RatingButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  font-size: 1.2rem;
  color: #fff;
  background-color: #4caf50;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #45a049;
  }
`;

const Course = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState({});
  const [openModules, setOpenModules] = useState([]);
  const [selectedAula, setSelectedAula] = useState(null);
  const [courseInfo, setCourseInfo] = useState({ title: "", descricao: "" });
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [rating, setRating] = useState(0); // Estado para armazenar a avaliação do usuário
  const userId = sessionStorage.getItem("userId"); // Pegando userId do sessionStorage

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchCourseData = async () => {
      try {
        const responseAulas = await axios.get(
          `http://localhost:5000/api/course/${id}/aulas`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setModules(responseAulas.data);
        const firstModule = Object.keys(responseAulas.data)[0];
        if (responseAulas.data[firstModule].length > 0) {
          setOpenModules([firstModule]);
          setSelectedAula(responseAulas.data[firstModule][0]);
        }

        const responseCourse = await axios.get(
          `http://localhost:5000/api/course/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCourseInfo(responseCourse.data);

        const responseExams = await axios.get(
          `http://localhost:5000/api/course/${id}/provas`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setExams(responseExams.data);
      } catch (error) {
        console.error("Erro ao buscar informações do curso:", error);
        // Se ocorrer um erro ao buscar as provas, ainda assim continue com a exibição do curso
        if (error.response && error.response.status === 404) {
          setExams([]); // Define exams como uma lista vazia se não houver provas
        } else {
          navigate("/login");
        }
      }
    };

    fetchCourseData();
  }, [id, navigate]);

  const handleModuleClick = (module) => {
    setOpenModules((prevState) =>
      prevState.includes(module)
        ? prevState.filter((m) => m !== module)
        : [...prevState, module]
    );
  };

  const handleAulaClick = (aula) => {
    saveProgress();
    setSelectedAula(aula);
    setSelectedExam(null); // Desseleciona a prova ao selecionar uma aula
  };

  const handleExamClick = (exam) => {
    setSelectedExam(exam);
    setSelectedAula(null); // Desseleciona a aula ao selecionar uma prova
  };

  const handleRatingClick = (rate) => {
    setRating(rate);
  };

  const handleRatingSubmit = async () => {
    const token = sessionStorage.getItem("token");

    try {
      const response = await axios.post(
        `http://localhost:5000/api/course/${id}/rating`,
        {
          userId,
          rating,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Avaliação enviada com sucesso!");
    } catch (error) {
      console.error(
        "Erro ao enviar avaliação:",
        error.response ? error.response.data : error.message
      );
      alert("Erro ao enviar avaliação. Por favor, tente novamente.");
    }
  };

  const saveProgress = async () => {
    if (selectedAula) {
      const nroAula = selectedAula.nro_aula;
      try {
        const progress = 0; // Pode-se adicionar um valor real de progresso
        console.log("Salvando progresso:", {
          userId,
          courseId: id,
          nroAula,
          progress,
        });
        const response = await axios.post(
          "http://localhost:5000/api/course/video-progress",
          {
            userId,
            courseId: id,
            nroAula,
            progress,
          },
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Progresso salvo:", response.data);
      } catch (error) {
        console.error(
          "Erro ao salvar progresso:",
          error.response ? error.response.data : error.message
        );
      }
    }
  };

  return (
    <>
      <GlobalStyle />
      <PageWrapper>
        <Navbar />
        <PageContent>
          <VideoWrapper>
            {selectedAula ? (
              <ReactPlayerWrapper>
                <ReactPlayerStyled
                  url={selectedAula.url}
                  controls
                  width="100%"
                  height="100%"
                />
              </ReactPlayerWrapper>
            ) : selectedExam ? (
              <div>Exibir conteúdo da prova aqui</div>
            ) : (
              <div>Selecione uma aula ou prova para começar</div>
            )}
            {selectedAula && (
              <>
                <CourseTitle>{courseInfo.title}</CourseTitle>
                <CourseDescription>{selectedAula.descricao}</CourseDescription>
              </>
            )}
          </VideoWrapper>
          <ListWrapper>
            <ListTitle>Módulos</ListTitle>
            {Object.keys(modules).map((module, index) => (
              <ModuleItem key={index}>
                <ModuleTitle
                  active={openModules.includes(module)}
                  onClick={() => handleModuleClick(module)}
                >
                  {module}
                </ModuleTitle>
                {openModules.includes(module) &&
                  modules[module].map((aula, aulaIndex) => (
                    <AulaItem
                      key={aulaIndex}
                      active={
                        selectedAula && selectedAula.titulo === aula.titulo
                      }
                      onClick={() => handleAulaClick(aula)}
                    >
                      {aula.titulo}
                    </AulaItem>
                  ))}
              </ModuleItem>
            ))}
            {exams.length > 0 && (
              <>
                <ListTitle>Provas</ListTitle>
                {exams.map((exam, index) => (
                  <ExamItem
                    key={index}
                    active={selectedExam && selectedExam.titulo === exam.titulo}
                    onClick={() => handleExamClick(exam)}
                  >
                    {exam.titulo}
                  </ExamItem>
                ))}
              </>
            )}
            <RatingWrapper>
              <StarRating>
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    size={24}
                    color={i < rating ? "#ffd700" : "#ccc"}
                    onClick={() => handleRatingClick(i + 1)}
                  />
                ))}
              </StarRating>
              <RatingButton onClick={handleRatingSubmit}>
                Enviar Avaliação
              </RatingButton>
            </RatingWrapper>
          </ListWrapper>
        </PageContent>
      </PageWrapper>
    </>
  );
};

export default Course;
