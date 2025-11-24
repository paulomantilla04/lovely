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
  
  // NUEVO: Estado para controlar la dirección del swipe manual
  const [manualSwipeDirection, setManualSwipeDirection] = useState<"left" | "right" | null>(null)

  useEffect(() => {
    if (currentUser) {
      fetchProfiles()
    }
  }, [currentUser])

  const fetchProfiles = async () => {
    // (El código de fetchProfiles es el mismo de la respuesta anterior)
    setLoading(true)
    try {
      if (!currentUser) return

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", currentUser.id)
        .single()

      let targetGenders: string[] = []
      if (myProfile?.preferences) {
        if (myProfile.preferences.includes("todos")) {
          targetGenders = ["hombre", "mujer", "no binario", "otro"]
        } else {
          const map: Record<string, string> = {
            "hombres": "hombre",
            "mujeres": "mujer",
            "personas no binarias": "no binario"
          }
          targetGenders = myProfile.preferences
            .map((p: string) => map[p] || p)
            .filter(Boolean)
        }
      }

      const { data: swipes } = await supabase
        .from("swipes")
        .select("to_user")
        .eq("from_user", currentUser.id)
      
      const swipedIds = swipes?.map(s => s.to_user) || []
      swipedIds.push(currentUser.id)

      let query = supabase
        .from("profiles")
        .select(`
          id, name, date_of_birth, looking_for, gender,
          photos (photo_url),
          user_hobbies (
            hobbies (name)
          )
        `)
        .not("id", "in", `(${swipedIds.join(',')})`)
        .limit(20)

      if (targetGenders.length > 0) {
        query = query.in("gender", targetGenders)
      }

      const { data: profiles, error } = await query

      if (error) throw error

      const formattedProfiles: Profile[] = profiles.map((p: any) => ({
        id: p.id,
        name: p.name,
        age: calculateAge(p.date_of_birth),
        bio: `Busco: ${p.looking_for} | ${p.gender}`,
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
    // (El código de calculateAge es el mismo)
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const handleSwipeComplete = async (id: string, direction: "left" | "right") => {
    // Esta función se llama cuando la animación termina (ya sea por drag o botón)
    
    // Resetear el estado manual
    setManualSwipeDirection(null)
    
    // Remover carta del estado
    setUsers((prev) => prev.filter((user) => user.id !== id))

    if (!currentUser) return

    const action = direction === "right" ? "like" : "dislike"
    const { error } = await supabase.from("swipes").insert({
      from_user: currentUser.id,
      to_user: id,
      action: action
    })

    if (error) console.error("Error saving swipe:", error)
    
    if (users.length <= 2) {
       // fetchProfiles() 
    }
  }

  const handleManualBtnClick = (direction: "left" | "right") => {
    if (users.length === 0 || manualSwipeDirection) return
    // Solo indicamos la dirección, la UserCard se encargará de animarse y llamar a handleSwipeComplete
    setManualSwipeDirection(direction)
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10"/></div>
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      <div className="relative flex h-[65vh] w-full max-w-sm flex-col items-center justify-center">
        {users.length > 0 ? (
          users.map((user, index) => {
            if (index < users.length - 2) return null
            const isTop = index === users.length - 1
            return (
              <UserCard 
                key={user.id} 
                user={user} 
                active={isTop} 
                // Pasamos la función que se ejecutará AL FINAL de la animación
                removeCard={handleSwipeComplete} 
                onExpand={setSelectedUser}
                // Pasamos la dirección manual solo si es la carta de arriba
                swipeDirection={isTop ? manualSwipeDirection : null}
              />
            )
          })
        ) : (
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

      <div className="mt-8 flex items-center justify-center gap-8 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-16 w-16 rounded-full border-2 border-red-500 bg-background text-red-500 shadow-lg hover:bg-red-50 hover:text-red-600 hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
          // Usamos la nueva función del botón
          onClick={() => handleManualBtnClick("left")}
          disabled={users.length === 0 || manualSwipeDirection !== null}
        >
          <X className="h-8 w-8" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-16 w-16 rounded-full border-2 border-green-500 bg-background text-green-500 shadow-lg hover:bg-green-50 hover:text-green-600 hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
          // Usamos la nueva función del botón
          onClick={() => handleManualBtnClick("right")}
          disabled={users.length === 0 || manualSwipeDirection !== null}
        >
          <Heart className="h-8 w-8 fill-current" />
        </Button>
      </div>

      <ProfileModal user={selectedUser} isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  )
}