type FieldVariant = "light" | "dark";
type FieldState = "default" | "focus" | "error" | "disabled";

interface FieldProps {
  label: string
  hint?: string
  error?: string
  variant?: FieldVariant
  disabled?: boolean
  placeholder?: string
  type?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function Field({
  label,
  hint,
  error,
  variant = "light",
  disabled = false,
  placeholder,
  type = "text",
  value,
  onChange,
}: FieldProps) {
  const isError = !!error

  return (
    <div className={`field field-${variant} ${isError ? "field-error" : ""} ${disabled ? "field-disabled" : ""}`}>
      <label className="field-label">{label}</label>
      <input
        className="field-input"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={isError}
        aria-describedby={hint || error ? "field-hint" : undefined}
      />
      {(error || hint) && (
        <span className="field-hint" id="field-hint">
          {error ?? hint}
        </span>
      )}
    </div>
  )
}