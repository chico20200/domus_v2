import type { LucideIcon } from "lucide-react"
type ButtonVariant = "primary" | "secondary" | "danger"
interface ButtonProps {
  label:     string                  // obligatorio — el texto del botón
  variant?:  ButtonVariant           // opcional — por defecto será "primary"
  disabled?: boolean                 // opcional — por defecto false
  loading?:  boolean                 // opcional — por defecto false
  onClick?:  () => void              // opcional — lo que pasa al hacer clic
  icon?:     LucideIcon              // opcional — el ícono del botón
}

export function Button({
  label,
  variant = "primary",
  disabled = false,
  loading = false,
  onClick,
  icon: Icon
}: ButtonProps) {
  const isBlocked = disabled || loading

  const variantClasses = {
    primary: "bg-primary_y hover:bg-primary_yh text-white",
    secondary: "bg-secondary_g hover:bg-secondary_gh text-white",
    danger: "bg-danger_r hover:bg-danger_rh text-white"
  }

  const buttonClasses = [
    // Base — siempre presente en todos los botones
    "m-1",
    "inline-flex items-center justify-center gap-2",
    "rounded-lg px-4 py-2 text-sm font-medium",
    "transition-colors",

    // Varía según variant
    variantClasses[variant],

    // Varía según si está bloqueado
    isBlocked
      ? "opacity-50 cursor-not-allowed"
      : "cursor-pointer",

  ].join(" ")

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={isBlocked}
    >
      {loading && <span>⟳</span>}
      {loading ? "Cargando..." : label}
      {Icon && !loading && <Icon size={16} />}
    </button>
  )

}