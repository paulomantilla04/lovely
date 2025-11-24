import { useState, type MouseEvent } from "react"
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/index"

interface UserCardProps {
  user: Profile
  active: boolean
  removeCard: (id: string, direction: "left" | "right") => void
  onExpand: (user: Profile) => void
}

export function UserCard({ user, active, removeCard, onExpand }: UserCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  // Motion values
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])
  
  const likeOpacity = useTransform(x, [25, 150], [0, 1])
  const nopeOpacity = useTransform(x, [-25, -150], [0, 1])

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

  return (
    <motion.div
      style={{
        x: active ? x : 0,
        rotate: active ? rotate : 0,
        opacity: active ? 1 : 1,
        scale: active ? 1 : 0.95,
        zIndex: active ? 50 : 0,
      }}
      drag={active ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      className={cn(
        "absolute inset-0 h-full w-full overflow-hidden rounded-3xl bg-black shadow-xl border border-white/10",
        active ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
      )}
      onClick={active ? cyclePhoto : undefined}
    >
      {/* Foto */}
      <div className="absolute inset-0 h-full w-full bg-neutral-900">
        <img
          src={user.photos[currentPhotoIndex] || "https://placehold.co/600x800?text=No+Photo"}
          alt={user.name}
          className="h-full w-full object-cover pointer-events-none select-none"
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
          <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 -rotate-12 rounded-lg border-4 border-green-500 px-4 py-1 z-30">
            <span className="text-4xl font-bold uppercase tracking-widest text-green-500">LIKE</span>
          </motion.div>
          <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 rotate-12 rounded-lg border-4 border-red-500 px-4 py-1 z-30">
            <span className="text-4xl font-bold uppercase tracking-widest text-red-500">NOPE</span>
          </motion.div>
        </>
      )}

      {/* Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-left">
        <div className="flex items-end justify-between">
          <div className="pointer-events-none">
            <h2 className="text-3xl font-bold text-white shadow-sm font-montserrat">
              {user.name}, {user.age}
            </h2>
            <p className="mt-1 line-clamp-1 text-sm font-medium text-white/90 font-inter">
               {user.hobbies[0] || "Estudiante"}
            </p>
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
      </div>
    </motion.div>
  )
}