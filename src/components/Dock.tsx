import { Link, useLocation, useNavigate } from "react-router";
import { Flame, MessageCircleHeart, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { UserAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface ItemsProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
}

export function Dock() {
  const location = useLocation();
  const activeTab = location.pathname;
  const { signOut } = UserAuth();
  const navigate = useNavigate();
  
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [touchedItem, setTouchedItem] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const items: ItemsProps[] = [
    { id: "explore", label: "Explorar", icon: Flame, href: "/explore" },
    { id: "matches", label: "Matches", icon: MessageCircleHeart, href: "/matches" },
    { id: "logout", label: "Cerrar Sesión", icon: LogOut, onClick: handleSignOut },
  ];

  const handleTouchStart = (itemId: string) => {
    // Mobile: Tooltip temporal
    setTouchedItem(itemId);
    setTimeout(() => setTouchedItem(null), 1500);
  };

  const handleMouseEnter = (itemId: string) => {
    // Desktop: Solo activar hover si hay un mouse real
    if (window.matchMedia("(hover: hover)").matches) {
      setHoveredItem(itemId);
    }
  };

  const handleClick = (item: ItemsProps) => {
    setHoveredItem(null);
    setTouchedItem(null);
    if (item.onClick) item.onClick();
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-center gap-2 px-4 py-3 rounded-full border border-white/20 bg-white/30 backdrop-blur-md shadow-xl transition-all hover:bg-white/40">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.href ? activeTab === item.href : false;
          const showTooltip = hoveredItem === item.id || touchedItem === item.id;

          const commonClasses = cn(
            "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
            "active:scale-95 cursor-pointer",
            // CAMBIO VISUAL:
            // Ya no ponemos el bg-primary aquí directamente, dejamos que el motion.div lo maneje.
            // Solo controlamos el color del texto/icono.
            isActive 
              ? "text-primary-foreground" // Texto blanco (o contraste) cuando está activo
              : "text-muted-foreground hover:text-primary hover:bg-white/40" // Gris cuando inactivo
          );

          const content = (
            <div
              className="relative flex items-center justify-center w-full h-full"
              onMouseEnter={() => handleMouseEnter(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onTouchStart={() => handleTouchStart(item.id)}
            >
              {/* FONDO ANIMADO (CAMBIO: Sólido en lugar de anillo) */}
              {isActive && (
                <motion.div
                  layoutId="dock-active"
                  className="absolute inset-0 bg-primary rounded-full shadow-md" 
                  // Eliminé: ring-2, ring-offset-2
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              {/* Icono (z-10 para estar encima del fondo) */}
              <Icon className={cn("w-5 h-5 relative z-10 stroke-[2.5px]")} />

              {/* Tooltip */}
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-14 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-foreground/90 text-background text-xs font-bold font-montserrat rounded-lg whitespace-nowrap shadow-lg pointer-events-none backdrop-blur-sm z-50"
                  >
                    {item.label}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground/90 rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );

          if (item.href) {
            return (
              <Link
                key={item.id}
                to={item.href}
                className={commonClasses}
                onClick={() => handleClick(item)}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={commonClasses}
            >
              {content}
            </button>
          );
        })}
      </nav>
    </div>
  );
}