import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { UserAuth } from "@/context/AuthContext"
import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router"

function Login() {

  const { signIn } = UserAuth()

  const [ email, setEmail ] = useState<string>("");
  const [ password, setPassword ] = useState<string>("");
  const [ loading, setLoading ] = useState<boolean>(false);
  const [ error, setError ] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await signIn(email, password);
            if (result.success) {
                navigate("/explore");

            } else if (result.error) {
                setError("Error al iniciar sesión: " + result.error.message);
            }
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            setError("Error al iniciar sesión. Por favor, inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

  return (
    <main className="min-h-screen bg-[#ECE6F0] flex items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center font-montserrat text-xl font-bold">
          <CardTitle>Lovely</CardTitle>
        </CardHeader>
        
        <CardContent>
          <FieldGroup className="font-montserrat">
            <Field>
              <FieldLabel>Correo electrónico</FieldLabel>
              <Input type="email" placeholder="correo@uaeh.edu.mx" id="email" onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Contraseña</FieldLabel>
              <Input type="password" placeholder="********" id="password" onChange={(e) => setPassword(e.target.value)} />
            </Field>
          </FieldGroup>  
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full font-montserrat" onClick={handleSubmit} disabled={loading}>{loading ? "Iniciando sesión..." : "Iniciar sesión"}</Button>
          <p className="text-center text-sm font-montserrat">¿No tienes cuenta? <a href="/signup" className="font-bold">Regístrate</a></p>
          {error && <p className="text-red-500 text-sm mt-4 bg-red-100 p-2 rounded-lg font-montserrat text-center">{error}</p>}
        </CardFooter>
      </Card>
    </main>
  )
}

export default Login
