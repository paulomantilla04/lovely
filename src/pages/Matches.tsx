import { useEffect, useState } from "react";
import { UserAuth } from "@/context/AuthContext";
import { supabase } from "@/config/supabaseClient";
import { Dock } from "@/components/Dock";
import { Card, CardContent } from "@/components/ui/card";
import { Instagram, Loader2 } from "lucide-react";
import { motion, type Variants } from "framer-motion"; 

interface MatchProfile {
  id: string;
  name: string;
  instagram: string | null;
  photo: string | null;
}

// Variantes de animación para el contenedor padre (orquestador)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Retraso entre cada hijo
      delayChildren: 0.1
    }
  }
};

// Variantes para los elementos hijos (tarjetas)
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function Matches() {
  const { user } = UserAuth();
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMatches();
  }, [user]);

  const fetchMatches = async () => {
    try {
      const { data: matchData, error } = await supabase
        .from("matches")
        .select("user1, user2")
        .or(`user1.eq.${user?.id},user2.eq.${user?.id}`);

      if (error) throw error;

      const friendIds = matchData.map((m) => 
        m.user1 === user?.id ? m.user2 : m.user1
      );

      if (friendIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, instagram, photos(photo_url)")
        .in("id", friendIds);

      if (profileError) throw profileError;

      const formattedMatches = profiles.map((p: any) => ({
        id: p.id,
        name: p.name,
        instagram: p.instagram,
        photo: p.photos?.[0]?.photo_url || null,
      }));

      setMatches(formattedMatches);
    } catch (err) {
      console.error("Error cargando matches:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#ECE6F0] pb-24 relative">
      <header className="p-6 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-2xl font-bold font-montserrat text-primary">Tus Matches</h1>
      </header>

      {/* Contenedor principal con padding */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
          </div>
        ) : matches.length > 0 ? (
          // Convertimos el grid en motion.div
          <motion.div 
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {matches.map((match) => (
              // Cada match es un motion.div hijo
              <motion.div key={match.id} variants={itemVariants} layout>
                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-muted shrink-0 border-2 border-white shadow-sm">
                        <img src={match.photo || "/placeholder-user.jpg"} alt={match.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold font-montserrat text-lg truncate">{match.name}</h3>
                      {match.instagram ? (
                        <a 
                          href={`https://instagram.com/${match.instagram.replace('@', '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-pink-600 text-sm flex items-center gap-1 hover:underline font-medium font-montserrat"
                        >
                          <Instagram className="w-3 h-3" /> @{match.instagram.replace('@', '')}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sin Instagram</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          // Estado vacío animado
          <motion.div 
            className="col-span-full text-center text-muted-foreground py-20 font-inter"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p>No tienes matches todavía.</p>
            <p className="text-sm mt-1">¡Sigue explorando para conectar!</p>
          </motion.div>
        )}
      </div>

      {/* Navegación */}
      <Dock />
    </main>
  );
}