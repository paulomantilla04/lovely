import { createBrowserRouter } from "react-router";
import App from "./App";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Explore from "./pages/Explore";
import Matches from "./pages/Matches";
import Profile from "./pages/Profile"; // Importamos la nueva página
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            // Rutas públicas
            { path: "/login", element: <Login/> },
            { path: "/signup", element: <Register/> },
            
            // Rutas Protegidas
            { 
                element: (
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                ),
                children: [
                    { path: "/explore", element: <Explore/> },
                    { path: "/matches", element: <Matches/> },
                    { path: "/profile", element: <Profile/> } 
                ]
            }
        ]
    }
])