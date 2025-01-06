import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import axios from "axios";
import Navbar from "../components/NavBar/NavBar";
import mestre from "../assets/mestre.png";
import Default from "../assets/default.jpg";

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
  flex: 1; /* Faz com que ambos ocupem tamanhos iguais */
  max-width: 30%; /* Cada container ocupará 50% */
  height: auto;
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
  display: flex;
  justify-content: space-between;
  padding-top: calc(60px + 2rem);
  padding-left: 2rem;
  padding-right: 2rem;
   {
    /*min-height: calc(100vh - 60px - 2rem);*/
  }
  min-height: 500px;
  z-index: 1;
`;

const SectionTitle = styled.h2`
  color: #fff;
  text-align: left;
  margin: 2rem 0 1rem;
  font-size: 1.5rem;
  font-weight: 700;
`;

const ScrollWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-right: 2rem;
`;

const ScrollContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  overflow-x: auto;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const StyledCard = styled.div`
  flex: 0 0 auto;
  width: 200px;
  background-color: #333; /* Alterado para um fundo sólido */
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  z-index: 0;
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
  background-color: #333; /* Alterado para um fundo sólido */
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #fff;
  font-size: 1rem;
`;

const CardSubtitle = styled.p`
  color: #ccc;
  font-size: 0.8rem;
  margin: 0.5rem 0;
  flex-grow: 1;
`;

const UserInfoWrapper = styled.div`
  flex: 0 0 330px;
  background-color: #222;
  border-radius: 8px;
  padding: 1.5rem;
  margin-right: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 2;
`;

const aura = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
`;

const UserImageContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid transparent;
  background: linear-gradient(white, white),
    radial-gradient(circle at top left, #ff0080, #8000ff);
  background-origin: border-box;
  background-clip: content-box, border-box;
  &::before {
    content: "";
    position: absolute;
    top: -10px;
    left: -10px;
    width: calc(100% + 20px);
    height: calc(100% + 20px);
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(138, 43, 226, 0.6),
      rgba(138, 43, 226, 0.2)
    );
    animation: ${aura} 3s infinite ease-in-out;
    z-index: 0;
  }
`;

const UserImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  position: relative;
  z-index: 1;
`;

const RankMedalsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 1rem;
`;

const RankTitle = styled.h3`
  color: #fff;
  font-size: 1.2rem;
  margin: 0;
`;

const MedalsTitle = styled.h3`
  color: #fff;
  font-size: 1.2rem;
  margin: 0;
`;

const MestreImage = styled.img`
  width: 70px;
  height: 70px;
  object-fit: cover;
  margin-top: 1rem;
  position: absolute;
  top: 20rem;
  left: 5rem;
`;

const UserName = styled.h3`
  color: #fff;
  font-size: 1.2rem;
  margin: 0.5rem 0;
`;

const UserRole = styled.p`
  color: #ccc;
  font-size: 1rem;
  margin: 0;
  text-align: center;
`;

const FlexContainer = styled.div`
  display: flex;

  justify-content: center; /* Centraliza horizontalmente os containers */
  align-items: center; /* Centraliza verticalmente os containers */
  gap: 10px; /* Espaço entre os containers */
  min-height: 100vh; /* Garante que ocupa a altura total da página */
  padding: 0px; /* Opcional: adiciona espaçamento interno */
`;

const AreaColab = () => {
  const [finalizedCourses, setFinalizedCourses] = useState([]);
  const [userInfo, setUserInfo] = useState({ name: "", role: "", foto: "" });
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFinalizedCourses = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          "http://192.168.0.232:9310/api/user/finalized-courses",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setFinalizedCourses(response.data);
      } catch (error) {
        console.error("Erro ao buscar cursos finalizados:", error);
        if (error.response && error.response.status === 401) {
          navigate("/login");
        }
      }
    };

    const fetchUserInfo = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get("http://192.168.0.232:9310/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserInfo(response.data);

        // Fetch user photo separately
        const photoResponse = await axios.get(
          "http://192.168.0.232:9310/users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUserInfo((prevInfo) => ({
          ...prevInfo,
          foto: photoResponse.data.foto,
        }));
      } catch (error) {
        console.error("Erro ao buscar informações do usuário:", error);
      }
    };

    fetchFinalizedCourses();
    fetchUserInfo();
  }, [navigate]);

  const userNome = sessionStorage.getItem("userNome");
  const funcao = sessionStorage.getItem("funcao");
  const role = sessionStorage.getItem("role");

  return (
    <>
      <GlobalStyle />
      <FlexContainer>
        {/* Container 1 */}
        <PageWrapper>
          <Navbar />
          <StarWrapper>
            <Stars />
            <Stars2 />
            <Stars3 />
          </StarWrapper>
          <PageContent>
            <UserInfoWrapper>
              <UserImageContainer>
                <UserImage
                  src={
                    userInfo.foto
                      ? `data:image/jpeg;base64,${userInfo.foto}`
                      : Default
                  }
                  alt=""
                  onError={(e) => (e.target.src = "??")}
                />
              </UserImageContainer>
              <UserName>{userNome}</UserName>
              <UserRole>
                {funcao} / {role}
              </UserRole>
              <br />
              <RankMedalsContainer>
                <RankTitle>
                  Rank <br /> <img src={mestre} alt="Medalha" />
                </RankTitle>

                <MedalsTitle>Medalhas</MedalsTitle>
              </RankMedalsContainer>
            </UserInfoWrapper>
          </PageContent>
        </PageWrapper>

        {/* Container 2 */}
        <PageWrapper>
          <Navbar />
          <StarWrapper>
            <Stars />
            <Stars2 />
            <Stars3 />
          </StarWrapper>
          <PageContent>
            <UserInfoWrapper>
              <SectionTitle>Cursos Finalizados</SectionTitle>
            </UserInfoWrapper>
            <ScrollWrapper>
              <ScrollContainer ref={scrollRef}>
                {finalizedCourses.map((course, index) => (
                  <StyledCard key={index}>
                    <CardImage src={course.img} alt={course.title} />
                    <CardContent>
                      <CardTitle>{course.title}</CardTitle>
                      <CardSubtitle>{course.subtitle}</CardSubtitle>
                    </CardContent>
                  </StyledCard>
                ))}
              </ScrollContainer>
            </ScrollWrapper>
          </PageContent>
        </PageWrapper>
      </FlexContainer>
    </>
  );
};

export default AreaColab;
