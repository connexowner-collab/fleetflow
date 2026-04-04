import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

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
      .select('id, nome, email, perfil, ativo, telas_permitidas, created_at, tenant_id, tenants(nome)')
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
  const { email, nome, cargo, telas } = body
  const perfil = roleMap[cargo] ?? 'motorista'
  const telasPermitidas = telas ?? ['checklist', 'troca', 'ocorrencia', 'historico']

  try {
    // inviteUserByEmail cria o usuário E envia o e-mail automaticamente
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { nome, perfil },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://webapp-peach-six.vercel.app'}/login`,
    })
    if (error) throw error

    // Atualiza o perfil criado pelo trigger com telas_permitidas
    if (data.user) {
      await supabase.from('profiles')
        .update({ telas_permitidas: telasPermitidas })
        .eq('id', data.user.id)
    }

    return NextResponse.json({ user: data.user })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao criar usuário'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
