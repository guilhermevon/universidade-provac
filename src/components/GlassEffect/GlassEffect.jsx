import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

// Importando a fonte no componente globalmente
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css?family=Rajdhani:300&display=swap');
`;

const GlassEffectWrapper = styled.div`
  --blur: 20px;
  --shadow-opacity: 0.30;
  --background-color: rgba(255, 255, 255, 0.1);

  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  font-family: 'Rajdhani', sans-serif;

  *, *:before, *:after {
    box-sizing: border-box;
  }

  .glass {
    height: 55%;
    width: 60%;
    background-color: var(--background-color);
    backdrop-filter: blur(var(--blur));
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    padding: 2em;
    z-index: 2;

    @media (max-width: 980px) {
      width: 90%;
      height: 70%;
    }

    @media (max-width: 640px) {
      width: 90%;
      height: 80%;
      padding: 1em;
    }

    @media (max-width: 480px) {
      width: 95%;
      height: 85%;
      padding: 0.5em;
    }
  }

  .drop-shadow {
    height: 100%;
    width: 100%;
    filter: drop-shadow(0px 20px 10px rgba(0, 0, 0, var(--shadow-opacity)));
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    

    &:before {
      display: block;
      content: "";
      position: absolute;
      top: 0;
      height: 100%;
      width: 100%;
      border-radius: 10px;
      border: 1px solid rgba(225, 225, 225, 0.3);
      z-index: 2;
    }
  
    > span {
      position: absolute;
      z-index: 2;
      color: white;
      font-size: 4em;
      letter-spacing: 0.75em;
      padding-left: 0.375em;

      @media (max-width: 980px) {
        font-size: 4em;
      }

      @media (max-width: 640px) {
        font-size: 2.5em;
        letter-spacing: 0.5em;
      }

      @media (max-width: 480px) {
        font-size: 2em;
        letter-spacing: 0.3em;
      }
    }
  }
`;

const GlassEffect = ({ children }) => {
  return (
    <>
      <GlobalStyle />
      <GlassEffectWrapper>
        <div className="drop-shadow">
          <div className="glass">
            {children}
          </div>
        </div>
      </GlassEffectWrapper>
    </>
  );
}

export default GlassEffect;
