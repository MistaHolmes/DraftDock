export interface AuthFormData {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message: string
  userData?: {
    email: string
    plan: string
  }
}

export interface User {
  id: number
  email: string
  password: string
  created_at: string
  plan: string
  status: string
}
