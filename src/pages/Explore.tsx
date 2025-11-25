// src/pages/Explore.tsx
import { SwipeDeck } from "@/components/SwipeDeck";

export default function Explore() {
    return (
        <main className="min-h-screen bg-[#ECE6F0] flex flex-col relative overflow-hidden">
            {/* Header simple y absoluto para no interferir con el layout central */}
            <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                 <h1 className="text-xl font-bold font-montserrat text-primary">Lovely</h1>
            </header>

            {/* Contenedor principal del Swipe */}
            <div className="flex-1 flex items-center justify-center pt-10 pb-4">
                <SwipeDeck />
            </div>
        </main>
    )
}