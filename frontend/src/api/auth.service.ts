// src/api/auth.service.ts
import { apiClient } from "./api.client"
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  MessageResponse,
} from "./auth.types"

export const authService = {

  // POST /api/auth/login
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/login", data)
    console.log("Login successful:", response)
    // Guarda el token para que api.client lo use en futuros requests
    localStorage.setItem("token", response.token)
    return response
  },

  // POST /api/auth/register
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>("/auth/register", data)
  },

  // POST /api/auth/forgot-password
  async forgotPassword(email: string): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>("/auth/forgot-password", { email })
  },

  // POST /api/auth/resend-confirmation
  async resendConfirmation(email: string): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>("/auth/resend-confirmation", { email })
  },

  // POST /api/auth/update-password  (requiere token)
  async updatePassword(password: string): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>("/auth/update-password", { password })
  },

  // Cierra sesión localmente
  logout(): void {
    localStorage.removeItem("token")
  },

  // Lee el token guardado
  getToken(): string | null {
    return localStorage.getItem("token")
  },
}