import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/auth/session'

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nome, email, perfil, avatar_url, created_at, tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('nome, cnpj, email, slug')
    .eq('id', profile.tenant_id)
    .single()

  return NextResponse.json({ profile, tenant: tenant ?? null })
}

export async function PATCH(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { nome } = body

  if (!nome?.trim()) return NextResponse.json({ error: 'Nome não pode ser vazio.' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({ nome: nome.trim() })
    .eq('email', session.email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Atualiza cookie fleetflow-user com novo nome
  const userDisplay = Buffer.from(JSON.stringify({ perfil: session.perfil, nome: nome.trim() })).toString('base64')
  const cookieOpts = `Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`
  const securePart = process.env.NODE_ENV === 'production' ? '; Secure' : ''

  const response = NextResponse.json({ ok: true, nome: nome.trim() })
  response.headers.append('Set-Cookie', `fleetflow-user=${userDisplay}${securePart}; ${cookieOpts}`)
  return response
}
