// src/api/profile.types.ts

// Lo que devuelve GET /api/profiles/me
export interface Profile {
  id:        string
  nombre:    string
  telefono:  string
  foto_url:  string
  // si tu compañero tiene más campos en la tabla los agregas aquí
}

export interface GetProfileResponse {
  profile: Profile
}

// Lo que envías en PUT /api/profiles/me
// Todos opcionales — el backend solo actualiza los que lleguen
export interface UpdateProfileRequest {
  nombre?:   string
  telefono?: string
  foto_url?: string
}

export interface UpdateProfileResponse {
  message: string
  profile: Profile
}