import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/NavBar/NavBar';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Courses from './pages/Courses';
import Course from './pages/Course';
import Cursos from './pages/Cursos';
import Modulos from './pages/Modulos';
import Aulas from './pages/Aulas';
import Provas from './pages/Provas';
import Aprovacao from './pages/Aprovacao';
import AreaColab from './pages/AreaColab';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import RoleBasedRoute from './components/RoleBasedRout/RoleBasedRout';
import './App.css';

const App = () => {
  console.log('App rendered');

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/areagest" element={
          <RoleBasedRoute requiredRole="1">
            <Courses />
          </RoleBasedRoute>
        } />
        <Route path="/cursos" element={
          <RoleBasedRoute requiredRole="1">
            <Cursos />
          </RoleBasedRoute>
        } />
        <Route path="/modulos" element={
          <RoleBasedRoute requiredRole="1">
            <Modulos />
          </RoleBasedRoute>
        } />
        <Route path="/aulas" element={
          <RoleBasedRoute requiredRole="1">
            <Aulas />
          </RoleBasedRoute>
        } />
        <Route path="/provas" element={
          <RoleBasedRoute requiredRole="1">
            <Provas />
          </RoleBasedRoute>
        } />
        <Route path="/aprovacao" element={
          <RoleBasedRoute requiredRole="1">
            <Aprovacao />
          </RoleBasedRoute>
        } />
        <Route path="/perfil" element={
          <PrivateRoute>
            <AreaColab />
          </PrivateRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/courses" element={
          <PrivateRoute>
            <Courses />
          </PrivateRoute>
        } />
        <Route path="/course/:id" element={
          <PrivateRoute>
            <Course />
          </PrivateRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
