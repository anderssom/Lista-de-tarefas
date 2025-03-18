import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      await supabase.auth.exchangeCodeForSession(code)
      console.log("Autenticação bem-sucedida")
    } catch (error) {
      console.error("Erro ao trocar código por sessão:", error)
    }
  }

  // URL para redirecionar após o processo de login ser concluído
  return NextResponse.redirect(new URL("/", requestUrl.origin))
}

