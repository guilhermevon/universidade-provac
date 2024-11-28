import React, { createContext } from "react";

// Criando um contexto
export const PortContext = createContext();

// Criar um provedor de contexto
export const PortProvider = ({ children }) => {
  const dadoPorta = "9301"; //9300 = teste / 9301 = produção

  return (
    <PortContext.Provider value={dadoPorta}>{children}</PortContext.Provider>
  );
};
