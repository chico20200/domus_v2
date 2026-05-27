import type { LucideIcon } from "lucide-react"

type fieldMode   = "dark" | "light"
type fieldStatus = "able" | "disabled"

interface FieldProps {
  label:        string
  hint?:        string
  error?:       string
  variant?:     fieldMode
  status?:      fieldStatus
  placeholder?: string
  type:         string
  value:        string
  onChange:     (e: React.ChangeEvent<HTMLInputElement>) => void
  icon?:        LucideIcon
  required?:    boolean
}

export function Field({
  label,
  hint,
  error,
  variant  = "light",
  status   = "able",
  placeholder,
  type     = "text",
  value,
  onChange,
  icon:    Icon,      // ← renombrado a Icon (mayúscula) para usarlo como componente JSX
  required = false,
}: FieldProps) {

  const isDisabled = status === "disabled"
  const isError    = !!error

  const inputClasses = [
    // cuando hay ícono agrega padding derecho extra para que el texto no tape el ícono
    Icon ? "pr-10" : "",
    "w-full rounded-lg pl-3 py-2 text-sm outline-none transition-colors border",
    variant === "light"
      ? "bg-white text-gray-900"
      : "bg-blk_2 text-gray-100",
    isError
      ? "border-danger_r focus:border-danger_r"
      : "border-gray-300 focus:border-secondary_g",
    isDisabled
      ? "opacity-50 cursor-not-allowed"
      : "",
  ].join(" ")

  const labelClasses = [
    "text-sm font-medium mt-1",
    variant === "light" ? "text-blk_1" : "text-secondary_wt"
  ].join(" ")

  // Color del ícono — rojo si hay error, gris si no
  const iconClasses = isError ? "text-danger_r" : "text-gray-400"

  return (
    <div className="flex flex-col gap-1 mb-4">

      {/* Label con asterisco si es requerido */}
      <label className={labelClasses}>
        {label}
        {required && (
          <span className="text-danger_r ml-1">*</span>
        )}
      </label>

      {/* Input envuelto en div relativo para posicionar el ícono */}
      <div className="relative">
        <input
          className={inputClasses}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={isDisabled}
        />

        {/* Ícono posicionado a la derecha */}
        {Icon && (
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <Icon size={16} className={iconClasses} />
          </div>
        )}
      </div>

      {/* Hint o error */}
      {(error || hint) && (
        <p className={`text-xs ${isError ? "text-danger_r" : "text-gray-500"}`}>
          {error || hint}
        </p>
      )}

    </div>
  )
}