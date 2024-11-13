import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

const bounceLeft = keyframes`
  0% { transform: translate3d(100%, -50%, 0); }
  50% { transform: translate3d(-30px, -50%, 0); }
  100% { transform: translate3d(0, -50%, 0); }
`;

const bounceRight = keyframes`
  0% { transform: translate3d(0, -50%, 0); }
  50% { transform: translate3d(calc(100% + 30px), -50%, 0); }
  100% { transform: translate3d(100%, -50%, 0); }
`;

const showSignUp = keyframes`
  100% { opacity: 1; visibility: visible; transform: translate3d(0, 0, 0); }
`;

const PageWrapper = styled.section`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  background: #ffffff; /* Fundo branco */
  background-size: cover;
`;

const OptionsContainer = styled.div`
  position: relative;
  width: 80%;
`;

const OptionsText = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.85); /* Fundo negro com opacidade */
  border-radius: 3px;
`;

const OptionsBox = styled.div`
  width: 50%;
  padding: 75px 45px;
  color: #ffffff; /* Texto branco */
  font-weight: 300;
`;

const Title = styled.h2`
  margin-bottom: 15px;
  font-size: 1.66rem;
  line-height: 1em;
  color: #f01c18; /* Cor do título vermelha */
`;

const Text = styled.p`
  font-size: 0.83rem;
  line-height: 1.4em;
  color: #ffffff; /* Texto branco */
`;

const Button = styled.button`
  margin-top: 30px;
  border: 1px solid #ffffff; /* Borda branca */
  border-radius: 3px;
  padding: 10px 30px;
  color: #ffffff; /* Texto branco */
  text-transform: uppercase;
  line-height: 1em;
  letter-spacing: 0.2rem;
  background-color: #f01c18; /* Fundo do botão vermelho */
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;

  &:hover {
    color: #000000; /* Texto negro ao passar o mouse */
    background-color: #ffffff; /* Fundo branco ao passar o mouse */
  }
`;

const FormsContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 30px;
  width: calc(50% - 30px);
  min-height: 420px;
  background-color: #ffffff; /* Fundo branco */
  border-radius: 3px;
  box-shadow: 2px 0 15px rgba(0, 0, 0, 0.25); /* Sombra com bordas suaves */
  overflow: hidden;
  transform: translate3d(100%, -50%, 0);
  transition: transform 0.4s ease-in-out;

  &.bounceLeft {
    animation: ${bounceLeft} 1s forwards;

    .user_forms-signup {
      animation: ${showSignUp} 1s forwards;
    }

    .user_forms-login {
      opacity: 0;
      visibility: hidden;
      transform: translate3d(-120px, 0, 0);
    }
  }

  &.bounceRight {
    animation: ${bounceRight} 1s forwards;
  }
`;

const FormTitle = styled.h2`
  margin-bottom: 45px;
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1em;
  text-transform: uppercase;
  color: #f01c18; /* Cor do título vermelho */
  letter-spacing: 0.1rem;
`;

const Fieldset = styled.fieldset`
  border: none;
`;

const FormField = styled.div`
  &:not(:last-of-type) {
    margin-bottom: 20px;
  }
`;

const Input = styled.input`
  width: 100%;
  border-bottom: 1px solid #ccc;
  padding: 6px 20px 6px 6px;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 300;
  color: #000000; /* Texto negro */
  letter-spacing: 0.1rem;
  transition: border-color 0.2s ease-in-out;

  &:focus {
    border-color: #f01c18; /* Borda vermelha ao focar */
  }

  &::placeholder {
    font-size: 0.85rem;
    font-family: 'Montserrat', sans-serif;
    font-weight: 300;
    letter-spacing: 0.1rem;
    color: #ccc;
  }

  &[type="submit"] {
    cursor: pointer;
  }
`;

const FormButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 35px;
`;

const ForgotButton = styled.button`
  font-family: 'Montserrat', sans-serif;
  letter-spacing: 0.1rem;
  color: #f01c18; /* Texto vermelho */
  text-decoration: underline;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: darken(#f01c18, 10%);
  }
`;

const ActionButton = styled.input`
  background-color: #f01c18; /* Fundo vermelho */
  border-radius: 3px;
  padding: 10px 35px;
  font-size: 1rem;
  font-family: 'Montserrat', sans-serif;
  font-weight: 300;
  color: #ffffff; /* Texto branco */
  text-transform: uppercase;
  letter-spacing: 0.1rem;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: darken(#f01c18, 10%);
  }
`;

const UserFormsLogin = styled.div`
  position: absolute;
  top: 70px;
  left: 40px;
  width: calc(100% - 80px);
  opacity: 1;
  visibility: visible;
  transition: opacity 0.4s ease-in-out, visibility 0.4s ease-in-out, transform 0.5s ease-in-out;
  transform: translate3d(0, 0, 0);
`;

const UserFormsSignup = styled.div`
  position: absolute;
  top: 70px;
  left: 40px;
  width: calc(100% - 80px);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.4s ease-in-out, visibility 0.4s ease-in-out, transform 0.5s ease-in-out;
  transform: translate3d(120px, 0, 0);
`;

const UserPage = () => {
  const [bounceClass, setBounceClass] = useState('');

  return (
    <PageWrapper className="user">
      <OptionsContainer className="user_options-container">
        <OptionsText className="user_options-text">
          <OptionsBox className="user_options-unregistered">
            <Title className="user_unregistered-title">Don't have an account?</Title>
            <Text className="user_unregistered-text">Banjo tote bag bicycle rights, High Life sartorial cray craft beer whatever street art fap.</Text>
            <Button className="user_unregistered-signup" id="signup-button" onClick={() => setBounceClass('bounceLeft')}>Sign up</Button>
          </OptionsBox>

          <OptionsBox className="user_options-registered">
            <Title className="user_registered-title">Have an account?</Title>
            <Text className="user_registered-text">Banjo tote bag bicycle rights, High Life sartorial cray craft beer whatever street art fap.</Text>
            <Button className="user_registered-login" id="login-button" onClick={() => setBounceClass('bounceRight')}>Login</Button>
          </OptionsBox>
        </OptionsText>

        <FormsContainer className={`user_options-forms ${bounceClass}`} id="user_options-forms">
          <UserFormsLogin className="user_forms-login">
            <FormTitle className="forms_title">Login</FormTitle>
            <form className="forms_form">
              <Fieldset className="forms_fieldset">
                <FormField className="forms_field">
                  <Input type="email" placeholder="Email" className="forms_field-input" required autoFocus />
                </FormField>
                <FormField className="forms_field">
                  <Input type="password" placeholder="Senha" className="forms_field-input" required />
                </FormField>
              </Fieldset>
              <FormButtons className="forms_buttons">
                <ForgotButton type="button" className="forms_buttons-forgot">Forgot password?</ForgotButton>
                <ActionButton type="submit" value="Log In" className="forms_buttons-action" />
              </FormButtons>
            </form>
          </UserFormsLogin>
          <UserFormsSignup className="user_forms-signup">
            <FormTitle className="forms_title">Cadastrar</FormTitle>
            <form className="forms_form">
              <Fieldset className="forms_fieldset">
                <FormField className="forms_field">
                  <Input type="text" placeholder="Nome completo" className="forms_field-input" required />
                </FormField>
                <FormField className="forms_field">
                  <Input type="email" placeholder="Email" className="forms_field-input" required />
                </FormField>
                <FormField className="forms_field">
                  <Input type="text" placeholder="Matrícula" className="forms_field-input" required />
                </FormField>
                <FormField className="forms_field">
                  <Input type="password" placeholder="Senha" className="forms_field-input" required />
                </FormField>
              </Fieldset>
              <FormButtons className="forms_buttons">
                <ActionButton type="submit" value="Finalizar" className="forms_buttons-action" />
              </FormButtons>
            </form>
          </UserFormsSignup>
        </FormsContainer>
      </OptionsContainer>
    </PageWrapper>
  );
};

export default UserPage;
