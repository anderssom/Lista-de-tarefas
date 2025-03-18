"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfilePage() {
  const { user, isLoading, updateProfile } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    } else if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsUpdating(true)

    if (!name) {
      setError("O nome não pode estar vazio")
      setIsUpdating(false)
      return
    }

    const { success: updateSuccess, error: updateError } = await updateProfile({ name })

    if (updateSuccess) {
      setSuccess(true)
    } else {
      setError(updateError || "Erro ao atualizar perfil")
    }

    setIsUpdating(false)
  }

  // Show loading or redirect to login if not authenticated
  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar will be rendered by the layout */}

      {/* Main content */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Perfil</CardTitle>
            <CardDescription>Gerencie suas informações pessoais</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">Perfil atualizado com sucesso!</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.photoURL || "/placeholder.svg?height=96&width=96"} alt={user.name} />
                  <AvatarFallback>{user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full" disabled={isUpdating}>
                {isUpdating ? "Salvando..." : "Salvar alterações"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

