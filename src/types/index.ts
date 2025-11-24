// src/types/index.ts
export interface Profile {
  id: string
  name: string
  age: number
  bio: string // Mapearemos 'looking_for' o crearemos una bio compuesta
  photos: string[]
  lookingFor: string
  hobbies: string[]
}