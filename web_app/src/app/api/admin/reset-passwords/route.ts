import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/session'

const SENHA_PADRAO = 'FleetFlow@2026'

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session || session.perfil !== 'diretor') {
    return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 })
  }

  const supabase = createAdminClient()

  try {
    // Lista todos os usuários
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    if (error) throw error

    // Atualiza a senha de cada um
    const resultados = await Promise.all(
      users.map(async (user) => {
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          password: SENHA_PADRAO,
        })
        return { email: user.email, ok: !updateError, erro: updateError?.message }
      })
    )

    return NextResponse.json({ senha: SENHA_PADRAO, resultados })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
