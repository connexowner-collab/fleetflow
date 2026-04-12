import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/auth/session'

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { nova_senha, confirmar_senha } = await request.json()

  if (!nova_senha || nova_senha.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
  }
  if (nova_senha !== confirmar_senha) {
    return NextResponse.json({ error: 'As senhas não coincidem.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Busca o ID do usuário no Supabase Auth pelo e-mail
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })

  const authUser = users.find(u => u.email?.toLowerCase() === session.email.toLowerCase())
  if (!authUser) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

  const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
    password: nova_senha,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
