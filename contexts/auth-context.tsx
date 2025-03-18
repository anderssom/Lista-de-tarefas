"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { Session } from "@supabase/supabase-js"

type AuthUser = {
  id: string
  email: string
  name: string
  photoURL?: string
}

type AuthContextType = {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>
  googleAuth: () => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isLoading: boolean
  updateProfile: (data: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in on mount and set up auth listener
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setIsLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUserFromSession(session)

      setIsLoading(false)
    }

    getInitialSession()

    // Set up auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserFromSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Helper to set user from session
  const setUserFromSession = async (session: Session | null) => {
    if (!session) {
      setUser(null)
      return
    }

    // Get user profile from database
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    setUser({
      id: session.user.id,
      email: session.user.email || "",
      name: profile?.name || session.user.email?.split("@")[0] || "User",
      photoURL: profile?.avatar_url,
    })
  }

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Falha ao fazer login",
      }
    }
  }

  const register = async (email: string, password: string, name?: string) => {
    try {
      // Create auth user
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split("@")[0],
          },
        },
      })

      if (error) throw error

      if (authUser) {
        // Create profile record
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: authUser.id,
            name: name || email.split("@")[0],
            email,
          },
        ])

        if (profileError) throw profileError
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Falha ao criar conta",
      }
    }
  }

  const googleAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) throw error

      // Se data.url existir, redirecione o usuário para a URL de autenticação do Google
      if (data?.url) {
        window.location.href = data.url
      }

      return { success: true }
    } catch (error: any) {
      console.error("Erro na autenticação do Google:", error)
      return {
        success: false,
        error: error.message || "Falha ao autenticar com Google",
      }
    }
  }

  const updateProfile = async (data: Partial<AuthUser>) => {
    if (!user) return { success: false, error: "Usuário não autenticado" }

    try {
      // Update auth metadata if name is provided
      if (data.name) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { name: data.name },
        })

        if (authError) throw authError
      }

      // Update profile record
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: data.name,
          avatar_url: data.photoURL,
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Update local user state
      setUser((prev) => (prev ? { ...prev, ...data } : null))

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Falha ao atualizar perfil",
      }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        googleAuth,
        logout,
        isLoading,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

