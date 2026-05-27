// src/api/auth.types.ts

// ─── REQUESTS — lo que el frontend envía ──────────────────────

interface LoginRequest {
  email:    string
  password: string
  // Tu backend: const { email, password } = req.body
}

interface RegisterRequest {
  email:    string
  password: string
  // Tu backend: const { email, password } = req.body
  // Mismo shape que Login — pero son interfaces separadas
  // porque en el futuro Register podría pedir más campos (nombre, etc.)
}

interface ForgotPasswordRequest {
  email: string
  // Tu backend: const { email } = req.body
}

interface UpdatePasswordRequest {
  password: string
  // Tu backend: const { password } = req.body
}

// ─── RESPONSES — lo que el backend devuelve ───────────────────

interface LoginResponse {
  message: string           // "Login exitoso"
  token:   string           // el JWT de Supabase
  user: {
    id:    string
    email: string
  }
}

interface RegisterResponse {
  message: string           // "Usuario creado exitosamente"
  user: {
    id:    string
    email: string
  }
  // Sin token — Supabase requiere confirmar el email primero
}

// Para forgot-password, resend-confirmation y test-email
// los tres devuelven solo un mensaje — un tipo sirve para todos
interface MessageResponse {
  message: string
}

// ─── USUARIO EN EL CONTEXTO ───────────────────────────────────

// Este NO viene del backend directamente
// Es lo que guardas en AuthContext después del login
interface AuthUser {
  id:    string
  email: string
  token: string             // lo necesitas para hacer requests autenticados
}

// ─── EXPORTS ──────────────────────────────────────────────────
// Todo exportado para que service y context puedan importarlos

export type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  UpdatePasswordRequest,
  LoginResponse,
  RegisterResponse,
  MessageResponse,
  AuthUser,
}