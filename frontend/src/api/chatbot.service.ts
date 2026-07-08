// src/api/chatbot.service.ts
import { apiClient } from "./api.client"

interface ChatbotResponse {
  respuesta: string
}

export const chatbotService = {
  async preguntar(mensaje: string): Promise<ChatbotResponse> {
    return apiClient.post<ChatbotResponse>("/chatbot/preguntar", { mensaje })
  },
}