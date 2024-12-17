import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Courses from "./pages/Courses";
import Error from "./pages/error";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/courses" element={<Courses />} />
    </Routes>
  );
};

export default App;
