import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, nome, email, cargo, status, created_at, tenant_id')
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
  const { email, password, nome, cargo } = body

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome, cargo },
    })

    if (error) throw error

    return NextResponse.json({ user: data.user })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao criar usuário'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
