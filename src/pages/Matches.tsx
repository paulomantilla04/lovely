import { useEffect, useState } from "react";
import { UserAuth } from "@/context/AuthContext";
import { supabase } from "@/config/supabaseClient";
import { Dock } from "@/components/Dock";
import { Card, CardContent } from "@/components/ui/card";
import { Instagram, Loader2 } from "lucide-react";

interface MatchProfile {
  id: string;
  name: string;
  instagram: string | null;
  photo: string | null;
}

export default function Matches() {
  const { user } = UserAuth();
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMatches();
  }, [user]);

  const fetchMatches = async () => {
    try {
      // 1. Obtener los IDs de los matches
      const { data: matchData, error } = await supabase
        .from("matches")
        .select("user1, user2")
        .or(`user1.eq.${user?.id},user2.eq.${user?.id}`);

      if (error) throw error;

      // 2. Filtrar para obtener solo el ID del "otro" usuario
      const friendIds = matchData.map((m) => 
        m.user1 === user?.id ? m.user2 : m.user1
      );

      if (friendIds.length === 0) {
        setLoading(false);
        return;
      }

      // 3. Obtener perfiles de esos usuarios
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, instagram, photos(photo_url)")
        .in("id", friendIds);

      if (profileError) throw profileError;

      // Formatear datos
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

      <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="flex justify-center col-span-full py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : matches.length > 0 ? (
          matches.map((match) => (
            <Card key={match.id} className="overflow-hidden border-none shadow-md">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-muted">
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
          ))
        ) : (
          <div className="col-span-full text-center text-muted-foreground py-10 font-inter">
            No tienes matches todavía. ¡Sigue explorando!
          </div>
        )}
      </div>

      {/* Navegación */}
      <Dock />
    </main>
  );
}