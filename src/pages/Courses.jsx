import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import axios from "axios";
import Navbar from "../components/NavBar/NavBar";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import backgroundImage from "../assets/bg_home.png"; // Import the background image

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

const DepartmentTitle = styled.h2`
  color: #79b6f7;
  text-align: left;
  margin: 2rem 0 1rem;
  padding-left: 2rem;
  font-size: 1.5rem;
  font-weight: 700;
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
  background-color: #222325; /* Match the Navbar's background color */
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;

  &:hover {
    transform: scale(1.05) translateZ(0);
    border-radius: 8px;
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
  color: #fff; /* White text */
  font-size: 1rem;
`;

const CardSubtitle = styled.p`
  color: #ddd; /* Lighter gray text */
  font-size: 0.8rem;
  margin: 0.5rem 0;
  flex-grow: 1;
`;

const CardButton = styled.button`
  background-color: #0d47a1;
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
    background-color: #0d47a1; /* Darker red on hover */
  }
`;

const NavigationButton = styled.button`
  background: rgba(255, 255, 255, 0.7); /* Lightened button background */
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
    background: rgba(255, 255, 255, 0.9); /* Even lighter on hover */
  }

  ${(props) => (props.left ? "left: 1rem;" : "right: 1rem;")}
  visibility: ${(props) => (props.visible ? "visible" : "hidden")};
`;

const Courses = () => {
  const [coursesByDepartment, setCoursesByDepartment] = useState({});
  const [scrollVisibility, setScrollVisibility] = useState({});
  const scrollRefs = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      const token = sessionStorage.getItem("token");
      try {
        const response = await axios.get(
          "http://192.168.0.232:9310/api/courses",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          }
        );

        if (response.data && typeof response.data === "object") {
          setCoursesByDepartment(response.data);
        } else {
          console.error(
            "Resposta da API não é um objeto válido:",
            response.data
          );
        }
      } catch (error) {
        console.error("Erro ao buscar cursos:", error);
      }
    };

    fetchCourses();
  }, []);

  const scroll = (department, direction) => {
    const container = scrollRefs.current[department];
    const scrollAmount = 300;
    if (container) {
      container.scrollLeft +=
        direction === "left" ? -scrollAmount : scrollAmount;
      updateScrollVisibility(department);
    }
  };

  const updateScrollVisibility = (department) => {
    const container = scrollRefs.current[department];
    if (container) {
      const atStart = container.scrollLeft <= 0;
      const atEnd =
        container.scrollLeft + container.offsetWidth >=
        container.scrollWidth - 1;
      setScrollVisibility((prev) => ({
        ...prev,
        [department]: {
          left: !atStart,
          right: !atEnd,
        },
      }));
    }
  };

  useEffect(() => {
    Object.keys(coursesByDepartment).forEach((department) => {
      updateScrollVisibility(department);
    });
  }, [coursesByDepartment]);

  useEffect(() => {
    const handleResize = () => {
      Object.keys(coursesByDepartment).forEach((department) => {
        updateScrollVisibility(department);
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [coursesByDepartment]);

  const navigateToCourse = (id) => {
    navigate(`/course/${id}`);
  };

  return (
    <>
      <GlobalStyle />
      <PageWrapper>
        <Navbar />
        {/*  <StarWrapper>
          <Stars />
          <Stars2 />
          <Stars3 />
        </StarWrapper> */}
        <PageContent>
          {Object.keys(coursesByDepartment).map((department) => (
            <div key={department}>
              <DepartmentTitle>{department}</DepartmentTitle>
              <ScrollWrapper>
                <NavigationButton
                  left
                  onClick={() => scroll(department, "left")}
                  visible={scrollVisibility[department]?.left}
                >
                  <FaArrowLeft />
                </NavigationButton>
                <ScrollContainer
                  ref={(el) => (scrollRefs.current[department] = el)}
                  onScroll={() => updateScrollVisibility(department)}
                >
                  {coursesByDepartment[department].map((course, index) => (
                    <StyledCard key={index}>
                      <CardImage src={course.img} alt={course.title} />
                      <CardContent>
                        <CardTitle>{course.title}</CardTitle>
                        <CardSubtitle>{course.subtitle}</CardSubtitle>
                        <CardButton onClick={() => navigateToCourse(course.id)}>
                          Avançar
                        </CardButton>
                      </CardContent>
                    </StyledCard>
                  ))}
                </ScrollContainer>
                <NavigationButton
                  onClick={() => scroll(department, "right")}
                  visible={scrollVisibility[department]?.right}
                >
                  <FaArrowRight />
                </NavigationButton>
              </ScrollWrapper>
            </div>
          ))}
        </PageContent>
      </PageWrapper>
    </>
  );
};

export default Courses;
