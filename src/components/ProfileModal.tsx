import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import type { Profile } from "@/types/index"

interface ProfileModalProps {
  user: Profile | null
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ user, isOpen, onClose }: ProfileModalProps) {
  if (!user) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[70] h-[85vh] rounded-t-[2rem] bg-background p-6 shadow-2xl overflow-y-auto"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose()
            }}
          >
            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
            <div className="space-y-6 text-left">
              <div>
                <h2 className="text-3xl font-bold tracking-tight font-montserrat">
                  {user.name}, {user.age}
                </h2>
              </div>

              <div className="h-px w-full bg-border" />

              <section>
                <h3 className="mb-2 text-lg font-semibold font-montserrat">Sobre mí</h3>
                <p className="leading-relaxed text-muted-foreground font-inter text-base whitespace-pre-wrap">
                    {user.description || "Este usuario no ha escrito una descripción aún."}
                </p>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-semibold font-montserrat">Intereses</h3>
                <div className="flex flex-wrap gap-2">
                  {user.hobbies.map((hobby) => (
                    <Badge key={hobby} variant="secondary" className="px-3 py-1 text-sm font-medium capitalize">
                      {hobby}
                    </Badge>
                  ))}
                </div>
              </section>
              <div className="h-20" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}