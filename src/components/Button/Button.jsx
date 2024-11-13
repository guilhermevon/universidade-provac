// src/components/Button/Button.jsx
import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

// Criando o botão estilizado usando styled-components e aceitando props
const StyledButton = styled.button`
  background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(245,245,245,1) 100%);
  border: none;
  color: ${({ cor }) => cor || 'black'};
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 5px;
  position: ${({ position }) => position || 'static'};
  left: ${({ left }) => left || 'auto'};
  top: ${({ top }) => top || 'auto'};
  bottom: ${({ bottom }) => bottom || 'auto'};
  right: ${({ right }) => right || 'auto'};
  z-index: 1;
`;

// Componente Button
const Button = ({ children, cor, position, left, top, bottom, right }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/login');
  };

  return (
    <StyledButton
      cor={cor}
      position={position}
      left={left}
      top={top}
      bottom={bottom}
      right={right}
      onClick={handleClick}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
