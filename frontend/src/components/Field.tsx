type fieldMode = "dark"|"light";
type fieldStatus = "able"|"disabled";

interface FieldProps {
  label:string
  hint?: string
  error?: string
  variant? : fieldMode
  status?: fieldStatus
  placeholder?: string
  type: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function Field({
  label,
  hint,
  error,
  variant = "light",
  status = "able",
  placeholder,
  type = "text",
  value,
  onChange

}: FieldProps){
   const isDisabled = status === "disabled"
  const isError    = !!error

  const inputClasses = [
    "w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors border",
    variant === "light"
      ? "bg-white text-gray-900"
      : "bg-gray-900 text-gray-100",
    isError
      ? "border-red-500 focus:border-red-500"
      : "border-gray-300 focus:border-blue-500",
    isDisabled
      ? "opacity-50 cursor-not-allowed"
      : "",
  ].join(" ")

  const labelClasses = [
    "text-sm font-medium mt-1",
    variant === "light" ? "text-blk_1" : "text-secondary_wt"
  ].join(" ")

 return (
  <div className="flex flex-col gap-1 mb-4">
    <label className={labelClasses}>{label}</label>
    <input 
      className={inputClasses}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={isDisabled}
    />
    {(error || hint) && <p className={`text-xs ${isError ? "text-red-500" : "text-gray-500"}`}>{error ?? hint}</p>}
  </div>




 )
}