import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import axios from "axios";

// Global Styles
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css?family=Lato:300,400,700&display=swap');

  html, body {
    height: 100%;
    margin: 0;
    font-family: 'Lato', sans-serif;
    background-color: #1c1c1c;
  }

  body {
    overflow-y: auto;
    padding-top: 60px;
  }
`;

// Styled Components
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

//ESTRUTURA DO SITE----------------------------------------------------------------------------------------------------------------------------------------------
const LoginPage = () => {
  const navigate = useNavigate();
  const [formType, setFormType] = useState("login");
  const [departamentos, setDepartamentos] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [selectedDepartamento, setSelectedDepartamento] = useState(null);
  const [selectedFuncao, setSelectedFuncao] = useState(null);
  const [funcoesFiltradas, setFuncoesFiltradas] = useState([]);

  // Fetch Departamentos
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
        setDepartamentos([]);
      }
    };

    fetchDepartamentos();
  }, []);

  useEffect(() => {
    const fetchFuncoes = async () => {
      if (selectedDepartamento) {
        const token = sessionStorage.getItem("token");
        try {
          // Requisição para buscar funções baseadas no departamento selecionado
          const response = await axios.get(
            `http://192.168.0.232:9310/funcoes?dp=${selectedDepartamento}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const funcoesList = response.data || [];
          setFuncoes(funcoesList); // Atualiza as funções

          // Limpa a função selecionada se ela não for mais válida para o novo departamento
          if (
            selectedFuncao &&
            !funcoesList.some((funcao) => funcao.id === selectedFuncao)
          ) {
            setSelectedFuncao(null); // Limpa a função se a selecionada não for mais válida
          }
        } catch (error) {
          console.error("Erro ao buscar funções:", error);
          setFuncoes([]); // Limpa as funções em caso de erro
          setSelectedFuncao(null); // Limpa a função em caso de erro
        }
      } else {
        setFuncoes([]); // Limpa as funções se nenhum departamento for selecionado
        setSelectedFuncao(null); // Limpa a função se nenhum departamento for selecionado
      }
    };

    fetchFuncoes();
  }, [selectedDepartamento]); // Atualiza sempre que o departamento muda

  // Handle Form Submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    if (formType === "login") {
      const payload = {
        email: formData.get("email"),
        senha: formData.get("password"),
      };

      try {
        const response = await axios.post(
          "http://192.168.0.232:9310/users/login",
          payload,
          { headers: { "Content-Type": "application/json" } }
        );

        if (response.status === 200) {
          alert("Login realizado com sucesso!");
          navigate("/welcome");
        }
      } catch (error) {
        console.error("Erro ao fazer login:", error);
        alert("Erro ao fazer login. Verifique suas credenciais.");
      }
    } else if (formType === "register") {
      const payload = {
        usuario: formData.get("usuario"),
        departamento: formData.get("departamento"),
        funcao: formData.get("funcao"),
        matricula: formData.get("matricula"),
        email: formData.get("email"),
        senha: formData.get("password"),
      };

      try {
        const response = await axios.post(
          "http://192.168.0.232:9310/users/register",
          payload,
          { headers: { "Content-Type": "application/json" } }
        );

        if (response.status === 201) {
          alert("Usuário cadastrado com sucesso!");
          setFormType("login"); // Alterna para a tela de login
        }
      } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        alert("Erro ao cadastrar. Tente novamente.");
      }
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
                    value={selectedDepartamento || ""}
                    onChange={(e) => {
                      const novoDepartamento = e.target.value;
                      setSelectedDepartamento(novoDepartamento);
                      setSelectedFuncao(null); // Limpa a função quando o departamento é alterado
                    }}
                  >
                    <option value="">Selecione um departamento</option>
                    {Array.from(
                      new Set(
                        departamentos.map((departamento) => departamento.dp)
                      )
                    ).map((departamento, index) => (
                      <option key={index} value={departamento}>
                        {departamento}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField>
                  <Label htmlFor="funcao">Função</Label>
                  <Select
                    id="funcao"
                    name="funcao"
                    value={selectedFuncao || ""}
                    onChange={(e) => setSelectedFuncao(e.target.value)}
                    disabled={funcoes.length === 0} // Desabilita o campo de função se não houver funções
                  >
                    <option value="funcao">Selecione uma função</option>
                    {funcoes?.map((funcao) => (
                      <option
                        key={funcao.departamento_id}
                        value={funcao.funcao}
                      >
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
