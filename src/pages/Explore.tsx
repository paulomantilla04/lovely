import { UserAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";


export default function Explore() {
    const { session, signOut } = UserAuth();

    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate("/login");
    }


    return (
        <main className="min-h-screen bg-[#ECE6F0] flex flex-col items-center justify-center p-4 md:p-8">
            <h1 className="text-2xl font-bold font-montserrat">Hola, {session?.user.email}</h1>
            <Button onClick={handleSignOut}>Cerrar sesión</Button>
        </main>
    )
}