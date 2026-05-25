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
  
}
