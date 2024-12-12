import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import axios from "axios";

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css?family=Lato:300,400,700&display=swap');

  html, body {
    height: 100%;
    margin: 0;
    font-family: 'Lato', sans-serif;
    background-color: #1c1c1c; /* Cor de fundo sólida que estava na parte superior */
  }

  body {
    overflow-y: auto;
    padding-top: 60px;
  }
`;

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
  padding: 20px;
  background-color: #1c1c1c;
`;

const FormWrapper = styled.div`
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  max-width: 400px;
  width: 100%;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 1.5rem;
    max-width: 90%;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    max-width: 100%;
  }
`;

const FormTitle = styled.h2`
  margin-bottom: 2rem;
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  color: #f01c18;

  @media (max-width: 480px) {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }
`;

const FormField = styled.div`
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
`;

const Label = styled.label`
  display: flex;
  margin-bottom: 0.5rem;
  font-weight: 700;
  color: #333;
  align-self: start;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border-radius: 5px;
  border: 1px solid #ddd;
  font-size: 1rem;
  color: #333;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #007bff;
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border-radius: 5px;
  border: 1px solid #ddd;
  font-size: 1rem;
  color: #333;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #007bff;
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 5px;
  background-color: #f01c18;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #d41715;
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #007bff;
  margin-top: 1rem;

  &:hover {
    background-color: #0056b3;
  }
`;

//Estrutura de Site------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const LoginPage = () => {
  const navigate = useNavigate();
  const [formType, setFormType] = useState("login");
  const [departamentos, setDepartamentos] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [selectedDepartamento, setSelectedDepartamento] = useState("");

  useEffect(() => {
    const fetchDepartamentos = async () => {
      const token = sessionStorage.getItem("token");
      try {
        const response = await axios.get(
          "http://192.168.0.232:9310/users/departamento",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setDepartamentos(response.data);
      } catch (error) {
        console.error("Erro ao buscar departamentos:", error);
      }
    };

    fetchDepartamentos();
  }, []);

  useEffect(() => {
    if (selectedDepartamento) {
      const fetchFuncoes = async () => {
        const token = sessionStorage.getItem("token");
        try {
          const response = await axios.get(
            `http://192.168.0.232:9310/users/departamento/${selectedDepartamento}/funcoes`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setFuncoes(response.data);
        } catch (error) {
          console.error("Erro ao buscar funções:", error);
        }
      };

      fetchFuncoes();
    } else {
      setFuncoes([]);
    }
  }, [selectedDepartamento]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const payload = {
      matricula: formData.get("matricula"),
      senha: formData.get("password"),
    };

    try {
      const response = await axios.post(
        "http://192.168.0.232:9310/users/login",
        payload, // Envia como JSON
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Payload enviado:", payload);
      if (response.data.token) {
        sessionStorage.setItem("token", response.data.token);
        navigate("/courses");
      } else {
        console.error("Erro de autenticação:", response.data);
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  return (
    <>
      <GlobalStyle />
      <PageWrapper>
        <FormWrapper>
          <FormTitle>{formType === "login" ? "Login" : "Cadastrar"}</FormTitle>
          <form onSubmit={handleSubmit}>
            {formType === "register" && (
              <>
                <FormField>
                  <Label htmlFor="usuario">Nome completo</Label>
                  <Input id="usuario" name="usuario" type="text" required />
                </FormField>
                <FormField>
                  <Label htmlFor="departamento">Departamento</Label>
                  <Select
                    id="departamento"
                    name="departamento"
                    value={selectedDepartamento}
                    onChange={(e) => setSelectedDepartamento(e.target.value)}
                    required
                  >
                    <option value="">Selecione um departamento</option>
                    <option value="RH">RH</option>
                    <option value="PMO">PMO</option>
                    <option value="TI">TI</option>
                    <option value="Financeiro">Financeiro</option>
                  </Select>
                </FormField>
                <FormField>
                  <Label htmlFor="funcao">Função</Label>
                  <Select id="funcao" name="funcao" required>
                    <option value="">Selecione uma função</option>
                    <option value="">Desenvolvedor jr</option>
                    <option value="">Analista 1</option>
                    {funcoes.map((funcao) => (
                      <option key={funcao.id} value={funcao.funcao}>
                        {funcao.funcao}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField>
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input id="matricula" name="matricula" type="text" required />
                </FormField>
                <FormField>
                  <Label htmlFor="foto">Foto</Label>
                  <Input
                    id="foto"
                    name="foto"
                    type="file"
                    accept="image/*"
                    required
                  />
                </FormField>
              </>
            )}
            <FormField>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </FormField>
            <FormField>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required />
            </FormField>
            <Button type="submit">
              {formType === "login" ? "Entrar" : "Cadastrar"}
            </Button>
          </form>
          <SecondaryButton
            onClick={() =>
              setFormType(formType === "login" ? "register" : "login")
            }
          >
            {formType === "login" ? "Criar uma conta" : "Já tenho uma conta"}
          </SecondaryButton>
        </FormWrapper>
      </PageWrapper>
    </>
  );
};

export default LoginPage;
