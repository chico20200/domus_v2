// src/pages/ProfilePage.tsx
import { useState, useEffect }  from "react"
import { useAuth }              from "../context/AuthContext"
import { profileService }       from "../api/profile.service"
import { AppLayout }            from "../components/layout/AppLayout"
import { Field }                from "../components/Field"
import { Button }               from "../components/Button"
import type { Profile }         from "../api/profile.types"

// ── Componente auxiliar solo lectura ─────────────────────────
// Sin AppLayout aquí — es solo una fila de datos
function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col gap-1 pb-3"
      style={{ borderBottom: "1px solid var(--border-base)" }}
    >
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: "var(--text-primary)" }}>
        {value || "—"}
      </span>
    </div>
  )
}

export default function ProfilePage() {
  const { user, logout, isLoading: authLoading } = useAuth()

  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [draft,     setDraft]     = useState<Profile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState("")
  const [success,   setSuccess]   = useState(false)

  

// El useEffect depende de user, no solo del montaje
useEffect(() => {
  if (!user) return  // espera a que AuthContext tenga el usuario

  async function cargarPerfil() {
    try {
      const response = await profileService.getMe()
      setProfile(response.profile)
      setDraft(response.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el perfil")
    } finally {
      setLoading(false)
    }
  }
  cargarPerfil()
}, [user]) 

  function handleChange(field: keyof Profile) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraft(prev => prev ? { ...prev, [field]: e.target.value } : prev)
    }
  }

  function handleEdit() {
    setDraft(profile)
    setIsEditing(true)
    setSuccess(false)
  }

  function handleCancel() {
    setDraft(profile)
    setIsEditing(false)
    setSuccess(false)
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    setError("")
    try {
      const response = await profileService.updateMe({
        nombre:   draft.nombre,
        telefono: draft.telefono,
        foto_url: draft.foto_url,
      })
      setProfile(response.profile)
      setIsEditing(false)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const initials = profile?.nombre
    ? profile.nombre.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() ?? "?"

  // ── Avatar ───────────────────────────────────────────────────
  const Avatar = (
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
      style={{ background: "var(--color-primary_y)" }}
    >
      {profile?.foto_url
        ? <img src={profile.foto_url} className="w-full h-full rounded-full object-cover" alt="foto de perfil" />
        : initials
      }
    </div>
  )

  // ── Carga inicial ────────────────────────────────────────────
 if (authLoading || loading) {
  return (
    <AppLayout titulo="Mi perfil">
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Cargando perfil...
        </p>
      </div>
    </AppLayout>
  )
}

  // ── Error sin perfil ─────────────────────────────────────────
  if (error && !profile) {
    return (
      <AppLayout titulo="Mi perfil">
        <div className="flex items-center justify-center h-full">
          <p className="text-sm" style={{ color: "var(--color-danger_r)" }}>
            {error}
          </p>
        </div>
      </AppLayout>
    )
  }

  // ── MODO VISTA ───────────────────────────────────────────────
  if (!isEditing) {
    return (
      <AppLayout titulo="Mi perfil">
        <div className="max-w-xl">

          {/* Cabecera con avatar */}
          <div
            className="flex items-center gap-4 p-5 rounded-xl mb-6"
            style={{
              background: "var(--bg-surface)",
              border:     "1px solid var(--border-base)",
            }}
          >
            {Avatar}
            <div>
              <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                {profile?.nombre || "Sin nombre"}
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {user?.email}
              </p>
            </div>
          </div>

          {/* Datos */}
          <div
            className="rounded-xl p-5 flex flex-col gap-4 mb-6"
            style={{
              background: "var(--bg-surface)",
              border:     "1px solid var(--border-base)",
            }}
          >
            <DataRow label="Correo electrónico" value={user?.email ?? ""} />
            <DataRow label="Teléfono"           value={profile?.telefono ?? ""} />
          </div>

          {success && (
            <p
              className="text-sm mb-4"
              style={{ color: "var(--color-secondary_g)" }}
            >
              ✓ Perfil actualizado correctamente
            </p>
          )}

          <div className="flex gap-3">
            <Button label="Editar perfil" variant="primary" onClick={handleEdit} />
            <Button label="Cerrar sesión" variant="danger"  onClick={logout}     />
          </div>

        </div>
      </AppLayout>
    )
  }

  // ── MODO EDICIÓN ─────────────────────────────────────────────
  return (
    <AppLayout titulo="Editar perfil">
      <div className="max-w-xl">

        {/* Avatar */}
        <div
          className="flex items-center gap-4 p-5 rounded-xl mb-6"
          style={{
            background: "var(--bg-surface)",
            border:     "1px solid var(--border-base)",
          }}
        >
          {Avatar}
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Foto de perfil
            </p>
            <button
              className="text-xs hover:underline"
              style={{ color: "var(--color-primary_y)" }}
            >
              Cambiar foto
            </button>
          </div>
        </div>

        {/* Formulario */}
        <div
          className="rounded-xl p-5 flex flex-col gap-4 mb-6"
          style={{
            background: "var(--bg-surface)",
            border:     "1px solid var(--border-base)",
          }}
        >
          <Field
            label="Nombre completo"
            type="text"
            value={draft?.nombre ?? ""}
            onChange={handleChange("nombre")}
            placeholder="Ana Torres"
            required
          />
          <Field
            label="Teléfono"
            type="tel"
            value={draft?.telefono ?? ""}
            onChange={handleChange("telefono")}
            placeholder="09XXXXXXXX"
          />
        </div>

        {error && (
          <p
            className="text-sm mb-4"
            style={{ color: "var(--color-danger_r)" }}
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button label="Guardar cambios" variant="primary"   loading={saving} onClick={handleSave}   />
          <Button label="Cancelar"        variant="secondary"                  onClick={handleCancel} />
        </div>

      </div>
    </AppLayout>
  )
}