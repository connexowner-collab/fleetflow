import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/auth/session'

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get('tipo') ?? searchParams.get('categoria')

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('email', session.email)
    .single()

  if (!profile) return NextResponse.json({ opcoes: [] })

  let query = supabase
    .from('config_opcoes')
    .select('id, categoria, valor, ativo')
    .eq('tenant_id', profile.tenant_id)
    .eq('ativo', true)
    .order('valor')

  if (categoria) query = query.eq('categoria', categoria)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Retorna compatível com ambos os campos (tipo e categoria)
  const opcoes = (data ?? []).map(o => ({ ...o, tipo: o.categoria }))

  return NextResponse.json({ opcoes })
}
