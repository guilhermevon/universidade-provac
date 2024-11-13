import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');
  console.log('PrivateRoute token:', token);

  if (!token) {
    console.log('Token não encontrado');
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
