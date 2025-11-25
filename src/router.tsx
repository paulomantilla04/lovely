import { createBrowserRouter } from "react-router";
import App from "./App";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Explore from "./pages/Explore";
import Matches from "./pages/Matches"; // Asegúrate de importar Matches
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout"; // Importa el nuevo layout

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            // Rutas públicas (Sin Dock)
            { path: "/login", element: <Login/> },
            { path: "/signup", element: <Register/> },
            
            // Rutas Protegidas (Con Dock y Seguridad)
            { 
                // 1. Primero protegemos el acceso
                // 2. Luego aplicamos el Layout con el Dock
                element: (
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                ),
                // Todas estas rutas heredarán el Dock
                children: [
                    { path: "/explore", element: <Explore/> },
                    { path: "/matches", element: <Matches/> }
                ]
            }
        ]
    }
])