// src/pages/LoginPage.tsx
import { useState }      from "react"
import { useNavigate }   from "react-router-dom"
import { useAuth }       from "../context/AuthContext"
import { Field }         from "../components/Field"
import { Button }        from "../components/Button"
import { Mail, Lock, Forward } from "lucide-react"
import { Link } from "react-router-dom"
export default function LoginPage() {
  const { login }    = useAuth()
  const navigate     = useNavigate()

  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function handleLogin() {
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      navigate("/cajas", { replace: true })  // redirige al perfil
    } catch (err) {
      // El error viene del throw en api.client con el mensaje del backend
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (

    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>

      <div className = "flex flex-row items-center justify-center mt-8">
        <img src="/logo_domus.png" alt="Logo de la caja" className="w-24"/>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Domus</h1>
     </div>

      <div className="m-5 flex justify-center items-center p-1" style={{ background: 'var(--bg-base)' }}>
        
        <div className="w-full max-w-sm flex flex-col gap-5 p-5 rounded-lg shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}>

          <div className="text-center">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Iniciar sesión</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Accede a tu caja de ahorro</p>
          </div>

          <Field
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ana@cajacomunidad.ec"
            error={error}
            hint="Usa tu correo registrado"
            icon={Mail}
            required
          />
          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            hint="Usa tu contraseña"
            error={error ? "Correo o contraseña incorrectos" : undefined}
            icon={Lock}
            required
          />
          <div className="text-right">
          <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--color-primary_y)' }}>
          ¿Olvidaste tu contraseña?
          </Link>
</div>

          <Button
            label="Ingresar"
            variant="primary"
            loading={loading}
            onClick={handleLogin}
            onEnter={handleLogin}
            icon={Forward}  
          />

        </div>
      </div>
      <p className="text-center text-sm mt-auto mb-4" style={{ color: 'var(--text-secondary)' }}>
        No tienes cuenta? <Link to="/register" className="hover:underline" style={{ color: 'var(--color-secondary_g)' }}>Regístrate aquí</Link>
      </p>
     </div>
  )
}