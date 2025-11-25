import { Link, useLocation, useNavigate } from "react-router";
import { Flame, MessageCircleHeart, LogOut, User } from "lucide-react";
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
    { id: "profile", label: "Perfil", icon: User, href: "/profile" },
    { id: "logout", label: "Salir", icon: LogOut, onClick: handleSignOut },
  ];

  const handleTouchStart = (itemId: string) => {
    setTouchedItem(itemId);
    setTimeout(() => setTouchedItem(null), 1500);
  };

  const handleMouseEnter = (itemId: string) => {
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
      {/* CAMBIO 1: Reduje el padding (px-4 py-3 -> px-3 py-2) para hacerlo más esbelto */}
      <nav className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/20 bg-white/30 backdrop-blur-md shadow-xl transition-all hover:bg-white/40">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.href ? activeTab === item.href : false;
          const showTooltip = hoveredItem === item.id || touchedItem === item.id;

          const commonClasses = cn(
            // CAMBIO 2: Reduje el tamaño de los botones (w-12 h-12 -> w-10 h-10)
            // 40px (w-10) sigue siendo un buen objetivo táctil, pero mucho menos intrusivo que 48px.
            "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
            "active:scale-95 cursor-pointer",
            isActive 
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-primary hover:bg-white/40"
          );

          const content = (
            <div
              className="relative flex items-center justify-center w-full h-full"
              onMouseEnter={() => handleMouseEnter(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onTouchStart={() => handleTouchStart(item.id)}
            >
              {isActive && (
                <motion.div
                  layoutId="dock-active"
                  className="absolute inset-0 bg-primary rounded-full shadow-md" 
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              {/* El icono se mantiene en w-5 h-5 para buena legibilidad */}
              <Icon className={cn("w-5 h-5 relative z-10 stroke-[2.5px]")} />

              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    // Ajuste la posición vertical (-top-14 -> -top-12) para que el tooltip quede pegado al nuevo tamaño
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-foreground/90 text-background text-xs font-bold font-montserrat rounded-lg whitespace-nowrap shadow-lg pointer-events-none backdrop-blur-sm z-50"
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
              <Link key={item.id} to={item.href} className={commonClasses} onClick={() => handleClick(item)}>
                {content}
              </Link>
            );
          }

          return (
            <button key={item.id} onClick={() => handleClick(item)} className={commonClasses}>
              {content}
            </button>
          );
        })}
      </nav>
    </div>
  );
}