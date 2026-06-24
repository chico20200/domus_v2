// src/pages/RegisterPage.tsx
import { useState }    from "react"
import { useNavigate, Link } from "react-router-dom"
import { Mail, Lock }  from "lucide-react"
import { Field }       from "../components/Field"
import { Button }      from "../components/Button"
import { useAuth }     from "../context/AuthContext"
import { authService } from "../api/auth.service"

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [confirm,  setConfirm]  = useState("")
  const [loading,  setLoading]  = useState(false)

  // Errores por campo — undefined cuando no hay error
  const [errorEmail,    setErrorEmail]    = useState<string | undefined>(undefined)
  const [errorPassword, setErrorPassword] = useState<string | undefined>(undefined)
  const [errorConfirm,  setErrorConfirm]  = useState<string | undefined>(undefined)
  const [errorGeneral,  setErrorGeneral]  = useState<string | undefined>(undefined)

  // ── Validación local antes de llamar al backend ──────────────
  function validar(): boolean {
    let valido = true

    setErrorEmail(undefined)
    setErrorPassword(undefined)
    setErrorConfirm(undefined)
    setErrorGeneral(undefined)

    if (!email.includes("@") || !email.includes(".")) {
      setErrorEmail("Ingresa un correo válido")
      valido = false
    }

    if (password.length < 6) {
      setErrorPassword("La contraseña debe tener al menos 6 caracteres")
      valido = false
    }

    if (password !== confirm) {
      setErrorConfirm("Las contraseñas no coinciden")
      valido = false
    }

    return valido
  }

  async function handleRegister() {
    if (!validar()) return   // si hay errores locales no llama al backend

    setLoading(true)
    try {
      // 1. Registra el usuario
      await authService.register({ email, password })

      // 2. Como no requiere confirmación, loguea directo
      await login(email, password)

      // 3. Redirige al perfil
      navigate("/perfil", { replace: true })

    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : "Error al crear la cuenta")
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
        <div className="mt-4 flex items-center justify-center ">
        <div className="w-full max-w-sm flex flex-col gap-5 p-5 rounded-lg shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}>

            <div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Crear cuenta</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Ingresa tus datos para registrarte
            </p>
            </div>

            <Field
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ana@cajacomunidad.ec"
            icon={Mail}
            required
            error={errorEmail}
            />
            <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
            required
            hint="Mínimo 6 caracteres"
            error={errorPassword}
            />
            <Field
            label="Confirmar contraseña"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
            required
            error={errorConfirm}
            />

            {errorGeneral && (
            <p className="text-sm" style={{ color: 'var(--color-danger_r)' }}>{errorGeneral}</p>
            )}

            <Button
            label="Crear cuenta"
            variant="primary"
            loading={loading}
            onClick={handleRegister}
            />

            <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="hover:underline" style={{ color: 'var(--color-primary_y)' }}>
              Inicia sesión
            </Link>
            </p>

        </div>
        </div>
    </div>
  )
}