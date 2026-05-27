// ProfilePage.tsx
import { useState } from "react"
import { Field }   from "../components/Field"
import { Button }  from "../components/Button"
import { useAuth } from "../context/AuthContext"

interface ProfileData {
  fullName:  string
  email:     string
  phone:     string
  role:      string
  avatarUrl: string
}

export default function ProfilePage() {

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const { logout } = useAuth()

  // Datos guardados — lo que se muestra en modo vista
  // Cuando tengas auth, esto vendrá de tu API/contexto
  const [saved, setSaved] = useState<ProfileData>({
    fullName:  "Ana Torres",
    email:     "ana@cajacomunidad.ec",
    phone:     "0991234567",
    role:      "Tesorera",
    avatarUrl: "",
  })

  // Copia temporal mientras editas — se descarta si cancelas
  const [draft, setDraft] = useState<ProfileData>(saved)

  // Iniciales para el avatar
  const initials = saved.fullName
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  function handleChange(field: keyof ProfileData) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraft(prev => ({ ...prev, [field]: e.target.value }))
    }
  }

  function handleEdit() {
    setDraft(saved)      // resetea el borrador al valor guardado
    setIsEditing(true)
  }

  function handleCancel() {
    setDraft(saved)      // descarta cambios
    setIsEditing(false)
    setSuccess(false)
  }

  async function handleSave() {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaved(draft)    // confirma los cambios como guardados
      setSuccess(true)
      setIsEditing(false)
    } finally {
      setLoading(false)
    }
  }

  // ─── Avatar — igual en ambos modos ───────────────────────────
  const Avatar = (
    <div className="w-20 h-20 rounded-full bg-primary_y flex items-center justify-center text-white text-2xl font-bold shrink-0">
      {saved.avatarUrl
        ? <img src={saved.avatarUrl} className="w-full h-full rounded-full object-cover" alt="foto de perfil"/>
        : initials
      }
    </div>
  )

  // ─── MODO VISTA ───────────────────────────────────────────────
  if (!isEditing) {
    return (
      <div className="min-h-screen bg-bg_base p-6">
        <div className="max-w-xl mx-auto">

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-text_primary">Mi perfil</h1>
            <p className="text-sm text-text_secondary mt-1">Tu información en la caja</p>
          </div>

          {/* Cabecera con avatar */}
          <div className="flex items-center gap-4 mb-8">
            {Avatar}
            <div>
              <p className="text-lg font-semibold text-text_primary">{saved.fullName}</p>
              <p className="text-sm text-text_secondary">{saved.role}</p>
            </div>
          </div>

          {/* Datos como lista de solo lectura */}
          <div className="flex flex-col gap-4">
            <DataRow label="Correo electrónico" value={saved.email} />
            <DataRow label="Teléfono"            value={saved.phone} />
            <DataRow label="Rol en la caja"      value={saved.role}  />
          </div>

          {success && (
            <p className="text-sm text-secondary_g mt-4">✓ Perfil actualizado correctamente</p>
          )}

          <div className="mt-6">
            <Button label="Editar perfil" variant="primary" onClick={handleEdit} />
            <Button label="Cerrar sesión" variant="danger" onClick={logout} />
          </div>

        </div>
      </div>
    )
  }

  // ─── MODO EDICIÓN ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg_base p-6">
      <div className="max-w-xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text_primary">Editar perfil</h1>
          <p className="text-sm text-text_secondary mt-1">Actualiza tu información personal</p>
        </div>

        <div className="flex items-center gap-4 mb-8">
          {Avatar}
          <button className="text-xs text-primary_y hover:underline">
            Cambiar foto
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Field
            label="Nombre completo"
            type="text"
            value={draft.fullName}
            onChange={handleChange("fullName")}
            placeholder="Ana Torres"
          />
          <Field
            label="Correo electrónico"
            type="email"
            value={draft.email}
            onChange={handleChange("email")}
            placeholder="ana@cajacomunidad.ec"
          />
          <Field
            label="Teléfono"
            type="tel"
            value={draft.phone}
            onChange={handleChange("phone")}
            placeholder="09XXXXXXXX"
          />
          <Field
            label="Rol en la caja"
            type="text"
            value={draft.role}
            onChange={handleChange("role")}
            hint="Este campo puede ser editado por un administrador"
          />
        </div>

        <div className="flex gap-3 mt-6">
          <Button label="Guardar cambios" variant="primary"   loading={loading} onClick={handleSave}  />
          <Button label="Cancelar"        variant="secondary"                   onClick={handleCancel} />
        </div>

      </div>
    </div>
  )
}

// ─── Componente auxiliar solo lectura ─────────────────────────
// Pequeño, simple, solo existe en este archivo (sin export)
function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border_base pb-3">
      <span className="text-xs text-text_secondary">{label}</span>
      <span className="text-sm text-text_primary">{value || "—"}</span>
    </div>
  )
}