// src/pages/ForgotPasswordPage.tsx
import { useState }    from "react"
import { Link }        from "react-router-dom"
import { Mail }        from "lucide-react"
import { Field }       from "../components/Field"
import { Button }      from "../components/Button"
import { authService } from "../api/auth.service"

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | undefined>(undefined)

  async function handleSubmit() {
    setError(undefined)
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSuccess(true)   // muestra el mensaje de éxito
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el correo")
    } finally {
      setLoading(false)
    }
  }

  // ── Vista de éxito ───────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-bg_base flex items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary_g flex items-center justify-center mx-auto">
            <Mail size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-text_primary">Revisa tu correo</h1>
          <p className="text-sm text-text_secondary">
            Enviamos un enlace de recuperación a <strong>{email}</strong>.
            Revisa también la carpeta de spam.
          </p>
          <Link to="/login" className="text-sm text-primary_y hover:underline mt-2">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  // ── Formulario ───────────────────────────────────────────────
  return (
    <div>
      <div className = "flex flex-row items-center justify-center mt-8">
            <img src="/logo_domus.png" alt="Logo de la caja" className="w-24"/>
            <h1 className="text-2xl font-semibold text-text_primary">Domus</h1>
        </div>
    <div className="mt-4 bg-bg_base flex items-center justify-center p-6">
      <div className="bg-secondary_wt w-full max-w-sm flex flex-col gap-5 p-5 rounded-lg shadow-md">

        <div>
          <h1 className="text-2xl font-semibold text-text_primary">¿Olvidaste tu contraseña?</h1>
          <p className="text-sm text-text_secondary mt-1">
            Ingresa tu correo y te enviaremos un enlace para recuperarla.
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
          error={error}
        />

        <Button
          label="Enviar enlace"
          variant="primary"
          loading={loading}
          onClick={handleSubmit}
        />

        <Link to="/login" className="text-sm text-text_secondary hover:underline text-center text-secondary_g">
          Volver al inicio de sesión
        </Link>

      </div>
    </div>
    </div>
  )
}