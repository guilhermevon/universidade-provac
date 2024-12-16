import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import axios from "axios";
import Navbar from "../components/NavBar/NavBar";
import { FaArrowLeft, FaArrowRight, FaCrown, FaMedal } from "react-icons/fa";
import backgroundImage from "../assets/bg_home.png";

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css?family=Lato:300,400,700&display=swap');

  html, body {
    height: 100%;
    margin: 0;
    font-family: 'Lato', sans-serif;
    background: url(${backgroundImage}) no-repeat center center fixed;
    background-size: cover;
    color: #e0e0e0;
    overflow-y: auto;
  }

  ::selection {
    background: #0D47A1; /* Azul marinho para o fundo da seleção */
    color: white;
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

const PageContent = styled.div`
  position: relative;
  padding-top: calc(60px + 2rem);
  min-height: calc(100vh - 60px - 2rem);
  z-index: 1;
`;

const SectionTitle = styled.h2`
  color: black; /* Cinza claro para combinar com a paleta */
  text-align: left;
  margin: 2rem 0 1rem;
  padding-left: 1.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  position: relative;
`;

const ScrollWrapper = styled.div`
  position: relative;
  padding: 0 2rem 2rem;
`;

const ScrollContainer = styled.div`
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;
  gap: 1rem;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const StyledCard = styled.div`
  flex: 0 0 auto;
  width: 200px;
  background-color: #1c1f23; /* Cinza escuro para o fundo do card */
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;

  &:hover {
    transform: scale(1.05) translateZ(0);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
`;

const CardContent = styled.div`
  padding: 1rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #ffffff; /* Texto branco */
  font-size: 1rem;
`;

const CardSubtitle = styled.p`
  color: #b0b0b0; /* Texto cinza claro */
  font-size: 0.8rem;
  margin: 0.5rem 0;
  flex-grow: 1;
`;

const CardButton = styled.button`
  background-color: #d32f2f; /* Botão vermelho */
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #b71c1c; /* Vermelho mais escuro ao passar o mouse */
  }
`;

const NavigationButton = styled.button`
  background: rgba(255, 255, 255, 0.7);
  border: none;
  color: #333;
  font-size: 2rem;
  cursor: pointer;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.9);
  }

  ${(props) => (props.left ? "left: 1rem;" : "right: 1rem;")}
  visibility: ${(props) => (props.visible ? "visible" : "hidden")};
`;

const RankingsSection = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 2rem;
  padding: 0 2rem;
`;

const RankingBox = styled.div`
  background-color: #1c1f23; /* Fundo cinza escuro */
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  width: 30%;
  text-align: center;
`;

const RankingTitle = styled.h3`
  color: #ffffff; /* Texto branco */
  margin-bottom: 1rem;
`;

const RankingList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const RankingItem = styled.li`
  color: #e0e0e0; /* Texto cinza claro */
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const RankingIcon = styled.span`
  color: ${(props) =>
    props.color || "#ffffff"}; /* Cor do ícone baseada na posição */
  margin-right: 0.5rem;
  font-size: 1.2rem;
`;

const PersonalRankBox = styled(RankingBox)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PersonalRankIcon = styled.div`
  font-size: 3rem;
  color: ${(props) => props.color || "#ffffff"};
  margin-bottom: 0.5rem;
`;

const PersonalRankPoints = styled.div`
  color: #e0e0e0; /* Texto cinza claro */
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
`;

const PersonalRankName = styled.div`
  color: #e0e0e0; /* Texto cinza claro */
  font-size: 1.2rem;
`;

const Home = () => {
  const [coursesProgress, setCoursesProgress] = useState([]);
  const [mandatoryCourses, setMandatoryCourses] = useState([]);
  const [rankings, setRankings] = useState({
    globalRankings: [],
    personalRank: {},
    departmentRankings: [],
  });
  const [scrollVisibility, setScrollVisibility] = useState({});
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoursesProgress();
    fetchMandatoryCourses();
    fetchRankings();
  }, []);

  // Fetch dos dados
  const fetchCoursesProgress = async () => {
    try {
      const userId = sessionStorage.getItem("userId");
      const response = await axios.get(
        `http://localhost:5000/api/user/${userId}/courses-progress`
      );
      setCoursesProgress(response.data);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
    }
  };

  const fetchMandatoryCourses = async () => {
    try {
      const userId = sessionStorage.getItem("userId");
      const response = await axios.get(
        `http://localhost:5000/api/user/${userId}/mandatory-courses`
      );
      setMandatoryCourses(response.data);
    } catch (error) {
      console.error("Erro ao buscar cursos obrigatórios:", error);
    }
  };

  const fetchRankings = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/rankings");
      setRankings(response.data);
    } catch (error) {
      console.error("Erro ao buscar rankings:", error);
    }
  };

  // Lógica de scroll
  const scroll = (direction) => {
    const container = scrollRef.current;
    const scrollAmount = 300;
    if (container) {
      container.scrollLeft +=
        direction === "left" ? -scrollAmount : scrollAmount;
      updateScrollVisibility();
    }
  };

  const updateScrollVisibility = () => {
    const container = scrollRef.current;
    if (container) {
      const atStart = container.scrollLeft <= 0;
      const atEnd =
        container.scrollLeft + container.offsetWidth >=
        container.scrollWidth - 1;
      setScrollVisibility({
        left: !atStart,
        right: !atEnd,
      });
    }
  };

  useEffect(() => {
    updateScrollVisibility();
  }, [coursesProgress]);

  useEffect(() => {
    const handleResize = () => {
      updateScrollVisibility();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navigateToCourse = (id, nroAula, progress) => {
    navigate(`/course/${id}`, { state: { nroAula, progress } });
  };

  return (
    <>
      <GlobalStyle />
      <PageWrapper>
        <Navbar />
        <StarWrapper />
        <PageContent>
          <SectionTitle>Continuar Assistindo</SectionTitle>
          <ScrollWrapper>
            <NavigationButton
              left
              onClick={() => scroll("left")}
              visible={scrollVisibility.left}
            >
              <FaArrowLeft />
            </NavigationButton>
            <ScrollContainer ref={scrollRef} onScroll={updateScrollVisibility}>
              {coursesProgress.map((course, index) => (
                <StyledCard key={index}>
                  <CardImage src={course.img} alt={course.title} />
                  <CardContent>
                    <CardTitle>{course.title}</CardTitle>
                    <CardSubtitle>{course.subtitle}</CardSubtitle>
                    <CardButton
                      onClick={() =>
                        navigateToCourse(
                          course.course_id,
                          course.nro_aula,
                          course.progress
                        )
                      }
                    >
                      Continuar
                    </CardButton>
                  </CardContent>
                </StyledCard>
              ))}
            </ScrollContainer>
            <NavigationButton
              onClick={() => scroll("right")}
              visible={scrollVisibility.right}
            >
              <FaArrowRight />
            </NavigationButton>
          </ScrollWrapper>

          {mandatoryCourses.length > 0 && (
            <>
              <SectionTitle>Cursos Obrigatórios</SectionTitle>
              <ScrollWrapper>
                <NavigationButton
                  left
                  onClick={() => scroll("left")}
                  visible={scrollVisibility.left}
                >
                  <FaArrowLeft />
                </NavigationButton>
                <ScrollContainer
                  ref={scrollRef}
                  onScroll={updateScrollVisibility}
                >
                  {mandatoryCourses.map((course, index) => (
                    <StyledCard key={index}>
                      <CardImage src={course.img} alt={course.title} />
                      <CardContent>
                        <CardTitle>{course.title}</CardTitle>
                        <CardSubtitle>{course.subtitle}</CardSubtitle>
                        <CardButton
                          onClick={() => navigateToCourse(course.id, 0, 0)}
                        >
                          Assistir
                        </CardButton>
                      </CardContent>
                    </StyledCard>
                  ))}
                </ScrollContainer>
                <NavigationButton
                  onClick={() => scroll("right")}
                  visible={scrollVisibility.right}
                >
                  <FaArrowRight />
                </NavigationButton>
              </ScrollWrapper>
            </>
          )}

          <SectionTitle>Ranks</SectionTitle>
          <RankingsSection>
            <RankingBox>
              <RankingTitle>Ranking Global</RankingTitle>
              <RankingList>
                {/* <div style={{ textAlign: "left" }}>
                  <h4>1° Guilherme Von-Randow Carvalho - 235 Pontos</h4>
                  <br />
                  <h4>2° Ismael Luiz Borges da Silva - 220 Pontos</h4>
                  <br />
                  <h4>3° Carlos Gonçalves - 215 Pontos</h4>
                  <br />
                  <h4>4° Russell Nunez - 212 Pontos</h4>
                  <br />
                  <h4>5° TI Betim - 210 Pontos</h4>
                  <br />
                  <h4>6° TI São Paulo - 201 - Pontos</h4>
                </div>*/}
                {rankings.globalRankings.map((user, index) => (
                  <RankingItem key={index}>
                    <RankingIcon
                      color={
                        index === 0 ? "gold" : index === 1 ? "silver" : "bronze"
                      }
                    >
                      {index === 0 ? <FaCrown /> : <FaMedal />}
                    </RankingIcon>
                    {user.usuario}: {user.total_pontos}
                  </RankingItem>
                ))}
              </RankingList>
            </RankingBox>
            <PersonalRankBox>
              <RankingTitle>Teu Rank</RankingTitle>

              <PersonalRankIcon color="gold">
                <FaCrown />
              </PersonalRankIcon>
              <PersonalRankPoints>
                {rankings.personalRank.total_pontos}
              </PersonalRankPoints>
              <PersonalRankName>
                {rankings.personalRank.usuario}
              </PersonalRankName>
            </PersonalRankBox>
            <RankingBox>
              <RankingTitle>Ranking Departamento</RankingTitle>
              <RankingList>
                {/*<div style={{ textAlign: "left" }}>
                  <br />
                  <h3>1° TI</h3>
                  <br />
                  <h3>2° RH</h3>
                  <br />
                  <h3>3° PMO</h3>
                  <br />
                  <h3>4° Financeiro</h3>
                </div>*/}
                {rankings.departmentRankings.map((user, index) => (
                  <RankingItem key={index}>
                    <RankingIcon
                      color={
                        index === 0 ? "gold" : index === 1 ? "silver" : "bronze"
                      }
                    >
                      {index === 0 ? <FaCrown /> : <FaMedal />}
                    </RankingIcon>
                    {user.usuario}: {user.total_pontos}
                  </RankingItem>
                ))}
              </RankingList>
            </RankingBox>
          </RankingsSection>
        </PageContent>
      </PageWrapper>
    </>
  );
};

export default Home;
