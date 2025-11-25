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
    setTouchedItem(itemId);
    // El tooltip desaparece después de 2 segundos en mobile
    setTimeout(() => setTouchedItem(null), 1000);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-center gap-2 px-4 py-3 rounded-full border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.href ? activeTab === item.href : false;
          const showTooltip = hoveredItem === item.id || touchedItem === item.id;

          const commonClasses = cn(
            "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
            "active:scale-95 cursor-pointer hover:scale-105",
            isActive ? "bg-primary text-white" : "text-primary"
          );

          const content = (
            <div
              className="relative"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onTouchStart={() => handleTouchStart(item.id)}
            >
              {/* Fondo activo animado */}
              {isActive && (
                <motion.div
                  layoutId="dock-active"
                  className="absolute inset-0 bg-white/10 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <Icon className={cn("w-6 h-6 relative z-10")} />

              {/* Tooltip */}
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-primary text-white text-sm font-medium font-montserrat rounded-lg whitespace-nowrap shadow-lg pointer-events-none"
                  >
                    {item.label}
                    {/* Flecha del tooltip */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
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
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              onClick={item.onClick}
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