import { Navigate, Outlet, useLocation } from "react-router";


function App() {

  const location = useLocation();

  if (location.pathname === "/") {
    return <Navigate to="/login" />
  }

  return (
    <div className="min-h-screen">
      <Outlet/>
    </div>
  )
}

export default App