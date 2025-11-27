import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children, requiredRole }: { children: JSX.Element; requiredRole: 'ADMIN' | 'USER' }) => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('role');

  useEffect(() => {
    // Logique de vérification unique
    if (!isAuthenticated || userRole !== requiredRole) {
      localStorage.removeItem('isAuthenticated');
    }
  }, [isAuthenticated, userRole, requiredRole]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;