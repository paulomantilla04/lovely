import { Navigate } from "react-router";
import { UserAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { session, loading } = UserAuth();

    if (loading) return <div>Cargando...</div>

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}