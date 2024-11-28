import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se há dados do usuário no localStorage ao carregar o aplicativo
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      setUser({ ...userData, isLoggedIn: true }); // Adicione o campo isLoggedIn
    } else {
      setUser(null);
    }
  }, []);

  const login = async (matricula, senha) => {
    try {
      const response = await axios.post(
        `http://192.168.0.232:9301/users/login`,
        {
          matricula: matricula,
          senha: senha,
        }
      );
      const userData = response.data;
      setUser({ ...userData, isLoggedIn: true }); // Adicione o campo isLoggedIn

      // Armazene os dados do usuário no localStorage
      localStorage.setItem("userData", JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    // Remova os dados do usuário do localStorage ao fazer logout
    localStorage.removeItem("userData");
    setTimeout(navigate("/"), 3000);
    window.location.reload(false);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};
