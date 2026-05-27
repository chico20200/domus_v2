// src/pages/ResetPasswordPage.tsx
import { useState, useEffect } from "react"
import { useNavigate }         from "react-router-dom"
import { Lock }                from "lucide-react"
import { Field }               from "../components/Field"
import { Button }              from "../components/Button"
import { authService }         from "../api/auth.service"

export default function ResetPasswordPage() {
  const navigate = useNavigate()

  const [password,  setPassword]  = useState("")
  const [confirm,   setConfirm]   = useState("")
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState<string | undefined>(() => {
    const hash   = window.location.hash
    const params = new URLSearchParams(hash.replace("#", ""))
    const token  = params.get("access_token")
    const type   = params.get("type")

    return token && type === "recovery" ? undefined : "El enlace no es válido o ya expiró."
  })
  const [tokenValido] = useState<boolean>(() => {
    const hash   = window.location.hash
    const params = new URLSearchParams(hash.replace("#", ""))
    const token  = params.get("access_token")
    const type   = params.get("type")

    return Boolean(token && type === "recovery")
  })

  // Supabase pone el token en el hash de la URL:
  // /reset-password#access_token=eyJ...&type=recovery
  useEffect(() => {
    const hash   = window.location.hash
    const params = new URLSearchParams(hash.replace("#", ""))
    const token  = params.get("access_token")
    const type   = params.get("type")

    if (token && type === "recovery") {
      // Guarda el token para que api.client lo use en el request
      localStorage.setItem("token", token)
    }
  }, [])

  async function handleReset() {
    // Validación local antes de llamar al backend
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      return
    }

    setError(undefined)
    setLoading(true)
    try {
      await authService.updatePassword(password)
      setSuccess(true)
      // Limpia el token de recovery — ya no sirve
      localStorage.removeItem("token")
      setTimeout(() => navigate("/login"), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar la contraseña")
    } finally {
      setLoading(false)
    }
  }

  // ── Token inválido ───────────────────────────────────────────
  if (!tokenValido && error) {
    return (
      <div className="min-h-screen bg-bg_base flex items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col gap-4 text-center">
          <h1 className="text-xl font-semibold text-text_primary">Enlace inválido</h1>
          <p className="text-sm text-danger_r">{error}</p>
          <a href="/forgot-password" className="text-sm text-primary_y hover:underline">
            Solicitar un nuevo enlace
          </a>
        </div>
      </div>
    )
  }

  // ── Vista de éxito ───────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-bg_base flex items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col gap-4 text-center">
          <h1 className="text-xl font-semibold text-text_primary">¡Contraseña actualizada!</h1>
          <p className="text-sm text-text_secondary">
            Tu contraseña fue cambiada correctamente. Redirigiendo al login...
          </p>
        </div>
      </div>
    )
  }

  // ── Formulario ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg_base flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-5">

        <div>
          <h1 className="text-2xl font-semibold text-text_primary">Nueva contraseña</h1>
          <p className="text-sm text-text_secondary mt-1">
            Ingresa tu nueva contraseña.
          </p>
        </div>

        <Field
          label="Nueva contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          icon={Lock}
          required
          hint="Mínimo 6 caracteres"
        />
        <Field
          label="Confirmar contraseña"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          icon={Lock}
          required
          error={error}
        />

        <Button
          label="Cambiar contraseña"
          variant="primary"
          loading={loading}
          onClick={handleReset}
        />

      </div>
    </div>
  )
}