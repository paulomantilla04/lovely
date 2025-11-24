import { createContext, useEffect, useState, useContext, type ReactNode } from "react";
import { supabase } from "../config/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

interface AuthResponse {
    success: boolean;
    data?: any;
    error?: {
        message: string;
    };
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    signIn: (email: string, password: string) => Promise<AuthResponse>;
    signUp: (email: string, password: string, name: string) => Promise <AuthResponse>;
    signOut: () => Promise<AuthResponse>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Función de Login
  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Hubo un problema al iniciar sesión", error);
      return {
        success: false,
        error: {
          message:
            error.message === "Invalid login credentials"
              ? "Correo electrónico o contraseña incorrectos"
              : "Error al iniciar sesión. Por favor, inténtalo de nuevo.",
        },
      };
    }

    return { success: true, data };
  };

  // Función de Registro
  const signUp = async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Guardamos el nombre en los metadatos del usuario de Auth.
        // Esto es útil para mostrar "Hola, [Nombre]" incluso antes de cargar la tabla 'profiles'.
        data: {
          name: name, 
        },
      },
    });

    if (error) {
      console.error("Hubo un problema al registrarse", error);
      return {
        success: false,
        error: {
          message:
            error.message === "User already registered"
              ? "Este correo electrónico ya está registrado"
              : "Error al registrarse. Por favor, inténtalo de nuevo.",
        },
      };
    }

    return { success: true, data };
  };

  // Función de Cerrar Sesión
  const signOut = async (): Promise<AuthResponse> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Hubo un problema al cerrar sesión", error);
      return { success: false, error: { message: error.message } };
    }
    // Limpiamos el estado local inmediatamente
    setSession(null);
    setUser(null);
    return { success: true };
  };

  // Efecto para escuchar cambios en la sesión
  useEffect(() => {
    // 1. Obtener sesión inicial
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // 2. Suscribirse a cambios (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, signIn, signUp, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const UserAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("UserAuth debe ser usado dentro de un AuthContextProvider");
  }
  return context;
};