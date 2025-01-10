import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/NavBar/NavBar";
import Home from "./pages/Home";
import About from "./pages/About";
import Areagest from "./pages/Areagest";
import Login from "./pages/Login";
import Courses from "./pages/Courses";
import Course from "./pages/Course";
import Cursos from "./pages/Cursos";
import Modulos from "./pages/Modulos";
import Aulas from "./pages/Aulas";
import Provas from "./pages/Provas";
import Aprovacao from "./pages/Aprovacao";
import AreaColab from "./pages/AreaColab";
import Welcome from "./pages/Welcome";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import RoleBasedRoute from "./components/RoleBasedRout/RoleBasedRout";
import "./App.css";

const App = () => {
  console.log("App rendered");

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/areagest" element={<Areagest />} />
        <Route path="/cursos" element={<Cursos />} />
        <Route path="/modulos" element={<Modulos />} />
        <Route path="/aulas" element={<Aulas />} />
        <Route path="/provas" element={<Provas />} />
        <Route
          path="/aprovacao"
          element={
            <RoleBasedRoute requiredRole="Gestor">
              <Aprovacao />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <AreaColab />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/courses"
          element={
            <PrivateRoute>
              <Courses />
            </PrivateRoute>
          }
        />
        <Route
          path="/course/:id"
          element={
            <PrivateRoute>
              <Course />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
