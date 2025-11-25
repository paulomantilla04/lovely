import { useEffect, useState } from "react";
import { UserAuth } from "@/context/AuthContext";
import { supabase } from "@/config/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion"; 

// Tipos locales
type ProfileData = {
  name: string;
  email: string;
  age: number;
  gender: string;
  instagram: string;
  looking_for: string;
  preferences: string[];
};

type Hobby = {
  id: string;
  name: string;
};

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

export default function Profile() {
  const { user } = UserAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Datos del perfil
  const [profile, setProfile] = useState<ProfileData | null>(null);
  
  // Gestión de Hobbies
  const [myHobbies, setMyHobbies] = useState<Hobby[]>([]);
  const [allHobbies, setAllHobbies] = useState<Hobby[]>([]);

  // Feedback
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          *,
          user_hobbies (
            hobby_id,
            hobbies ( id, name )
          )
        `)
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;

      const dob = new Date(profileData.date_of_birth);
      const ageDifMs = Date.now() - dob.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);

      setProfile({
        name: profileData.name,
        email: profileData.email,
        age: age,
        gender: profileData.gender,
        instagram: profileData.instagram || "No conectado",
        looking_for: profileData.looking_for,
        preferences: profileData.preferences || [],
      });

      const userHobbiesMapped = profileData.user_hobbies.map((uh: any) => ({
        id: uh.hobbies.id,
        name: uh.hobbies.name
      }));
      setMyHobbies(userHobbiesMapped);

      const { data: hobbiesData } = await supabase.from("hobbies").select("*");
      if (hobbiesData) setAllHobbies(hobbiesData);

    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    setMessage(null);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          looking_for: profile.looking_for,
          preferences: profile.preferences,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await supabase.from("user_hobbies").delete().eq("profile_id", user.id);

      if (myHobbies.length > 0) {
        const hobbyInserts = myHobbies.map(h => ({
          profile_id: user.id,
          hobby_id: h.id
        }));
        const { error: hobbyError } = await supabase.from("user_hobbies").insert(hobbyInserts);
        if (hobbyError) throw hobbyError;
      }

      setMessage({ type: 'success', text: "Guardado exitosamente" });
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error("Error guardando:", error);
      setMessage({ type: 'error', text: "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (value: string) => {
    if (!profile) return;
    const isSelected = profile.preferences.includes(value);
    const updated = isSelected ? [] : [value];
    setProfile({ ...profile, preferences: updated });
  };

  const toggleHobby = (hobby: Hobby) => {
    const exists = myHobbies.find(h => h.id === hobby.id);
    if (exists) {
      setMyHobbies(myHobbies.filter(h => h.id !== hobby.id));
    } else {
      if (myHobbies.length >= 10) return; 
      setMyHobbies([...myHobbies, hobby]);
    }
  };

  const isPreferencesValid = profile?.preferences && profile.preferences.length === 1;
  const isFormValid = isPreferencesValid;

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#ECE6F0]"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;
  if (!profile) return <div className="p-8 text-center">No se pudo cargar el perfil.</div>;

  return (
    <main className="min-h-screen bg-[#ECE6F0] pb-28 pt-6 px-4 flex justify-center">
      {/* Convertimos el contenedor principal en un motion.div */}
      <motion.div 
        className="w-full max-w-lg space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        <motion.header variants={itemVariants} className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold font-montserrat text-primary">Mi Perfil</h1>
        </motion.header>

        {/* SECCIÓN 1: DATOS INMUTABLES */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-sm bg-white/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-montserrat">Identidad</CardTitle>
              <CardDescription>Datos verificados por la universidad (No editables)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nombre</Label>
                  <Input value={profile.name} disabled className="bg-muted/50 font-medium text-foreground border-transparent h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Edad</Label>
                  <Input value={`${profile.age} años`} disabled className="bg-muted/50 font-medium text-foreground border-transparent h-8" />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Correo</Label>
                <Input value={profile.email} disabled className="bg-muted/50 text-foreground border-transparent h-8" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Género</Label>
                  <Input value={profile.gender} disabled className="bg-muted/50 text-foreground border-transparent capitalize h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Instagram</Label>
                  <Input value={profile.instagram} disabled className="bg-muted/50 text-foreground border-transparent h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* SECCIÓN 2: PREFERENCIAS EDITABLES */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="pb-3 bg-white">
              <CardTitle className="text-lg font-montserrat flex items-center justify-between">
                  Preferencias
                  <Badge variant="secondary" className="text-[10px] font-normal bg-primary/10 text-primary hover:bg-primary/20">Editable</Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-6 bg-white">
              {/* GÉNERO DE INTERÉS */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium block">Me interesa conocer</Label>
                  {!isPreferencesValid && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[10px] text-destructive flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" /> Selecciona una opción
                    </motion.span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {["hombres", "mujeres", "personas no binarias", "todos"].map((opt) => {
                    const isSelected = profile.preferences.includes(opt);
                    return (
                      <Button
                        key={opt}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePreference(opt)}
                        className={`capitalize rounded-full h-8 text-xs transition-all ${isSelected ? 'shadow-md scale-105 ring-2 ring-primary ring-offset-1' : 'border-dashed opacity-70 hover:opacity-100'}`}
                      >
                        {opt}
                        {isSelected && <CheckCircle2 className="w-3 h-3 ml-1.5" />}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* INTENCIÓN */}
              <div className="space-y-3">
                <Label className="text-sm font-medium block">Estoy buscando</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {["relación", "amistad", "aún no lo sé"].map((opt) => (
                    <div 
                      key={opt}
                      onClick={() => setProfile({ ...profile, looking_for: opt })}
                      className={`
                          flex items-center justify-center p-2 rounded-md border cursor-pointer transition-all text-xs font-medium text-center h-10
                          ${profile.looking_for === opt 
                              ? "border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]" 
                              : "border-border bg-background hover:bg-muted text-muted-foreground"}
                      `}
                    >
                      <span className="capitalize">{opt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* HOBBIES */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <Label className="text-sm font-medium">Mis Intereses</Label>
                  <span className="text-[10px] text-muted-foreground">{myHobbies.length} seleccionados</span>
                </div>
                
                <div className="min-h-[80px] p-3 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20">
                  <motion.div layout className="flex flex-wrap gap-2">
                      {myHobbies.length === 0 && <p className="text-xs text-muted-foreground w-full text-center py-4">Selecciona tus intereses abajo 👇</p>}
                      <AnimatePresence mode='popLayout'>
                        {myHobbies.map(hobby => (
                        <motion.div
                          key={hobby.id}
                          layout
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge 
                              variant="default"
                              className="cursor-pointer pl-3 pr-1 py-1 hover:bg-destructive hover:text-destructive-foreground transition-all group"
                              onClick={() => toggleHobby(hobby)}
                          >
                              {hobby.name}
                              <div className="ml-1 p-0.5 rounded-full bg-white/20 group-hover:bg-white/40">
                                  <span className="block text-[8px] leading-none font-bold">✕</span>
                              </div>
                          </Badge>
                        </motion.div>
                        ))}
                      </AnimatePresence>
                  </motion.div>
                </div>

                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground mb-2 block">Añadir más:</Label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                      {allHobbies
                          .filter(h => !myHobbies.some(mh => mh.id === h.id))
                          .map(hobby => (
                          <Badge 
                              key={hobby.id} 
                              variant="outline"
                              className="cursor-pointer hover:border-primary hover:text-primary bg-background transition-colors text-[10px] py-0.5 px-2"
                              onClick={() => toggleHobby(hobby)}
                          >
                              + {hobby.name}
                          </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>

            {/* BOTÓN INTEGRADO EN EL FOOTER DE LA CARD */}
            <CardFooter className="bg-muted/30 p-4 border-t">
              <Button 
                  onClick={handleSave} 
                  disabled={saving || !isFormValid}
                  className={`
                      w-full font-montserrat font-bold tracking-wide shadow-sm transition-all
                      ${message?.type === 'success' ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-600 ring-offset-1' : ''}
                      ${message?.type === 'error' ? 'bg-red-600 hover:bg-red-700' : ''}
                      disabled:opacity-50 disabled:cursor-not-allowed
                  `}
              >
                  {saving ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
                  ) : message ? (
                      <>{message.text}</>
                  ) : !isFormValid ? (
                      <>Completa tus preferencias</>
                  ) : (
                      <><Save className="w-4 h-4 mr-2" /> Guardar Cambios</>
                  )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

      </motion.div>
    </main>
  );
}