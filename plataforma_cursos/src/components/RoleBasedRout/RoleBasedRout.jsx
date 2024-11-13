import React from 'react';
import { Navigate } from 'react-router-dom';

const RoleBasedRoute = ({ children, requiredRole }) => {
  const token = sessionStorage.getItem('token');

  if (!token) {
    console.log('Token não encontrado');
    return <Navigate to="/login" />;
  }

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const user = JSON.parse(jsonPayload);
    console.log('User payload:', user);
    console.log('User role:', user.role);
    console.log('Required role:', requiredRole);

    if (!user || String(user.role) !== String(requiredRole)) {
      console.log('Role não autorizado');
      return <Navigate to="/login" />;
    }

    return children;
  } catch (error) {
    console.error('Erro ao verificar o token:', error);
    return <Navigate to="/login" />;
  }
};

export default RoleBasedRoute;
