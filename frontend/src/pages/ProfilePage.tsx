// src/pages/ProfilePage.tsx
import { useState, useEffect } from "react"
import { useAuth }         from "../context/AuthContext"
import { profileService }  from "../api/profile.service"
import { AppLayout } from "../components/layaut/AppLayout"
import { Field }           from "../components/Field"
import { Button }          from "../components/Button"
import type { Profile }    from "../api/profile.types"

// ── Componente auxiliar solo lectura ─────────────────────────
function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <AppLayout titulo="Mi perfil">
      <div className="flex flex-col gap-1 border-b border-gray-200 pb-3">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-sm text-gray-900">{value || "—"}</span>
      </div>
    </AppLayout>
  )
}

export default function ProfilePage() {
  const { user, logout } = useAuth()

  // ── Estado ───────────────────────────────────────────────────
  const [profile,    setProfile]    = useState<Profile | null>(null)
  const [draft,      setDraft]      = useState<Profile | null>(null)
  const [isEditing,  setIsEditing]  = useState(false)
  const [loading,    setLoading]    = useState(true)   // carga inicial
  const [saving,     setSaving]     = useState(false)  // guardando cambios
  const [error,      setError]      = useState("")
  const [success,    setSuccess]    = useState(false)

  // ── Carga inicial del perfil ─────────────────────────────────
  useEffect(() => {
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
  }, []) // ← solo al montar el componente

  // ── Handlers ────────────────────────────────────────────────
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
      setProfile(response.profile)  // actualiza los datos guardados
      setIsEditing(false)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  // ── Iniciales para el avatar ─────────────────────────────────
  const initials = profile?.nombre
    ? profile.nombre.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() ?? "?"

  // ── Estados de carga y error ─────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-bg_base flex items-center justify-center">
        <p className="text-text_secondary text-sm">Cargando perfil...</p>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-bg_base flex items-center justify-center">
        <p className="text-danger_r text-sm">{error}</p>
      </div>
    )
  }

  // ── Avatar — igual en ambos modos ────────────────────────────
  const Avatar = (
    <div className="w-20 h-20 rounded-full bg-primary_y flex items-center justify-center text-white text-2xl font-bold shrink-0">
      {profile?.foto_url
        ? <img src={profile.foto_url} className="w-full h-full rounded-full object-cover" alt="foto de perfil" />
        : initials
      }
    </div>
  )

  // ── MODO VISTA ───────────────────────────────────────────────
  if (!isEditing) {
    return (
      <div className="min-h-screen bg-bg_base p-6">
        <div className="max-w-xl mx-auto">

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-text_primary">Mi perfil</h1>
            <p className="text-sm text-text_secondary mt-1">Tu información en la caja</p>
          </div>

          <div className="flex items-center gap-4 mb-8">
            {Avatar}
            <div>
              <p className="text-lg font-semibold text-text_primary">
                {profile?.nombre || "Sin nombre"}
              </p>
              <p className="text-sm text-text_secondary">{user?.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <DataRow label="Correo electrónico" value={user?.email ?? ""} />
            <DataRow label="Teléfono"           value={profile?.telefono ?? ""} />
          </div>

          {success && (
            <p className="text-sm text-secondary_g mt-4">✓ Perfil actualizado correctamente</p>
          )}

          <div className="flex gap-3 mt-6">
            <Button label="Editar perfil"   variant="primary"   onClick={handleEdit} />
            <Button label="Cerrar sesión"   variant="danger"    onClick={logout} />
          </div>

        </div>
      </div>
    )
  }

  // ── MODO EDICIÓN ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg_base p-6">
      <div className="max-w-xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text_primary">Editar perfil</h1>
          <p className="text-sm text-text_secondary mt-1">Actualiza tu información personal</p>
        </div>

        <div className="flex items-center gap-4 mb-8">
          {Avatar}
        </div>

        <div className="flex flex-col gap-4">
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

        {error && <p className="text-sm text-danger_r mt-2">{error}</p>}

        <div className="flex gap-3 mt-6">
          <Button label="Guardar cambios" variant="primary"   loading={saving}  onClick={handleSave}   />
          <Button label="Cancelar"        variant="secondary"                   onClick={handleCancel} />
        </div>

      </div>
    </div>
  )
}