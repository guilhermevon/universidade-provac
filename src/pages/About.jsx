import React from "react";
import styled from "styled-components";
import logoProvac from "../../src/assets/logo_provac.png";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 200px;
  color: white;

  text-align: center; /* Centraliza o texto */
`;

const Logo = styled.img`
  width: 150px; /* Ajuste o tamanho desejado da imagem */
  height: auto;
  margin-bottom: 20px; /* Espaço entre a imagem e o texto abaixo */
`;

const Text = styled.p`
  max-width: 600px; /* Define a largura máxima do parágrafo */
  line-height: 1.6; /* Espaçamento entre as linhas */
  text-align: justify; /* Justifica o texto para melhor legibilidade */
`;

const About = () => {
  return (
    <Container>
      <Logo src={logoProvac} alt="Provac Logo" />
      <Text>
        A Universidade Provac é um sistema inovador desenvolvido para garantir
        que o aprendizado dos colaboradores esteja sempre em dia. Com foco no
        desenvolvimento contínuo, a plataforma oferece uma experiência de
        aprendizado moderna, dinâmica e personalizada. Através de cursos,
        treinamentos e recursos interativos, a Universidade Provac capacita os
        profissionais, promovendo crescimento pessoal e alinhamento estratégico
        com os objetivos da empresa. Aqui, o conhecimento é a chave para o
        sucesso coletivo!
      </Text>
    </Container>
  );
};

export default About;
