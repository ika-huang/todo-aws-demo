import { JSX } from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: Props) {
  const user = localStorage.getItem('user');
  return user ? children : <Navigate to='/login' replace />;
}
