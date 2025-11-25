import { Outlet } from "react-router";
import { Dock } from "@/components/Dock";

export default function MainLayout() {
  return (
    <>
      {/* El Outlet renderiza la página hija (Explore, Matches, etc.) */}
      <div className="relative z-0">
        <Outlet />
      </div>
      
      {/* El Dock flota por encima de todo */}
      <Dock />
    </>
  );
}