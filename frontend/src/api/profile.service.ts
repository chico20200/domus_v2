// src/api/profile.service.ts
import { apiClient } from "./api.client"
import type {
  GetProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from "./profile.types"

export const profileService = {

  // GET /api/profiles/me
  async getMe(): Promise<GetProfileResponse> {
    return apiClient.get<GetProfileResponse>("/profiles/me")
  },

  // PUT /api/profiles/me
  async updateMe(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    return apiClient.put<UpdateProfileResponse>("/profiles/me", data)
  },
}