import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Simple route guard: if token is missing send to login
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('auth_token');
  const location = useLocation();

  if (!token) {
    // preserve where the user wanted to go for later
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
