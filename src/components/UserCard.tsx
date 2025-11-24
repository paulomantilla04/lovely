import { useState, type MouseEvent, useEffect } from "react"
import { motion, useMotionValue, useTransform, type PanInfo, useAnimation } from "framer-motion"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/index"
import { Badge } from "@/components/ui/badge"

interface UserCardProps {
  user: Profile
  active: boolean
  removeCard: (id: string, direction: "left" | "right") => void
  onExpand: (user: Profile) => void
  swipeDirection: "left" | "right" | null 
}

export function UserCard({ user, active, removeCard, onExpand, swipeDirection }: UserCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const controls = useAnimation() 

  // Lógica de Preload
  useEffect(() => {
    user.photos.forEach((url) => {
      const img = new Image()
      img.src = url
    })
  }, [user.photos])

  // Valores de movimiento para el arrastre (DRAG)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  
  const dragLikeOpacity = useTransform(x, [25, 150], [0, 1])
  const dragNopeOpacity = useTransform(x, [-25, -150], [0, 1])

  // Efecto para manejar los botones manuales
  useEffect(() => {
    if (!swipeDirection) return;

    const targetX = swipeDirection === "right" ? 500 : -500;
    const targetRotate = swipeDirection === "right" ? 20 : -20;

    controls.start({
      x: targetX,
      rotate: targetRotate,
      opacity: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }).then(() => {
      removeCard(user.id, swipeDirection);
    });

  }, [swipeDirection, controls, removeCard, user.id]);


  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      const direction = info.offset.x > 0 ? "right" : "left"
      removeCard(user.id, direction)
    }
  }

  const cyclePhoto = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return
    e.stopPropagation()
    setCurrentPhotoIndex((prev) => (prev + 1) % user.photos.length)
  }

  const finalLikeOpacity = swipeDirection === "right" ? 1 : dragLikeOpacity;
  const finalNopeOpacity = swipeDirection === "left" ? 1 : dragNopeOpacity;

  return (
    <motion.div
      style={{
        x: active ? x : 0,
        rotate: active ? rotate : 0,
        zIndex: active ? 50 : 0,
      }}
      animate={controls} 
      initial={{ scale: active ? 1 : 0.95, opacity: 1 }}
      whileTap={{ scale: active ? 1.02 : 0.95 }}
      drag={active && !swipeDirection ? "x" : false} 
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      className={cn(
        "absolute inset-0 h-full w-full overflow-hidden rounded-3xl bg-black shadow-xl border border-white/10 transition-transform",
        active ? "cursor-grab active:cursor-grabbing" : "pointer-events-none scale-95 opacity-50"
      )}
      onClick={active ? cyclePhoto : undefined}
    >
      {/* Foto */}
      <div className="absolute inset-0 h-full w-full bg-neutral-900">
        <img
          src={user.photos[currentPhotoIndex] || "https://placehold.co/600x800?text=No+Photo"}
          alt={user.name}
          className="h-full w-full object-cover pointer-events-none select-none"
          // Priority hint para navegadores modernos (opcional pero útil)
          fetchPriority={active ? "high" : "low"}
        />
      </div>

      {/* Indicadores de Foto */}
      <div className="absolute top-4 left-0 right-0 z-20 flex gap-1 px-4">
        {user.photos.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "h-1 flex-1 rounded-full shadow-sm transition-colors",
              idx === currentPhotoIndex ? "bg-white" : "bg-white/40"
            )}
          />
        ))}
      </div>

      {/* Gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

      {/* Feedback Visual (Like/Nope) */}
      {active && (
        <>
          <motion.div 
            style={{ opacity: finalLikeOpacity }} 
            className="absolute top-8 left-8 -rotate-12 rounded-lg border-4 border-green-500 px-4 py-1 z-30"
          >
            <span className="text-4xl font-bold uppercase tracking-widest text-green-500">LIKE</span>
          </motion.div>
          <motion.div 
            style={{ opacity: finalNopeOpacity }} 
            className="absolute top-8 right-8 rotate-12 rounded-lg border-4 border-red-500 px-4 py-1 z-30"
          >
            <span className="text-4xl font-bold uppercase tracking-widest text-red-500">NOPE</span>
          </motion.div>
        </>
      )}

      {/* Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-left bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-20">
        <div className="flex flex-col gap-3">
          {/* Nombre y Edad */}
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white shadow-sm font-montserrat">
                {user.name}, {user.age}
              </h2>
            </div>
            
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 shrink-0 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 border-0"
              onClick={(e) => {
                e.stopPropagation()
                onExpand(user)
              }}
            >
              <Info className="h-5 w-5" />
            </Button>
          </div>

          {/* Descripción */}
          {user.description && (
            <p className="text-sm text-white/90 font-inter line-clamp-2 leading-relaxed">
              {user.description}
            </p>
          )}

          {/* Badges de Hobbies */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {user.hobbies.slice(0, 3).map((hobby, idx) => ( // Mostramos max 3 hobbies en la carta
              <Badge 
                key={idx} 
                variant="secondary" 
                className="bg-white/20 text-white hover:bg-white/30 border-0 text-[10px] px-2 py-0.5 backdrop-blur-sm"
              >
                {hobby}
              </Badge>
            ))}
            {user.hobbies.length > 3 && (
              <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px] px-2 py-0.5">
                +{user.hobbies.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}