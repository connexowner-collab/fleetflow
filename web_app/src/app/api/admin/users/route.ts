import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

// Mapeia label do form → valor do CHECK constraint
const roleMap: Record<string, string> = {
  'Motorista': 'motorista',
  'Analista de Frota': 'analista',
  'Gestor': 'gestor',
  'Diretor': 'diretor',
}

export async function GET() {
  const supabase = createAdminClient()

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, nome, email, perfil, ativo, created_at, tenant_id, tenants(nome)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ users: profiles ?? [] })
  } catch {
    return NextResponse.json({ users: [] })
  }
}

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const body = await request.json()
  const { email, nome, cargo } = body

  const perfil = roleMap[cargo] ?? 'motorista'

  try {
    // Cria o usuário no Supabase Auth com senha aleatória temporária
    // O Supabase envia automaticamente o e-mail de confirmação/definição de senha
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false,          // força envio do e-mail de confirmação
      user_metadata: { nome, perfil },
    })

    if (error) throw error

    // Envia e-mail para o usuário definir a própria senha
    await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://webapp-peach-six.vercel.app'}/login`,
      },
    })

    return NextResponse.json({ user: data.user })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao criar usuário'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
