# Lovely 💖

**Lovely** es una aplicación web de citas tipo "Tinder" diseñada exclusivamente para la comunidad universitaria. Conecta a estudiantes permitiéndoles descubrir perfiles, hacer "match" y conocer gente nueva dentro de su campus de forma segura y divertida.

![Lovely App Screenshot](https://placehold.co/1200x600?text=Lovely+Preview) ## 🚀 Tecnologías

El proyecto está construido con un stack moderno enfocado en rendimiento, escalabilidad y experiencia de desarrollador:

- **Frontend:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Componentes UI:** [Shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind)
- **Animaciones:** [Framer Motion](https://www.framer.com/motion/)
- **Enrutamiento:** [React Router v7](https://reactrouter.com/)
- **Backend & Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime)
- **Iconos:** [Lucide React](https://lucide.dev/)

## ✨ Características Principales

- **Autenticación Segura:** Registro exclusivo con correo institucional (`@uaeh.edu.mx`) y verificación vía OTP.
- **Onboarding Interactivo:** Wizard paso a paso para completar perfil, subir fotos y definir intereses.
- **Swipe Deck:** Interfaz fluida para dar "Like" o "Nope" a otros perfiles con gestos o botones.
- **Matching en Tiempo Real:** Lógica de emparejamiento automática (backend-driven) cuando hay interés mutuo.
- **Perfiles Detallados:** Visualización de fotos, biografía, edad y hobbies mediante badges.
- **Gestión de Preferencias:** Filtrado por género e intereses.

## 🛠️ Configuración del Proyecto

Sigue estos pasos para levantar el proyecto en tu entorno local.

### Prerrequisitos

- Node.js (v18 o superior)
- npm, yarn, pnpm o bun
- Una cuenta en [Supabase](https://supabase.com/)

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone [https://github.com/tu-usuario/lovely.git](https://github.com/tu-usuario/lovely.git)
cd lovely
bun install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto y agrega las siguientes variables:

```env
VITE_SUPABASE_URL=tu-url-supabase
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-supabase
```

### 3. Configurar Backend (Supabase)

Este proyecto utiliza **Supabase** como Backend-as-a-Service. Para ejecutarlo localmente, necesitas crear un proyecto en Supabase y configurar lo siguiente:

1. **Autenticación:** Habilitar proveedores de correo electrónico/contraseña.
2. **Base de Datos (PostgreSQL):**
   - Se requiere una tabla `profiles` vinculada a la tabla `auth.users`.
   - Tablas relacionales para `swipes`, `matches` y `hobbies`.
   - Triggers para el manejo automático de *matching*.
3. **Storage:** Crear un bucket privado llamado `user_photos` con políticas RLS para permitir la carga de imágenes de perfil.

> **Nota:** La lógica de negocio crítica (como el algoritmo de matching) se ejecuta a nivel de base de datos para garantizar la integridad y el rendimiento.


