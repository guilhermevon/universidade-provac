import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Link, useLocation } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import {
  HiOutlineVideoCamera,
  HiOutlineViewBoards,
  HiOutlineBookOpen,
  HiOutlineAcademicCap,
  HiDocumentDuplicate,
  HiChartBar,
  HiOutlineUserGroup,
} from "react-icons/hi";
import { FiLogIn } from "react-icons/fi";
import logoProvac from "../../assets/logo_provac.png";

// Assuming the main colors from the image are dark blue, red, and white:
const NavbarContainer = styled.nav`
  background: #222325; /* Dark Blue */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
`;

const LogoImage = styled.img`
  height: 40px;
  margin-right: 0.5rem;
`;

const LogoText = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
`;

const NavLinks = styled.ul`
  list-style: none;
  display: flex;
  gap: 1rem;
  margin: 0 auto;
  flex-grow: 1;
  justify-content: center;

  @media (max-width: 768px) {
    display: ${({ isOpen }) => (isOpen ? "flex" : "none")};
    flex-direction: column;
    width: 100%;
    position: absolute;
    top: 60px;
    left: 0;
    background: #0c1f3f;
    padding: 1rem 0;
  }
`;

const NavLink = styled.li`
  a {
    color: #fff;
    text-decoration: none;
    transition: color 0.3s;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: 700;

    &:hover {
      color: #57a2f2;
    }

    &.active {
      background-color: #0d47a1; /* Red background */
      color: #fff;
      font-weight: bold;
    }
  }

  @media (max-width: 768px) {
    padding: 0.5rem 0;
    text-align: center;
  }
`;

const ToggleButton = styled.div`
  display: none;
  flex-direction: column;
  cursor: pointer;

  .bar {
    height: 3px;
    width: 25px;
    background-color: #fff;
    margin: 4px 0;
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

const LoginLink = styled.div`
  display: flex;
  position: relative;
  z-index: 10;
  align-items: center;
  gap: 0.5rem;

  a {
    color: #fff;
    text-decoration: none;
    transition: color 0.3s;

    &:hover {
      color: #e63946; /* Red on hover */
    }
  }

  svg {
    font-size: 1.2rem;
    color: #fff;
  }
`;

const ProfileLink = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;

  a {
    color: #fff;
    text-decoration: none;
    transition: color 0.3s;

    &:hover {
      color: #e63946; /* Red on hover */
    }
  }

  svg {
    font-size: 1.2rem;
    color: #fff;
  }
`;

const Sidebar = styled.div`
  background: #222325;
  color: #fff;
  width: 250px;
  height: calc(100vh - 60px);
  position: fixed;
  top: 60px;
  left: 0;
  padding: 20px;
  box-sizing: border-box;
  z-index: 999;
  overflow-y: auto;

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin: 20px 0;
    display: flex;
    align-items: center;
    transition: background-color 0.3s;
    border-radius: 5px;
    padding: 10px;

    &:hover {
      background-color: #0d47a1;
    }

    &.active {
      background-color: #0d47a1; /* Red background for active items */
      font-weight: bold;
      color: #fff;
    }
  }

  a {
    color: #fff;
    text-decoration: none;
    transition: color 0.3s;
    display: flex;
    align-items: center;
    width: 100%;

    &:hover {
      color: white; /* Red on hover */
    }

    svg {
      margin-right: 10px;
      font-size: 1.2rem;
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    position: static;
    padding: 0;
  }
`;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const role = sessionStorage.getItem("role");
    const usuario = sessionStorage.getItem("usuario");
    if (role === "Gestor" && usuario === "admin") {
      setIsAdmin(true);
    }
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const isGestorArea = [
    "/areagest",
    "/cursos",
    "/modulos",
    "/aulas",
    "/provas",
    "/documentacao",
    "/graficos",
    "/aprovacao",
  ].includes(location.pathname);

  const role = sessionStorage.getItem("role");
  console.log("role", role);

  return (
    <>
      <NavbarContainer>
        <LogoContainer>
          <LogoImage src={logoProvac} alt="Provac Logo" />
          <LogoText>Universidade Provac</LogoText>
        </LogoContainer>
        <NavLinks isOpen={isOpen}>
          <NavLink>
            <Link
              to="/home"
              className={location.pathname === "/home" ? "active" : ""}
            >
              Home
            </Link>
          </NavLink>
          <NavLink>
            <Link
              to="/courses"
              className={location.pathname === "/courses" ? "active" : ""}
            >
              Cursos
            </Link>
          </NavLink>
          <NavLink>
            <Link
              to="/about"
              className={location.pathname === "/about" ? "active" : ""}
            >
              Sobre
            </Link>
          </NavLink>
          {role === "Gestor" && (
            <NavLink>
              <Link
                to="/areagest"
                className={location.pathname === "/areagest"}
              >
                Área Gestor
              </Link>
            </NavLink>
          )}
        </NavLinks>
        <div style={{ display: "flex", alignItems: "center" }}>
          <LoginLink>
            <FiLogIn />
            <Link to="/login">Login</Link>
          </LoginLink>
          <ProfileLink>
            <FaUser />
            <Link to="/perfil">Perfil</Link>
          </ProfileLink>
        </div>
        <ToggleButton onClick={toggleMenu}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </ToggleButton>
      </NavbarContainer>

      {isGestorArea && role === "Gestor" && (
        <Sidebar>
          <ul>
            <li className={location.pathname === "/cursos"}>
              <Link to="/cursos">
                <HiOutlineVideoCamera />
                Cursos
              </Link>
            </li>
            <li className={location.pathname === "/modulos" ? "active" : ""}>
              <Link to="/modulos">
                <HiOutlineViewBoards />
                Módulos
              </Link>
            </li>
            <li className={location.pathname === "/aulas" ? "active" : ""}>
              <Link to="/aulas">
                <HiOutlineBookOpen />
                Aulas
              </Link>
            </li>
            <li className={location.pathname === "/provas" ? "active" : ""}>
              <Link to="/provas">
                <HiOutlineAcademicCap />
                Provas
              </Link>
            </li>
            <li
              className={location.pathname === "/documentacao" ? "active" : ""}
            >
              <Link to="/documentacao">
                <HiDocumentDuplicate />
                Documentação
              </Link>
            </li>
            <li className={location.pathname === "/graficos" ? "active" : ""}>
              <Link to="/graficos">
                <HiChartBar />
                Gráficos
              </Link>
            </li>
            {isAdmin && (
              <li
                className={location.pathname === "/aprovacao" ? "active" : ""}
              >
                <Link to="/aprovacao">
                  <HiOutlineAcademicCap />
                  Aprovação de Cursos
                </Link>
              </li>
            )}
          </ul>
        </Sidebar>
      )}
    </>
  );
};

export default Navbar;
