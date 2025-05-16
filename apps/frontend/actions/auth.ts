"use server"

import { supabaseAdmin } from "@/lib/supabase"
import type { AuthFormData, AuthResponse } from "@/types/auth"
import bcrypt from "bcryptjs"

export async function login(data: AuthFormData): Promise<AuthResponse> {
  try {
    const { data: user, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("email, password, plan")
      .eq("email", data.email)
      .single()

    if (fetchError || !user) {
      return {
        success: false,
        message: "Invalid credentials",
      }
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password)

    if (!isValidPassword) {
      return {
        success: false,
        message: "Invalid credentials",
      }
    }

    await supabaseAdmin
      .from("users")
      .update({
        last_login: new Date().toISOString(),
      })
      .eq("email", data.email)

    return {
      success: true,
      message: "Login successful",
      userData: {
        email: user.email,
        plan: user.plan,
      },
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      message: "An error occurred during login",
    }
  }
}

export async function register(data: AuthFormData): Promise<AuthResponse> {
  try {
    const { data: existingUser } = await supabaseAdmin.from("users").select("email").eq("email", data.email).single()

    if (existingUser) {
      return {
        success: false,
        message: "User already exists",
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const { error: createError } = await supabaseAdmin.from("users").insert([
      {
        email: data.email,
        password: hashedPassword,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])

    if (createError) {
      throw createError
    }

    return {
      success: true,
      message: "Registration successful",
      userData: {
        email: data.email,
        plan: "free",
      },
    }
  } catch (error) {
    console.error("Registration error:", error)
    return {
      success: false,
      message: "An error occurred during registration",
    }
  }
}
