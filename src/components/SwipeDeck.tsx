import { useState, useEffect } from "react"
import { X, Heart, RotateCcw, Loader2 } from "lucide-react"
import { UserCard } from "@/components/UserCard"
import { ProfileModal } from "@/components/ProfileModal"
import { Button } from "@/components/ui/button"
import { supabase } from "@/config/supabaseClient"
import { UserAuth } from "@/context/AuthContext"
import type { Profile } from "@/types/index"

export function SwipeDeck() {
  const { user: currentUser } = UserAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  // Índice activo (último elemento del array es la carta superior)
  const activeIndex = users.length - 1

  useEffect(() => {
    if (currentUser) {
      fetchProfiles()
    }
  }, [currentUser])

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      if (!currentUser) return

      // 1. Obtener a quién ya le di swipe
      const { data: swipes } = await supabase
        .from("swipes")
        .select("to_user")
        .eq("from_user", currentUser.id)
      
      const swipedIds = swipes?.map(s => s.to_user) || []
      swipedIds.push(currentUser.id) // Excluirse a sí mismo

      // 2. Obtener perfiles que NO están en esa lista
      // Nota: En producción, esto se optimiza con una función RPC o filtro .not.in
      // Traemos perfiles + fotos + hobbies
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          id, name, date_of_birth, looking_for, gender,
          photos (photo_url),
          user_hobbies (
            hobbies (name)
          )
        `)
        .not("id", "in", `(${swipedIds.join(',')})`)
        .limit(20) // Paginación simple

      if (error) throw error

      // 3. Transformar datos al formato Profile
      const formattedProfiles: Profile[] = profiles.map((p: any) => ({
        id: p.id,
        name: p.name,
        age: calculateAge(p.date_of_birth),
        bio: `Busco: ${p.looking_for} | ${p.gender}`, // Usamos looking_for como bio simple por ahora
        lookingFor: p.looking_for,
        photos: p.photos.map((ph: any) => ph.photo_url),
        hobbies: p.user_hobbies.map((uh: any) => uh.hobbies?.name || ""),
      }))

      setUsers(formattedProfiles)
    } catch (error) {
      console.error("Error fetching profiles:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dob: string) => {
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const handleSwipe = async (id: string, direction: "left" | "right") => {
    // UI Optimista: Remover carta inmediatamente
    const userToSwipe = users.find(u => u.id === id)
    setUsers((prev) => prev.filter((user) => user.id !== id))

    if (!userToSwipe || !currentUser) return

    // Guardar en Supabase
    const action = direction === "right" ? "like" : "dislike"
    const { error } = await supabase.from("swipes").insert({
      from_user: currentUser.id,
      to_user: id,
      action: action
    })

    if (error) console.error("Error saving swipe:", error)
    
    // Si quedan pocas cartas, recargar (opcional)
    if (users.length <= 2) {
        // fetchProfiles() // Descomentar para carga infinita
    }
  }

  const handleManualSwipe = (direction: "left" | "right") => {
    if (users.length === 0) return
    const user = users[activeIndex]
    handleSwipe(user.id, direction)
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10"/></div>
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* Stack de Cartas */}
      <div className="relative flex h-[65vh] w-full max-w-sm flex-col items-center justify-center">
        {users.length > 0 ? (
          users.map((user, index) => {
            // Renderizar solo las últimas 2 para rendimiento
            if (index < users.length - 2) return null
            const isTop = index === users.length - 1
            return (
              <UserCard 
                key={user.id} 
                user={user} 
                active={isTop} 
                removeCard={handleSwipe} 
                onExpand={setSelectedUser} 
              />
            )
          })
        ) : (
            // Estado vacío
          <div className="flex flex-col items-center justify-center text-center p-6">
            <div className="mb-4 rounded-full bg-muted p-6 animate-pulse">
              <RotateCcw className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold font-montserrat">No hay más perfiles</h3>
            <p className="mb-6 text-sm text-muted-foreground font-inter">Vuelve más tarde para ver gente nueva.</p>
            <Button onClick={fetchProfiles} variant="outline">Recargar</Button>
          </div>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="mt-8 flex items-center justify-center gap-8 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-16 w-16 rounded-full border-2 border-red-500 bg-background text-red-500 shadow-lg hover:bg-red-50 hover:text-red-600 hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
          onClick={() => handleManualSwipe("left")}
          disabled={users.length === 0}
        >
          <X className="h-8 w-8" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-16 w-16 rounded-full border-2 border-green-500 bg-background text-green-500 shadow-lg hover:bg-green-50 hover:text-green-600 hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
          onClick={() => handleManualSwipe("right")}
          disabled={users.length === 0}
        >
          <Heart className="h-8 w-8 fill-current" />
        </Button>
      </div>

      <ProfileModal user={selectedUser} isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  )
}