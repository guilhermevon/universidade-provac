import React from "react";
import styled from "styled-components";
import logoProvac from "../../src/assets/logo_provac.png";

const Text = styled.p`
  max-width: 600px; /* Define a largura máxima do parágrafo */
  line-height: 1.6; /* Espaçamento entre as linhas */
  text-align: justify; /* Justifica o texto para melhor legibilidade */
`;

const Welcome = () => {
  return (
    <Container>
      <Logo src={logoProvac} alt="Provac Logo" />
      <Text>BEM VINDO AO SISTEMA DE CURSOS!</Text>
    </Container>
  );
};

export default Welcome;
