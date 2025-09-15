// components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserType } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: UserType;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredUserType, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Redirect to login page with return url
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requiredUserType && userProfile?.userType !== requiredUserType) {
    // Redirect to unauthorized page or home
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// Component for redirecting authenticated users away from auth pages
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (currentUser) {
    // Redirect to the page they were trying to visit or dashboard
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}