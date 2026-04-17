import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/session'

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get('categoria')

  const supabase = createAdminClient()
  try {
    const { data: tenant } = await supabase.from('tenants').select('id').single()
    if (!tenant) return NextResponse.json({ opcoes: [] })

    let query = supabase
      .from('config_opcoes')
      .select('id, categoria, valor')
      .eq('tenant_id', tenant.id)
      .eq('ativo', true)
      .order('valor')

    if (categoria) query = query.eq('categoria', categoria)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ opcoes: data ?? [] })
  } catch {
    return NextResponse.json({ opcoes: [] })
  }
}
