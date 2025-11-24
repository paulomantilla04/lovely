// src/types/index.ts
export interface Profile {
  id: string
  name: string
  age: number
  gender: string
  bio: string // Mantenemos bio por compatibilidad o lógica calculada
  description?: string // NUEVO CAMPO
  photos: string[]
  lookingFor: string
  hobbies: string[]
}