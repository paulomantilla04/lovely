import { createBrowserRouter } from "react-router";
import App from "./App";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Explore from "./pages/Explore";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            { path: "/login", element: <Login/> },
            { path: "/signup", element: <Register/> },
            { path: "/explore", element: <ProtectedRoute><Explore/></ProtectedRoute> }
        ]
    }
])